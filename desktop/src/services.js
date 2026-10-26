const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const { createInterface } = require("node:readline");
const { app } = require("electron");
const tar = require("tar");

const { codexVersion, layout } = require("./paths");
const { WEB_PORT } = require("./server");

// 桌面页面从固定端口加载，内置 Agent 仅接受这些网页来源。
const ALLOWED_ORIGINS = [`http://127.0.0.1:${WEB_PORT}`, `http://localhost:${WEB_PORT}`].join(",");

/** 只覆盖当前支持的 Windows / Linux 平台；三平台之外直接报错而不是静默失败。 */
const CODEX_TARGETS = {
    "win32-x64": { package: "win32-x64", triple: "x86_64-pc-windows-msvc", executable: "codex.exe" },
    "linux-x64": { package: "linux-x64", triple: "x86_64-unknown-linux-musl", executable: "codex" },
    "linux-arm64": { package: "linux-arm64", triple: "aarch64-unknown-linux-musl", executable: "codex" },
};

const children = [];

// 默认走国内镜像：npmmirror 只做缓存转发，tarball 与官方逐字节一致。
// 镜像不可用或校验不通过时才回退官方源；可用 CANVAS_CODEX_MIRROR 覆盖镜像地址。
const CODEX_MIRROR_REGISTRY = (process.env.CANVAS_CODEX_MIRROR || "https://registry.npmmirror.com").replace(/\/+$/, "");
const CODEX_REGISTRIES = [CODEX_MIRROR_REGISTRY, "https://registry.npmjs.org"];

function codexTarget() {
    const key = `${process.platform}-${process.arch}`;
    const target = CODEX_TARGETS[key];
    if (!target) throw new Error(`暂不支持当前平台：${key}`);
    return target;
}

/** Codex 原生可执行文件路径；首次启动时下载到用户数据目录，安装包因此不必带 350MB 二进制。 */
function codexBinPath() {
    const target = codexTarget();
    return path.join(app.getPath("userData"), "codex", codexVersion(), "vendor", target.triple, "bin", target.executable);
}

function freePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.on("error", reject);
        server.listen(0, "127.0.0.1", () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });
    });
}

async function waitFor(url, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        try {
            const response = await fetch(url);
            if (response.ok) return;
        } catch {}
        if (Date.now() > deadline) throw new Error(`等待本地服务响应超时：${url}`);
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
}

/** 流式下载并回报进度，避免首次启动时界面看起来卡死。 */
async function download(url, destination, expectedIntegrity, onProgress) {
    const response = await fetch(url);
    if (!response.ok || !response.body) throw new Error(`下载助手运行时失败：HTTP ${response.status}`);
    const total = Number(response.headers.get("content-length")) || 0;
    const output = fs.createWriteStream(destination);
    const hash = crypto.createHash("sha512");
    let received = 0;
    let reported = 0;
    try {
        for await (const chunk of response.body) {
            hash.update(chunk);
            output.write(chunk);
            received += chunk.length;
            if (received - reported > 4 * 1024 * 1024) {
                reported = received;
                onProgress?.({ phase: "codex", received, total });
            }
        }
    } finally {
        await new Promise((resolve) => output.end(resolve));
    }
    const actual = `sha512-${hash.digest("base64")}`;
    // 镜像只做缓存转发，内容必须和官方 integrity 完全一致，否则当次取到的文件直接丢弃。
    if (expectedIntegrity && actual !== expectedIntegrity) throw new Error(`助手运行时校验与官方不一致：期望 ${expectedIntegrity}，实际 ${actual}`);
    onProgress?.({ phase: "codex", received, total: total || received });
}

/** 从 canvas-agent 的 lockfile 中取当前平台包的官方 integrity，作为镜像下载的校验基准。 */
function expectedIntegrity(packageName) {
    const lockPath = path.join(layout().agentHome, "package-lock.json");
    try {
        const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
        return String(lock.packages?.[`node_modules/${packageName}`]?.integrity || "");
    } catch {
        log(`failed to read package-lock integrity: ${lockPath}`);
        return "";
    }
}

