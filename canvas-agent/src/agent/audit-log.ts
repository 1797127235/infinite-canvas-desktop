import crypto from "node:crypto";
import { constants } from "node:fs";
import fs, { type FileHandle } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";

import { CONFIG_DIR } from "../config.js";
import { redactAgentLog } from "../utils/agent-runtime.js";

const STORAGE_VERSION = 1 as const;
const MANIFEST_FILE = "manifest.json";
const EVENTS_FILE = "events.jsonl";
const LOCK_FILE = "writer.lock";
const RUN_ID = crypto.randomUUID();
const AUDIT_DIRECTORY = process.env.CANVAS_AUDIT_DIR || path.join(CONFIG_DIR, "agent-audit");
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const METADATA_FIELDS = ["threadId", "turnId", "itemId", "clientId", "requestId", "messageId", "status"] as const;
const SENSITIVE_KEYS = new Set([
    "key", "apikey", "authorization", "proxyauthorization", "auth", "token", "accesstoken", "refreshtoken", "idtoken",
    "bearertoken", "password", "passwd", "pwd", "secret", "clientsecret", "apisecret", "secretkey", "privatekey",
    "credential", "credentials", "cookie", "setcookie", "sessiontoken", "sessionid", "signature", "sig",
    "xapikey", "xauthtoken", "xamzsignature", "xamzcredential", "xamzsecuritytoken", "xgoogsignature", "xgoogcredential",
]);

type AuditSanitizedValue = string | number | boolean | null | AuditSanitizedValue[] | { [key: string]: AuditSanitizedValue };
type FileIdentity = { dev: number; ino: number };
export type AuditEvent = {
    schemaVersion: typeof STORAGE_VERSION;
    eventId: string;
    sequence: number;
    timestamp: string;
    runId: string;
    hash: string;
    eventType: string;
    threadId?: string;
    turnId?: string;
    itemId?: string;
    clientId?: string;
    requestId?: string;
    messageId?: string;
    status?: string;
    payload?: Record<string, unknown>;
};
export type AuditEventInput = Omit<AuditEvent, "schemaVersion" | "eventId" | "sequence" | "timestamp" | "runId" | "hash"> & { timestamp?: string };
export type AuditQuery = { threadId?: string; turnId?: string; afterSequence?: number; limit?: number };
type AuditListener = (event: AuditEvent) => unknown;

export class AuditLogError extends Error {
    readonly code = "AUDIT_UNAVAILABLE";

    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = "AuditLogError";
    }
}

/** 仅支持本机文件系统；writer.lock 必须在确认旧进程退出并检查 journal 后人工移除。 */
export class AuditLog {
    private queue: Promise<unknown> = Promise.resolve();
    private failure?: AuditLogError;
    private initialized = false;
    private nextSequence = 1;
    private confirmedBytes = 0;
    private journal?: FileHandle;
    private journalIdentity?: FileIdentity;
    private lock?: FileHandle;
    private lockIdentity?: FileIdentity;
    private closing?: Promise<void>;
    private listeners = new Set<AuditListener>();
    private listenerError?: string;

    private readonly directory: string;

    constructor(directory = AUDIT_DIRECTORY) {
        this.directory = path.resolve(directory);
    }

    get filePath() {
        return path.join(this.directory, EVENTS_FILE);
    }

