import assert from "node:assert/strict";
import test from "node:test";

import { corsOrigin } from "./http.js";

const desktopOrigins = ["http://127.0.0.1:17370", "http://localhost:17370"];

test("未配置桌面白名单时不放行跨域来源", () => {
    assert.equal(corsOrigin("", []), "");
    assert.equal(corsOrigin("https://canvas.best", []), "");
});

test("配置白名单后只回显白名单来源", () => {
    assert.equal(corsOrigin("http://127.0.0.1:17370", desktopOrigins), "http://127.0.0.1:17370");
    assert.equal(corsOrigin("http://localhost:17370", desktopOrigins), "http://localhost:17370");
});

test("白名单外的来源不下发跨域头", () => {
    assert.equal(corsOrigin("https://evil.example", desktopOrigins), "");
    assert.equal(corsOrigin("http://127.0.0.1:3000", desktopOrigins), "");
});

test("本机非浏览器请求不带 Origin 时不下发跨域头", () => {
    assert.equal(corsOrigin("", desktopOrigins), "");
});
