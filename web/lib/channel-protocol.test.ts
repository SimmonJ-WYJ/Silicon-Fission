import assert from "node:assert/strict";
import test from "node:test";

import {
  channelEndpointPreview,
  channelTypeForProtocol,
  normalizeChannelBaseUrl,
  parseChannelProtocol,
  protocolForChannelType,
  validateChannelBaseUrl,
} from "./channel-protocol.ts";

test("defaults an omitted protocol to OpenAI", () => {
  assert.equal(parseChannelProtocol(undefined), "openai");
});

test("maps supported protocols to new-api channel types", () => {
  assert.equal(channelTypeForProtocol("openai"), 1);
  assert.equal(channelTypeForProtocol("anthropic"), 14);
  assert.equal(channelTypeForProtocol("zhipu-v4"), 26);
  assert.equal(protocolForChannelType("26"), "zhipu-v4");
});

test("rejects unknown channel protocols", () => {
  assert.equal(parseChannelProtocol("gemini"), null);
});

test("builds the BigModel V4 endpoint from its root URL", () => {
  assert.equal(parseChannelProtocol("zhipu-v4"), "zhipu-v4");
  assert.equal(channelTypeForProtocol("zhipu-v4"), 26);
  assert.equal(
    normalizeChannelBaseUrl(" https://open.bigmodel.cn/ "),
    "https://open.bigmodel.cn",
  );
  assert.equal(
    channelEndpointPreview("zhipu-v4", "https://open.bigmodel.cn/"),
    "https://open.bigmodel.cn/api/paas/v4/chat/completions",
  );
  assert.equal(
    validateChannelBaseUrl("zhipu-v4", "https://open.bigmodel.cn/api/paas/v4"),
    "智谱 GLM / BigModel V4 请填写根地址 https://open.bigmodel.cn，不要填写 /api/paas/v4、/v1 或 /chat/completions。",
  );
});