    record(input: AuditEventInput): Promise<AuditEvent> {
        if (this.closing) return Promise.reject(new AuditLogError("Audit log is closed."));
        return this.enqueue(async () => {
            if (this.failure) throw this.failure;
            let event: AuditEvent;
            try {
                await this.ensureReady();
                if (!Number.isSafeInteger(this.nextSequence)) throw new Error("Audit sequence exhausted.");
                if (typeof input.eventType !== "string" || !input.eventType) throw new Error("Audit eventType must be a nonempty string.");
                const content: Omit<AuditEvent, "hash"> = {
                    schemaVersion: STORAGE_VERSION,
                    eventId: crypto.randomUUID(),
                    sequence: this.nextSequence,
                    timestamp: input.timestamp === undefined ? new Date().toISOString() : new Date(input.timestamp).toISOString(),
                    runId: RUN_ID,
                    eventType: sanitizeText(input.eventType),
                };
                for (const field of METADATA_FIELDS) {
                    if (input[field] === undefined) continue;
                    if (typeof input[field] !== "string") throw new Error(`Audit ${field} must be a string.`);
                    content[field] = sanitizeText(input[field]);
                }
                if (input.payload !== undefined) {
                    if (!input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) throw new Error("Audit payload must be an object.");
                    content.payload = sanitizeValue(input.payload, "", new WeakSet()) as Record<string, unknown>;
                }
                event = { ...content, hash: hashContent(content) };
                const line = JSON.stringify(event) + "\n";
                await this.verifyWriter();
                await this.journal!.writeFile(line, "utf8");
                await this.journal!.sync();
                this.confirmedBytes += Buffer.byteLength(line);
                this.nextSequence++;
            } catch (error) {
                throw this.fail(error);
            }
            // A failed consumer cannot turn an already durable write into a failed record().
            for (const listener of this.listeners) {
                try {
                    void Promise.resolve(listener(structuredClone(event))).catch((error) => this.noteListenerError(error));
                } catch (error) {
                    this.noteListenerError(error);
                }
            }
            return event;
        });
    }

    async read(options: AuditQuery = {}): Promise<AuditEvent[]> {
        return (await this.query(options)).events;
    }

    query(options: AuditQuery = {}): Promise<{ events: AuditEvent[]; nextSequence: number; hasMore: boolean }> {
        return this.enqueue(async () => {
            const afterSequence = options.afterSequence ?? 0;
            if (!Number.isSafeInteger(afterSequence) || afterSequence < 0) throw new RangeError("afterSequence must be a finite nonnegative safe integer.");
            if (options.limit !== undefined && (!Number.isSafeInteger(options.limit) || options.limit <= 0)) throw new RangeError("limit must be a finite positive safe integer.");
            const readable = await readOnlyJournal(this.directory, this.initialized);
            if (!readable) return { events: [], nextSequence: afterSequence, hasMore: false };
            // Validate even after a write fault; never expose a partially written or corrupt file as a valid page.
            const events: AuditEvent[] = [];
            let hasMore = false;
            const confirmedSequence = this.failure && this.initialized ? this.nextSequence - 1 : Infinity;
            await scanJournal(this.filePath, (event) => {
                if (event.sequence > confirmedSequence || event.sequence <= afterSequence) return;
                if (options.threadId && event.threadId !== options.threadId) return;
                if (options.turnId && event.turnId !== options.turnId) return;
                if (options.limit === undefined || events.length < options.limit) events.push(event);
                else hasMore = true;
            });
            return { events, nextSequence: events.at(-1)?.sequence ?? afterSequence, hasMore };
        });
    }

    subscribe(listener: AuditListener) {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }

    status() {
        return {
            failed: !!this.failure,
            error: this.failure?.message,
            directory: this.directory,
            closed: !!this.closing,
            listenerError: this.listenerError,
            directorySync: process.platform === "win32" ? "unsupported" as const : "fsync" as const,
        };
    }

    flush(): Promise<void> {
        return this.enqueue(async () => {
            if (this.failure) throw this.failure;
            if (!this.journal) return;
            try {
                await this.verifyWriter();
                await this.journal.sync();
            } catch (error) {
                throw this.fail(error);
            }
        });
    }

