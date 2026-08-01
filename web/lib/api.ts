// 后端对接层(seam)。当前返回 mock 数据;上线时把实现换成 fetch 真实后端即可,
// 页面组件不需要改动。
//
// 例(对接自研 gateway 或 new-api):
//   const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/v1/models`, {
//     headers: { Authorization: `Bearer ${key}` },
//   });

import { MODELS, type Model } from "./models";

export async function getModels(): Promise<Model[]> {
  return MODELS;
}

/** 网关地址,Chat Playground 直接打这个 OpenAI 兼容端点 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8788";

// ---- 账户(真实对接:走本站 /api/* 代理到 new-api 后端) ----

export interface AuthResult {
  ok: boolean;
  message: string;
}

export async function login(username: string, password: string): Promise<AuthResult> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok && body.success, message: body.message || (res.ok ? "登录成功" : "登录失败") };
}

export async function register(username: string, password: string): Promise<AuthResult> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok && body.success, message: body.message || (res.ok ? "注册成功,请登录" : "注册失败") };
}

export interface Me {
  id: number;
  username: string;
  displayName: string;
  group: string;
  quota: number;
  balanceUsd: number;
  role: number; // 1 普通 / 10 管理员 / 100 超级管理员
  isAdmin: boolean; // role >= 10
}

export interface ApiKeyItem {
  id: number;
  name: string;
  maskedKey: string;
  enabled: boolean;
  createdAt: string;
  usedUsd: number;
  remainUsd: number | null;
}

export async function fetchMe(): Promise<Me | null> {
  let res = await fetch("/api/me");
  if (res.status === 401) {
    const refreshed = await fetch("/api/auth/refresh", { method: "POST" });
    if (refreshed.ok) res = await fetch("/api/me");
  }
  if (!res.ok) return null;
  const body = await res.json();
  return body.success ? (body.data as Me) : null;
}

/** 修改自己的账号(用户名 / 显示名 / 密码)。留空的字段不改。 */
export async function updateSelf(input: {
  username?: string;
  displayName?: string;
  password?: string;
}): Promise<AuthResult> {
  const res = await fetch("/api/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok && body.success, message: body.message || (res.ok ? "修改成功" : "修改失败") };
}

export async function fetchKeys(): Promise<ApiKeyItem[] | null> {
  const res = await fetch("/api/keys");
  if (!res.ok) return null;
  const body = await res.json();
  return body.success ? (body.data as ApiKeyItem[]) : null;
}

/** 创建 Key。完整 key 仅在此处返回一次(res.key),之后无法再取,请提示用户立即保存。 */
export async function createKey(name: string): Promise<AuthResult & { key?: string | null }> {
  const res = await fetch("/api/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const body = await res.json().catch(() => ({}));
  return {
    ok: res.ok && body.success,
    message: body.message || (res.ok ? "创建成功" : "创建失败"),
    key: body.key ?? null,
  };
}

export async function fetchMyModels(): Promise<string[] | null> {
  const res = await fetch("/api/models");
  if (!res.ok) return null;
  const body = await res.json();
  return body.success ? (body.data as string[]) : null;
}

export interface TopupOrder {
  orderId: string;
  amountCny: number;
  credits: number;
  method: string;
}

/** 创建充值订单。后端就绪后改为 POST /api/billing/topup,返回支付二维码/跳转链接 */
export async function createTopupOrder(
  amountCny: number,
  method: string,
): Promise<TopupOrder> {
  await new Promise((r) => setTimeout(r, 600));
  const FX = 7.2; // 演示汇率:1 USD ≈ 7.2 CNY
  const FEE = 0.03; // 充值手续费 3%(见 SPEC)
  return {
    orderId: `SF${String(Math.floor(Math.random() * 1e10)).padStart(10, "0")}`,
    amountCny,
    credits: Number(((amountCny / FX) * (1 - FEE)).toFixed(2)),
    method,
  };
}
