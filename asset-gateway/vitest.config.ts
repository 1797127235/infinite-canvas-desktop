import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

/** 拦截 DO 发起的出站请求：把 C2A key 校验 mock 掉。 */
async function outbound(request: Request): Promise<Response> {
    if (request.url.includes("/v1/models")) {
        const valid = request.headers.get("Authorization") === "Bearer valid-key";
        return new Response(valid ? `{"data":[]}` : `{"error":"bad key"}`, { status: valid ? 200 : 401 });
    }
    return new Response("not found", { status: 404 });
}

export default defineConfig({
    plugins: [
        cloudflareTest({
            wrangler: { configPath: "./wrangler.toml" },
            miniflare: {
                compatibilityDate: "2026-10-01",
                bindings: {
                    SIGNING_SECRET: "test-secret",
                    C2A_BASE_URL: "https://c2a.test",
                    GATEWAY_ORIGIN: "https://assets.test",
                },
                r2Buckets: ["ASSETS"],
                outboundService: async (request) => outbound(request),
            },
        }),
    ],
});
