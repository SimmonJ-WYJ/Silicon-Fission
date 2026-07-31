import assert from "node:assert/strict";
import test from "node:test";

import {
  CONSOLE_NAV_SECTIONS,
  isConsoleItemActive,
  visibleConsoleSections,
} from "./console-navigation.ts";

test("exposes only implemented console destinations", () => {
  assert.deepEqual(
    CONSOLE_NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.href)),
    [
      "/dashboard",
      "/dashboard#api-keys",
      "/models",
      "/chat",
      "/docs",
      "/topup",
      "/settings",
      "/admin",
      "/admin/pricing",
      "/admin/users",
    ],
  );
});

test("hides administration from standard users", () => {
  assert.equal(
    visibleConsoleSections(false).some((section) => section.id === "administration"),
    false,
  );
  assert.equal(
    visibleConsoleSections(true).some((section) => section.id === "administration"),
    true,
  );
});

test("distinguishes overview from the API Keys hash", () => {
  const items = CONSOLE_NAV_SECTIONS.flatMap((section) => section.items);
  const overview = items.find((item) => item.id === "overview")!;
  const keys = items.find((item) => item.id === "api-keys")!;

  assert.equal(isConsoleItemActive(overview, "/dashboard", ""), true);
  assert.equal(isConsoleItemActive(overview, "/dashboard", "#api-keys"), false);
  assert.equal(isConsoleItemActive(keys, "/dashboard", "#api-keys"), true);
  assert.equal(isConsoleItemActive(keys, "/dashboard", "api-keys"), true);
});

test("uses exact route matching for other console pages", () => {
  const models = CONSOLE_NAV_SECTIONS.flatMap((section) => section.items).find(
    (item) => item.id === "models",
  )!;

  assert.equal(isConsoleItemActive(models, "/models", ""), true);
  assert.equal(isConsoleItemActive(models, "/chat", ""), false);
});
