import {inspect} from "node:util";

import winston, {format, transports, type Logger as WinstonLogger} from "winston";

/** 输出到父进程，由桌面壳统一写入 desktop.log。 */
export class Logger {
    readonly enabled = process.argv.includes("--debug");
    private readonly logger: WinstonLogger;

    /** 仅输出级别和内容；时间由桌面壳添加，stderr 避免污染 MCP stdout。 */
    constructor() {
        const line = format.printf(({level, message, details}) => `${level.toUpperCase()} ${message}${formatDetails(details)}`);
        this.logger = winston.createLogger({
            level: this.enabled ? "debug" : "info",
            transports: [new transports.Console({format: line, stderrLevels: ["error", "warn", "info", "debug"]})],
        });
    }

    /** 输出 Debug 级别日志。 */
    debug(message: string, details?: unknown) {
        if (details === undefined) this.logger.debug(message);
        else this.logger.debug(message, {details: sanitize(details)});
    }

    /** 输出 Info 级别日志。 */
    info(message: string, details?: unknown) {
        if (details === undefined) this.logger.info(message);
        else this.logger.info(message, {details: sanitize(details)});
    }

    /** 输出 Warn 级别日志。 */
    warn(message: string, details?: unknown) {
        if (details === undefined) this.logger.warn(message);
        else this.logger.warn(message, {details: sanitize(details)});
    }

    /** 输出 Error 级别日志。 */
    error(message: string, details?: unknown) {
        if (details === undefined) this.logger.error(message);
        else this.logger.error(message, {details: sanitize(details)});
    }
}

/** 将日志详情格式化为紧凑的单行文本。 */
function formatDetails(details: unknown) {
    if (details === undefined) return "";
    if (!details || typeof details !== "object" || Array.isArray(details)) return ` ${inspect(details, {depth: null, breakLength: Infinity})}`;
    const text = Object.entries(details).filter(([, value]) => value !== undefined).map(([key, value]) => `${key}=${inspect(value, {depth: null, breakLength: Infinity})}`).join(" ");
    return text ? ` ${text}` : "";
}

/** 清理日志内容中的敏感数据和不可序列化引用。 */
function sanitize(value: unknown, key = "", seen = new WeakSet<object>()): unknown {
    if (/token|authorization|api.?key|dataurl/i.test(key)) return "[REDACTED]";
    if (typeof value === "string" && value.startsWith("data:")) return `[DATA URL ${value.length} chars]`;
    if (value instanceof Error) return {name: value.name, message: value.message, stack: value.stack};
    if (!value || typeof value !== "object") return value;
    if (seen.has(value)) return "[CIRCULAR]";
    seen.add(value);
    if (Array.isArray(value)) return value.map((item) => sanitize(item, key, seen));
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([field, item]) => [field, sanitize(item, field, seen)]));
}

export const logger = new Logger();
