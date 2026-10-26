const test = require("node:test");
const assert = require("node:assert/strict");

const { buildProblemLogBundle, PROBLEM_LOG_SCHEMA_VERSION } = require("./problem-log");

test("buildProblemLogBundle preserves detailed logs and handoff context", () => {
    const bundle = buildProblemLogBundle({
        exportedAt: "2026-01-01T00:00:00.000Z",
        application: { version: "0.1.1", platform: "linux", arch: "x64" },
        context: { threadId: "thread-1", turnId: "turn-2", activity: "执行失败", connection: "connected" },
        desktopLog: "ERROR Codex app-server exited: 1",
        frontendLogs: [{ title: "执行失败", text: "工具返回错误", raw: { code: "E_TOOL" } }],
        auditEvents: [{ sequence: 7, eventType: "tool_call.failed", payload: { path: "/tmp/example" } }],
    });

    assert.equal(bundle.schemaVersion, PROBLEM_LOG_SCHEMA_VERSION);
    assert.deepEqual(bundle.application, { version: "0.1.1", platform: "linux", arch: "x64" });
    assert.deepEqual(bundle.context, { threadId: "thread-1", turnId: "turn-2", activity: "执行失败", connection: "connected" });
    assert.equal(bundle.logs.desktop, "ERROR Codex app-server exited: 1");
    assert.equal(bundle.logs.frontend[0].raw.code, "E_TOOL");
    assert.equal(bundle.logs.audit[0].payload.path, "/tmp/example");
    assert.equal(bundle.handoff.automaticUpload, false);
    assert.equal(bundle.handoff.containsUserContent, true);
});

test("buildProblemLogBundle marks unavailable desktop logs instead of dropping the bundle", () => {
    const bundle = buildProblemLogBundle({ frontendLogs: [], auditEvents: [] });

    assert.equal(bundle.logs.desktop, "[desktop.log unavailable]");
    assert.deepEqual(bundle.logs.frontend, []);
    assert.deepEqual(bundle.logs.audit, []);
});