    close(): Promise<void> {
        if (this.closing) return this.closing;
        this.closing = this.enqueue(async () => {
            try {
                if (this.journal && !this.failure) {
                    await this.verifyWriter();
                    await this.journal.sync();
                }
            } catch (error) {
                this.fail(error);
            }
            for (const handle of [this.journal, this.lock]) {
                try {
                    await handle?.close();
                } catch (error) {
                    this.fail(error);
                }
            }
            this.journal = undefined;
            if (this.lock) {
                try {
                    const lockPath = path.join(this.directory, LOCK_FILE);
                    await assertIdentity(lockPath, this.lockIdentity!);
                    await fs.unlink(lockPath);
                    await syncDirectory(this.directory);
                } catch (error) {
                    this.fail(error);
                }
                this.lock = undefined;
            }
            this.listeners.clear();
            if (this.failure) throw this.failure;
        });
        return this.closing;
    }

    private enqueue<T>(task: () => Promise<T>): Promise<T> {
        const result = this.queue.then(task);
        this.queue = result.then(() => undefined, () => undefined);
        return result;
    }

    private fail(error: unknown) {
        this.failure ??= error instanceof AuditLogError ? error : new AuditLogError(`Audit log unavailable: ${safeError(error)}`, error);
        return this.failure;
    }

    private noteListenerError(error: unknown) {
        this.listenerError = safeError(error);
    }

    private async verifyWriter() {
        await assertIdentity(path.join(this.directory, LOCK_FILE), this.lockIdentity!);
        const current = await assertIdentity(this.filePath, this.journalIdentity!);
        if (current.size !== this.confirmedBytes) throw new Error("Audit journal size changed outside this writer.");
    }

    private async ensureReady() {
        if (this.initialized) return;
        const created = await fs.mkdir(this.directory, { recursive: true, mode: 0o700 });
        if (!(await fs.lstat(this.directory)).isDirectory()) throw new Error("Audit directory must be a real directory.");
        const entries = await fs.readdir(this.directory);
        const fresh = created !== undefined;
        if (fresh ? entries.length !== 0 : !entries.includes(MANIFEST_FILE) || !entries.includes(EVENTS_FILE)) {
            throw new Error("Audit manifest or events file is missing; refusing to initialize an existing directory.");
        }
        this.lock = await fs.open(path.join(this.directory, LOCK_FILE), "wx", 0o600);
        this.lockIdentity = await this.lock.stat();
        await this.lock.writeFile(JSON.stringify({ pid: process.pid, runId: RUN_ID, timestamp: new Date().toISOString() }) + "\n");
        await this.lock.sync();
        await syncDirectory(this.directory);
        if (fresh) {
            await createDurably(path.join(this.directory, MANIFEST_FILE), JSON.stringify({ version: STORAGE_VERSION }) + "\n");
            await createDurably(this.filePath, "");
            // Sync each new directory and its entry in its parent, up to the first existing ancestor.
            const ancestor = path.dirname(path.resolve(created!));
            for (let current = this.directory;; current = path.dirname(current)) {
                await syncDirectory(current);
                if (current === ancestor) break;
            }
        }
        await validateManifest(this.directory);
        const recovered = await scanJournal(this.filePath);
        this.nextSequence = recovered.sequence + 1;
        this.confirmedBytes = recovered.bytes;
        this.journal = await fs.open(this.filePath, constants.O_WRONLY | constants.O_APPEND | (constants.O_NOFOLLOW || 0));
        this.journalIdentity = recovered.identity;
        await this.verifyWriter();
        this.initialized = true;
    }
}

export const auditLog = new AuditLog();

async function createDurably(file: string, content: string) {
    const handle = await fs.open(file, "wx", 0o600);
    try {
        await handle.writeFile(content, "utf8");
        await handle.sync();
    } finally {
        await handle.close();
    }
}

async function syncDirectory(directory: string) {
    // Node on Windows cannot fsync directory handles; file fsync remains mandatory, and status() exposes this limitation.
    if (process.platform === "win32") return;
    const handle = await fs.open(directory, "r");
    try {
        await handle.sync();
    } finally {
        await handle.close();
    }
}

async function assertIdentity(file: string, expected: FileIdentity) {
    const current = await fs.lstat(file);
    if (!current.isFile() || current.dev !== expected.dev || current.ino !== expected.ino) throw new Error(`Audit file replaced: ${file}`);
    return current;
}

