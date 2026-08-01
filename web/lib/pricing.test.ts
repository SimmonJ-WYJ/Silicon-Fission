import assert from "node:assert/strict";
import test from "node:test";

import {
  fromPricingRows,
  parseRatioJson,
  ratioToUsdPerMillion,
  rowPriceUsdPerMillion,
  usdToCny,
  toPricingRows,
  validatePricingRow,
  type ModelPricingRow,
} from "./pricing.ts";

test("parses a valid ratio object", () => {
  assert.deepEqual(parseRatioJson('{"gpt-4o":2.5,"glm-4":1}'), { "gpt-4o": 2.5, "glm-4": 1 });
});

test("returns an empty table for unusable input", () => {
  assert.deepEqual(parseRatioJson(""), {});
  assert.deepEqual(parseRatioJson("not json"), {});
  assert.deepEqual(parseRatioJson("[1,2]"), {});
  assert.deepEqual(parseRatioJson(null), {});
  assert.deepEqual(parseRatioJson(undefined), {});
});

test("drops non-numeric values", () => {
  assert.deepEqual(parseRatioJson('{"a":1,"b":"2","c":null,"d":true}'), { a: 1 });
});

test("merges the three tables into one sorted row per model", () => {
  const rows = toPricingRows({
    modelRatio: { "gpt-4o": 2.5, "glm-4": 1 },
    completionRatio: { "gpt-4o": 4 },
    modelPrice: { "dall-e-3": 0.04 },
  });

  assert.deepEqual(rows, [
    { model: "dall-e-3", inputRatio: null, outputRatio: null, perCallPrice: 0.04 },
    { model: "glm-4", inputRatio: 1, outputRatio: null, perCallPrice: null },
    { model: "gpt-4o", inputRatio: 2.5, outputRatio: 4, perCallPrice: null },
  ]);
});

test("returns no rows for empty tables", () => {
  assert.deepEqual(toPricingRows({ modelRatio: {}, completionRatio: {}, modelPrice: {} }), []);
});

test("round-trips through toPricingRows", () => {
  const tables = {
    modelRatio: { "gpt-4o": 2.5, "glm-4": 1 },
    completionRatio: { "gpt-4o": 4 },
    modelPrice: { "dall-e-3": 0.04 },
  };
  assert.deepEqual(fromPricingRows(toPricingRows(tables)), tables);
});

test("omits null fields so they get removed upstream", () => {
  const rows: ModelPricingRow[] = [
    { model: "a", inputRatio: 1, outputRatio: null, perCallPrice: null },
  ];
  assert.deepEqual(fromPricingRows(rows), {
    modelRatio: { a: 1 },
    completionRatio: {},
    modelPrice: {},
  });
});

test("skips blank model names and trims the rest", () => {
  const rows: ModelPricingRow[] = [
    { model: "   ", inputRatio: 1, outputRatio: null, perCallPrice: null },
    { model: "  b  ", inputRatio: 2, outputRatio: null, perCallPrice: null },
  ];
  assert.deepEqual(fromPricingRows(rows), {
    modelRatio: { b: 2 },
    completionRatio: {},
    modelPrice: {},
  });
});

test("converts a ratio to usd per million tokens", () => {
  assert.equal(ratioToUsdPerMillion(1), 2);
  assert.equal(ratioToUsdPerMillion(2.5), 5);
});

test("converts displayed USD prices to RMB at the configured rate", () => {
  assert.equal(usdToCny(1), 7.2);
  assert.ok(Math.abs(usdToCny(0.002) - 0.0144) < Number.EPSILON);
});

test("treats a missing output ratio as 1x the input price", () => {
  const row: ModelPricingRow = {
    model: "x",
    inputRatio: 2.5,
    outputRatio: null,
    perCallPrice: null,
  };
  assert.deepEqual(rowPriceUsdPerMillion(row), { input: 5, output: 5 });
});

test("multiplies output price by the output ratio", () => {
  const row: ModelPricingRow = { model: "x", inputRatio: 2.5, outputRatio: 4, perCallPrice: null };
  assert.deepEqual(rowPriceUsdPerMillion(row), { input: 5, output: 20 });
});

test("reports no price when the input ratio is unset", () => {
  const row: ModelPricingRow = {
    model: "x",
    inputRatio: null,
    outputRatio: null,
    perCallPrice: 0.04,
  };
  assert.equal(rowPriceUsdPerMillion(row), null);
});

const okRow: ModelPricingRow = { model: "a", inputRatio: 1, outputRatio: 2, perCallPrice: null };

test("accepts a well-formed row", () => {
  assert.equal(validatePricingRow(okRow), null);
});

test("accepts a per-call-only row", () => {
  assert.equal(
    validatePricingRow({ model: "a", inputRatio: null, outputRatio: null, perCallPrice: 0.04 }),
    null,
  );
});

test("rejects a blank model name", () => {
  assert.equal(validatePricingRow({ ...okRow, model: " " }), "模型名不能为空");
});

test("rejects negative values", () => {
  assert.equal(validatePricingRow({ ...okRow, inputRatio: -1 }), "输入倍率不能为负数");
  assert.equal(validatePricingRow({ ...okRow, outputRatio: -1 }), "输出倍率不能为负数");
  assert.equal(validatePricingRow({ ...okRow, perCallPrice: -1 }), "按次单价不能为负数");
});

test("rejects NaN", () => {
  assert.equal(validatePricingRow({ ...okRow, inputRatio: NaN }), "输入倍率必须是数字");
});

test("requires either an input ratio or a per-call price", () => {
  assert.equal(
    validatePricingRow({ model: "a", inputRatio: null, outputRatio: 2, perCallPrice: null }),
    "请至少填写输入倍率或按次单价",
  );
});

test("allows zero as a free-tier price", () => {
  assert.equal(validatePricingRow({ ...okRow, inputRatio: 0 }), null);
});
