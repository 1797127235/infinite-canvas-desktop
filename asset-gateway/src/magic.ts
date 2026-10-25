/** 首片字节嗅探：只接受真实图片/视频容器，防止借网关托管任意文件。 */
export function sniffType(bytes: Uint8Array, declared: string): boolean {
    const starts = (prefix: number[], offset = 0) => prefix.every((byte, index) => bytes[offset + index] === byte);
    switch (declared) {
        case "image/jpeg":
            return starts([0xff, 0xd8, 0xff]);
        case "image/png":
            return starts([0x89, 0x50, 0x4e, 0x47]);
        case "image/webp":
            return starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8); // RIFF....WEBP
        case "video/mp4":
        case "video/quicktime":
            return starts([0x66, 0x74, 0x79, 0x70], 4); // ....ftyp
        default:
            return false;
    }
}
