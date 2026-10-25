/** HMAC-SHA256 签名：上传令牌（自包含）与取回 URL 两套都用它。 */
import { TOKEN_TTL_MS } from "./limits";

const encoder = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
    const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let binary = "";
    for (const byte of view) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(text: string): Uint8Array {
    const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmac(secret: string, message: string): Promise<string> {
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return b64url(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

export type UploadClaims = { uid: string; sha256: string; type: string; size: number; iat: number };

/** 生成自包含上传令牌：payload 签名，无服务端会话。 */
export async function signUpload(secret: string, claims: UploadClaims): Promise<string> {
    const payload = b64url(encoder.encode(JSON.stringify(claims)));
    return `${payload}.${await hmac(secret, `upload:${payload}`)}`;
}

/** 校验并还原上传令牌；签名不符或已过期返回 null。 */
export async function verifyUpload(secret: string, token: string): Promise<UploadClaims | null> {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;
    if ((await hmac(secret, `upload:${payload}`)) !== signature) return null;
    try {
        const claims = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as UploadClaims;
        if (Date.now() - claims.iat >= 0 && Date.now() - claims.iat < TOKEN_TTL_MS) return claims;
        return null;
    } catch {
        return null;
    }
}

/** 生成取回 URL 的过期签名（覆盖对象 key + 过期时间）。 */
export async function signUrl(secret: string, key: string, expiresAt: number): Promise<string> {
    return hmac(secret, `get:${key}:${expiresAt}`);
}

export async function verifyUrl(secret: string, key: string, expiresAt: number, signature: string): Promise<boolean> {
    return (await signUrl(secret, key, expiresAt)) === signature && expiresAt > Date.now();
}
