import { createRequire } from "node:module";

import { VERSION } from "./config.js";
import { logger } from "./utils/logger.js";

const require = createRequire(import.meta.url);
const CODEX_VERSION = String((require("@openai/codex/package.json") as { version: string }).version);

/** 记录桌面组件版本；不探测或要求用户安装全局 Codex CLI。 */
export function checkVersions() {
    logger.info("Canvas Agent version", { version: VERSION });
    logger.info("Desktop Codex runtime", { version: CODEX_VERSION, executable: process.env.CANVAS_CODEX_BIN });
}
