/** 功能性约束（对齐上游/保护桶）；测试阶段不设用量与频率限制。 */
export const MAX_FILE_BYTES = 20 * 1024 * 1024; // 单文件 20 MiB（对齐 xAI 上限）
export const CHUNK_BYTES = 8 * 1024 * 1024; // 分片大小；R2 multipart 非末片下限 5 MiB，取 8 MiB
export const MAX_PART_BYTES = 20 * 1024 * 1024; // 单个分片硬上限（容忍超预算分片，R2 单片支持到 5 GiB）
export const TOKEN_TTL_MS = 60 * 60 * 1000; // 上传令牌有效期：1 小时
export const URL_TTL_MS = 24 * 60 * 60 * 1000; // 取回 URL 有效期：24 小时（对齐素材生命周期）
export const KEY_CACHE_TTL_MS = 10 * 60 * 1000; // C2A key 校验结果缓存时长

/** 允许的素材类型：MIME → 扩展名（对象 key 的扩展名由此决定）。 */
export const ALLOWED_TYPES: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
};
