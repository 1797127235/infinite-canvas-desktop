import { describe, expect, it } from "vitest";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import worker from "../src";
import { signUpload, verifyUpload, signUrl, verifyUrl } from "../src/sign";
import { sniffType } from "../src/magic";
import { TOKEN_TTL_MS } from "../src/limits";

const IncomingRequest = Request;

/** 直连被测 Worker，等价于真实 HTTP 请求。 */
async function call(input: string, init?: RequestInit): Promise<Response> {
    const response = await worker.fetch(new IncomingRequest(input, init) as unknown as Parameters<typeof worker.fetch>[0], env);
    await waitOnExecutionContext(createExecutionContext());
    return response;
}

const PNG_PREFIX = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const sha = (n: number) => n.toString(16).padStart(64, "0");

function pngBody(bytes = 64): Uint8Array {
    return Uint8Array.from({ length: bytes }, (_, index) => PNG_PREFIX[index % PNG_PREFIX.length]);
}

async function putPart(token: string, body: Uint8Array, part = 1) {
    return call(`http://assets.test/upload/part?part=${part}`, { method: "PUT", headers: { "X-Upload-Token": token }, body });
}

describe("签名", () => {
    it("上传令牌可往返，篡改与过期都拒绝", async () => {
        const token = await signUpload("s", { uid: "u", sha256: "a".repeat(64), type: "image/png", size: 1, iat: Date.now() });
        expect((await verifyUpload("s", token))?.uid).toBe("u");
        expect(await verifyUpload("other", token)).toBeNull();
        const expired = await signUpload("s", { uid: "u", sha256: "a".repeat(64), type: "image/png", size: 1, iat: Date.now() - TOKEN_TTL_MS - 1000 });
        expect(await verifyUpload("s", expired)).toBeNull();
    });

    it("取回 URL 签名校验过期", async () => {
        const exp = Date.now() + 1000;
        const sig = await signUrl("s", "ref/x.png", exp);
        expect(await verifyUrl("s", "ref/x.png", exp, sig)).toBe(true);
        expect(await verifyUrl("s", "ref/y.png", exp, sig)).toBe(false);
        expect(await verifyUrl("s", "ref/x.png", Date.now() - 1, sig)).toBe(false);
    });
});

describe("魔数嗅探", () => {
    it("PNG 前缀通过，文本字节按 PNG 声明被拒", () => {
        expect(sniffType(PNG_PREFIX, "image/png")).toBe(true);
        expect(sniffType(new TextEncoder().encode("<html>"), "image/png")).toBe(false);
    });
});

describe("上传与取回", () => {
    it("完整流程：init → part → complete → GET 签名 URL", async () => {
        const init = await call("http://assets.test/upload/init", {
            method: "POST",
            headers: { Authorization: "Bearer valid-key", "Content-Type": "application/json" },
            body: JSON.stringify({ sha256: "b".repeat(64), size: 64, contentType: "image/png" }),
        });
        expect(init.status).toBe(200);
        const { token } = (await init.json()) as { token: string };
        expect(token).toBeTruthy();

        const part = await putPart(token, pngBody());
        expect(part.status).toBe(200);
        const { etag } = (await part.json()) as { etag: string };

        const complete = await call("http://assets.test/upload/complete", {
            method: "POST",
            headers: { "X-Upload-Token": token, "Content-Type": "application/json" },
            body: JSON.stringify([{ partNumber: 1, etag }]),
        });
        expect(complete.status).toBe(200);
        const { url } = (await complete.json()) as { url: string };
        expect(url).toContain("/f/ref/");
        expect(url).toContain("exp=");

        // 取回：换到测试 worker 自己的可访问 origin
        const serve = await call(url.replace("https://assets.test", "http://assets.test"));
        expect(serve.status).toBe(200);
        expect(serve.headers.get("content-disposition")).toBe("attachment");
        expect(new Uint8Array(await serve.arrayBuffer())[0]).toBe(0x89);

        // 同素材重复 init 走去重，直接返回新 URL
        const again = await call("http://assets.test/upload/init", {
            method: "POST",
            headers: { Authorization: "Bearer valid-key", "Content-Type": "application/json" },
            body: JSON.stringify({ sha256: "b".repeat(64), size: 64, contentType: "image/png" }),
        });
        expect(again.status).toBe(200);
        expect(((await again.json()) as { url: string }).url).toContain("/f/ref/");
    });

    it("内容与声明类型不符返回 415", async () => {
        const init = await call("http://assets.test/upload/init", {
            method: "POST",
            headers: { Authorization: "Bearer valid-key", "Content-Type": "application/json" },
            body: JSON.stringify({ sha256: "c".repeat(64), size: 32, contentType: "image/png" }),
        });
        const { token } = (await init.json()) as { token: string };
        expect((await putPart(token, new TextEncoder().encode("not a png"))).status).toBe(415);
    });

    it("无效 key 返回 401", async () => {
        const response = await call("http://assets.test/upload/init", {
            method: "POST",
            headers: { Authorization: "Bearer bad-key", "Content-Type": "application/json" },
            body: JSON.stringify({ sha256: "d".repeat(64), size: 32, contentType: "image/png" }),
        });
        expect(response.status).toBe(401);
    });

    it("超出每日字节额度返回 429", async () => {
        const size = 19 * 1024 * 1024;
        let last = 200;
        for (let index = 0; index < 12; index++) {
            const response = await call("http://assets.test/upload/init", {
                method: "POST",
                headers: { Authorization: "Bearer valid-key", "Content-Type": "application/json" },
                body: JSON.stringify({ sha256: sha(index + 100), size, contentType: "image/png" }),
            });
            last = response.status;
            if (response.status === 429) break;
        }
        expect(last).toBe(429);
    });

    it("签名 URL 过期后取回被拒", async () => {
        const expired = Date.now() - 1;
        const sig = await signUrl("test-secret", "ref/bb.png", expired);
        const serve = await call(`http://assets.test/f/ref/bb.png?exp=${expired}&sig=${sig}`);
        expect(serve.status).toBe(403);
    });
});
