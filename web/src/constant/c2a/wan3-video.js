// 万相 3.0（wan3.0-video / wan3.0-video-prime）· C2A 中转
// 上游协议：DashScope 原生异步视频合成，与 [OI] Videos 不通用。
// 参考素材以 Base64 Data URL 直传（国内上游从 Cloudflare 拉素材不可靠，实测多尺寸/类型稳定失败），提交前先压到 3 MB。
// 官方文档：https://help.aliyun.com/zh/model-studio/wan3-video-generation-api-reference
// C2A 端点：https://www.codex2api.com/docs/wan-create 、/docs/wan-query
const MB = 1024 * 1024;
// 实测：中转网关不拦 body，但上游限制单条 data URI ≤ 20 MiB（20971520 字节），
// 反推原始素材 ≈15 MiB；这里按 14 MiB 拦，给 base64 前缀和 padding 留余量。
// 官方「图片 20MB / 视频 100MB / 音频 15MB」只对公网 URL 输入成立。
const MAX_ITEM = 14 * MB;
const RATIOS = ["adaptive", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"];
const RESOLUTIONS = { "480p": "480P", "720p": "720P", "1080p": "1080P" };
function checkDimensions(width, height, max, label) {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 240 || height < 240 || width > max || height > max || width / height > 8 || height / width > 8) {
        throw new Error(`${label}单边须为 240–${max} px，宽高比不超过 8:1`);
    }
}
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("浏览器无法解码图片，请转成 JPG、PNG 或 WEBP 后重试"));
        image.src = url;
    });
}
// 官方单边 [240, 8000] px；实测低于 240 会在任务创建后的校验阶段失败，所以提交前先放大/缩小。
const MIN_SIDE = 240;
const MAX_SIDE = 8000;
async function normalizeImage(url) {
    const image = await loadImage(url);
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const longest = Math.max(width, height);
    const shortest = Math.min(width, height);
    let scale = 1;
    if (longest > MAX_SIDE) scale = MAX_SIDE / longest;
    else if (shortest < MIN_SIDE) scale = MIN_SIDE / shortest;
    if (scale === 1) return url;
    const normalizedWidth = Math.round(width * scale);
    const normalizedHeight = Math.round(height * scale);
    if (Math.min(normalizedWidth, normalizedHeight) < MIN_SIDE || Math.max(normalizedWidth, normalizedHeight) > MAX_SIDE) {
        throw new Error(`图片 ${width}×${height} 缩放后仍超出 240–8000 px，宽高比过于极端，请先裁剪再试`);
    }
    const canvas = document.createElement("canvas");
    canvas.width = normalizedWidth;
    canvas.height = normalizedHeight;
    canvas.getContext("2d").drawImage(image, 0, 0, normalizedWidth, normalizedHeight);
    // 万相不支持透明通道，原图是 BMP/PNG 也统一转 JPEG，同时避免放大后体积越界。
    return canvas.toDataURL("image/jpeg", 0.92);
}
function dataUrlBytes(url) {
    const comma = url.indexOf(",");
    if (comma < 0) throw new Error("素材必须是 Base64 Data URL");
    const encoded = url.slice(comma + 1).replace(/\s/g, "");
    return Math.floor((encoded.length * 3) / 4) - (encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0);
}
// 提交体积控制：超过 3 MB 的参考图等比压缩（长边逐级降档 + 逐级降质量），Base64 提交体积小、上游处理快。
async function compressForGateway(url, capBytes) {
    if (dataUrlBytes(url) <= capBytes) return url;
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    for (const longest of [2560, 2048, 1600, 1280, 1024]) {
        const scale = Math.min(1, longest / Math.max(image.naturalWidth, image.naturalHeight));
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        for (const quality of [0.9, 0.8, 0.7, 0.6]) {
            const out = canvas.toDataURL("image/jpeg", quality);
            if (dataUrlBytes(out) <= capBytes) return out;
        }
    }
    return canvas.toDataURL("image/jpeg", 0.6);
}
async function validateImage(url) {
    if (!/^data:image\/(jpeg|jpg|png|bmp|webp);base64,/i.test(url)) throw new Error("参考图片仅支持 JPG、JPEG、PNG、BMP、WEBP 的 Data URL（不支持 HEIC/HEIF 与透明通道）");
    if (dataUrlBytes(url) > MAX_ITEM) throw new Error("单张图片超过 14 MB；万相只接受公网 URL 传 20 MB 大图，Base64 通道受上游 20 MiB 单条限制，请先压缩");
    await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            try {
                checkDimensions(image.naturalWidth, image.naturalHeight, 8000, "图片");
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        image.onerror = () => reject(new Error("浏览器无法解码图片，请转成 JPG、PNG 或 WEBP 后重试"));
        image.src = url;
    });
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
async function validateMedia(files, kind, maxBytes) {
    const video = kind === "video";
    const label = video ? "参考视频" : "参考音频";
    const max = video ? 5 : 5;
    if (files.length > max) throw new Error(`${label}最多 ${max} 段`);
    let total = 0;
    for (const file of files) {
        if (file.size > maxBytes) throw new Error(`单个${label}超过 ${Math.floor(maxBytes / MB)} MB；请先压缩或改用公网 URL`);
        const mime = (file.type || "").toLowerCase();
        const valid = video ? ["video/mp4", "video/quicktime"].includes(mime) : ["audio/wav", "audio/x-wav", "audio/wave", "audio/vnd.wave", "audio/mpeg", "audio/mp3"].includes(mime);
        const validName = video ? /\.(mp4|mov)$/i.test(file.name) : /\.(wav|mp3)$/i.test(file.name);
        if (!valid && !((!mime || mime === "application/octet-stream") && validName)) throw new Error(`${label}仅支持 ${video ? "MP4、MOV" : "WAV、MP3"}`);
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
                reject(new Error(`浏览器无法读取${label}，请检查文件和编码`));
            };
            media.src = objectUrl;
        });
        if (!Number.isFinite(meta.duration) || meta.duration < 1 || meta.duration > 15) throw new Error(`单段${label}时长须为 1–15 秒`);
        if (video) checkDimensions(meta.width, meta.height, 4096, label);
        total += meta.duration;
    }
    if (total > 15) throw new Error(`${label}总时长不能超过 15 秒`);
    return total;
}
const headers = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
if (!prompt.trim()) throw new Error("提示词不能为空");
// 实测 25000 字符被上游拒（Range of input length should be [1, 61440]，按字节计）；官方上限 20000 字符。
if (Array.from(prompt).length > 20000) throw new Error("提示词不能超过 20000 个字符");
const uiResolution = String(params.resolution || "720p").toLowerCase();
const resolution = RESOLUTIONS[uiResolution];
if (!resolution) throw new Error("万相 3.0 仅支持 480p / 720p / 1080p；未配置档位会按 4.80 元/秒兜底价计费，已阻止");
const requested = Number(params.seconds || 6);
if (!Number.isInteger(requested) || requested < 2 || requested > 30) throw new Error("万相 3.0 时长须为 2–30 秒整数");
// 首帧/尾帧与参考素材互斥（上游硬规则）；只有 0–2 张图且无视频音频时才走首尾帧模式。
const frames = params.mode !== "reference" && images.length <= 2 && !videos.length && !audios.length;
if (frames && images.length > 2) throw new Error("首尾帧模式最多 2 张图");
if (!frames && images.length > 10) throw new Error("参考图片最多 10 张");
for (let index = 0; index < images.length; index++) {
    images[index] = await normalizeImage(images[index]);
    images[index] = await compressForGateway(images[index], 3 * MB);
}
const mediaSeconds = videos.length || audios.length
    ? (await validateMedia(videos, "video", MAX_ITEM)) + (await validateMedia(audios, "audio", MAX_ITEM))
    : 0;
