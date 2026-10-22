import assert from "node:assert/strict";
import test from "node:test";

import { shouldUseCodexModelCatalog } from "./codex-model-catalog.js";

test("uses Codex model/list instead of gateway /models when a custom model catalog is configured", () => {
    assert.equal(shouldUseCodexModelCatalog({ model_catalog_json: "/app/codex/models.json" }), true);
});

test("keeps the existing provider /models fallback when no custom catalog is configured", () => {
    assert.equal(shouldUseCodexModelCatalog({ model_provider: "canvas_c2a" }), false);
});
