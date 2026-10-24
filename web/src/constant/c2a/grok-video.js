// 参考图先压到 [256, 5760] 内：上游对超出边长的图直接返回 400，本地先解决尺寸问题。
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("浏览器无法解码参考图片，请转成 JPG、PNG 或 WEBP 后重试"));
        image.src = url;
    });
}
async function normalizeImage(url) {
    const image = await loadImage(url);
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const longest = Math.max(width, height);
    const shortest = Math.min(width, height);
    let scale = 1;
    if (longest > 5760) scale = 5760 / longest;
    else if (shortest < 256) scale = 256 / shortest;
    if (scale === 1) return url;
    const normalizedWidth = Math.round(width * scale);
    const normalizedHeight = Math.round(height * scale);
    if (Math.min(normalizedWidth, normalizedHeight) < 256 || Math.max(normalizedWidth, normalizedHeight) > 5760) {
        throw new Error(`参考图片 ${width}×${height} 缩放后仍超出 256–5760 px，宽高比过于极端，请先裁剪再试`);
    }
    const canvas = document.createElement("canvas");
    canvas.width = normalizedWidth;
    canvas.height = normalizedHeight;
    canvas.getContext("2d").drawImage(image, 0, 0, normalizedWidth, normalizedHeight);
    return canvas.toDataURL(/png/i.test(url.slice(0, 40)) ? "image/png" : "image/jpeg", 0.92);
}
// 上游 400 的正文必须透出来，否则用户只能看到 status code 400。
function apiError(error) {
    const data = error && error.response && error.response.data;
    const reason = (data && data.error && (data.error.message || data.error)) || (data && (data.message || data.detail)) || (error && error.message);
    return new Error(String(reason || "C2A Grok 视频任务创建失败"));
}
const normalizedImages = await Promise.all(images.map((url) => normalizeImage(url)));
const body = { model, prompt, duration: Number(params.seconds) || 8, resolution: params.resolution || "720p", aspect_ratio: params.ratio || "16:9" };
if (params.generateAudio !== undefined) body.generate_audio = params.generateAudio !== false;
if (params.watermark !== undefined) body.watermark = params.watermark === true;
if (params.mode === "frames" && normalizedImages.length >= 2) {
    body.image = { url: normalizedImages[0] };
    body.last_frame = { url: normalizedImages[1] };
} else if (normalizedImages.length) body.reference_images = normalizedImages.map((url) => ({ url }));
if (videos.length) {
    const toDataUrl = async (file) => {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
        return `data:${file.type || "video/mp4"};base64,${btoa(binary)}`;
    };
    body.videos = (await Promise.all(videos.map(toDataUrl))).map((url) => ({ url }));
}
const created = await request({ method: "post", url: "/videos/generations", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, data: body }).catch((error) => {
    throw apiError(error);
});
const task = created.data || created;
const requestId = task.request_id || task.id || task.task_id;
if (!requestId) throw new Error("C2A Grok 视频接口没有返回 request_id");
return await poll(
    () => request({ method: "get", url: `/videos/generations/${encodeURIComponent(requestId)}`, headers: { Authorization: `Bearer ${apiKey}` } }),
    (value) => {
        const data = value.data || value;
        const status = String(data.status || "").toLowerCase();
        if (["failed", "cancelled", "expired", "error"].includes(status)) throw new Error(data.error?.message || data.message || "C2A Grok 视频生成失败");
        if (!["done", "completed"].includes(status)) return null;
        const url = data.video?.url || data.url || data.video_url || data.result_url;
        if (!url) throw new Error("C2A Grok 视频任务完成但没有返回视频地址");
        return { url };
    },
    { intervalMs: 5000, timeoutMs: 600000 },
);
