import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { type TestContext } from "node:test";

import { AuditLog, AuditLogError, type AuditEvent } from "./audit-log.js";

async function fixture(t: TestContext) {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "canvas-audit-"));
    const directory = path.join(root, "audit");
    const logs: AuditLog[] = [];
    const open = () => {
        const log = new AuditLog(directory);
        logs.push(log);
        return log;
    };
    t.after(async () => {
        for (const log of logs) await log.close().catch((error) => assert.ok(error instanceof AuditLogError));
        await fs.rm(root, { recursive: true, force: true });
    });
    return { root, directory, open, log: open() };
}

const unavailable = (error: unknown) => error instanceof AuditLogError && error.code === "AUDIT_UNAVAILABLE";

// Fixture hash is deliberately independent of the writer, so the recovery tests exercise the reader.
function signed(event: Omit<AuditEvent, "hash"> & { hash?: string }): AuditEvent {
    const { hash: _hash, ...content } = event;
    const canonical = (value: unknown): string => {
        if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
        if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
        return JSON.stringify(value) ?? "null";
    };
    return { ...content, hash: crypto.createHash("sha256").update(canonical(content)).digest("hex") };
}

test("并发写入连续、逐条持久，重启从 journal 恢复且不重写 manifest", async (t) => {
    const { log, open, directory } = await fixture(t);
    const events = await Promise.all(Array.from({ length: 24 }, (_, i) => log.record({ eventType: "delta", payload: { i } })));
    assert.deepEqual(events.map((event) => event.sequence), Array.from({ length: 24 }, (_, i) => i + 1));
    assert.equal(new Set(events.map((event) => event.eventId)).size, 24);
    assert.equal(new Set(events.map((event) => event.runId)).size, 1);
    const manifest = path.join(directory, "manifest.json");
    assert.deepEqual(JSON.parse(await fs.readFile(manifest, "utf8")), { version: 1 });
    const before = await fs.stat(manifest);
    await log.flush();
    await log.close();
    const restarted = open();
    assert.equal((await restarted.record({ eventType: "restarted" })).sequence, 25);
    assert.deepEqual((await restarted.read()).slice(0, 24), events);
    assert.equal((await fs.stat(manifest)).mtimeMs, before.mtimeMs);
    assert.equal((await restarted.read()).at(-1)?.runId, events[0].runId); // Same process, even across instances.
});

test("正文超过 100k 完整保留，读取无默认 500/5000 cap 且分页无丢失", async (t) => {
    const { log, directory, open } = await fixture(t);
    const text = "完整正文🧪".repeat(20_000);
    const first = await log.record({ eventType: "message", threadId: "a", turnId: "t", payload: { text } });
    await log.close();
    // Seed 5001 valid records in one write instead of doing 5001 expensive fsync calls.
    const events = Array.from({ length: 5001 }, (_, i) => signed({
        schemaVersion: 1, eventId: crypto.randomUUID(), sequence: i + 1,
        timestamp: first.timestamp, runId: first.runId, eventType: "message",
        threadId: i % 2 ? "b" : "a", turnId: "t", payload: i === 0 ? { text } : { i },
    }));
    await fs.writeFile(path.join(directory, "events.jsonl"), events.map((event) => JSON.stringify(event) + "\n").join(""));
    const reader = open();
    assert.equal((await reader.read()).length, 5001);
    assert.equal((await reader.read({ limit: 6000 })).length, 5001);
    assert.equal((await reader.read({ limit: 1 }))[0].payload?.text, text);
    const collected: AuditEvent[] = [];
    let afterSequence = 0;
    for (;;) {
        const page = await reader.query({ threadId: "a", turnId: "t", afterSequence, limit: 733 });
        collected.push(...page.events);
        afterSequence = page.nextSequence;
        if (!page.hasMore) break;
    }
    assert.deepEqual(collected, events.filter((event) => event.threadId === "a"));
    assert.deepEqual(await reader.query({ afterSequence: 5001, limit: 1 }), { events: [], nextSequence: 5001, hasMore: false });
    assert.equal((await reader.record({ eventType: "continued" })).sequence, 5002);
});

