import assert from "node:assert/strict";
import test from "node:test";

import { toSystemSettings, validateSettingUpdate } from "./system-settings.ts";

test("maps New API option strings to typed settings", () => {
  const settings = toSystemSettings([
    { key: "RegisterEnabled", value: "true" },
    { key: "RetryTimes", value: "3" },
  ]);
  assert.equal(settings.find((item) => item.key === "RegisterEnabled")?.value, true);
  assert.equal(settings.find((item) => item.key === "RetryTimes")?.value, 3);
});

test("only permits known settings with the expected value type", () => {
  assert.deepEqual(validateSettingUpdate({ key: "RetryTimes", value: 2 }), {
    ok: true,
    key: "RetryTimes",
    value: 2,
  });
  assert.equal(validateSettingUpdate({ key: "RetryTimes", value: -1 }).ok, false);
  assert.equal(validateSettingUpdate({ key: "RegisterEnabled", value: "true" }).ok, false);
  assert.equal(validateSettingUpdate({ key: "Logo", value: "changed" }).ok, false);
});
