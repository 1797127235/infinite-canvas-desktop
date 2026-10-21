import grokVideoScript from "@/constant/c2a/grok-video.js?raw";
import h3Script from "@/constant/c2a/minimax-h3.js?raw";
import h3MaxScript from "@/constant/c2a/minimax-h3-max.js?raw";

/** 内置默认渠道：脚本随仓库维护，用户只需要填 API Key。 */
export const C2A_CHANNEL = {
    id: "c2a-relay",
    name: "C2A 中转",
    baseUrl: "https://www.codex2api.com",
    apiKey: "",
    apiFormat: "openai" as const,
    models: [
        { name: "grok-4.7", capability: "text" as const },
        { name: "grok-imagine-image-2.0", capability: "image" as const },
        { name: "grok-imagine-image-quality", capability: "image" as const },
        { name: "grok-imagine-video-1.5", capability: "video" as const, script: grokVideoScript },
        { name: "grok-imagine-video-1.5-preview", capability: "video" as const, script: grokVideoScript },
        { name: "MiniMax-H3", capability: "video" as const, script: h3Script },
        { name: "MiniMax-H3-Max", capability: "video" as const, script: h3MaxScript },
    ],
};