test("首次读取无写副作用，读取失败不污染后续写状态", async (t) => {
    const { log, directory, open } = await fixture(t);
    assert.deepEqual(await log.read(), []);
    await assert.rejects(fs.stat(directory), { code: "ENOENT" });
    await log.record({ eventType: "first" });
    await log.close();
    const manifest = path.join(directory, "manifest.json");
    const original = await fs.readFile(manifest);
    await fs.writeFile(manifest, "{broken");
    const reader = open();
    await assert.rejects(reader.read(), /manifest/);
    assert.equal(reader.status().failed, false);
    assert.equal(await fs.readFile(manifest, "utf8"), "{broken");
    await fs.writeFile(manifest, original);
    assert.equal((await reader.record({ eventType: "second" })).sequence, 2);
});

test("非法分页参数只拒绝读取，不污染写状态", async (t) => {
    const { log } = await fixture(t);
    await log.record({ eventType: "first" });
    for (const limit of [0, -1, 1.5, NaN, Infinity]) await assert.rejects(log.read({ limit }), /limit/);
    for (const afterSequence of [-1, 1.5, NaN, Infinity]) await assert.rejects(log.read({ afterSequence }), /afterSequence/);
    assert.equal(log.status().failed, false);
    assert.equal((await log.record({ eventType: "second" })).sequence, 2);
});

test("未知 manifest 版本不改原文件且永久拒写", async (t) => {
    const { log, directory, open } = await fixture(t);
    await log.record({ eventType: "first" });
    await log.close();
    const manifest = path.join(directory, "manifest.json");
    const original = '{"version":999}\n';
    await fs.writeFile(manifest, original);
    const journal = await fs.readFile(log.filePath);
    const broken = open();
    await assert.rejects(broken.record({ eventType: "blocked" }), unavailable);
    await assert.rejects(broken.read(), /manifest/);
    assert.equal(await fs.readFile(manifest, "utf8"), original);
    assert.deepEqual(await fs.readFile(log.filePath), journal);
    assert.equal(broken.status().failed, true);
    await fs.writeFile(manifest, '{"version":1}');
    await assert.rejects(broken.record({ eventType: "still blocked" }), unavailable);
});

for (const corruption of ["half-line", "hash", "sequence", "duplicate-id", "invalid-json", "blank-line", "unknown-event-version", "invalid-utf8", "bare-cr"] as const) {
    test(`启动拒绝 ${corruption}，原文件保持不动且完整读取明确报错`, async (t) => {
        const { log, open } = await fixture(t);
        const first = await log.record({ eventType: "first" });
        const second = await log.record({ eventType: "second" });
        await log.close();
        let raw: Buffer = await fs.readFile(log.filePath);
        if (corruption === "half-line") raw = raw.subarray(0, raw.length - 1);
        if (corruption === "hash") raw = Buffer.from(raw.toString().replace('"eventType":"second"', '"eventType":"changed"'));
        if (corruption === "sequence") raw = Buffer.from(JSON.stringify(first) + "\n" + JSON.stringify(signed({ ...second, sequence: 4 })) + "\n");
        if (corruption === "duplicate-id") raw = Buffer.from(JSON.stringify(first) + "\n" + JSON.stringify(signed({ ...second, eventId: first.eventId })) + "\n");
        if (corruption === "invalid-json") raw = Buffer.concat([raw, Buffer.from("oops\n")]);
        if (corruption === "blank-line") raw = Buffer.concat([raw, Buffer.from("\n")]);
        if (corruption === "unknown-event-version") raw = Buffer.from(raw.toString().replace('"schemaVersion":1', '"schemaVersion":2'));
        if (corruption === "invalid-utf8") raw = Buffer.concat([raw, Buffer.from([0xff, 0x0a])]);
        if (corruption === "bare-cr") raw = Buffer.from(JSON.stringify(first) + "\r" + JSON.stringify(second) + "\n");
        await fs.writeFile(log.filePath, raw);
        const broken = open();
        await assert.rejects(broken.record({ eventType: "blocked" }), unavailable);
        await assert.rejects(broken.read({ limit: 1 })); // Corruption after a requested page cannot be hidden.
        await assert.rejects(broken.record({ eventType: "still blocked" }), unavailable);
        assert.deepEqual(await fs.readFile(log.filePath), raw);
    });
}

