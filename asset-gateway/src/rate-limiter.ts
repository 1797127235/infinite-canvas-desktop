/**
 * 额度 Durable Object：每个 C2A API Key 一个实例（idFromName）。
 * 职责：转发上游校验 key（内存缓存 10 分钟）+ 当日字节/次数原子记账。
 */
import { DurableObject } from "cloudflare:workers";
import { DAILY_BYTES, DAILY_COUNT, KEY_CACHE_TTL_MS } from "./limits";

type GrantRequest = { action: "grant"; apiKey: string; bytes: number };
type GrantResponse = { ok: true } | { ok: false; status: number; message: string };

type DailyUsage = { bytes: number; count: number };

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

    private async today(): Promise<{ key: string; usage: DailyUsage }> {
        const key = `day:${new Date().toISOString().slice(0, 10)}`;
        return { key, usage: (await this.ctx.storage.get<DailyUsage>(key)) ?? { bytes: 0, count: 0 } };
    }

    async fetch(request: Request): Promise<Response> {
        const { action, apiKey, bytes } = (await request.json()) as GrantRequest;
        if (action !== "grant" || !apiKey) return Response.json({ ok: false, status: 400, message: "无效请求" } satisfies GrantResponse);
        if (!(await this.validKey(apiKey))) return Response.json({ ok: false, status: 401, message: "API Key 校验失败" } satisfies GrantResponse);
        const { key, usage } = await this.today();
        if (usage.count + 1 > DAILY_COUNT || usage.bytes + bytes > DAILY_BYTES) {
            return Response.json({ ok: false, status: 429, message: "今日上传额度已用完（200 MB / 50 次），明天恢复" } satisfies GrantResponse);
        }
        await this.ctx.storage.put(key, { bytes: usage.bytes + bytes, count: usage.count + 1 });
        return Response.json({ ok: true } satisfies GrantResponse);
    }
}
