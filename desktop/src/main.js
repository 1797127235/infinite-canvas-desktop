const path = require("node:path");
const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");

const { ensureCodex, log, runCodex, startAgent, startProxy, stopChildren } = require("./services");
const { AGENT_PREFIX, startWebServer } = require("./server");

const preload = path.join(__dirname, "preload.js");
const AGENT_START_TIMEOUT_MS = 90_000;
const CODEX_LOGIN_TIMEOUT_MS = 300_000;

let splash = null;
let mainWindow = null;
let accountWindow = null;
let agentPort = 0;
let webPort = 0;
let injected = { agentUrl: "", proxyUrl: "" };
let booting = null;
let lastProgress = { phase: "codex" };

function sendProgress(value) {
    lastProgress = value;
    if (splash && !splash.isDestroyed()) splash.webContents.send("bootstrap:progress", value);
}

function createSplash() {
    splash = new BrowserWindow({
        width: 440,
        height: 300,
        frame: false,
        resizable: false,
        show: false,
        backgroundColor: "#0c0a09",
        webPreferences: { preload, contextIsolation: true, nodeIntegration: false, sandbox: true },
    });
    splash.once("ready-to-show", () => splash?.show());
    // 启动页加载完成前发出的进度事件会丢失，加载完补发最后一次状态。
    splash.webContents.once("did-finish-load", () => sendProgress(lastProgress));
    splash.loadFile(path.join(__dirname, "splash.html"));
}

/** 桌面壳启动顺序：Codex 运行时 → 本地代理 → Canvas Agent → 同源网页服务。 */
async function bootstrap() {
    sendProgress({ phase: "codex", received: 0, total: 0 });
    const codexBin = await ensureCodex(sendProgress);
    const proxyPort = await startProxy(sendProgress);
    agentPort = await startAgent(codexBin, sendProgress);
    webPort = await startWebServer(() => agentPort);
    injected = { agentUrl: `http://127.0.0.1:${webPort}${AGENT_PREFIX}`, proxyUrl: `http://127.0.0.1:${proxyPort}` };
    log(`services ready: web=${webPort} agent=${agentPort} proxy=${proxyPort}`);
    sendProgress({ phase: "ready" });
}

async function openApp() {
    if (booting) return booting;
    booting = (async () => {
        try {
            await bootstrap();
        } catch (error) {
            log(`bootstrap failed: ${error.message}`);
            sendProgress({ phase: "error", message: error.message });
            booting = null;
            return;
        }
        if (mainWindow && !mainWindow.isDestroyed()) return void mainWindow.show();
        mainWindow = new BrowserWindow({
            width: 1440,
            height: 900,
            minWidth: 1080,
            minHeight: 720,
            show: false,
            backgroundColor: "#0c0a09",
            title: "无限画布",
            // 隐藏菜单栏那一行，只保留系统标题栏和三个窗口按钮；菜单加速键（Ctrl+R / F12 等）仍然生效。
            autoHideMenuBar: true,
            webPreferences: { preload, contextIsolation: true, nodeIntegration: false, sandbox: true },
        });
        mainWindow.once("ready-to-show", () => {
            splash?.destroy();
            splash = null;
            mainWindow?.setMenuBarVisibility(false);
            mainWindow?.show();
        });
        mainWindow.on("closed", () => (mainWindow = null));
        await mainWindow.loadURL(`http://127.0.0.1:${webPort}/`);
    })();
    return booting;
}

/** 只允许页面停留在本地服务；外部链接交给系统浏览器。 */
function lockNavigation(contents) {
    contents.setWindowOpenHandler(({ url }) => {
        if (/^https?:/i.test(url)) shell.openExternal(url);
        return { action: "deny" };
    });
    contents.on("will-navigate", (event, url) => {
        const allowed = webPort && url.startsWith(`http://127.0.0.1:${webPort}`);
        if (allowed) return;
        event.preventDefault();
        if (/^https?:/i.test(url)) shell.openExternal(url);
    });
}

function openAccountWindow() {
    if (accountWindow && !accountWindow.isDestroyed()) return accountWindow.focus();
    accountWindow = new BrowserWindow({
        width: 520,
        height: 460,
        title: "Codex 账号",
        backgroundColor: "#0c0a09",
        webPreferences: { preload, contextIsolation: true, nodeIntegration: false, sandbox: true },
    });
    accountWindow.setMenuBarVisibility(false);
    accountWindow.on("closed", () => (accountWindow = null));
    accountWindow.loadFile(path.join(__dirname, "account.html"));
    return undefined;
}

/** 执行一次 Codex 命令，输出回传给登录窗口，不往终端打印。 */
function runCodexCommand(args, options = {}) {
    return new Promise((resolve) => {
        let settled = false;
        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve(result);
        };
        const timer = setTimeout(() => finish({ ok: false, text: "等待 Codex 响应超时，请重试。" }), CODEX_LOGIN_TIMEOUT_MS);
        let child;
        let output;
        try {
            ({ child, output } = runCodex(args, options));
        } catch (error) {
            return void finish({ ok: false, text: error.message });
        }
        child.on("error", (error) => finish({ ok: false, text: error.message }));
        child.on("exit", (code) => finish({ ok: code === 0, text: output() || "" }));
    });
}

function registerIpc() {
    ipcMain.on("desktop:config", (event) => {
        event.returnValue = injected;
    });
    ipcMain.handle("bootstrap:retry", async () => {
        stopChildren();
        return void (await openApp());
    });
    ipcMain.handle("codex:status", () => runCodexCommand(["login", "status"]));
    ipcMain.handle("codex:login-api-key", (_event, apiKey) => {
        const key = String(apiKey || "").trim();
        if (!key) return { ok: false, text: "请先填写 API Key。" };
        return runCodexCommand(["login", "--with-api-key"], { input: `${key}\n` });
    });
    ipcMain.handle("codex:login-browser", async () => {
        const result = await runCodexCommand(["login"]);
        const url = result.text.match(/https:\/\/[^\s"'<>]+/)?.[0];
        if (url) shell.openExternal(url);
        return { ok: result.ok, text: result.text || (url ? "已在浏览器打开登录页面。" : "Codex 未输出登录地址，请重试。") };
    });
}

function buildMenu() {
    Menu.setApplicationMenu(
        Menu.buildFromTemplate([
            {
                label: "文件",
                submenu: [
                    { label: "Codex 账号…", accelerator: "CommandOrControl+Shift+A", click: openAccountWindow },
                    { type: "separator" },
                    { role: "quit", label: "退出", accelerator: "CommandOrControl+Q" },
                ],
            },
            {
                label: "编辑",
                submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" }],
            },
            {
                label: "视图",
                submenu: [{ role: "reload" }, { role: "forceReload" }, { role: "toggleDevTools" }, { type: "separator" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { role: "togglefullscreen" }],
            },
            {
                label: "帮助",
                submenu: [{ label: "打开项目主页", click: () => shell.openExternal("https://github.com/basketikun/infinite-canvas") }],
            },
        ]),
    );
}

if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on("second-instance", () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
    app.on("web-contents-created", (_event, contents) => lockNavigation(contents));
    app.on("before-quit", () => stopChildren());
    app.on("window-all-closed", () => app.quit());
    app.whenReady().then(() => {
        registerIpc();
        buildMenu();
        createSplash();
        void openApp();
    });
}