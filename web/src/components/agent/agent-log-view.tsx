import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Segmented, Tooltip } from "antd";
import copyToClipboard from "copy-to-clipboard";
import { CheckCircle2, ChevronDown, CircleAlert, CircleDot, Copy, Download, Trash2, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import i18n from "@/i18n";
import { canvasThemes } from "@/lib/canvas-theme";
import type { AgentAuditEvent } from "@/services/api/canvas-agent";
import { useAgentStore, type AgentEventLog } from "@/stores/use-agent-store";
import { formatLogJson, formatLogText, type AgentLogContext } from "./agent-event-formatters";
import { AgentScrollToBottom } from "./agent-scroll-to-bottom";
import { useAgentAudit } from "./use-agent-audit";

type LogFilter = "all" | "error" | "warning" | "info";
type DisplayLog = AgentEventLog & { count: number; detail: string; displayText: string; level: Exclude<LogFilter, "all">; signature: string; success: boolean };
const SCROLL_BOTTOM_THRESHOLD = 48;
const AUDIT_PAGE_SIZE = 100;

export function AgentLogView({
    logs,
    theme,
    context,
    onClear,
    onCopied,
    onCopyBlocked,
    onExportProblemLog,
}: {
    logs: AgentEventLog[];
    theme: (typeof canvasThemes)[keyof typeof canvasThemes];
    context: AgentLogContext;
    onClear: () => void;
    onCopied: (text: string) => void;
    onCopyBlocked: (text: string) => void;
    onExportProblemLog?: () => void;
}) {
    const { t } = useTranslation();
    const [mode, setMode] = useState<"audit" | "text" | "json">("audit");
    const [auditScope, setAuditScope] = useState<"thread" | "all">("thread");
    const audit = useAgentAudit(auditScope, AUDIT_PAGE_SIZE);
    const auditEvents = useAgentStore((state): AgentAuditEvent[] => state.auditEvents);
    const auditStatus = useAgentStore((state) => state.auditStatus);
    const visibleAudit = useMemo(
        () => auditEvents.filter((event) => auditScope === "all" || (Boolean(audit.activeThreadId) && event.threadId === audit.activeThreadId)).sort((a, b) => a.sequence - b.sequence),
        [auditEvents, auditScope, audit.activeThreadId],
    );
    const [filter, setFilter] = useState<LogFilter>("all");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const followLogsRef = useRef(true);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [newLogCount, setNewLogCount] = useState(0);
    const content = mode === "audit" ? "" : mode === "text" ? formatLogText(logs, context) : formatLogJson(logs, context);
    const displayLogs = useMemo(() => prepareLogs(logs), [logs]);
    const counts = useMemo(
        () => ({
            all: displayLogs.reduce((sum, item) => sum + item.count, 0),
            error: displayLogs.filter((item) => item.level === "error").reduce((sum, item) => sum + item.count, 0),
            warning: displayLogs.filter((item) => item.level === "warning").reduce((sum, item) => sum + item.count, 0),
            info: displayLogs.filter((item) => item.level === "info").reduce((sum, item) => sum + item.count, 0),
        }),
        [displayLogs],
    );
    const visibleLogs = filter === "all" ? displayLogs : displayLogs.filter((item) => item.level === filter);
    const visibleLogCount = visibleLogs.reduce((sum, item) => sum + item.count, 0);
    const previousVisibleCountRef = useRef(visibleLogCount);
    const lastError = [...logs].reverse().find((item) => logLevel(item) === "error");
    const updateScrollState = useCallback(() => {
        const list = listRef.current;
        if (!list) return;
        const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight <= SCROLL_BOTTOM_THRESHOLD;
        followLogsRef.current = atBottom;
        setShowScrollToBottom(!atBottom);
        if (atBottom) setNewLogCount(0);
    }, []);
    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        const list = listRef.current;
        if (!list) return;
        followLogsRef.current = true;
        list.scrollTo({ top: list.scrollHeight, behavior });
        setShowScrollToBottom(false);
        setNewLogCount(0);
    }, []);
    const handleLastLogToggle = useCallback(
        (open: boolean) => {
            if (!open) {
                requestAnimationFrame(updateScrollState);
                return;
            }
            if (!followLogsRef.current) return;
            requestAnimationFrame(() => requestAnimationFrame(() => scrollToBottom("auto")));
        },
        [scrollToBottom, updateScrollState],
    );
    useEffect(() => {
        if (mode !== "text") return;
        const frame = requestAnimationFrame(() => scrollToBottom("auto"));
        return () => cancelAnimationFrame(frame);
    }, [filter, mode, scrollToBottom]);
    useEffect(() => {
        const previousCount = previousVisibleCountRef.current;
        const addedCount = Math.max(0, visibleLogCount - previousCount);
        previousVisibleCountRef.current = visibleLogCount;
        if (mode !== "text") return;
        if (visibleLogCount < previousCount) setNewLogCount(0);
        const frame = requestAnimationFrame(() => {
            if (followLogsRef.current) scrollToBottom("auto");
            else {
                if (addedCount) setNewLogCount((count) => count + addedCount);
                updateScrollState();
            }
        });
        return () => cancelAnimationFrame(frame);
    }, [mode, scrollToBottom, updateScrollState, visibleLogCount]);
    const copy = async (value = content, tip = t("agent.logs.copied")) => {
        if (await copyToClipboard(value)) {
            onCopied(tip);
            return;
        }
        textareaRef.current?.focus();
        textareaRef.current?.select();
        onCopyBlocked(t(mode === "json" ? "agent.logs.selectedManual" : "agent.logs.copyFailed"));
    };
    const connectionLabel = t(context.connected ? "agent.events.online" : context.enabled ? "agent.events.connecting" : "agent.events.disabled");
    return (
        <div className="min-h-0 flex-1 overflow-hidden px-4 py-3">
            <div className="flex h-full min-h-0 flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-base font-semibold leading-6">{t("agent.logs.title")}</div>
                    <div className="flex min-w-0 items-center gap-2">
                        <Segmented
                            size="small"
                            value={mode}
                            onChange={(value) => setMode(value as "audit" | "text" | "json")}
                            options={[
                                { label: "审计记录", value: "audit" },
                                { label: t("agent.logs.diagnostics"), value: "text" },
                                { label: t("agent.logs.rawJson"), value: "json" },
                            ]}
                        />
                        {onExportProblemLog ? (
                            <Button type="text" size="small" icon={<Download className="size-3.5" />} onClick={onExportProblemLog}>
                                导出问题日志
                            </Button>
                        ) : null}
                    </div>
                </div>

                <div className="border-y py-2.5" style={{ borderColor: theme.node.stroke }}>
                    <div className="flex items-start gap-2.5">
                        <span className={`mt-1.5 size-2 shrink-0 rounded-full ${context.connected ? "bg-emerald-500" : context.enabled ? "bg-amber-500" : "bg-current opacity-30"}`} />
                        <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2 text-sm">
                                <span className="font-medium">{connectionLabel}</span>
                                <span className="truncate" style={{ color: theme.node.muted }}>
                                    {context.activity}
                                </span>
                            </div>
                            <div className="mt-0.5 truncate font-mono text-[11px] leading-4" style={{ color: theme.node.faint }} title={context.endpoint}>
                                {context.endpoint}
                            </div>
                        </div>
                        <div className="shrink-0 text-right text-[11px] leading-4" style={{ color: theme.node.muted }}>
                            <div>{t("agent.logs.messages", { count: context.messages })}</div>
                            <div>{context.pendingTool ? t("agent.logs.tool", { tool: context.pendingTool }) : t("agent.logs.noPendingTool")}</div>
                        </div>
                    </div>
                </div>

                {auditStatus?.failed ? (
                    <div role="alert" className="shrink-0 whitespace-pre-wrap break-words text-sm text-red-600 dark:text-red-400">
                        <div className="font-medium">本机审计写入失败，后续操作可能未被完整记录</div>
                        <div>{auditStatus.error || "服务端未提供错误详情"}</div>
                    </div>
                ) : null}

                {mode === "audit" ? (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <Segmented
                                size="small"
                                value={auditScope}
                                onChange={(value) => setAuditScope(value as "thread" | "all")}
                                options={[
                                    { label: "当前会话", value: "thread" },
                                    { label: "全部会话（含全局）", value: "all" },
                                ]}
                            />
                            <Button type="text" size="small" disabled={!visibleAudit.length} icon={<Copy className="size-3.5" />} onClick={() => void copy(safeJson(visibleAudit), "已复制当前范围内已加载的审计记录")}>
                                复制已加载
                            </Button>
                        </div>
                        <div className="text-xs leading-5" style={{ color: theme.node.muted }}>
                            <div>
                                本机持久审计 · 已加载 {visibleAudit.length} 条（含实时事件）· 历史每页 {AUDIT_PAGE_SIZE} 条 · 序号升序
                            </div>
                            <div>历史按页读取，当前列表不代表完整历史；诊断缓存清空不会删除审计文件。</div>
                            {auditStatus?.directory ? <div className="break-all font-mono">存储目录：{auditStatus.directory}</div> : null}
                        </div>
                        {audit.error ? (
                            <div role="alert" className="whitespace-pre-wrap break-words text-xs text-red-600 dark:text-red-400">
                                {audit.error}
                            </div>
                        ) : null}
                        <div tabIndex={0} aria-label="审计记录，按序号升序" className="thin-scrollbar min-h-0 flex-1 overflow-y-auto border-y focus-visible:outline-none" style={{ borderColor: theme.node.stroke }}>
                            {visibleAudit.map((event) => (
                                <AuditRow key={event.eventId} event={event} theme={theme} />
                            ))}
                            {!visibleAudit.length ? (
                                <div className="px-3 py-10 text-center text-sm" style={{ color: theme.node.muted }}>
                                    {audit.loading
                                        ? "正在读取本机审计记录…"
                                        : auditScope === "thread" && !audit.activeThreadId
                                          ? "当前没有会话，可切换至全部会话查看审计。"
                                          : audit.connected
                                            ? "当前范围尚无已加载的审计记录"
                                            : "连接本机 Agent 后可读取持久审计记录"}
                                </div>
                            ) : null}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs" style={{ color: theme.node.muted }}>
                                {!audit.connected
                                    ? "连接已断开，当前仅显示已加载记录"
                                    : audit.loading
                                      ? "正在读取…"
                                      : audit.error
                                        ? "读取失败，可重试"
                                        : audit.hasMore
                                          ? "仍有历史记录未加载"
                                          : auditScope === "all" || audit.activeThreadId
                                            ? "历史分页已读至末尾；新事件实时追加"
                                            : "尚未读取历史"}
                            </span>
                            <div className="flex shrink-0 gap-1">
                                <Button type="text" size="small" disabled={!audit.connected || audit.loading || (auditScope === "thread" && !audit.activeThreadId)} onClick={audit.refresh}>
                                    重新读取
                                </Button>
                                {audit.hasMore || audit.error ? (
                                    <Button type="text" size="small" loading={audit.loading} disabled={!audit.connected} onClick={audit.loadMore}>
                                        {audit.error ? "重试本页" : "加载更多"}
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    </>
                ) : mode === "text" ? (
                    <>
                        <div className="flex items-center justify-between gap-2">
                            <Segmented
                                size="small"
                                value={filter}
                                onChange={(value) => setFilter(value as LogFilter)}
                                options={[
                                    { label: t("agent.logs.all", { count: counts.all }), value: "all" },
                                    { label: t("agent.logs.errors", { count: counts.error }), value: "error" },
                                    { label: t("agent.logs.warnings", { count: counts.warning }), value: "warning" },
                                    { label: t("agent.logs.info", { count: counts.info }), value: "info" },
                                ]}
                            />
                            <LogActions logs={logs} lastError={lastError} onClear={onClear} onCopy={(value, tip) => void copy(value, tip)} context={context} />
                        </div>
                        <div className="relative min-h-0 flex-1">
                            <div ref={listRef} tabIndex={0} aria-label={t("agent.logs.list")} className="thin-scrollbar h-full overflow-y-auto border-y focus-visible:outline-none" style={{ borderColor: theme.node.stroke }} onScroll={updateScrollState}>
                                {visibleLogs.map((item, index) => (
                                    <LogRow key={item.id} item={item} theme={theme} onToggle={index === visibleLogs.length - 1 ? handleLastLogToggle : undefined} />
                                ))}
                                {!visibleLogs.length ? (
                                    <div className="px-3 py-10 text-center text-sm" style={{ color: theme.node.muted }}>
                                        {t(logs.length ? "agent.logs.noFiltered" : "agent.logs.empty")}
                                    </div>
                                ) : null}
                            </div>
                            {showScrollToBottom ? (
                                <AgentScrollToBottom
                                    theme={theme}
                                    title={newLogCount ? t("agent.logs.new", { count: newLogCount }) : t("agent.logs.latest")}
                                    ariaLabel={newLogCount ? t("agent.logs.newLabel", { count: newLogCount }) : t("agent.logs.latest")}
                                    className="!bottom-52"
                                    onClick={() => scrollToBottom()}
                                />
                            ) : null}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs" style={{ color: theme.node.muted }}>
                                {t("agent.logs.fullData", { count: logs.length })}
                            </span>
                            <LogActions logs={logs} lastError={lastError} onClear={onClear} onCopy={(value, tip) => void copy(value, tip)} context={context} />
                        </div>
                        <textarea
                            ref={textareaRef}
                            readOnly
                            value={content}
                            className="thin-scrollbar min-h-0 flex-1 resize-none rounded-md border bg-transparent p-3 font-mono text-xs leading-5 outline-none"
                            style={{ borderColor: theme.node.stroke, color: theme.node.text }}
                            onFocus={(event) => event.currentTarget.select()}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

const AUDIT_TITLES: Record<string, string> = {
    "user_message.accepted": "用户消息已接收",
    "turn.bound": "执行轮次已关联",
    "turn.finished": "执行轮次结束",
    "turn.completed": "执行轮次完成",
    "tool_call.started": "工具调用开始",
    "tool_call.completed": "工具调用完成",
    "tool_call.failed": "工具调用失败",
    "tool_call.timeout": "工具调用超时",
    "agent_message.delta": "助手回复分片",
    "reasoning.delta": "思考内容分片",
    "plan.delta": "计划内容分片",
    "command.output.delta": "命令输出分片",
    "usage.updated": "用量更新",
    "codex.received": "收到协议事件",
    "codex.sent": "发送协议事件",
    "thread/started": "会话已创建",
    "thread/status/changed": "会话状态更新",
    "thread/tokenUsage/updated": "用量更新",
    "turn/started": "执行轮次开始",
    "turn/completed": "执行轮次完成",
    "turn/plan/updated": "执行计划更新",
    "item/started": "执行项目开始",
    "item/completed": "执行项目完成",
    "item/agentMessage/delta": "助手回复分片",
    "item/reasoning/summaryTextDelta": "思考摘要分片",
    "item/reasoning/textDelta": "思考内容分片",
    "item/plan/delta": "计划内容分片",
    "item/commandExecution/outputDelta": "命令输出分片",
    "item/commandExecution/requestApproval": "命令执行审批请求",
    "item/fileChange/requestApproval": "文件修改审批请求",
    error: "执行错误",
};

function AuditRow({ event, theme }: { event: AgentAuditEvent; theme: (typeof canvasThemes)[keyof typeof canvasThemes] }) {
    const method = typeof event.payload?.method === "string" ? event.payload.method : "";
    const title = AUDIT_TITLES[method] || AUDIT_TITLES[event.eventType] || "协议事件";
    const body = auditBody(event.payload);
    return (
        <article className="border-b px-1 py-3 last:border-b-0" style={{ borderColor: theme.node.stroke }}>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-mono text-[11px]" style={{ color: theme.node.faint }}>
                    #{event.sequence}
                </span>
                <span className="text-sm font-medium">{title}</span>
                <time dateTime={event.timestamp} className="break-all font-mono text-[10px]" style={{ color: theme.node.muted }}>
                    {event.timestamp}
                </time>
            </div>
            <div className="mt-1 break-all text-[10px]" style={{ color: theme.node.muted }}>
                {event.threadId ? `会话 ${event.threadId}` : "全局事件"}
                {event.status ? ` · 状态 ${event.status}` : ""}
            </div>
            {body ? <div className="mt-2 whitespace-pre-wrap break-words text-xs leading-5">{body}</div> : null}
            <details className="group mt-2">
                <summary
                    className="flex cursor-pointer list-none items-center gap-1.5 rounded-sm text-xs leading-6 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/20 dark:hover:bg-white/10 [&::-webkit-details-marker]:hidden"
                    style={{ color: theme.node.muted }}
                >
                    <ChevronDown className="size-3.5 shrink-0 transition-transform group-open:rotate-180" />
                    <span>
                        完整 JSON · {event.eventType}
                        {method ? ` · ${method}` : ""}
                    </span>
                </summary>
                <pre className="thin-scrollbar mt-1 overflow-auto whitespace-pre-wrap break-all rounded-md border p-2.5 font-mono text-[11px] leading-5" style={{ borderColor: theme.node.stroke, background: theme.node.panel, color: theme.node.text }}>
                    {safeJson(event)}
                </pre>
            </details>
        </article>
    );
}

function auditBody(value: unknown): string {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.map(auditBody).filter(Boolean).join("\n");
    if (!value || typeof value !== "object") return value == null ? "" : String(value);
    const record = value as Record<string, unknown>;
    for (const key of ["text", "delta", "message", "output", "aggregatedOutput", "content", "contentItems", "error", "params", "item", "input", "turn"]) {
        if (record[key] === undefined) continue;
        const text = auditBody(record[key]);
        if (text) return text;
    }
    return safeJson(record);
}

function LogActions({ logs, lastError, context, onClear, onCopy }: { logs: AgentEventLog[]; lastError?: AgentEventLog; context: AgentLogContext; onClear: () => void; onCopy: (value?: string, tip?: string) => void }) {
    const { t } = useTranslation();
    return (
        <div className="flex shrink-0 items-center gap-0.5">
            <Tooltip title={t("agent.logs.copyAll")}>
                <Button type="text" size="small" shape="circle" aria-label={t("agent.logs.copyAll")} icon={<Copy className="size-3.5" />} onClick={() => onCopy()} />
            </Tooltip>
            <Tooltip title={t("agent.logs.copyLastError")}>
                <Button
                    type="text"
                    size="small"
                    shape="circle"
                    aria-label={t("agent.logs.copyLastError")}
                    disabled={!lastError}
                    icon={<CircleAlert className="size-3.5" />}
                    onClick={() => lastError && onCopy(formatLogText([lastError], context), t("agent.logs.lastErrorCopied"))}
                />
            </Tooltip>
            <Tooltip title="仅清空诊断缓存，不删除审计记录">
                <Button danger type="text" size="small" shape="circle" aria-label="清空诊断缓存，不删除审计记录" disabled={!logs.length} icon={<Trash2 className="size-3.5" />} onClick={onClear} />
            </Tooltip>
        </div>
    );
}

function LogRow({ item, theme, onToggle }: { item: DisplayLog; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; onToggle?: (open: boolean) => void }) {
    const { t } = useTranslation();
    const tone = item.level === "error" ? "text-red-600 dark:text-red-400" : item.level === "warning" ? "text-amber-600 dark:text-amber-400" : item.success ? "text-emerald-600 dark:text-emerald-400" : "";
    const Icon = item.level === "error" ? CircleAlert : item.level === "warning" ? TriangleAlert : item.success ? CheckCircle2 : CircleDot;
    return (
        <details className="group border-b last:border-b-0" style={{ borderColor: theme.node.stroke }} onToggle={(event) => onToggle?.(event.currentTarget.open)}>
            <summary className="cursor-pointer list-none px-1 py-2.5 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current/20 dark:hover:bg-white/10 [&::-webkit-details-marker]:hidden">
                <div className="flex items-start gap-2.5">
                    <Icon className={`mt-0.5 size-4 shrink-0 ${tone}`} style={tone ? undefined : { color: theme.node.muted }} />
                    <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                            <span className="shrink-0 font-mono text-[10px] leading-5" style={{ color: theme.node.faint }}>
                                {item.time}
                            </span>
                            <span className="truncate text-sm font-medium leading-5">{item.title}</span>
                            {item.count > 1 ? (
                                <span className="shrink-0 text-[10px] leading-4" style={{ color: theme.node.muted }}>
                                    {t("agent.logs.repeated", { count: item.count })}
                                </span>
                            ) : null}
                        </div>
                        {item.displayText !== item.title ? (
                            <div className="line-clamp-2 whitespace-pre-wrap break-words text-xs leading-5" style={{ color: theme.node.muted }}>
                                {item.displayText}
                            </div>
                        ) : null}
                    </div>
                    <ChevronDown className="mt-1 size-3.5 shrink-0 transition-transform group-open:rotate-180" style={{ color: theme.node.faint }} />
                </div>
            </summary>
            <div className="pb-3 pl-[34px] pr-2">
                <div className="mb-1 text-[10px] font-medium" style={{ color: theme.node.faint }}>
                    {t("agent.logs.details")}
                </div>
                <pre className="thin-scrollbar max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-md border p-2.5 font-mono text-[11px] leading-5" style={{ borderColor: theme.node.stroke, background: theme.node.panel, color: theme.node.text }}>
                    {item.detail}
                </pre>
            </div>
        </details>
    );
}

function prepareLogs(logs: AgentEventLog[]) {
    return logs.flatMap(expandLog).reduce<DisplayLog[]>((result, item) => {
        const previous = result.at(-1);
        if (previous && previous.signature === item.signature) {
            previous.count += 1;
            previous.time = item.time;
            previous.detail = item.detail;
            return result;
        }
        result.push(item);
        return result;
    }, []);
}

function expandLog(item: AgentEventLog): DisplayLog[] {
    const entries = parseJsonEntries(item.raw ?? item.text);
    return (entries.length ? entries : [undefined]).map((entry, index) => {
        const displayText = compactLogText(entry === undefined ? item.text : logSummary(entry)) || item.title;
        const level = logLevel(item, entry);
        const title = entry === undefined ? item.title : logTitle(item.title, entry);
        return {
            ...item,
            id: entries.length > 1 ? `${item.id}-${index}` : item.id,
            time: logTime(item.time, entry),
            title,
            text: displayText,
            raw: entry ?? item.raw,
            count: 1,
            detail: entry === undefined ? stripAnsi(safeString(item.raw ?? item.text)) || item.text : safeJson(entry),
            displayText,
            level,
            signature: `${level}\n${title}\n${logSignature(displayText)}`,
            success: level === "info" && /完成|成功|已连接|已就绪|收到回复/.test(`${title}\n${displayText}`),
        };
    });
}

function logLevel(item: AgentEventLog, entry?: unknown): DisplayLog["level"] {
    const entries = entry === undefined ? parseJsonEntries(item.raw ?? item.text) : [entry];
    const structured = entries.find((value) => value && typeof value === "object" && !Array.isArray(value)) as Record<string, unknown> | undefined;
    if (structured?.type === "mcp.startup") {
        if (structured.status === "failed") return "error";
        if (structured.status === "cancelled") return "warning";
        return "info";
    }
    const declared = entries.map(declaredLogLevel).filter(Boolean);
    if (declared.includes("error")) return "error";
    if (declared.includes("warning")) return "warning";
    if (declared.includes("info")) return "info";
    const text = `${item.title}\n${item.text}\n${safeString(item.raw)}`;
    if (/错误|失败|异常|中断|断开|拒绝|\berror\b|\bfailed\b|\bfatal\b|exception/i.test(text)) return "error";
    if (/警告|重试|未找到|不可用|\bwarn(?:ing)?\b|deprecated|missing|unavailable/i.test(text)) return "warning";
    return "info";
}

function declaredLogLevel(value: unknown): DisplayLog["level"] | "" {
    if (!value || typeof value !== "object" || Array.isArray(value)) return "";
    const level = String((value as Record<string, unknown>).level || "").toLowerCase();
    if (["error", "fatal"].includes(level)) return "error";
    if (["warn", "warning"].includes(level)) return "warning";
    if (["info", "debug", "trace"].includes(level)) return "info";
    return "";
}

function logTitle(fallback: string, value: unknown) {
    if ((fallback !== "日志" && fallback !== "Log") || !value || typeof value !== "object" || Array.isArray(value)) return fallback;
    const target = String((value as Record<string, unknown>).target || "").toLowerCase();
    if (target.includes("skill")) return i18n.t("agent.logs.skillLoading");
    if (target.includes("plugin")) return i18n.t("agent.logs.plugin");
    if (target.includes("mcp") || target.includes("rmcp")) return "MCP";
    if (target.includes("shell")) return i18n.t("agent.logs.terminal");
    if (target.includes("state_db")) return i18n.t("agent.logs.conversationStorage");
    return i18n.t("agent.message.assistantName");
}

function logTime(fallback: string, value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
    const timestamp = (value as Record<string, unknown>).timestamp;
    if (typeof timestamp !== "string") return fallback;
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? fallback : date.toLocaleTimeString();
}

function parseJsonEntries(value: unknown): unknown[] {
    if (value && typeof value === "object") return [value];
    if (typeof value !== "string") return [];
    const text = stripAnsi(value).trim();
    if (!text) return [];
    try {
        return [JSON.parse(text)];
    } catch {
        const entries: unknown[] = [];
        let start = -1;
        let depth = 0;
        let quoted = false;
        let escaped = false;
        for (let index = 0; index < text.length; index += 1) {
            const character = text[index];
            if (start < 0) {
                if (character !== "{" && character !== "[") continue;
                start = index;
                depth = 1;
                continue;
            }
            if (quoted) {
                if (escaped) escaped = false;
                else if (character === "\\") escaped = true;
                else if (character === '"') quoted = false;
                continue;
            }
            if (character === '"') quoted = true;
            else if (character === "{" || character === "[") depth += 1;
            else if (character === "}" || character === "]") depth -= 1;
            if (depth !== 0) continue;
            try {
                entries.push(JSON.parse(text.slice(start, index + 1)));
            } catch {
                // Ignore non-JSON fragments and continue scanning the stderr chunk.
            }
            start = -1;
        }
        return entries;
    }
}

function logSummary(value: unknown): string {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.map(logSummary).filter(Boolean).slice(0, 3).join(" · ");
    if (!value || typeof value !== "object") return String(value ?? "");
    const record = value as Record<string, unknown>;
    const fields = record.fields && typeof record.fields === "object" && !Array.isArray(record.fields) ? (record.fields as Record<string, unknown>) : null;
    if (fields) {
        for (const key of ["message", "msg", "reason", "summary", "text", "error"]) {
            if (fields[key] === undefined) continue;
            const summary = logSummary(fields[key]);
            if (summary) return summary;
        }
    }
    for (const key of ["message", "msg", "reason", "summary", "text", "error"]) {
        if (record[key] === undefined) continue;
        const summary = logSummary(record[key]);
        if (summary) return summary;
    }
    return [record.method, record.type, record.tool, record.path, record.url].filter((item) => typeof item === "string" && item).join(" · ") || safeJson(value);
}

function compactLogText(value: string) {
    return stripAnsi(value).replace(/\s+/g, " ").trim();
}

function logSignature(value: string) {
    return value
        .replace(/[a-z]:\\[^\r\n]*?skill\.md/gi, "<SKILL.md>")
        .replace(/file:\/\/\/[^\s"']+/gi, "<路径>")
        .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "<ID>");
}

function stripAnsi(value: string) {
    return value.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");
}

function safeString(value: unknown) {
    if (typeof value === "string") return value;
    if (value === undefined || value === null) return "";
    return safeJson(value);
}

function safeJson(value: unknown) {
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}
