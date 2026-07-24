import { Hono } from "hono";
import { route, RouteError } from "../router.js";
import type { ChatRequest } from "../providers/types.js";

export const chat = new Hono();

chat.post("/completions", async (c) => {
  let body: ChatRequest;
  try {
    body = await c.req.json<ChatRequest>();
  } catch {
    return c.json({ error: { message: "Invalid JSON body", type: "invalid_request_error" } }, 400);
  }
  if (!body.model || !Array.isArray(body.messages)) {
    return c.json(
      { error: { message: "`model` and `messages` are required", type: "invalid_request_error" } },
      400,
    );
  }

  try {
    const { response, provider, model, attempts } = await route(body);

    // 透明路由:让调用方知道请求实际由谁服务、经过了哪些重试
    const headers = new Headers(response.headers);
    headers.set("x-sf-provider", provider);
    headers.set("x-sf-model", model);
    headers.set("x-sf-attempts", JSON.stringify(attempts));
    headers.delete("content-length"); // 头已改动,长度交给运行时重新计算

    return new Response(response.body, { status: response.status, headers });
  } catch (err) {
    if (err instanceof RouteError) {
      return c.json(
        { error: { message: err.message, type: "routing_error", attempts: err.attempts } },
        err.status as 404 | 502 | 503,
      );
    }
    throw err;
  }
});
