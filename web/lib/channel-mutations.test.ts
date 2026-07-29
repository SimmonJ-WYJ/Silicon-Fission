import assert from "node:assert/strict";
import test from "node:test";

import {
  buildChannelUpdatePayload,
  deletionNameMatches,
  parseChannelId,
  parseDeletionConfirmation,
  parseChannelUpdate,
} from "./channel-mutations.ts";

test("accepts only positive decimal channel IDs", () => {
  assert.equal(parseChannelId("42"), 42);
  for (const value of ["0", "-1", "1.2", "01", "abc", ""]) {
    assert.equal(parseChannelId(value), null);
  }
});

test("validates and trims editable channel fields", () => {
  assert.deepEqual(
    parseChannelUpdate({
      name: "  BananaRouter-Kimi  ",
      baseUrl: " https://api.bananarouter.com ",
      models: " kimi-k3 ",
      enabled: true,
      key: "  ",
    }),
    {
      value: {
        name: "BananaRouter-Kimi",
        baseUrl: "https://api.bananarouter.com",
        models: "kimi-k3",
        enabled: true,
        key: "",
      },
    },
  );
});

test("rejects missing fields and invalid enabled state", () => {
  assert.deepEqual(
    parseChannelUpdate({ name: "", baseUrl: "", models: "kimi-k3", enabled: true }),
    { error: "渠道名称和模型均必填" },
  );
  assert.deepEqual(
    parseChannelUpdate({ name: "Kimi", baseUrl: "", models: "", enabled: true }),
    { error: "渠道名称和模型均必填" },
  );
  assert.deepEqual(
    parseChannelUpdate({ name: "Kimi", baseUrl: "", models: "kimi-k3", enabled: "true" }),
    { error: "渠道状态必须是布尔值" },
  );
});

test("builds an update payload that preserves configuration and omits blank keys", () => {
  const payload = buildChannelUpdatePayload(
    {
      id: 7,
      type: 14,
      name: "Old",
      base_url: "https://old.example.com",
      models: "claude-old",
      group: "default",
      priority: 20,
      status: 1,
      key: "masked-or-secret",
    },
    7,
    {
      name: "New",
      baseUrl: "https://new.example.com",
      models: "claude-new",
      enabled: false,
      key: "",
    },
  );

  assert.equal(payload.type, 14);
  assert.equal(payload.group, "default");
  assert.equal(payload.priority, 20);
  assert.equal(payload.name, "New");
  assert.equal(payload.base_url, "https://new.example.com");
  assert.equal(payload.models, "claude-new");
  assert.equal("status" in payload, false);
  assert.equal("key" in payload, false);
});

test("includes a non-blank replacement key", () => {
  const payload = buildChannelUpdatePayload(
    { id: 3, type: 1, status: 1 },
    3,
    { name: "GPT", baseUrl: "", models: "gpt-5.6-sol", enabled: true, key: "  sk-new  " },
  );

  assert.equal(payload.key, "sk-new");
});

test("requires an exact channel name to confirm deletion", () => {
  assert.equal(deletionNameMatches("BananaRouter-Kimi", "BananaRouter-Kimi"), true);
  assert.equal(deletionNameMatches("BananaRouter-Kimi", " bananarouter-kimi "), false);
  assert.equal(deletionNameMatches("BananaRouter-Kimi", null), false);
});

test("safely parses deletion confirmation bodies", () => {
  assert.equal(parseDeletionConfirmation({ confirmName: "BananaRouter-Kimi" }), "BananaRouter-Kimi");
  assert.equal(parseDeletionConfirmation(null), null);
  assert.equal(parseDeletionConfirmation("BananaRouter-Kimi"), null);
  assert.equal(parseDeletionConfirmation({ confirmName: 123 }), null);
});
