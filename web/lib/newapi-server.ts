// 服务端专用:new-api 后端代理助手。
// 仅在 Next.js API 路由(服务端)中使用,浏览器永远不直接接触 new-api 地址。
// 通过环境变量 NEWAPI_BASE 指向你的 new-api 实例,如 http://localhost:3000

import { cookies } from "next/headers";

export const NEWAPI_BASE = process.env.NEWAPI_BASE ?? "http://localhost:3000";

export const TOKEN_COOKIE = "sf_token";

/** new-api 的额度单位:500000 quota = 1 USD(QuotaPerUnit 默认值) */
export const QUOTA_PER_USD = 500_000;

export interface NapiResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

export async function napiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
  bearer?: string,
): Promise<{ status: number; body: NapiResult<T> }> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
  const res = await fetch(`${NEWAPI_BASE}${path}`, { ...init, headers, cache: "no-store" });
  let body: NapiResult<T>;
  try {
    body = (await res.json()) as NapiResult<T>;
  } catch {
    body = { success: false, message: `Upstream returned non-JSON (HTTP ${res.status})` };
  }
  return { status: res.status, body };
}

/** 从请求 cookie 里取出登录时保存的 access_token */
export async function getSessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(TOKEN_COOKIE)?.value ?? null;
}
