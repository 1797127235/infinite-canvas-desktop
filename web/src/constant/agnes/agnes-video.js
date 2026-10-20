/**
 * Agnes Video 2.5 / 2.5 Flash
 * 创建：POST /v1/videos
 * 查询：GET {origin}/agnesapi?video_id=...&model_name=...
 * seconds 仅支持 "4"–"12"；size 支持 720P/1080P/1K/2K，Flash 仅 720P。
 * @param {string} prompt 可含 <Picture 1> 这类占位符
 * @param {string[]} images 参考图或首尾帧，data URL
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
async function generateVideo({ prompt, images, params: { seconds, size, resolution, ratio, mode }, model, baseUrl, apiKey, request, poll }) {
  const flash = /-flash$/i.test(model);
  const origin = baseUrl.replace(/\/v1\/?$/i, "").replace(/\/+$/, "");
  const duration = String(Math.min(12, Math.max(4, Math.round(Number(seconds) || 5))));

  function pickSize() {
    if (flash) return "720P";
    const value = `${resolution || ""} ${size || ""}`.toLowerCase();
    if (value.includes("2k") || value.includes("1440")) return "2K";
    if (value.includes("1080")) return "1080P";
    if (value.includes("1k")) return "1K";
    return "720P";
  }

  const aspect = ["1:1", "3:4", "4:3", "16:9", "9:16", "21:9"].includes(String(ratio)) ? ratio : "16:9";
  const body = { model, prompt, n: 1, seconds: duration, size: pickSize(), aspect_ratio: aspect };

  if (mode === "frames" && images.length) {
    body.mode = "keyframe";
    if (images[0]) body.first_frame = images[0];
    if (images[1]) body.last_frame = images[1];
  } else if (images.length) {
    if (flash && images.length > 5) throw new Error("Agnes Video 2.5 Flash 最多支持 5 张参考图");
    body.mode = "reference";
    body.images = images.slice(0, flash ? 5 : 8);
  } else {
    body.mode = "text";
  }

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
  const created = await request({ method: "post", url: "/videos", headers, data: body });
  const videoId = created.video_id;
  if (!videoId) throw new Error("Agnes 视频接口没有返回 video_id");

  const query = `${origin}/agnesapi?video_id=${encodeURIComponent(videoId)}&model_name=${encodeURIComponent(model)}`;
  const state = await poll(
    () => request({ method: "get", url: query, headers: { Authorization: `Bearer ${apiKey}` } }),
    (data) => {
      if (data.status === "completed") return data;
      if (data.status === "failed" || data.status === "expired") {
        const reason = data.error && (data.error.message || data.error) || "Agnes 视频生成失败";
        throw new Error(String(reason));
      }
      return null;
    },
    { intervalMs: 2000, timeoutMs: 600000 },
  );

  const url = state.url || (state.metadata && state.metadata.url);
  if (!url) throw new Error("Agnes 视频任务完成但没有返回视频地址");
  return { url };
}

return await generateVideo({ prompt, images, params, model, baseUrl, apiKey, request, poll });