for (const missing of ["manifest.json", "events.jsonl", "both"] as const) {
    test(`已有目录缺 ${missing} 拒绝初始化`, async (t) => {
        const { log, directory, open } = await fixture(t);
        await log.record({ eventType: "first" });
        await log.close();
        for (const name of missing === "both" ? ["manifest.json", "events.jsonl"] : [missing]) await fs.unlink(path.join(directory, name));
        const before = (await fs.readdir(directory)).sort();
        const broken = open();
        await assert.rejects(broken.record({ eventType: "blocked" }), unavailable);
        await broken.close().catch((error) => assert.ok(unavailable(error)));
        assert.deepEqual((await fs.readdir(directory)).sort(), before);
    });
}

test("预先存在的空目录拒绝初始化", async (t) => {
    const { log, directory } = await fixture(t);
    await fs.mkdir(directory);
    await assert.rejects(log.record({ eventType: "blocked" }), unavailable);
    assert.deepEqual(await fs.readdir(directory), []);
});

test("wx 锁拒绝第二写者和失效锁，不静默破锁", async (t) => {
    const { log, directory, open } = await fixture(t);
    await log.record({ eventType: "first" });
    const competing = open();
    await assert.rejects(competing.record({ eventType: "blocked" }), unavailable);
    assert.equal((await competing.read()).length, 1);
    await competing.close().catch((error) => assert.ok(unavailable(error)));
    await log.close();
    const lock = path.join(directory, "writer.lock");
    await fs.writeFile(lock, '{"pid":-1}');
    await assert.rejects(open().record({ eventType: "stale lock" }), unavailable);
    assert.equal(await fs.readFile(lock, "utf8"), '{"pid":-1}');
});

test("写失败永久锁定，恢复目录后仍可读已确认记录，flush/close 不伪称成功", async (t) => {
    const { log, directory } = await fixture(t);
    const first = await log.record({ eventType: "first" });
    const moved = directory + ".moved";
    await fs.rename(directory, moved);
    await assert.rejects(log.record({ eventType: "lost" }), unavailable);
    await fs.rename(moved, directory);
    assert.deepEqual(await log.read(), [first]);
    await assert.rejects(log.record({ eventType: "blocked" }), unavailable);
    await assert.rejects(log.flush(), unavailable);
    assert.equal(log.status().failed, true);
    assert.ok(log.status().error);
    assert.equal(log.status().directory, directory);
    await assert.rejects(log.close(), unavailable);
});

test("fsync 失败的完整行不被确认为成功、不广播，并永久拒写", async (t) => {
    const { log, open } = await fixture(t);
    const first = await log.record({ eventType: "confirmed" });
    const writer = (log as unknown as { journal: Awaited<ReturnType<typeof fs.open>> }).journal;
    const originalSync = writer.sync;
    let broadcasts = 0;
    log.subscribe(() => { broadcasts++; });
    writer.sync = async () => { throw new Error("injected fsync failure"); };
    try {
        await assert.rejects(log.record({ eventType: "unconfirmed" }), unavailable);
    } finally {
        writer.sync = originalSync;
    }
    assert.equal(broadcasts, 0);
    assert.equal(log.status().failed, true);
    assert.equal((await fs.readFile(log.filePath, "utf8")).trimEnd().split("\n").length, 2);
    assert.deepEqual(await log.read(), [first]);
    await assert.rejects(log.record({ eventType: "blocked" }), unavailable);
    await assert.rejects(log.close(), unavailable);
    // A new instance validates every complete line: sync failure is an indeterminate commit, not a rollback.
    const recovered = open();
    assert.equal((await recovered.record({ eventType: "recovered" })).sequence, 3);
});

test("读到外部损坏会报错，但读取本身不永久污染写状态", async (t) => {
    const { log } = await fixture(t);
    await log.record({ eventType: "first" });
    const original = await fs.readFile(log.filePath);
    await fs.appendFile(log.filePath, "bad\n");
    await assert.rejects(log.read());
    assert.equal(log.status().failed, false);
    const restore = await fs.open(log.filePath, "r+");
    try {
        await restore.truncate(0);
        await restore.write(original);
        await restore.sync();
    } finally {
        await restore.close();
    }
    assert.equal((await log.record({ eventType: "second" })).sequence, 2);
});

