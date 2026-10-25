// Grok Imagine 视频（grok-imagine-video-1.5 / -preview）· C2A 中转
// 上游对 base64 参考图有约 600 KB 的总请求体限制（实测），视频参考素材不可能走 base64。
// 策略：素材先经官方素材网关换 24 小时公网 URL（上游实测 9 MB+ 可用）；
// 网关不可用/用户拒绝时，参考图降级为总预算内的压缩 base64，参考视频直接报错。
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("浏览器无法解码参考图片，请转成 JPG、PNG 或 WEBP 后重试"));
        image.src = url;
    });
}
// 参考图先压到 [256, 5760] 内：上游对超出边长的图直接返回 400，本地先解决尺寸问题。
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
function dataUrlBytes(url) {
    const encoded = url.slice(url.indexOf(",") + 1).replace(/\s/g, "");
    return Math.floor((encoded.length * 3) / 4) - (encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0);
}
// 总预算内逐级降 JPEG 质量，仍超时再等比缩小边长（不低于 256 px）。
async function compressToBudget(url, budgetBytes) {
    const image = await loadImage(url);
    const qualities = [0.92, 0.8, 0.7, 0.6, 0.5];
    let best = "";
    for (let scale = 1; Math.round(Math.max(image.naturalWidth, image.naturalHeight) * scale) >= 256 && !best; scale *= 0.8) {
        const width = Math.round(image.naturalWidth * scale);
        const height = Math.round(image.naturalHeight * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(image, 0, 0, width, height);
        for (const quality of qualities) {
            const dataUrl = canvas.toDataURL("image/jpeg", quality);
            if (dataUrlBytes(dataUrl) <= budgetBytes) return dataUrl;
            best = dataUrl;
        }
    }
    return best;
}
// 上游 400 的正文必须透出来，否则用户只能看到 status code 400。
function apiError(error) {
    const data = error && error.response && error.response.data;
    const reason = (data && data.error && (data.error.message || data.error)) || (data && (data.message || data.detail)) || (error && error.message);
    return new Error(String(reason || "C2A Grok 视频任务创建失败"));
}

// 参考图统一先归一化（尺寸限制）并压到 3 MB 内再上传/提交：
// 上游（含境外 xAI）从网关拉大图都慢，18 MB 级原图下载容易超时，参考图画质 3 MB 足够。
const normalizedImages = await Promise.all(images.map((url) => normalizeImage(url).then((normalized) => compressToBudget(normalized, 3 * 1024 * 1024))));

// 官方素材网关：单张失败即整体降级，保持一次请求内素材形态一致。
const assetUrls = [];
for (const source of [...normalizedImages, ...videos]) {
    const asset = await uploadAsset?.(source).catch(() => null);
    if (!asset) {
        assetUrls.length = 0;
        break;
    }
    assetUrls.push(asset.url);
}
const viaUrl = assetUrls.length === normalizedImages.length + videos.length;
if (videos.length && !viaUrl) throw new Error("参考视频体积过大，必须经官方素材网关以链接提交；本次上传未完成，请重试或在配置里检查网络");

let referenceImages;
if (viaUrl) {
    referenceImages = assetUrls;
} else {
    // base64 降级：素材字节总预算 440 KB（×1.33 base64 膨胀后约 585 KB 请求体，实测上限约 675 KB）。
    const budget = Math.floor((440 * 1024) / normalizedImages.length);
    referenceImages = await Promise.all(normalizedImages.map((url) => compressToBudget(url, budget)));
}

const body = { model, prompt, duration: Number(params.seconds) || 8, resolution: params.resolution || "720p", aspect_ratio: params.ratio || "16:9" };
if (params.generateAudio !== undefined) body.generate_audio = params.generateAudio !== false;
if (params.watermark !== undefined) body.watermark = params.watermark === true;
if (params.mode === "frames" && referenceImages.length >= 2) {
    body.image = { url: referenceImages[0] };
    body.last_frame = { url: referenceImages[1] };
} else if (referenceImages.length) body.reference_images = referenceImages.map((url) => ({ url }));
if (videos.length) body.videos = assetUrls.slice(images.length).map((url) => ({ url }));
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
