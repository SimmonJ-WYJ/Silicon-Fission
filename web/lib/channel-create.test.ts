import assert from "node:assert/strict";
import test from "node:test";
import { parseChannelCreate } from "./channel-create.ts";

test("creates a native New API channel payload with advanced fields", () => {
  const parsed = parseChannelCreate({
    type: 33, name: "Bedrock", key: "ak|sk|us-east-1", models: "claude-sonnet",
    mode: "multi_to_single", multiKeyMode: "polling", group: "default,vip",
    priority: 10, weight: 20, modelMapping: '{"claude":"upstream"}', autoBan: true,
  });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.payload.mode, "multi_to_single");
  assert.equal(parsed.payload.multi_key_mode, "polling");
  assert.equal((parsed.payload.channel as Record<string, unknown>).type, 33);
  assert.equal((parsed.payload.channel as Record<string, unknown>).group, "default,vip");
});

test("rejects unknown channel types and malformed JSON", () => {
  assert.equal(parseChannelCreate({ type: 999, name: "x", key: "x", models: "x" }).ok, false);
  assert.equal(parseChannelCreate({ type: 1, name: "x", key: "x", models: "x", modelMapping: "{" }).ok, false);
});
