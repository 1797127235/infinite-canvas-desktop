const PROBLEM_LOG_SCHEMA_VERSION = 1;

function buildProblemLogBundle(input) {
    return {
        schemaVersion: PROBLEM_LOG_SCHEMA_VERSION,
        exportedAt: input.exportedAt || new Date().toISOString(),
        application: {
            version: String(input.application?.version || "unknown"),
            platform: String(input.application?.platform || "unknown"),
            arch: String(input.application?.arch || "unknown"),
        },
        context: {
            threadId: String(input.context?.threadId || ""),
            turnId: String(input.context?.turnId || ""),
            activity: String(input.context?.activity || ""),
            connection: input.context?.connection || "unknown",
        },
        logs: {
            desktop: typeof input.desktopLog === "string" ? input.desktopLog : "[desktop.log unavailable]",
            frontend: Array.isArray(input.frontendLogs) ? input.frontendLogs : [],
            audit: Array.isArray(input.auditEvents) ? input.auditEvents : [],
            auditStatus: input.auditStatus || null,
            auditComplete: input.auditComplete === true,
        },
        handoff: {
            purpose: "将本次问题交给 coding agent 定位、修复并创建 PR",
            containsUserContent: true,
            containsToolOutput: true,
            containsLocalPaths: true,
            automaticUpload: false,
        },
    };
}

module.exports = { buildProblemLogBundle, PROBLEM_LOG_SCHEMA_VERSION };
