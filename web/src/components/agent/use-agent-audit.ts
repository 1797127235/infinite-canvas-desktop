import { useEffect, useRef, useState } from "react";
import { App } from "antd";

import { fetchAgentAudit } from "@/services/api/canvas-agent";
import { useAgentStore } from "@/stores/use-agent-store";

export function useAgentAudit(scope: "thread" | "all", pageSize: number) {
    const { message } = App.useApp();
    const endpoint = useAgentStore((state) => state.url)
        .trim()
        .replace(/\/$/, "");
    const token = useAgentStore((state) => state.token);
    const connected = useAgentStore((state) => state.connected);
    const activeThreadId = useAgentStore((state) => state.activeThreadId);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hasMore, setHasMore] = useState(false);
    const [revision, setRevision] = useState(0);
    const loadRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        let active = true;
        let busy = false;
        // Only the persisted query advances this cursor; SSE may arrive ahead of unread pages.
        let afterSequence = 0;
        const controller = new AbortController();
        const current = () => {
            const state = useAgentStore.getState();
            return active && !controller.signal.aborted && state.connected && state.url.trim().replace(/\/$/, "") === endpoint && state.token === token && state.activeThreadId === activeThreadId;
        };
        setError("");
        setHasMore(false);
        setLoading(false);
        const load = async () => {
            if (busy || !current()) return;
            busy = true;
            setLoading(true);
            setError("");
            const previousStatus = useAgentStore.getState().auditStatus;
            try {
                const page = await fetchAgentAudit(endpoint, token, { threadId: scope === "thread" ? activeThreadId : undefined, afterSequence, limit: pageSize }, controller.signal);
                if (!current()) return;
                const state = useAgentStore.getState();
                state.appendAuditEvents(page.events);
                // Do not replace an SSE status received after this request started.
                if (state.auditStatus === previousStatus) state.setAgentState({ auditStatus: page.status });
                afterSequence = page.nextSequence;
                setHasMore(page.hasMore);
            } catch (cause) {
                if (!current()) return;
                const text = `审计记录查询失败：${cause instanceof Error ? cause.message : String(cause)}`;
                setError(text);
                message.error(text);
            } finally {
                busy = false;
                if (current()) setLoading(false);
            }
        };
        if (connected && endpoint && (scope === "all" || activeThreadId)) {
            loadRef.current = () => void load();
            void load();
        }
        return () => {
            active = false;
            controller.abort();
            loadRef.current = null;
        };
    }, [activeThreadId, connected, endpoint, message, pageSize, revision, scope, token]);

    return { loading, error, hasMore, connected, activeThreadId, loadMore: () => loadRef.current?.(), refresh: () => setRevision((value) => value + 1) };
}
