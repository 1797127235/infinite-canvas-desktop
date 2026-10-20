type DesktopShellConfig = { agentUrl?: string; proxyUrl?: string };

declare global {
    interface Window {
        __CANVAS_DESKTOP__?: DesktopShellConfig;
    }
}

const injected: DesktopShellConfig = (typeof window !== "undefined" && window.__CANVAS_DESKTOP__) || {};

/** 桌面版把本地代理地址注入到页面，用户不需要自己启动代理或填写地址。 */
export const desktopShellProxyUrl = String(injected.proxyUrl || "")
    .trim()
    .replace(/\/+$/, "");

export const isDesktopShell = Boolean(desktopShellProxyUrl || injected.agentUrl);
