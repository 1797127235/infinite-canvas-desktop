import { saveAs } from "file-saver";

import i18n from "@/i18n";
import { createModelChannel, normalizedBaseUrlKey, useConfigStore, type AiConfig, type ModelChannel, type WebdavSyncConfig } from "@/stores/use-config-store";
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
    /** 文件里出现、本地没有，于是追加的渠道数量。 */
    added: number;
    /** 文件里出现、本地已有同渠道，于是按文件更新的渠道数量。 */
    updated: number;
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

/** 渠道身份键：优先按接口地址（忽略结尾斜杠与 /v1），地址为空时退回渠道名；两者都没有则不参与合并。 */
function channelKey(channel: ModelChannel) {
    const baseUrl = channel.baseUrl.trim();
    if (baseUrl) return `url:${normalizedBaseUrlKey(baseUrl)}`;
    const name = channel.name.trim();
    return name ? `name:${name}` : "";
}

/** 就地更新一个已存在的渠道：保留本地 id，文件和本地都没填的字段退回本地值。 */
function mergeChannel(local: ModelChannel, imported: ModelChannel): { channel: ModelChannel; keptKey: boolean } {
    const keptKey = !imported.apiKey.trim() && Boolean(local.apiKey.trim());
    return {
        keptKey,
        channel: {
            ...imported,
            id: local.id,
            baseUrl: imported.baseUrl.trim() || local.baseUrl,
            apiKey: keptKey ? local.apiKey : imported.apiKey,
            models: imported.models.length ? imported.models : local.models,
        },
    };
}

/**
 * 导入按渠道合并，不会清空本地已有渠道：
 * - 同 baseUrl（地址为空时同名）的渠道按文件内容就地更新，保留本地 id；
 * - 本地没有的渠道追加到末尾；
 * - 文件里没出现的本地渠道原样保留。
 * 分享出去的配置通常不夹带 API Key / 模型列表，这两项为空时沿用本地已填好的值，
 * 否则用户填好的 Key 和模型会被一次导入静默清空。
 */
function mergeChannels(next: AiConfig, current: AiConfig): { config: AiConfig; added: number; updated: number; keptKeys: number } {
    const channels = [...current.channels];
    const index = new Map<string, number>();
    channels.forEach((channel, position) => {
        const key = channelKey(channel);
        if (key && !index.has(key)) index.set(key, position);
    });
    const ids = new Set(channels.map((channel) => channel.id));
    let added = 0;
    let updated = 0;
    let keptKeys = 0;

    for (const imported of next.channels) {
        const key = channelKey(imported);
        const position = key ? index.get(key) : undefined;
        if (position === undefined) {
            const channel = createModelChannel({ ...imported, id: imported.id && !ids.has(imported.id) ? imported.id : "" });
            ids.add(channel.id);
            if (key) index.set(key, channels.length);
            channels.push(channel);
            added += 1;
            continue;
        }
        const local = channels[position];
        const merged = mergeChannel(local, imported);
        if (merged.keptKey) keptKeys += 1;
        channels[position] = merged.channel;
        updated += 1;
    }

    const baseUrl = next.baseUrl.trim() || current.baseUrl;
    const apiKey = next.apiKey.trim() || current.apiKey;
    return { config: { ...next, channels, baseUrl, apiKey }, added, updated, keptKeys };
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
    const { config, added, updated, keptKeys } = mergeChannels(data.config, useConfigStore.getState().config);
    const { webdav, kept } = keepWebdavPassword(data.webdav, useConfigStore.getState().webdav);
    useConfigStore.setState({ config, webdav });
    usePromptSourceStore.setState(data.promptSources);
    return { added, updated, keptKeys, keptWebdavPassword: kept };
}
