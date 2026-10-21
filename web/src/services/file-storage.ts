import localforage from "localforage";
import { nanoid } from "nanoid";

import i18n from "@/i18n";
import { useConfigStore, withLocalProxy } from "@/stores/use-config-store";

export type UploadedFile = { url: string; storageKey: string; bytes: number; mimeType: string; width?: number; height?: number; durationMs?: number };
export type MediaFetchOptions = { headers?: Record<string, string> };

const store = localforage.createInstance({ name: "infinite-canvas", storeName: "media_files" });
const objectUrls = new Map<string, string>();

/**
 * 下载失败且**不能降级为远程播放**的情形：内容是错误页 / 不是音视频，或需要鉴权而被拒。
 * `<video>` 发不出 Authorization 头，这类地址直连必然黒屏，必须报错。
 */
export function isMediaUnavailableError(error: unknown) {
    if (!(error instanceof Error)) return false;
    if (error.name === "MediaContentError") return true;
    const status = (error as Error & { status?: number }).status;
    return error.name === "MediaHttpError" && (status === 401 || status === 403 || status === 404);
}

export async function uploadMediaFile(input: string | Blob, prefix = "file", options?: MediaFetchOptions): Promise<UploadedFile> {
    const blob = typeof input === "string" ? await downloadMedia(input, prefix, options) : input;
    const storageKey = `${prefix}:${nanoid()}`;
    await store.setItem(storageKey, blob);
    const url = URL.createObjectURL(blob);
    objectUrls.set(storageKey, url);
    const meta = blob.type.startsWith("video/") ? await readVideoMeta(url) : blob.type.startsWith("audio/") ? await readAudioMeta(url) : {};
    return { url, storageKey, bytes: blob.size, mimeType: blob.type || "application/octet-stream", ...meta };
}

/**
 * 不少渠道的视频地址要求鉴权（如 codex2api 的 `/v1/videos/{id}/content` 不带 Key 直接 401），
 * 但 `<video>` 标签发不出 Authorization 头，所以下载时必须自己带上。
 * 按 origin 在本地渠道列表里找对应渠道，只给渠道自己的域名附凭据，避免把 Key 泄露给第三方图床。
 */
export function mediaAuthHeaders(url: string): Record<string, string> {
    const { config } = useConfigStore.getState();
    let origin = "";
    try {
        origin = new URL(url).origin;
    } catch {
        return {};
    }
    const owner = [config, ...config.channels].find((channel) => {
        if (!channel.apiKey.trim() || !channel.baseUrl.trim()) return false;
        try {
            return new URL(channel.baseUrl.trim()).origin === origin;
        } catch {
            return false;
        }
    });
    if (!owner) return {};
    return owner.apiFormat === "gemini" ? { "x-goog-api-key": owner.apiKey } : { Authorization: `Bearer ${owner.apiKey}` };
}

/**
 * 下载远程媒体。响应非 2xx、或返回 text/html、JSON 时直接报错：
 * 否则渠道把错误页 / 站点首页当成 200 返回时，会被原样存成“视频”，节点显示空播放器却标记为成功。
 * 同源渠道的地址自动带上 API Key（部分渠道的媒体地址需要鉴权）。
 */
async function downloadMedia(url: string, prefix: string, options?: MediaFetchOptions) {
    const response = await fetch(withLocalProxy(url), { headers: { ...mediaAuthHeaders(url), ...options?.headers } });
    if (!response.ok) {
        const error = new Error(i18n.t("apiErrors.mediaDownloadFailed", { status: response.status })) as Error & { status?: number };
        error.name = "MediaHttpError";
        error.status = response.status;
        throw error;
    }
    const blob = await response.blob();
    const type = blob.type.toLowerCase();
    const expected = prefix === "video" ? "video/" : prefix === "audio" ? "audio/" : "";
    const wrongType = Boolean(expected) && Boolean(type) && !type.startsWith(expected) && !type.startsWith("application/octet-stream");
    if (type.startsWith("text/") || type.includes("json") || wrongType) {
        const error = new Error(i18n.t("apiErrors.mediaNotPlayable", { type: blob.type || i18n.t("apiErrors.mediaUnknownType") }));
        error.name = "MediaContentError";
        throw error;
    }
    return blob;
}

export async function resolveMediaUrl(storageKey?: string, fallback = "") {
    if (!storageKey) return fallback;
    const cached = objectUrls.get(storageKey);
    if (cached) return cached;
    const blob = await store.getItem<Blob>(storageKey);
    if (!blob) return fallback;
    const url = URL.createObjectURL(blob);
    objectUrls.set(storageKey, url);
    return url;
}

export async function getMediaBlob(storageKey: string) {
    return store.getItem<Blob>(storageKey);
}

export async function setMediaBlob(storageKey: string, blob: Blob) {
    await store.setItem(storageKey, blob);
    const url = URL.createObjectURL(blob);
    objectUrls.set(storageKey, url);
    return url;
}

export async function deleteStoredMedia(keys: Iterable<string>) {
    await Promise.all(
        Array.from(new Set(keys)).map(async (key) => {
            const url = objectUrls.get(key);
            if (url) URL.revokeObjectURL(url);
            objectUrls.delete(key);
            await store.removeItem(key);
        }),
    );
}

export async function cleanupUnusedMedia(usedData: unknown) {
    const usedKeys = collectMediaStorageKeys(usedData);
    const unused: string[] = [];
    await store.iterate((_value, key) => {
        if (!usedKeys.has(key)) unused.push(key);
    });
    await Promise.all(unused.map((key) => store.removeItem(key)));
}

export function collectMediaStorageKeys(value: unknown, keys = new Set<string>()) {
    if (!value || typeof value !== "object") return keys;
    if ("storageKey" in value && typeof value.storageKey === "string" && value.storageKey.includes(":")) keys.add(value.storageKey);
    Object.values(value).forEach((item) => (Array.isArray(item) ? item.forEach((child) => collectMediaStorageKeys(child, keys)) : collectMediaStorageKeys(item, keys)));
    return keys;
}

function readVideoMeta(url: string) {
    return new Promise<{ width: number; height: number; durationMs?: number }>((resolve) => {
        const video = document.createElement("video");
        const done = () => resolve({ width: video.videoWidth || 1280, height: video.videoHeight || 720, durationMs: Number.isFinite(video.duration) ? Math.round(video.duration * 1000) : undefined });
        video.onloadedmetadata = done;
        video.onerror = done;
        video.src = url;
    });
}

function readAudioMeta(url: string) {
    return new Promise<{ durationMs?: number }>((resolve) => {
        const audio = document.createElement("audio");
        const done = () => resolve({ durationMs: Number.isFinite(audio.duration) ? Math.round(audio.duration * 1000) : undefined });
        audio.onloadedmetadata = done;
        audio.onerror = done;
        audio.src = url;
    });
}
