import { Hono } from "hono";
import { registry } from "../registry.js";

export const models = new Hono();

// OpenAI 兼容的 /v1/models,附加价格与供应商信息
models.get("/", (c) =>
  c.json({
    object: "list",
    data: registry.map((m) => ({
      id: m.id,
      object: "model",
      name: m.name,
      context_length: Math.max(...m.endpoints.map((e) => e.contextLength)),
      pricing: {
        // 展示最优价(路由默认命中价),单位:USD / 1M tokens
        input: Math.min(...m.endpoints.map((e) => e.inputPrice)),
        output: Math.min(...m.endpoints.map((e) => e.outputPrice)),
      },
      providers: m.endpoints.map((e) => e.provider),
    })),
  }),
);
