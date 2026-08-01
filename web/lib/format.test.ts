import assert from "node:assert/strict";
import test from "node:test";

import { fmtDualCurrency, fmtPrice } from "./format.ts";

test("formats RMB as the primary currency with USD as reference", () => {
  assert.equal(fmtDualCurrency(1), "¥7.20 ($1.0000)");
  assert.equal(fmtDualCurrency(2.5, 2, 2), "¥18.00 ($2.50)");
});

test("model prices use dual currency display", () => {
  assert.equal(fmtPrice(0), "免费");
  assert.equal(fmtPrice(2), "¥14.40 ($2.00)");
});
