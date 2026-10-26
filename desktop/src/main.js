const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { execFileSync } = require("node:child_process");
const { app, BrowserWindow, Menu, ipcMain, dialog, safeStorage, shell } = require("electron");
const { autoUpdater } = require("electron-updater");

const { ensureCodex, log, runCodex, startAgent, startProxy, stopChildren } = require("./services");
const { fetchAvailableModels, hasExistingCodexConfig, normalizeOpenAIBaseUrl } = require("./onboarding");
const { channelSetupForRenderer, readSetup, saveSetup, setupCodexDecision } = require("./onboarding-store");
const { AGENT_PREFIX, startWebServer } = require("./server");

const preload = path.join(__dirname, "preload.js");
const CODEX_LOGIN_TIMEOUT_MS = 300_000;

let splash = null;
let mainWindow = null;
let accountWindow = null;
let agentPort = 0;
let webPort = 0;
let injected = { agentUrl: "", proxyUrl: "", onboarding: null };
let finishOnboarding = null;
let onboardingSetupCodex = false;
let runtimeCodexEnv = {};
let booting = null;
let lastProgress = { phase: "codex" };

function sendProgress(value) {
    lastProgress = value;
    if (splash && !splash.isDestroyed()) splash.webContents.send("bootstrap:progress", value);
}

/** 只在系统里找 Codex 可执行文件；配置文件是否存在交给 hasExistingCodexConfig 统一判断。 */
function detectCodexExecutable() {
    const candidates = process.platform === "win32" ? ["codex.exe", "codex.cmd"] : ["codex"];
    for (const binary of candidates) {
        try {
            execFileSync(process.platform === "win32" ? "where" : "which", [binary], { stdio: "ignore" });
            return true;
        } catch {}
    }
    const userPaths = process.platform === "win32"
        ? [path.join(process.env.LOCALAPPDATA || "", "Programs", "Codex", "codex.exe")]
        : process.platform === "darwin"
          ? ["/Applications/Codex.app/Contents/Resources/codex", path.join(os.homedir(), "Applications/Codex.app/Contents/Resources/codex")]
          : ["/usr/bin/codex", "/usr/local/bin/codex", path.join(os.homedir(), ".local", "bin", "codex")];
    return userPaths.some((candidate) => candidate && fs.existsSync(candidate));
}

