const { contextBridge, ipcRenderer } = require("electron");

/** 主进程注入的运行期地址，页面脚本执行前就绪。 */
const config = ipcRenderer.sendSync("desktop:config") || {};

if (config.agentUrl) contextBridge.exposeInMainWorld("__CANVAS_AGENT__", { url: config.agentUrl, token: "" });
if (config.agentUrl || config.proxyUrl) contextBridge.exposeInMainWorld("__CANVAS_DESKTOP__", { agentUrl: config.agentUrl || "", proxyUrl: config.proxyUrl || "" });

contextBridge.exposeInMainWorld("canvasDesktop", {
    onBootstrapProgress: (callback) => {
        const handler = (_event, value) => callback(value);
        ipcRenderer.on("bootstrap:progress", handler);
        return () => ipcRenderer.removeListener("bootstrap:progress", handler);
    },
    retryBootstrap: () => ipcRenderer.invoke("bootstrap:retry"),
    codexStatus: () => ipcRenderer.invoke("codex:status"),
    codexLoginBrowser: () => ipcRenderer.invoke("codex:login-browser"),
    codexLoginApiKey: (apiKey) => ipcRenderer.invoke("codex:login-api-key", apiKey),
    fetchOnboardingModels: (input) => ipcRenderer.invoke("onboarding:fetch-models", input),
    saveOnboarding: (input) => ipcRenderer.invoke("onboarding:save", input),
    readOnboarding: () => ipcRenderer.invoke("onboarding:read"),
    exportProblemLog: (bundle) => ipcRenderer.invoke("problem-log:export", bundle),
});
