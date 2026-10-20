import imageScript from "@/constant/agnes/agnes-image.js?raw";
import textScript from "@/constant/agnes/agnes-text.js?raw";
import videoScript from "@/constant/agnes/agnes-video.js?raw";

/** 内置默认渠道：脚本随仓库维护，用户只需要填 API Key。 */
export const AGNES_CHANNEL = {
    id: "agnes-cn",
    name: "Agnes 中国站",
    baseUrl: "https://api.agnes-ai.cn/v1",
    apiKey: "",
    apiFormat: "openai" as const,
    models: [
        { name: "agnes-image-2.5-flash", capability: "image" as const, script: imageScript },
        { name: "agnes-video-2.5", capability: "video" as const, script: videoScript },
        { name: "agnes-video-2.5-flash", capability: "video" as const, script: videoScript },
        { name: "agnes-2.5-flash", capability: "text" as const, script: textScript },
    ],
};
