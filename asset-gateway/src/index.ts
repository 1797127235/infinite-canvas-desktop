/**
 * 素材网关：画布本地参考图/视频 → 公网临时 URL。
 * 上传三段式统一走 R2 multipart（单片即小文件），字节不过网关以外的服务器；
 * 取回 URL 带 24 小时 HMAC 签名，桶对象由生命周期规则 24 小时自动删除。
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ALLOWED_TYPES, CHUNK_BYTES, MAX_FILE_BYTES, MAX_PART_BYTES, URL_TTL_MS } from "./limits";
import { RateLimiter } from "./rate-limiter";
import { signUpload, signUrl, verifyUpload, verifyUrl } from "./sign";
import { sniffType } from "./magic";

export type Env = {
    ASSETS: R2Bucket;
    RATE_LIMITER: DurableObjectNamespace;
    SIGNING_SECRET: string;
    C2A_BASE_URL: string;
    GATEWAY_ORIGIN: string;
};

const app = new Hono<{ Bindings: Env }>();

// 桌面端渲染进程跑在 localhost/127.0.0.1 任意端口，取回时还可能是纯脚本无 origin。
app.use("*", cors({ origin: (origin) => origin ?? "*", allowMethods: ["GET", "POST", "PUT", "OPTIONS"], allowHeaders: ["Authorization", "Content-Type", "X-Upload-Token"], maxAge: 86400 }));

app.onError((error, context) => context.json({ error: error instanceof Error ? error.message : String(error) }, 500));

app.get("/healthz", (context) => context.json({ ok: true, time: new Date().toISOString() }));

/** Bearer C2A key → 去对应 DO 校验并记账。 */
async function grant(context: { env: Env }, apiKey: string, bytes: number): Promise<Response | null> {
    const stub = context.env.RATE_LIMITER.idFromName(apiKey);
    const result = (await (await context.env.RATE_LIMITER.get(stub).fetch("https://do/grant", { method: "POST", body: JSON.stringify({ action: "grant", apiKey, bytes }) })).json()) as { ok: boolean; status?: number; message?: string };
    return result.ok ? null : context.json({ error: result.message }, (result.status ?? 401) as 401 | 429 | 400);
}

function bearer(header: string | undefined): string {
    return header?.startsWith("Bearer ") ? header.slice(7) : "";
}

const objectKey = (sha256: string, type: string) => `ref/${sha256}.${ALLOWED_TYPES[type]}`;

app.post("/upload/init", async (context) => {
    const apiKey = bearer(context.req.header("Authorization"));
    const { sha256, size, contentType } = await context.req.json<{ sha256: string; size: number; contentType: string }>();
    if (!apiKey || !/^[a-f0-9]{64}$/.test(sha256) || !Number.isFinite(size)) return context.json({ error: "参数不完整" }, 400);
    if (!ALLOWED_TYPES[contentType]) return context.json({ error: "仅支持 JPEG / PNG / WebP / MP4 / MOV" }, 415);
    if (size > MAX_FILE_BYTES) return context.json({ error: "单个文件不能超过 20 MiB" }, 413);

    const key = objectKey(sha256, contentType);
    const expiresAt = Date.now() + URL_TTL_MS;
    // 内容寻址：同一素材已存在时直接换发新签名 URL，不再占用额度。
    if (await context.env.ASSETS.head(key)) {
        return context.json(await signedUrlResult(context.env, key, expiresAt));
    }
    const denied = await grant(context, apiKey, size);
    if (denied) return denied;

    const upload = await context.env.ASSETS.createMultipartUpload(key, { httpMetadata: { contentType }, customMetadata: { sha256 } });
    const token = await signUpload(context.env.SIGNING_SECRET, { uid: upload.uploadId, sha256, type: contentType, size, iat: Date.now() });
    return context.json({ token, key, chunkBytes: CHUNK_BYTES });
});

app.put("/upload/part", async (context) => {
    const token = context.req.header("X-Upload-Token") ?? "";
    const claims = await verifyUpload(context.env.SIGNING_SECRET, token);
    const partNumber = Number(context.req.query("part"));
    if (!claims || !Number.isInteger(partNumber) || partNumber < 1) return context.json({ error: "上传令牌无效或已过期，请重新发起上传" }, 401);

    const body = new Uint8Array(await context.req.arrayBuffer());
    console.log(`[part] part=${partNumber} bytes=${body.length} sha=${claims.sha256.slice(0, 8)}`);
    if (body.length > MAX_PART_BYTES) return context.json({ error: `分片超过 ${Math.floor(MAX_PART_BYTES / 1024 / 1024)} MiB（实际收到 ${body.length} 字节）` }, 413);
    if (partNumber === 1 && !sniffType(body, claims.type)) return context.json({ error: "文件内容与声明的类型不符" }, 415);

    const upload = context.env.ASSETS.resumeMultipartUpload(objectKey(claims.sha256, claims.type), claims.uid);
    try {
        const part = await upload.uploadPart(partNumber, body);
        return context.json({ partNumber, etag: part.etag });
    } catch {
        return context.json({ error: "分片写入失败，请重试该分片" }, 500);
    }
});

app.post("/upload/complete", async (context) => {
    const token = context.req.header("X-Upload-Token") ?? "";
    const claims = await verifyUpload(context.env.SIGNING_SECRET, token);
    const parts = await context.req.json<{ partNumber: number; etag: string }[]>();
    if (!claims || !Array.isArray(parts) || !parts.length) return context.json({ error: "上传令牌无效或已过期，请重新发起上传" }, 401);

    const key = objectKey(claims.sha256, claims.type);
    const upload = context.env.ASSETS.resumeMultipartUpload(key, claims.uid);
    try {
        await upload.complete(parts);
    } catch {
        return context.json({ error: "合并分片失败，请重试" }, 500);
    }
    const expiresAt = Date.now() + URL_TTL_MS;
    return context.json(await signedUrlResult(context.env, key, expiresAt));
});

async function signedUrlResult(env: Env, key: string, expiresAt: number) {
    return { url: `${env.GATEWAY_ORIGIN}/f/${key}?exp=${expiresAt}&sig=${await signUrl(env.SIGNING_SECRET, key, expiresAt)}`, expiresAt };
}

app.get("/f/*", async (context) => {
    const key = context.req.path.slice(3);
    const exp = Number(context.req.query("exp"));
    const signature = context.req.query("sig") ?? "";
    if (!key.startsWith("ref/") || !Number.isFinite(exp) || !(await verifyUrl(context.env.SIGNING_SECRET, key, exp, signature))) {
        return context.json({ error: "链接无效或已过期" }, 403);
    }
    const object = await context.env.ASSETS.get(key);
    if (!object) return context.json({ error: "素材不存在或已被清理" }, 404);
    return new Response(object.body, {
        headers: {
            "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
            // 强制下载语义：即使被第三方拿到链接也不能当网页/脚本渲染
            "content-disposition": "attachment",
            "cache-control": "private, max-age=0, no-store",
        },
    });
});

// Durable Object 类必须顶层命名导出，miniflare / wrangler 才能解析绑定。
export { RateLimiter };

export default { fetch: app.fetch };
