/**
 * 额度 Durable Object：每个 C2A API Key 一个实例（idFromName）。
 * 测试阶段不设用量限制，仅负责校验 key（内存缓存 10 分钟）。
 */
import { DurableObject } from "cloudflare:workers";
import { KEY_CACHE_TTL_MS } from "./limits";

type GrantRequest = { action: "grant"; apiKey: string; bytes: number };
type GrantResponse = { ok: true } | { ok: false; status: number; message: string };

export class RateLimiter extends DurableObject {
    /** key 校验缓存；DO 重启丢失只会多一次上游校验，无正确性影响。 */
    private keyCache = new Map<string, { ok: boolean; at: number }>();

    private async validKey(apiKey: string): Promise<boolean> {
        const cached = this.keyCache.get(apiKey);
        if (cached && Date.now() - cached.at < KEY_CACHE_TTL_MS) return cached.ok;
        const response = await fetch(`${this.env.C2A_BASE_URL}/v1/models`, { headers: { Authorization: `Bearer ${apiKey}` } });
        const ok = response.status === 200;
        this.keyCache.set(apiKey, { ok, at: Date.now() });
        return ok;
    }

    async fetch(request: Request): Promise<Response> {
        const { apiKey } = (await request.json()) as GrantRequest;
        if (!apiKey) return Response.json({ ok: false, status: 400, message: "无效请求" } satisfies GrantResponse);
        if (!(await this.validKey(apiKey))) return Response.json({ ok: false, status: 401, message: "API Key 校验失败" } satisfies GrantResponse);
        return Response.json({ ok: true } satisfies GrantResponse);
    }
}
