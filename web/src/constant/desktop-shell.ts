type OnboardingModel = {
    id: string;
    name: string;
    capability: "text" | "image" | "video" | "audio";
    contextWindow?: number;
    /** 上下文长度由同家族模型推断，而非 models.dev 直接匹配。 */
    contextInferred?: boolean;
    maxOutputTokens?: number;
    inputModalities: string[];
    reasoning: boolean;
    toolCall: boolean;
};

type OnboardingConfig = {
    baseUrl: string;
    apiKey: string;
    models: OnboardingModel[];
    existingCodex: boolean;
};

type SavedOnboardingConfig = {
    setupId: string;
    baseUrl: string;
    apiKey: string;
    modelIds: string[];
    defaultTextModel: string;
};

type DesktopShellConfig = { agentUrl?: string; proxyUrl?: string };

type DesktopShellApi = {
    readOnboarding?: () => Promise<SavedOnboardingConfig | null>;
};

declare global {
    interface Window {
        __CANVAS_DESKTOP__?: DesktopShellConfig;
        canvasDesktop?: DesktopShellApi;
    }
}

const injected: DesktopShellConfig = (typeof window !== "undefined" && window.__CANVAS_DESKTOP__) || {};

/** 桌面版把本地代理地址注入到页面，用户不需要自己启动代理或填写地址。 */
export const desktopShellProxyUrl = String(injected.proxyUrl || "")
    .trim()
    .replace(/\/+$/, "");

export const isDesktopShell = Boolean(desktopShellProxyUrl || injected.agentUrl);
export type { OnboardingConfig, OnboardingModel, SavedOnboardingConfig };
