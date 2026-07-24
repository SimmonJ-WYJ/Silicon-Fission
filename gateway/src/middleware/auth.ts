import type { MiddlewareHandler } from "hono";
import { config } from "../config.js";

// M0:单一主 Key。M1 起替换为多 Key + 额度/限速校验(Redis)。
export const auth: MiddlewareHandler = async (c, next) => {
  const header = c.req.header("Authorization") ?? "";
  const key = header.replace(/^Bearer\s+/i, "");
  if (!key || key !== config.masterKey) {
    return c.json({ error: { message: "Invalid API key", type: "authentication_error" } }, 401);
  }
  await next();
};