/** 把平台包解压到用户数据目录，返回其中的 Codex 可执行文件路径。 */
async function ensureCodex(onProgress) {
    const binary = codexBinPath();
    if (fs.existsSync(binary)) return binary;
    const target = codexTarget();
    const version = codexVersion();
    const root = path.join(app.getPath("userData"), "codex", version);
    const archive = path.join(root, `codex-${version}-${target.package}.tgz`);
    const file = `codex-${version}-${target.package}.tgz`;
    const integrity = expectedIntegrity(`@openai/codex-${target.package}`);
    fs.mkdirSync(root, { recursive: true });
    let failure = "";
    for (const registry of CODEX_REGISTRIES) {
        onProgress?.({ phase: "codex", received: 0, total: 0 });
        try {
            await download(`${registry}/@openai/codex/-/${file}`, archive, integrity, onProgress);
            await tar.x({ file: archive, cwd: root, strip: 1 });
            if (!fs.existsSync(binary)) throw new Error("解压后缺少助手可执行文件");
            fs.rmSync(archive, { force: true });
            log(`codex runtime ready from ${registry}`);
            break;
        } catch (error) {
            failure = error.message;
            log(`codex download failed from ${registry}: ${error.message}`);
            fs.rmSync(archive, { force: true });
        }
    }
    if (!fs.existsSync(binary)) throw new Error(`无法获取助手运行时：${failure || "没有可用的下载源"}`);
    // npm 包里的可执行位不一定保留，这里统一补上原生二进制和随包工具的执行权限。
    if (process.platform !== "win32") {
        const vendor = path.join(root, "vendor", target.triple);
        for (const dir of [path.join(vendor, "bin"), path.join(vendor, "codex-path"), path.join(vendor, "codex-resources")]) {
            if (!fs.existsSync(dir)) continue;
            for (const file of fs.readdirSync(dir, { recursive: true })) {
                const full = path.join(dir, String(file));
                if (fs.statSync(full).isFile()) fs.chmodSync(full, 0o755);
            }
        }
    }
    return binary;
}

/** 用 Electron 自带的 Node 跑子进程，用户机器上不需要再装 Node。 */
function spawnNode(entry, { port, args = [], env = {}, shutdownCommand = false } = {}) {
    const child = spawn(process.execPath, [entry, ...args], {
        env: { ...process.env, ...env, ...(port ? { PORT: String(port) } : {}), ELECTRON_RUN_AS_NODE: "1" },
        stdio: [shutdownCommand ? "pipe" : "ignore", "pipe", "pipe"],
        windowsHide: true,
    });
    if (shutdownCommand) child.shutdownCommand = true;
    children.push(child);
    if (child.stdout) createInterface({ input: child.stdout }).on("line", log);
    if (child.stderr) createInterface({ input: child.stderr }).on("line", log);
    return child;
}

const logFile = path.join(app.getPath("userData"), "desktop.log");
function log(text) {
    const line = text.trim();
    if (!line) return;
    try {
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${line}\n`);
    } catch {}
}

function readDesktopLog() {
    try {
        return fs.readFileSync(logFile, "utf8");
    } catch {
        return null;
    }
}

/** 启动内置 Canvas Agent，并把下载好的 Codex 通过环境变量交给它。 */
async function startAgent(codexBin, onProgress, env = {}) {
    const { agentEntry } = layout();
    if (!fs.existsSync(agentEntry)) throw new Error("安装包缺少 Canvas Agent 产物，请先执行 npm run resources");
    onProgress?.({ phase: "agent", received: 0, total: 0 });
    const port = await freePort();
    spawnNode(agentEntry, { port, args: ["desktop", ...(process.argv.includes("--debug") ? ["--debug"] : [])], shutdownCommand: true, env: { CANVAS_CODEX_BIN: codexBin, NO_COLOR: "1", CANVAS_AGENT_ALLOWED_ORIGINS: ALLOWED_ORIGINS, ...env } });
    await waitFor(`http://127.0.0.1:${port}/health`, 90_000);
    return port;
}

/** 启动内置本地代理，浏览器端 AI 请求不再受跨域限制，用户也不用自己跑 npx。 */
async function startProxy(onProgress) {
    const { proxyEntry } = layout();
    if (!fs.existsSync(proxyEntry)) throw new Error("安装包缺少本地代理，请先执行 npm run resources");
    onProgress?.({ phase: "proxy", received: 0, total: 0 });
    const port = await freePort();
    spawnNode(proxyEntry, { port, args: ["--port", String(port)] });
    await waitFor(`http://127.0.0.1:${port}/`, 30_000);
    return port;
}

async function stopChildren() {
    await Promise.all(children.map((child) => new Promise((resolve) => {
        if (child.exitCode !== null) return resolve();
        child.once("exit", resolve);
        if (child.shutdownCommand) child.stdin?.write("shutdown\n");
        else if (process.platform === "win32" && child.pid) spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true });
        else child.kill();
    })));
    children.length = 0;
}

/** 直接执行 Codex 子命令，用于登录窗口；返回输出而不是打印到终端。 */
function runCodex(args, { input, detached = false, env = {} } = {}) {
    const binary = codexBinPath();
    if (!fs.existsSync(binary)) throw new Error("助手运行时尚未下载完成");
    const child = spawn(binary, args, { windowsHide: true, detached, env: { ...process.env, ...env }, stdio: [input ? "pipe" : "ignore", "pipe", "pipe"] });
    if (input) {
        child.stdin.end(input);
    }
    let output = "";
    const collect = (chunk) => (output += chunk.toString());
    child.stdout?.on("data", collect);
    child.stderr?.on("data", collect);
    return { child, output: () => output };
}

module.exports = { codexBinPath, ensureCodex, runCodex, startAgent, startProxy, stopChildren, log, readDesktopLog };