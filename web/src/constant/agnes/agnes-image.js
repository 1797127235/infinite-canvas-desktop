/**
 * Agnes Image 2.5 / 2.1 Flash：POST /v1/images/generations
 * 官方参数：model、prompt、size（1K/2K/3K/4K 或精确尺寸）、ratio、
 * extra_body.image（参考图）、extra_body.response_format。
 * 该接口不接受 quality，也不接受顶层 response_format。
 * @param {string} prompt
 * @param {string[]} images 参考图 data URL；为空即文生图
 * @param {object} params
 * @param {string} params.size 画布尺寸，例如 "1312x736" 或 "16:9"
 * @param {string} params.resolution "1k" | "2k" | "4k" | "auto"
 * @param {number} params.count 生成张数，接口一次一张，脚本按需要循环
 * @param {string} model
 * @param {string} apiKey
 * @param {function} request
 * @returns {Promise<string[]>}
 */
async function generateImage({ prompt, images, params: { size, resolution, count }, model, apiKey, request }) {
    const RATIOS = ["1:1", "2:3", "3:2", "4:3", "3:4", "16:9", "9:16", "21:9"];

    function pickRatio(value) {
        const match = String(value || "").match(/^(\d+(?:\.\d+)?)[:x](\d+(?:\.\d+)?)$/);
        if (!match) return undefined;
        const target = Number(match[1]) / Number(match[2]);
        return RATIOS.reduce((best, current) => {
            const [w, h] = current.split(":").map(Number);
            const [bw, bh] = best.split(":").map(Number);
            return Math.abs(w / h - target) < Math.abs(bw / bh - target) ? current : best;
        });
    }

    function pickSize(value, scale) {
        const raw = String(value || "");
        const normalizedScale = String(scale || "").toLowerCase();
        const tier = { "1k": "1K", "2k": "2K", "3k": "3K", "4k": "4K" }[normalizedScale];
        if (tier) return tier;
        if (/^[1-4]K$/i.test(raw)) return raw.toUpperCase();
        const match = raw.match(/^(\d+)x(\d+)$/i);
        if (!match) return "1K";
        const longSide = Math.max(Number(match[1]), Number(match[2]));
        if (longSide >= 4700) return "4K";
        if (longSide >= 3000) return "3K";
        if (longSide >= 1500) return "2K";
        return "1K";
    }

    const ratio = pickRatio(size) || "1:1";
    const body = {
        model,
        prompt,
        size: pickSize(size, resolution),
        ratio,
    };
    if (images.length) {
        body.extra_body = {
            image: images,
            response_format: "b64_json",
        };
    } else {
        body.return_base64 = true;
    }

    const total = Math.max(1, Math.floor(Math.abs(Number(count)) || 1));
    const urls = [];
    for (let index = 0; index < total; index++) {
        const data = await request({
            method: "post",
            url: "/images/generations",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            data: body,
        });
        for (const item of data.data || []) {
            if (item.b64_json) urls.push(`data:image/png;base64,${item.b64_json}`);
            else if (item.url) urls.push(item.url);
        }
    }
    if (!urls.length) throw new Error("Agnes 图片接口没有返回图像");
    return urls;
}

return await generateImage({ prompt, images, params, model, apiKey, request });
