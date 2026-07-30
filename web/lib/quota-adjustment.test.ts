import assert from "node:assert/strict";
import test from "node:test";

import {
  parseQuotaAdjustment,
  toNewApiQuotaRequest,
} from "./quota-adjustment.ts";

test("parses an increase and converts USD to New API quota", () => {
  const result = parseQuotaAdjustment({
    id: 7,
    action: "increase",
    amount: 10,
    remark: "  manual credit  ",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value, {
    id: 7,
    action: "increase",
    amount: 10,
    remark: "manual credit",
  });
  assert.deepEqual(toNewApiQuotaRequest(result.value), {
    id: 7,
    action: "add_quota",
    mode: "add",
    value: 5_000_000,
  });
});

test("maps decrease to New API subtract mode", () => {
  const result = parseQuotaAdjustment({ id: 8, action: "decrease", amount: 0.1234 });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(toNewApiQuotaRequest(result.value), {
    id: 8,
    action: "add_quota",
    mode: "subtract",
    value: 61_700,
  });
});

test("rejects malformed user IDs and actions", () => {
  for (const input of [
    { id: 0, action: "increase", amount: 1 },
    { id: -1, action: "increase", amount: 1 },
    { id: 1.5, action: "increase", amount: 1 },
    { id: "1", action: "increase", amount: 1 },
    { id: 1, action: "override", amount: 1 },
  ]) {
    assert.equal(parseQuotaAdjustment(input).ok, false);
  }
});

test("rejects invalid amounts and excessive precision", () => {
  for (const amount of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, 0.00001, "1"]) {
    assert.equal(parseQuotaAdjustment({ id: 1, action: "increase", amount }).ok, false);
  }
});

test("accepts an omitted remark and rejects invalid or overly long remarks", () => {
  const omitted = parseQuotaAdjustment({ id: 1, action: "increase", amount: 1 });
  assert.equal(omitted.ok, true);
  if (omitted.ok) assert.equal(omitted.value.remark, "");

  assert.equal(
    parseQuotaAdjustment({ id: 1, action: "increase", amount: 1, remark: 42 }).ok,
    false,
  );
  assert.equal(
    parseQuotaAdjustment({ id: 1, action: "increase", amount: 1, remark: "x".repeat(201) }).ok,
    false,
  );
});
