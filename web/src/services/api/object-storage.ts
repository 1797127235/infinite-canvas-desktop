import axios from "axios";

import { ASSET_GATEWAY_ORIGIN } from "@/constant/asset-gateway";
import { withLocalProxy } from "@/stores/use-config-store";

/**
 * 官方素材网关客户端：本地素材换取 24 小时公网签名 URL，默认直接上传。
 * 请求经本地代理转发，网关调用与模型请求一样进入 desktop.log，便于排查素材路径。
 * 未配置 API Key 返回 null，调用方自行降级（压缩 base64 或报错）。
 */

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export type UploadedAsset = { url: string; expiresAt: number };
export type UploadAssetOptions = { signal?: AbortSignal; onProgress?: (loaded: number, total: number) => void };

export async function uploadAsset(source: string | File, apiKey: string, options: UploadAssetOptions = {}): Promise<UploadedAsset | null> {
    if (!apiKey?.trim()) return null;

    const blob = typeof source === "string" ? await (await fetch(source)).blob() : source;
    if (!blob.type) throw new Error("素材缺少类型信息");
    const bytes = new Uint8Array(await blob.arrayBuffer());

    const headers = { Authorization: `Bearer ${apiKey}` };
    const init = await axios.post(
        withLocalProxy(`${ASSET_GATEWAY_ORIGIN}/upload/init`),
        { sha256: await sha256Hex(bytes.buffer), size: bytes.length, contentType: blob.type },
        { headers, signal: options.signal },
    );
    if (init.data.url) return init.data as UploadedAsset; // 内容寻址命中，直接换发签名 URL

    const token = init.data.token as string;
    const chunkBytes = init.data.chunkBytes as number;
    const parts: { partNumber: number; etag: string }[] = [];
    for (let offset = 0, partNumber = 1; offset < bytes.length; offset += chunkBytes, partNumber++) {
        const part = await axios.put(withLocalProxy(`${ASSET_GATEWAY_ORIGIN}/upload/part?part=${partNumber}`), bytes.subarray(offset, Math.min(offset + chunkBytes, bytes.length)), {
            headers: { "X-Upload-Token": token, "Content-Type": "application/octet-stream" },
            signal: options.signal,
        });
        parts.push({ partNumber, etag: part.data.etag });
        options.onProgress?.(Math.min(offset + chunkBytes, bytes.length), bytes.length);
    }
    const complete = await axios.post(withLocalProxy(`${ASSET_GATEWAY_ORIGIN}/upload/complete`), parts, { headers: { "X-Upload-Token": token }, signal: options.signal });
    return complete.data as UploadedAsset;
}

