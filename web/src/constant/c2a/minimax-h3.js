// 限制来源：https://platform.minimax.cn/docs/api-reference/video-generation-v2-create
const MB = 1024 * 1024;
function checkDimensions(width, height, label) {
    if (width < 256 || height < 256 || width > 5760 || height > 5760 || width / height < 0.4 || width / height > 2.5) throw new Error(`${label}宽高须为 256–5760 px，宽高比须为 0.4–2.5`);
}
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("浏览器无法解码参考图片，请转成 JPG、PNG 或 WEBP 后重试"));
        image.src = url;
    });
}
/**
 * 超出 [256, 5760] 的参考图先等比缩/放大，避免把模型侧尺寸限制直接抛给用户。
 * 宽高比不能靠缩放改变，超出 [0.4, 2.5] 时只能退回让用户裁剪。
 */
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
async function validateImage(url) {
    const match = url.match(/^data:image\/(jpeg|jpg|png|webp|heic|heif);base64,([\s\S]+)$/i);
    if (!match) throw new Error("参考图片仅支持 JPG、JPEG、PNG、WEBP、HEIC、HEIF 的 Data URL");
    const encoded = match[2].replace(/\s/g, "");
    const bytes = (encoded.length * 3) / 4 - (encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0);
    if (bytes > 30 * MB) throw new Error("单张参考图片不能超过 30 MB");
    await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            try {
                checkDimensions(image.naturalWidth, image.naturalHeight, "参考图片");
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        image.onerror = () => reject(new Error("浏览器无法解码参考图片，请转成 JPG、PNG 或 WEBP 后重试"));
        image.src = url;
    });
}
async function validateMedia(files, kind) {
    let total = 0;
    const video = kind === "video";
    const label = video ? "视频" : "音频";
    for (const file of files) {
        if (file.size > (video ? 50 : 15) * MB) throw new Error(`单个参考${label}不能超过 ${video ? 50 : 15} MB`);
        const mime = file.type.toLowerCase();
        const valid = video ? ["video/mp4", "video/quicktime"].includes(mime) : ["audio/wav", "audio/x-wav", "audio/wave", "audio/vnd.wave", "audio/mpeg", "audio/mp3"].includes(mime);
        const validName = video ? /\.(mp4|mov)$/i.test(file.name) : /\.(wav|mp3)$/i.test(file.name);
        if (!valid && !((!mime || mime === "application/octet-stream") && validName)) throw new Error(`参考${label}仅支持 ${video ? "MP4、MOV" : "WAV、MP3"}`);
        const meta = await new Promise((resolve, reject) => {
            const objectUrl = URL.createObjectURL(file);
            const media = document.createElement(kind);
            const cleanup = () => {
                media.onloadedmetadata = null;
                media.onerror = null;
                media.removeAttribute("src");
                media.load();
                URL.revokeObjectURL(objectUrl);
            };
            media.preload = "metadata";
            media.onloadedmetadata = () => {
                const result = { duration: media.duration, width: media.videoWidth, height: media.videoHeight };
                cleanup();
                resolve(result);
            };
            media.onerror = () => {
                cleanup();
                reject(new Error(`浏览器无法读取参考${label}，请检查文件和编码`));
            };
            media.src = objectUrl;
        });
        if (!Number.isFinite(meta.duration) || meta.duration < 2 || meta.duration > 15) throw new Error(`单段参考${label}时长须为 2–15 秒`);
        if (video) checkDimensions(meta.width, meta.height, "参考视频");
        total += meta.duration;
    }
    if (total > 15) throw new Error(`参考${label}总时长不能超过 15 秒`);
}
function checkBody(body) {
    if (new TextEncoder().encode(JSON.stringify(body)).byteLength > 64 * MB) throw new Error("请求 JSON（含 Base64）不能超过 64 MB，请缩小素材；配置包不会自动上传素材或压缩降质");
}
async function toDataUrl(file) {
    let mime = file.type;
    if (!mime || mime === "application/octet-stream") {
        const ext = file.name.split(".").pop().toLowerCase();
        mime = { mp4: "video/mp4", mov: "video/quicktime", mp3: "audio/mpeg", wav: "audio/wav" }[ext];
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    return `data:${mime};base64,${btoa(binary)}`;
}
const headers = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
if (!prompt.trim() || Array.from(prompt).length > 7000) throw new Error("提示词须为 1–7000 个字符");
const seconds = Number(params.seconds || 8);
const ratio = params.ratio || "16:9";
const uiResolution = String(params.resolution || "720p").toLowerCase();
function taskObject(value) {
    return value.task || (value.data && !Array.isArray(value.data) ? value.data : value);
}
function taskError(task, id) {
    if (["failed", "cancelled", "canceled", "expired", "unknown"].includes(String(task.status).toLowerCase()))
        throw new Error(`任务 ${id}：${task.error?.message || task.message || task.status}，账务状态 ${task.billing_status || "未知"}；请核对原任务，不要重复提交`);
}
if (!Number.isInteger(seconds) || seconds < 4 || seconds > 15) throw new Error("MiniMax-H3 时长须为 4–15 秒整数");
if (!["16:9", "9:16"].includes(ratio)) throw new Error("C2A H3 的 /v1/videos 目前仅确认横竖屏尺寸映射；其他官方比例请使用 H3-Max");
if (!["480p", "720p", "768p", "1080p", "2k"].includes(uiResolution)) throw new Error("H3 分辨率须为 768P 或 2K（画布 480/720 映射 768P、1080 映射 2K）");
if (images.length > 1 || videos.length || audios.length) throw new Error("C2A H3 的 /v1/videos 目前仅确认单张参考图；首尾帧、视频和音频参考请使用 H3-Max");
for (let index = 0; index < images.length; index++) {
    images[index] = await normalizeImage(images[index]);
}
// 官方素材网关优先：换成 24 小时公网 URL 绕开 base64 体积限制；失败走原 base64 校验。
const asset = await uploadAsset?.(images[0]).catch(() => null);
const imageUrl = asset ? asset.url : images[0];
if (!asset) {
    for (let index = 0; index < images.length; index++) await validateImage(images[index]);
}
const use2K = ["1080p", "2k"].includes(uiResolution);
const size = use2K ? (ratio === "16:9" ? "1792x1024" : "1024x1792") : ratio === "16:9" ? "1280x720" : "720x1280";
const body = { model, prompt, seconds, size };
if (images[0]) body.input_reference = { image_url: imageUrl };
checkBody(body);
const created = await request({ method: "post", url: "/videos", headers, data: body });
const taskId = created.id || created.task_id;
if (!taskId) throw new Error(created.error?.message || "C2A H3 创建响应缺少任务 ID；请核对任务记录，不要重复提交");
return await poll(
    async () => {
        const task = taskObject(await request({ method: "get", url: `/videos/${encodeURIComponent(taskId)}`, headers }));
        taskError(task, taskId);
        if (String(task.status).toLowerCase() !== "completed") return null;
        const url = task.content?.url || task.video_url || task.url;
        if (url) return { url };
        return await request({ method: "get", url: `/videos/${encodeURIComponent(taskId)}/content`, headers, responseType: "blob" });
    },
    (result) => result,
    { intervalMs: 5000, timeoutMs: 900000 },
);
