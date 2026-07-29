import assert from "node:assert/strict";
import test from "node:test";

import {
  channelTypeForProtocol,
  parseChannelProtocol,
} from "./channel-protocol.ts";

test("defaults an omitted protocol to OpenAI", () => {
  assert.equal(parseChannelProtocol(undefined), "openai");
});

test("maps supported protocols to new-api channel types", () => {
  assert.equal(channelTypeForProtocol("openai"), 1);
  assert.equal(channelTypeForProtocol("anthropic"), 14);
});

test("rejects unknown channel protocols", () => {
  assert.equal(parseChannelProtocol("gemini"), null);
});
