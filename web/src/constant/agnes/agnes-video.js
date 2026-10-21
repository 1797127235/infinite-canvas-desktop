/**
 * Agnes Video 2.5 / 2.5 Flash
 * 创建：POST /v1/videos
 * 查询：GET {origin}/agnesapi?video_id=...&model_name=...
 * seconds 仅支持 "4"–"12"；size 支持 720P/1080P/1K/2K，Flash 仅 720P。
 * 图片和音频参考实测支持 data URL；参考视频只接受可公开访问的 URL。
 * @param {string} prompt 可含 <Picture 1> 这类占位符
 * @param {string[]} images 参考图或首尾帧，data URL
 * @param {File[]} videos 参考视频
 * @param {File[]} audios 参考音频
 * @param {object} params
 * @param {string} params.seconds 时长
 * @param {string} params.size 画布尺寸
 * @param {string} params.resolution 清晰度
 * @param {string} params.ratio 比例
 * @param {"frames"|"reference"} params.mode 画布模式
 * @param {string} model
 * @param {string} baseUrl
 * @param {string} apiKey
 * @param {function} request
 * @param {function} poll
 * @returns {Promise<{url: string}>}
 */
async function generateVideo({ prompt, images, videos, audios, params: { seconds, size, resolution, ratio, mode }, model, baseUrl, apiKey, request, poll }) {
    const flash = /-flash$/i.test(model);
    const origin = baseUrl.replace(/\/v1\/?$/i, "").replace(/\/+$/, "");
    const duration = String(Math.min(12, Math.max(4, Math.round(Number(seconds) || 5))));

    function pickSize() {
        // Agnes Video 2.5 Flash only accepts 720P. Agnes Video 2.5 accepts these four tiers.
        if (flash) return "720P";
        const value = `${resolution || ""} ${size || ""}`.toLowerCase();
        if (value.includes("2k") || value.includes("1440")) return "2K";
        if (value.includes("1080")) return "1080P";
        if (value.includes("1k")) return "1K";
        return "720P";
    }

    // axios 只给出状态码，这里把 Agnes 返回的 JSON 错误正文取出来，用户才能看到「当前分组不支持模型」这类真实原因。
    function apiError(error, fallback) {
        const data = error && error.response && error.response.data;
        const reason = (data && data.error && (data.error.message || data.error)) || (data && (data.message || data.detail)) || (error && error.message) || fallback;
        return new Error(String(reason));
    }

    function mediaRef(value, kind) {
        const text = String(value || "");
        if (/^https?:\/\//i.test(text) || /^data:(image|audio)\//i.test(text)) return text;
        throw new Error(`Agnes 视频${kind}必须是可公开访问的 URL 或 data URL`);
    }

    function fileDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error(`读取 Agnes 参考${file.type.startsWith("audio/") ? "音频" : "视频"}失败`));
            reader.readAsDataURL(file);
        });
    }

    if ((videos || []).length) {
        throw new Error("Agnes 视频参考视频需要可公开访问的 URL，画布本地视频无法直接上传");
    }

    const aspect = ["1:1", "3:4", "4:3", "16:9", "9:16", "21:9"].includes(String(ratio)) ? ratio : "16:9";
    const references = images.map((image) => mediaRef(image, "参考图片"));
    const audioRefs = await Promise.all((audios || []).map(async (file) => mediaRef(await fileDataUrl(file), "参考音频")));
    if (flash && references.length > 5) throw new Error("Agnes Video 2.5 Flash 最多支持 5 张参考图");
    if (audioRefs.length > 3) throw new Error("Agnes 视频最多支持 3 段参考音频");

    const body = { model, prompt, n: 1, seconds: duration, size: pickSize(), aspect_ratio: aspect };
    if (mode !== "reference" && !audioRefs.length && references.length <= 2) {
        body.mode = references.length ? "keyframe" : "text";
        if (references[0]) body.first_frame = references[0];
        if (references[1]) body.last_frame = references[1];
    } else {
        body.mode = "reference";
        if (references.length) body.images = references.slice(0, flash ? 5 : 8);
        if (audioRefs.length) body.audios = audioRefs;
    }

    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
    // Source: https://wiki.agnes-ai.cn/zh-Hans/docs/agnes-video-25.md
    // Agnes requires video_id for polling and model_name for keyframe/reference tasks.
    const createdResponse = await request({ method: "post", url: "/videos", headers, data: body }).catch((error) => {
        throw apiError(error, "Agnes 视频任务创建失败");
    });
    const created = createdResponse.data || createdResponse;
    const videoId = created.video_id;
    if (!videoId) throw new Error("Agnes 视频接口没有返回 video_id，无法查询任务");

    const query = `${origin}/agnesapi?video_id=${encodeURIComponent(videoId)}&model_name=${encodeURIComponent(model)}`;
    const state = await poll(
        async () => {
            try {
                return await request({ method: "get", url: query, headers: { Authorization: `Bearer ${apiKey}` } });
            } catch (error) {
                // 429 只表示查询过快，继续等下一轮。
                if (error && error.response && error.response.status === 429) return { status: "queued" };
                throw apiError(error, "Agnes 视频任务查询失败");
            }
        },
        (data) => {
            const status = String(data.status || "").toLowerCase();
            if (status === "completed") return data;
            if (status === "failed" || status === "expired") {
                const reason = (data.error && (data.error.message || data.error)) || "Agnes 视频生成失败";
                throw new Error(String(reason));
            }
            return null;
        },
        { intervalMs: 3000, timeoutMs: 600000 },
    );

    // The documented completed response exposes url at the top level.
    if (!state.url) throw new Error("Agnes 视频任务完成但没有返回视频地址");
    return { url: state.url };
}

return await generateVideo({ prompt, images, videos, audios, params, model, baseUrl, apiKey, request, poll });
