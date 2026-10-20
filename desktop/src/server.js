const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const { layout } = require("./paths");

/** Agent 反向代理挂载的前缀，避免和网页自身路由（例如 /config 设置页）冲突。 */
const AGENT_PREFIX = "/agent-api";

const MIME_TYPES = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".mp4": "video/mp4",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".wasm": "application/wasm",
    ".webmanifest": "application/manifest+json",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
};

/** 页面自身与 AI 接口、Agent 事件流都在本地；不放宽到任意来源，避免被外部页面复用。 */
const CONTENT_SECURITY_POLICY = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' data: blob: https: http:",
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    "connect-src 'self' data: blob: https: http: ws: wss:",
    "frame-src 'self' https:",
].join("; ");

function isLoopbackHost(header) {
    const host = String(header || "").split(":")[0];
    return host === "127.0.0.1" || host === "localhost";
}

function send(res, status, body, headers = {}) {
    res.writeHead(status, { "content-type": "text/plain; charset=utf-8", ...headers });
    res.end(body);
}

/** 把 Agent 请求原样转发到本机端口；SSE 直接透传，不做缓冲。 */
function proxyAgent(req, res, agentPort) {
    const target = req.url.slice(AGENT_PREFIX.length) || "/";
    const upstream = http.request(
        {
            host: "127.0.0.1",
            port: agentPort,
            method: req.method,
            path: target,
            headers: { ...req.headers, host: `127.0.0.1:${agentPort}` },
        },
        (response) => {
            res.writeHead(response.statusCode || 502, response.headers);
            res.socket?.setNoDelay(true);
            response.pipe(res);
        },
    );
    upstream.on("error", (error) => {
        if (res.headersSent) return void res.destroy();
        send(res, 502, `Canvas Agent 不可用：${error.message}`);
    });
    req.pipe(upstream);
}

function serveStatic(req, res) {
    const root = layout().web;
    let pathname = "/";
    try {
        pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    } catch {
        return send(res, 400, "Bad Request");
    }
    const requested = path.join(root, pathname);
    const inside = requested === root || requested.startsWith(`${root}${path.sep}`);
    const file = inside && fs.existsSync(requested) && fs.statSync(requested).isFile() ? requested : path.join(root, "index.html");
    if (!fs.existsSync(file)) return send(res, 404, "Not Found");
    if (file !== requested && req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method Not Allowed");
    const extension = path.extname(file).toLowerCase();
    const immutable = file !== path.join(root, "index.html") && pathname.startsWith("/assets/");
    res.writeHead(200, {
        "content-type": MIME_TYPES[extension] || "application/octet-stream",
        "cache-control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
        "content-security-policy": CONTENT_SECURITY_POLICY,
        "x-content-type-options": "nosniff",
        "referrer-policy": "no-referrer",
    });
    fs.createReadStream(file).pipe(res);
}

/** 用同源静态服务承载网页，并把 Agent 挂到 /agent-api，浏览器端无需处理跨域和地址配置。 */
function startWebServer(getAgentPort) {
    const server = http.createServer((req, res) => {
        // 挡住 DNS rebinding：只有本机地址能访问这份本地服务。
        if (!isLoopbackHost(req.headers.host)) return send(res, 403, "Forbidden");
        if (req.method === "OPTIONS" && req.url.startsWith(AGENT_PREFIX)) return send(res, 204, "");
        const agentPort = getAgentPort();
        if (req.url === AGENT_PREFIX || req.url.startsWith(`${AGENT_PREFIX}/`)) {
            if (!agentPort) return send(res, 503, "Canvas Agent 正在启动");
            return proxyAgent(req, res, agentPort);
        }
        serveStatic(req, res);
    });
    return new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => resolve(server.address().port));
    });
}

module.exports = { startWebServer, AGENT_PREFIX };