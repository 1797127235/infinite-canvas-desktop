const mode = process.argv[2];
if (mode === "desktop") {
    const { startHttpServer } = await import("./server/http.js");
    const { auditLog } = await import("./agent/audit-log.js");
    const { createInterface } = await import("node:readline");
    const server = startHttpServer();
    let shuttingDown = false;
    const shutdown = async () => {
        if (shuttingDown) return;
        shuttingDown = true;
        await new Promise<void>((resolve) => {
            server.close(() => resolve());
            server.closeAllConnections?.();
        });
        try {
            await auditLog.close();
        } catch (error) {
            console.error("Failed to close audit log", error);
            process.exitCode = 1;
        }
    };
    createInterface({ input: process.stdin }).on("line", (line) => {
        if (line.trim() === "shutdown") void shutdown().finally(() => process.exit());
    });
    process.once("SIGTERM", () => void shutdown().finally(() => process.exit()));
    process.once("SIGINT", () => void shutdown().finally(() => process.exit()));
} else if (mode === "mcp") {
    const { startMcpServer } = await import("./server/mcp.js");
    await startMcpServer();
} else {
    console.error("Canvas Agent 是桌面内部服务，请启动 Infinite Canvas 桌面程序。");
    process.exitCode = 1;
}

export {};
