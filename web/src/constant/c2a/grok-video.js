const body = { model, prompt, duration: Number(params.seconds) || 8, resolution: params.resolution || "720p", aspect_ratio: params.ratio || "16:9" };
if (params.generateAudio !== undefined) body.generate_audio = params.generateAudio !== false;
if (params.watermark !== undefined) body.watermark = params.watermark === true;
if (params.mode === "frames" && images.length >= 2) { body.image = { url: images[0] }; body.last_frame = { url: images[1] }; }
else if (images.length) body.reference_images = images.map((url) => ({ url }));
if (videos.length) { const toDataUrl = async (file) => { const bytes = new Uint8Array(await file.arrayBuffer()); let binary = ""; for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)); return `data:${file.type || "video/mp4"};base64,${btoa(binary)}`; }; body.videos = (await Promise.all(videos.map(toDataUrl))).map((url) => ({ url })); }
const created = await request({ method: "post", url: "/videos/generations", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, data: body });
const task = created.data || created;
const requestId = task.request_id || task.id || task.task_id;
if (!requestId) throw new Error("C2A Grok 视频接口没有返回 request_id");
return await poll(() => request({ method: "get", url: `/videos/generations/${encodeURIComponent(requestId)}`, headers: { Authorization: `Bearer ${apiKey}` } }), (value) => { const data = value.data || value; const status = String(data.status || "").toLowerCase(); if (["failed", "cancelled", "expired", "error"].includes(status)) throw new Error(data.error?.message || data.message || "C2A Grok 视频生成失败"); if (!["done", "completed"].includes(status)) return null; const url = data.video?.url || data.url || data.video_url || data.result_url; if (!url) throw new Error("C2A Grok 视频任务完成但没有返回视频地址"); return { url }; }, { intervalMs: 5000, timeoutMs: 600000 });
