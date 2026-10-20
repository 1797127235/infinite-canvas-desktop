import { saveAs } from "file-saver";

import i18n from "@/i18n";
import { normalizedBaseUrlKey, useConfigStore, type AiConfig, type ModelChannel, type WebdavSyncConfig } from "@/stores/use-config-store";
import { usePromptSourceStore, type PromptSourceSchedule } from "@/stores/use-prompt-source-store";
import type { PromptSource } from "@/services/api/prompt-source-presets";

type AppConfigFile = {
    app: "infinite-canvas";
    version: 1;
    exportedAt: string;
    config: AiConfig;
    webdav: WebdavSyncConfig;
    promptSources: {
        sources: PromptSource[];
        schedule: PromptSourceSchedule;
    };
};

export type AppConfigImportResult = {
    /** 导入文件里没带凭据、但本地已有同渠道，于是沿用下来的数量。 */
    keptKeys: number;
    keptWebdavPassword: boolean;
};

export function exportAppConfig() {
    const { config, webdav } = useConfigStore.getState();
    const { sources, schedule } = usePromptSourceStore.getState();
    const data: AppConfigFile = { app: "infinite-canvas", version: 1, exportedAt: new Date().toISOString(), config, webdav, promptSources: { sources, schedule } };
    saveAs(new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" }), "infinite-canvas-config.json");
}

/**
 * 导入是整份覆盖，但分享出去的配置文件通常不夹带 API Key / 密码。
 * 若导入的渠道没带 Key，而本地同 baseUrl（或 baseUrl 为空时同名）的渠道有 Key，就沿用本地的，
 * 否则用户填好的 Key 会被一次导入静默清空，只能重新去控制台复制。
 */
function keepLocalCredentials(next: AiConfig, current: AiConfig): { config: AiConfig; keptKeys: number } {
    const byBaseUrl = new Map<string, ModelChannel>();
    const byName = new Map<string, ModelChannel>();
    for (const channel of current.channels) {
        if (channel.baseUrl.trim()) byBaseUrl.set(normalizedBaseUrlKey(channel.baseUrl), channel);
        if (channel.name.trim() && !byName.has(channel.name.trim())) byName.set(channel.name.trim(), channel);
    }
    let keptKeys = 0;
    const channels = next.channels.map((channel) => {
        if (channel.apiKey.trim()) return channel;
        const existing = channel.baseUrl.trim() ? byBaseUrl.get(normalizedBaseUrlKey(channel.baseUrl)) : byName.get(channel.name.trim());
        if (!existing?.apiKey.trim()) return channel;
        keptKeys += 1;
        return { ...channel, apiKey: existing.apiKey, baseUrl: channel.baseUrl.trim() ? channel.baseUrl : existing.baseUrl };
    });
    const baseUrl = next.baseUrl.trim() || current.baseUrl;
    const apiKey = next.apiKey.trim() || current.apiKey;
    return { config: { ...next, channels, baseUrl, apiKey }, keptKeys };
}

function keepWebdavPassword(next: WebdavSyncConfig, current: WebdavSyncConfig): { webdav: WebdavSyncConfig; kept: boolean } {
    if (next.password.trim() || !current.password.trim()) return { webdav: next, kept: false };
    if (next.url.trim() !== current.url.trim() || next.username.trim() !== current.username.trim()) return { webdav: next, kept: false };
    return { webdav: { ...next, password: current.password }, kept: true };
}

export async function importAppConfig(file: File): Promise<AppConfigImportResult> {
    let data: AppConfigFile;
    try {
        data = JSON.parse(await file.text()) as AppConfigFile;
    } catch {
        throw new Error(i18n.t("config.invalidFile"));
    }
    if (data.app !== "infinite-canvas" || data.version !== 1 || !data.config || !data.webdav || !data.promptSources) throw new Error(i18n.t("config.invalidFile"));
    const { config, keptKeys } = keepLocalCredentials(data.config, useConfigStore.getState().config);
    const { webdav, kept } = keepWebdavPassword(data.webdav, useConfigStore.getState().webdav);
    useConfigStore.setState({ config, webdav });
    usePromptSourceStore.setState(data.promptSources);
    return { keptKeys, keptWebdavPassword: kept };
}