test("敏感字段精确匹配，保留 usage、长文、Error、重复对象和附件引用", async (t) => {
    const { log } = await fixture(t);
    const shared = { ordinary: "保留" };
    const cyclic: Record<string, unknown> = { shared };
    cyclic.self = cyclic;
    const payload = {
        api_key: "hidden-key", accessToken: "hidden-access", refresh_token: "hidden-refresh",
        authorization: "hidden-auth", password: "hidden-password", clientSecret: "hidden-secret",
        input_tokens: 123, output_tokens: 456, token_count: 579,
        left: shared, right: shared, cyclic, absent: undefined, number: NaN, integer: 12n,
        error: new Error("password=hidden-error"),
        text: 'Authorization: Bearer hidden-header\npassword="hidden-text" secret=hidden-secret-text sk-abcdefghijk https://alice:hidden-url@example.com/p?api_key=hidden-query&ok=yes',
        embedded: "before data:image/png;base64,aGVsbG8= after",
        base64: "aGVsbG8=", image_base64: "aGVsbG8=", bytes: Buffer.from("hidden-binary"),
        attachments: [{ hash: "reference-hash", path: "/safe/image.png", contentType: "image/png" }],
    };
    const event = await log.record({ eventType: "test", payload });
    assert.deepEqual(await log.read(), [event]);
    const saved = event.payload!;
    assert.equal(saved.input_tokens, 123);
    assert.equal(saved.output_tokens, 456);
    assert.equal(saved.token_count, 579);
    assert.deepEqual(saved.left, shared);
    assert.deepEqual(saved.right, shared);
    assert.equal((saved.cyclic as Record<string, unknown>).self, "[CIRCULAR]");
    assert.equal(saved.absent, null);
    assert.equal(saved.number, null);
    assert.equal(saved.integer, "12");
    assert.equal((saved.error as Record<string, unknown>).name, "Error");
    assert.match(String((saved.error as Record<string, unknown>).stack), /Error:/);
    assert.deepEqual(saved.attachments, payload.attachments);
    for (const field of ["base64", "image_base64", "bytes"]) {
        const summary = saved[field] as Record<string, unknown>;
        assert.match(String(summary.hash), /^[a-f0-9]{64}$/);
        assert.equal(typeof summary.length, "number");
        assert.equal(typeof summary.type, "string");
    }
    const raw = await fs.readFile(log.filePath, "utf8");
    assert.doesNotMatch(raw, /hidden-|aGVsbG8=|alice/);
    assert.match(raw, /ok=yes/);
    assert.match(String(saved.embedded), /^before .* after$/);
});

test("监听者仅收到持久成功事件，抛错/异步拒绝和修改事件不影响持久结果", async (t) => {
    const { log, directory } = await fixture(t);
    let broadcasts = 0;
    log.subscribe(() => { throw new Error("listener failed"); });
    log.subscribe(async () => { throw new Error("async listener failed"); });
    const unsubscribe = log.subscribe((event) => { broadcasts++; event.payload!.text = "mutated"; });
    const event = await log.record({ eventType: "first", payload: { text: "original" } });
    assert.equal(event.payload?.text, "original");
    assert.deepEqual(await log.read(), [event]);
    assert.equal(broadcasts, 1);
    assert.equal(log.status().failed, false);
    assert.ok(log.status().listenerError);
    unsubscribe();
    const moved = directory + ".moved";
    await fs.rename(directory, moved);
    await assert.rejects(log.record({ eventType: "failed" }), unavailable);
    await fs.rename(moved, directory);
    assert.equal(broadcasts, 1);
});

test("close 等待已排队写入，关闭后拒写但允许读取", async (t) => {
    const { log } = await fixture(t);
    const pending = log.record({ eventType: "pending" });
    const closing = log.close();
    await pending;
    await closing;
    await assert.rejects(log.record({ eventType: "closed" }), unavailable);
    assert.equal((await log.read()).length, 1);
});
