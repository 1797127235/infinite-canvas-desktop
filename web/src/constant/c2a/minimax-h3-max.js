// 限制来源：https://platform.minimax.cn/docs/api-reference/video-generation-v2-create
const MB = 1024 * 1024;
function checkDimensions(width, height, label) {
  if (width < 256 || height < 256 || width > 5760 || height > 5760 || width / height < 0.4 || width / height > 2.5) throw new Error(`${label}宽高须为 256–5760 px，宽高比须为 0.4–2.5`);
}
async function validateImage(url) {
  const match = url.match(/^data:image\/(jpeg|jpg|png|webp|heic|heif);base64,([\s\S]+)$/i);
  if (!match) throw new Error("参考图片仅支持 JPG、JPEG、PNG、WEBP、HEIC、HEIF 的 Data URL");
  const encoded = match[2].replace(/\s/g, "");
  const bytes = encoded.length * 3 / 4 - (encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0);
  if (bytes > 30 * MB) throw new Error("单张参考图片不能超过 30 MB");
  await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => { try { checkDimensions(image.naturalWidth, image.naturalHeight, "参考图片"); resolve(); } catch (error) { reject(error); } };
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
      const cleanup = () => { media.onloadedmetadata = null; media.onerror = null; media.removeAttribute("src"); media.load(); URL.revokeObjectURL(objectUrl); };
      media.preload = "metadata";
      media.onloadedmetadata = () => { const result = { duration: media.duration, width: media.videoWidth, height: media.videoHeight }; cleanup(); resolve(result); };
      media.onerror = () => { cleanup(); reject(new Error(`浏览器无法读取参考${label}，请检查文件和编码`)); };
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
function taskObject(value) { return value.task || (value.data && !Array.isArray(value.data) ? value.data : value); }
function taskError(task, id) {
  if (["failed", "cancelled", "canceled", "expired", "unknown"].includes(String(task.status).toLowerCase())) throw new Error(`任务 ${id}：${task.error?.message || task.message || task.status}，账务状态 ${task.billing_status || "未知"}；请核对原任务，不要重复提交`);
}
if (!Number.isInteger(seconds) || seconds < 5 || seconds > 15) throw new Error("MiniMax-H3-Max 时长须为 5–15 秒整数");
if (!["adaptive", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"].includes(ratio)) throw new Error(`H3-Max 不支持输出比例 ${ratio}`);
if (!["480p", "720p", "768p", "1080p"].includes(uiResolution)) throw new Error("H3-Max 仅支持 480P/768P（画布 720/1080 映射 768P），不支持 2K/4K");
const resolution = uiResolution === "480p" ? "480P" : "768P";
const referenceMode = params.mode === "reference" || images.length > 2 || videos.length > 0 || audios.length > 0;
if (images.length > 9 || videos.length > 3 || audios.length > 3 || images.length + videos.length + audios.length > 12) throw new Error("参考图最多 9 张、视频最多 3 段、音频最多 3 段，混合媒体合计最多 12 个");
if (audios.length && !images.length && !videos.length) throw new Error("当前 C2A H3-Max 上游要求参考音频同时搭配至少一张参考图片或一段参考视频");
if (!images.length && !videos.length && !audios.length && ratio === "adaptive") throw new Error("纯文生视频必须选择具体比例，不能使用 adaptive");
// 携带视频/音频时，所有图片统一作为参考图，避免与首尾帧互斥字段混用。
for (const image of images) await validateImage(image);
await validateMedia(videos, "video");
await validateMedia(audios, "audio");
const content = [{ type: "text", text: prompt }];
for (let index = 0; index < images.length; index++) {
  content.push({ type: "image_url", image_url: { url: images[index] }, role: referenceMode ? "reference_image" : index === 0 ? "first_frame" : "last_frame" });
}
for (const file of videos) content.push({ type: "video_url", video_url: { url: await toDataUrl(file) }, role: "reference_video" });
for (const file of audios) content.push({ type: "audio_url", audio_url: { url: await toDataUrl(file) }, role: "reference_audio" });
const body = { model, content, duration: seconds, resolution, ratio: images.length && !referenceMode ? "adaptive" : ratio };
if (params.watermark !== undefined) body.aigc_watermark = params.watermark === true;
checkBody(body);
const created = await request({ method: "post", url: "/video/generations", headers, data: body });
const taskId = created.id || created.task_id;
if (!taskId) throw new Error(created.error?.message || "C2A H3-Max 创建响应缺少任务 ID；请核对任务记录，不要重复提交");
return await poll(() => request({ method: "get", url: `/video/generations/${encodeURIComponent(taskId)}`, headers }), (value) => {
  const task = taskObject(value);
  taskError(task, taskId);
  if (String(task.status).toLowerCase() !== "completed") return null;
  const url = task.data?.find?.((item) => item.url)?.url || task.content?.url || task.video_url || task.url;
  if (!url) throw new Error(`任务 ${taskId} 已完成但缺少视频 URL，账务状态 ${task.billing_status || "未知"}，请核对 C2A 原任务`);
  return { url };
}, { intervalMs: 5000, timeoutMs: 900000 });