async function readOnlyJournal(directory: string, initialized: boolean) {
    try {
        const directoryStat = await fs.lstat(directory);
        if (!directoryStat.isDirectory()) throw new Error(`Audit directory must be a real directory: ${directory}`);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT" && !initialized) return false;
        throw error;
    }
    const entries = await fs.readdir(directory);
    if (!entries.includes(MANIFEST_FILE) || !entries.includes(EVENTS_FILE)) throw new Error("Audit manifest or events file is missing.");
    await validateManifest(directory);
    return true;
}

async function validateManifest(directory: string) {
    const file = path.join(directory, MANIFEST_FILE);
    if (!(await fs.lstat(file)).isFile()) throw new Error(`Audit manifest must be a regular file: ${file}`);
    let value: unknown;
    try {
        value = JSON.parse(await fs.readFile(file, "utf8"));
    } catch (error) {
        throw new Error(`Audit manifest is invalid: ${file}`, { cause: error });
    }
    if (!value || typeof value !== "object" || (value as Record<string, unknown>).version !== STORAGE_VERSION || Object.keys(value).some((key) => key !== "version")) {
        throw new Error(`Unsupported audit manifest: ${file}`);
    }
}

/** Stream the entire file, even for a small page, so a corrupt tail cannot be silently hidden. */
async function scanJournal(file: string, visit?: (event: AuditEvent) => void) {
    const handle = await fs.open(file, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
    const identity = await handle.stat();
    let bytes = 0;
    let lastByte: number | undefined;
    let newlineCount = 0;
    let sequence = 0;
    const ids = new Set<string>();
    const source = handle.createReadStream({ autoClose: false });
    const input = Readable.from((async function* () {
        const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
        for await (const chunk of source) {
            bytes += chunk.length;
            lastByte = chunk[chunk.length - 1];
            for (let index = chunk.indexOf(10); index !== -1; index = chunk.indexOf(10, index + 1)) newlineCount++;
            yield decoder.decode(chunk, { stream: true });
        }
        yield decoder.decode();
        if (bytes > 0 && lastByte !== 10) throw new Error(`Audit journal has an incomplete final line: ${file}`);
    })(), { objectMode: false });
    const lines = createInterface({ input, crlfDelay: Infinity });
    try {
        if (!identity.isFile()) throw new Error(`Audit journal must be a regular file: ${file}`);
        for await (const line of lines) {
            const event = parseEvent(line, file);
            if (event.sequence !== sequence + 1 || ids.has(event.eventId)) throw new Error(`Audit sequence or event ID is duplicated/out of order: ${file}`);
            sequence = event.sequence;
            ids.add(event.eventId);
            visit?.(event);
        }
        if (newlineCount !== sequence) throw new Error(`Audit events must each end with a newline: ${file}`);
        const after = await handle.stat();
        if (bytes !== identity.size || after.size !== bytes || after.mtimeMs !== identity.mtimeMs || after.ctimeMs !== identity.ctimeMs) throw new Error(`Audit journal changed during reading: ${file}`);
        return { sequence, bytes, identity };
    } finally {
        lines.close();
        input.destroy();
        source.destroy();
        await handle.close();
    }
}

function parseEvent(raw: string, file: string): AuditEvent {
    try {
        const event = JSON.parse(raw) as AuditEvent;
        if (!event || typeof event !== "object" || Array.isArray(event) || event.schemaVersion !== STORAGE_VERSION
            || typeof event.eventId !== "string" || !UUID.test(event.eventId) || typeof event.runId !== "string" || !UUID.test(event.runId)
            || !Number.isSafeInteger(event.sequence) || event.sequence < 1
            || typeof event.eventType !== "string" || !event.eventType || typeof event.timestamp !== "string"
            || !Number.isFinite(Date.parse(event.timestamp)) || typeof event.hash !== "string" || !/^[a-f0-9]{64}$/.test(event.hash)) throw new Error();
        for (const field of METADATA_FIELDS) if (event[field] !== undefined && typeof event[field] !== "string") throw new Error();
        if (event.payload !== undefined && (!event.payload || typeof event.payload !== "object" || Array.isArray(event.payload))) throw new Error();
        const { hash, ...content } = event;
        if (hash !== hashContent(content)) throw new Error();
        return event;
    } catch {
        throw new Error(`Audit log event is invalid (schema/hash): ${file}`);
    }
}

function hashContent(value: unknown): string {
    return crypto.createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function canonicalJson(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
    if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
    return JSON.stringify(value) ?? "null";
}

function normalizedKey(key: string) {
    return key.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function digest(value: string | Uint8Array, type: string) {
    return { hash: crypto.createHash("sha256").update(value).digest("hex"), type, length: typeof value === "string" ? value.length : value.byteLength };
}

function sanitizeValue(value: unknown, key: string, stack: WeakSet<object>): AuditSanitizedValue {
    const normalized = normalizedKey(key);
    if (SENSITIVE_KEYS.has(normalized)) return "[REDACTED]";
    if (Buffer.isBuffer(value)) return digest(value, "Buffer");
    if (ArrayBuffer.isView(value)) return digest(new Uint8Array(value.buffer, value.byteOffset, value.byteLength), value.constructor.name);
    if (value instanceof ArrayBuffer) return digest(new Uint8Array(value), "ArrayBuffer");
    if (typeof value === "string") {
        if (/base64|b64json|dataurl/.test(normalized)) return digest(value, normalized.includes("dataurl") ? "data-url" : "base64");
        return sanitizeText(value);
    }
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "bigint") return value.toString();
    if (typeof value === "boolean" || value === null) return value;
    if (typeof value !== "object") return null;
    if (stack.has(value)) return "[CIRCULAR]";
    stack.add(value);
    try {
        if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.toISOString() : null;
        if (value instanceof URL) return sanitizeText(value.toString());
        if (Array.isArray(value)) return Array.from(value, (item) => sanitizeValue(item, key, stack));
        const fields = value instanceof Error ? { ...value, name: value.name, message: value.message, stack: value.stack, ...(value.cause !== undefined ? { cause: value.cause } : {}) } : value;
        return Object.fromEntries(Object.entries(fields).map(([field, item]) => [field, sanitizeValue(item, field, stack)]));
    } finally {
        stack.delete(value);
    }
}

function sanitizeText(text: string) {
    // shortcut: credentials split across separate delta events cannot be recognized; redact at the producer if streaming secrets is possible.
    const summarized = text.replace(/\bdata:[^\s"'<>()[\]{}]+/gi, (value) => {
        const type = /^data:([a-z\d.+-]+\/[a-z\d.+-]+)[;,]/i.exec(value)?.[1] || "data-url";
        return `[DATA URL ${JSON.stringify(digest(value, type))}]`;
    });
    const redactText = (value: string) => redactAgentLog(value).replace(/(\b(?:password|passwd|pwd|secret|client[_ -]?secret|api[_ -]?secret|private[_ -]?key|credential|access[_ -]?token|refresh[_ -]?token|api[_ -]?key|token)\b["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, "$1[REDACTED]");
    // Keep URLs separate so a text assignment rule cannot consume their nonsensitive query parameters.
    return summarized.split(/(\b[a-z][a-z\d+.-]*:\/\/[^\s"'<>]+)/gi).map((value, index) => {
        if (index % 2 === 0) return redactText(value);
        try {
            const url = new URL(value);
            url.username = "";
            url.password = "";
            for (const key of new Set(url.searchParams.keys())) if (SENSITIVE_KEYS.has(normalizedKey(key))) url.searchParams.set(key, "[REDACTED]");
            return url.toString().replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "[REDACTED]");
        } catch {
            return "[INVALID URL]";
        }
    }).join("");
}

function safeError(error: unknown) {
    try {
        return sanitizeText(error instanceof Error ? error.message : String(error));
    } catch {
        return "Unknown audit error";
    }
}
