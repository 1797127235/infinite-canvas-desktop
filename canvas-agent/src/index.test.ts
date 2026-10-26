import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("..", import.meta.url));

test("无参数和未知模式不会启动独立 HTTP 服务", () => {
    for (const args of [[], ["unknown"]]) {
        const result = spawnSync(process.execPath, ["--import", "tsx", "src/index.ts", ...args], { cwd, encoding: "utf8" });
        assert.ifError(result.error);
        assert.equal(result.status, 1);
        assert.equal(result.stdout, "");
        assert.match(result.stderr, /桌面内部服务/);
    }
});

test("Debug 日志只写 stderr，不创建独立日志文件", (context) => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "canvas-logger-"));
    context.after(() => fs.rmSync(home, { recursive: true, force: true }));
    const script = "import { logger } from './src/utils/logger.ts'; logger.info('test', { apiKey: 'private-key' }); logger.debug('debug-test');";
    const result = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script, "--", "--debug"], {
        cwd, encoding: "utf8", env: { ...process.env, HOME: home, USERPROFILE: home },
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /INFO test/);
    assert.match(result.stderr, /DEBUG debug-test/);
    assert.match(result.stderr, /REDACTED/);
    assert.doesNotMatch(result.stderr, /private-key/);
    assert.deepEqual(fs.readdirSync(home), []);
});