function createSplash() {
    splash = new BrowserWindow({
        width: 560,
        height: 700,
        minWidth: 520,
        minHeight: 560,
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

/** 新用户先完成一次配置，再启动 Codex 运行时与画布服务。 */
async function bootstrap() {
    const userDataPath = app.getPath("userData");
    let setup = readSetup(userDataPath, safeStorage);
    if (!setup) {
        const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
        const existingCodex = hasExistingCodexConfig({
            configTomlExists: fs.existsSync(path.join(codexHome, "config.toml")),
            authJsonExists: fs.existsSync(path.join(codexHome, "auth.json")),
            codexExecutableExists: detectCodexExecutable(),
        });
        onboardingSetupCodex = setupCodexDecision(existingCodex);
        sendProgress({ phase: "onboarding", existingCodex, setupCodex: onboardingSetupCodex, baseUrl: "https://www.codex2api.com" });
        setup = await new Promise((resolve) => { finishOnboarding = resolve; });
        finishOnboarding = null;
    }
    sendProgress({ phase: "codex", received: 0, total: 0 });
    const codexBin = await ensureCodex(sendProgress);
    const proxyPort = await startProxy(sendProgress);
    runtimeCodexEnv = setup.useManagedCodexHome ? { CODEX_HOME: path.join(userDataPath, "codex-home"), CANVAS_C2A_API_KEY: setup.apiKey } : {};
    agentPort = await startAgent(codexBin, sendProgress, runtimeCodexEnv);
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
        title: "助手账号",
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
        const timer = setTimeout(() => finish({ ok: false, text: "等待助手响应超时，请重试。" }), CODEX_LOGIN_TIMEOUT_MS);
        let child;
        let output;
        try {
            ({ child, output } = runCodex(args, { ...options, env: { ...runtimeCodexEnv, ...options.env } }));
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
        if (finishOnboarding) {
            const setup = readSetup(app.getPath("userData"), safeStorage);
            if (!setup) {
                sendProgress({ phase: "onboarding", existingCodex: !onboardingSetupCodex, setupCodex: onboardingSetupCodex, baseUrl: "https://www.codex2api.com" });
                return;
            }
            const resolve = finishOnboarding;
            finishOnboarding = null;
            resolve(setup);
            return;
        }
        await stopChildren();
        booting = null;
        return void (await openApp());
    });
    ipcMain.handle("onboarding:fetch-models", async (event, input) => {
        if (event.sender !== splash?.webContents) throw new Error("只允许桌面配置向导读取模型");
        const baseUrl = normalizeOpenAIBaseUrl(input?.baseUrl);
        const apiKey = String(input?.apiKey || "").trim();
        if (!apiKey) throw new Error("请填写 C2A API Key。");
        return { models: await fetchAvailableModels({ baseUrl, apiKey }), existingCodex: !onboardingSetupCodex };
    });
    ipcMain.handle("onboarding:save", (event, input) => {
        if (event.sender !== splash?.webContents) throw new Error("只允许桌面配置向导保存配置");
        const baseUrl = normalizeOpenAIBaseUrl(input?.baseUrl);
        const apiKey = String(input?.apiKey || "").trim();
        const models = Array.isArray(input?.models) ? input.models : [];
        const selectedTextModels = Array.isArray(input?.selectedTextModels) ? input.selectedTextModels.map(String) : [];
        const defaultTextModel = String(input?.defaultTextModel || "");
        const saved = saveSetup({ userDataPath: app.getPath("userData"), safeStorage, baseUrl, apiKey, models, selectedTextModels, defaultTextModel, setupCodex: onboardingSetupCodex });
        const setup = readSetup(app.getPath("userData"), safeStorage);
        if (finishOnboarding) finishOnboarding(setup);
        sendProgress({ phase: "onboarding-saved" });
        return saved;
    });
    ipcMain.handle("onboarding:read", (event) => {
        if (event.sender !== mainWindow?.webContents) throw new Error("只允许画布页面读取配置");
        const setup = readSetup(app.getPath("userData"), safeStorage);
        return channelSetupForRenderer(setup);
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
        return { ok: result.ok, text: result.text || (url ? "已在浏览器打开登录页面。" : "助手未输出登录地址，请重试。") };
    });
}

/**
 * 自动更新走 GitHub Releases（electron-builder.yml 的 publish）。仅打包后启用，
 * 开发模式跳过（AppImage/NSIS 环境不存在，检查会直接抛错）。
 * 启动时静默检查一次，失败（离线、GitHub 不可达）不打扰用户；「帮助 → 检查更新」手动检查才弹窗。
 */
let manualUpdateCheck = false;

function setupAutoUpdater() {
    if (!app.isPackaged) return;
    autoUpdater.autoDownload = true;
    autoUpdater.on("update-available", async (info) => {
        if (!manualUpdateCheck) return;
        manualUpdateCheck = false;
        await dialog.showMessageBox({ type: "info", title: "检查更新", message: `发现新版本 v${info.version}，正在后台下载，完成后会提示安装。` });
    });
    autoUpdater.on("update-not-available", async () => {
        if (!manualUpdateCheck) return;
        manualUpdateCheck = false;
        await dialog.showMessageBox({ type: "info", title: "检查更新", message: `当前已是最新版本（v${app.getVersion()}）。` });
    });
    autoUpdater.on("error", async (error) => {
        if (!manualUpdateCheck) return;
        manualUpdateCheck = false;
        await dialog.showMessageBox({ type: "warning", title: "检查更新", message: "检查更新失败，请检查网络后重试。", detail: String(error?.message || error) });
    });
    autoUpdater.on("update-downloaded", async () => {
        const { response } = await dialog.showMessageBox({
            type: "info",
            title: "更新就绪",
            message: "新版本已下载完成。",
            detail: "重启应用以完成安装，重启后画布数据不受影响。",
            buttons: ["立即重启", "稍后"],
            defaultId: 0,
            cancelId: 1,
        });
        if (response === 0) autoUpdater.quitAndInstall();
    });
    autoUpdater.checkForUpdates().catch((error) => log(`update check failed: ${error.message}`));
}

function buildMenu() {
    Menu.setApplicationMenu(
        Menu.buildFromTemplate([
            {
                label: "文件",
                submenu: [
                    { label: "助手账号…", accelerator: "CommandOrControl+Shift+A", click: openAccountWindow },
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
                submenu: [
                    { label: "检查更新…", click: () => { manualUpdateCheck = true; autoUpdater.checkForUpdates().catch(() => {}); } },
                    { type: "separator" },
                    { label: "打开项目主页", click: () => shell.openExternal("https://github.com/basketikun/infinite-canvas") },
                ],
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
    let quitting = false;
    app.on("before-quit", (event) => {
        if (quitting) return;
        event.preventDefault();
        quitting = true;
        void stopChildren().finally(() => app.quit());
    });
    app.on("window-all-closed", () => app.quit());
    app.whenReady().then(() => {
        registerIpc();
        buildMenu();
        createSplash();
        setupAutoUpdater();
        void openApp();
    });
}