// 有视频/音频输入时：输入总时长 + 输出时长 ≤ 30 秒。单段 ≤15 秒，所以上限恒 ≥15。
// 策略：静默压到上限（不弹错），用户选的 30 秒与「输入 5 + 输出 25」在账面一致。
const duration = mediaSeconds ? Math.min(requested, 30 - mediaSeconds) : requested;
const media = [];
if (frames) {
    if (images[0]) media.push({ type: "first_frame", url: images[0] });
    if (images[1]) media.push({ type: "last_frame", url: images[1] });
} else {
    for (const url of images) media.push({ type: "reference_image", url });
    for (const file of videos) media.push({ type: "reference_video", url: await toDataUrl(file) });
    for (const file of audios) media.push({ type: "reference_audio", url: await toDataUrl(file) });
}
for (let index = 0; index < images.length; index++) await validateImage(images[index]);
// 首尾帧比例由图片决定；参考模式用画布比例（多素材时上游的 adaptive 选择不可预测）。
const ratio = frames ? (media.length ? "adaptive" : params.ratio || "16:9") : params.ratio || "adaptive";
if (!RATIOS.includes(ratio)) throw new Error(`万相 3.0 不支持输出比例 ${ratio}`);
const parameters = { resolution, ratio, duration };
if (params.generateAudio !== undefined) parameters.audio = params.generateAudio !== false;
if (params.watermark !== undefined) parameters.watermark = params.watermark === true;
const body = { model, input: media.length ? { prompt, media } : { prompt }, parameters };
if (new TextEncoder().encode(JSON.stringify(body)).byteLength > 64 * MB) throw new Error("请求 JSON（含 Base64）不能超过 64 MB，请减少素材或先压缩");
function failure(value) {
    const error = value?.error || value || {};
    const message = error.message || error.msg;
    if (!message) return "";
    return `${error.code ? `${error.code}：` : ""}${message}`;
}
const created = await request({ method: "post", url: "/api/v1/services/aigc/video-generation/video-synthesis", headers, data: body });
// 原生响应只有 output.task_id 可用轮询；顶层 request_id 是追踪号，X-Video-Task-ID 实测不返回。
const taskId = created?.output?.task_id;
if (!taskId) throw new Error(failure(created) || "万相 3.0 创建响应缺少 task_id；请核对 C2A 任务记录，不要重复提交");
return await poll(
    async () => {
        const task = await request({ method: "get", url: `/api/v1/tasks/${encodeURIComponent(taskId)}`, headers });
        const output = task?.output || {};
        const status = String(output.task_status || "").toUpperCase();
        if (status === "SUCCEEDED") {
            if (!output.video_url) throw new Error(`任务 ${taskId} 已完成但没有返回视频地址，请核对 C2A 任务记录`);
            return { url: output.video_url };
        }
        if (["FAILED", "CANCELED", "UNKNOWN"].includes(status)) {
            const detail = output.message || output.code || (status === "UNKNOWN" ? "任务不存在或查询已过期（task_id 有效期 24 小时）" : status);
            throw new Error(`任务 ${taskId} ${status}：${detail}；请核对原任务，不要重复提交`);
        }
        return null;
    },
    (result) => result,
    { intervalMs: 10000, timeoutMs: 900000 },
);
