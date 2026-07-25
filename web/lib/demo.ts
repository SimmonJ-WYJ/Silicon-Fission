// 演示模式:当未配置真实 new-api 后端时启用(如 Vercel 上未设 NEWAPI_BASE)。
// 用签名 cookie 承载会话与创建的 Key,serverless 无状态也能跑通全流程。
// 一旦 NEWAPI_BASE 指向真实后端,自动切回真实模式,页面无需改动。

import { cookies } from "next/headers";

export const DEMO_COOKIE = "sf_demo";
export const DEMO_USER_COOKIE = "sf_demo_user";
export const DEMO_KEYS_COOKIE = "sf_demo_keys";
export const DEMO_CH_COOKIE = "sf_demo_channels";

export function isDemo(): boolean {
  if (process.env.DEMO_MODE === "true") return true;
  if (process.env.DEMO_MODE === "false") return false;
  const base = process.env.NEWAPI_BASE;
  if (!base) return true; // 未配置后端 → 演示模式
  return /localhost|127\.0\.0\.1/.test(base);
}

export const DEMO_MODELS = ["gpt-4o", "claude-sonnet-4", "deepseek-chat", "gemini-2.5-pro"];

export interface DemoKey {
  id: number;
  name: string;
  createdAt: string;
}
export interface DemoChannel {
  id: number;
  name: string;
  baseUrl: string;
  models: string;
  enabled: boolean;
  usedQuota: number;
  responseTimeMs: number;
}

export const COOKIE_OPTS = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 86400 };

export async function demoUser(): Promise<string | null> {
  const jar = await cookies();
  if (jar.get(DEMO_COOKIE)?.value !== "1") return null;
  return jar.get(DEMO_USER_COOKIE)?.value ?? "demo";
}

export async function demoKeys(): Promise<DemoKey[]> {
  const jar = await cookies();
  const raw = jar.get(DEMO_KEYS_COOKIE)?.value;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DemoKey[];
  } catch {
    return [];
  }
}

const SEED_CHANNELS: DemoChannel[] = [
  {
    id: 1,
    name: "DeepSeek(示例)",
    baseUrl: "https://api.deepseek.com",
    models: "deepseek-chat,deepseek-reasoner",
    enabled: true,
    usedQuota: 0,
    responseTimeMs: 320,
  },
];

export async function demoChannels(): Promise<DemoChannel[]> {
  const jar = await cookies();
  const raw = jar.get(DEMO_CH_COOKIE)?.value;
  if (!raw) return SEED_CHANNELS;
  try {
    return JSON.parse(raw) as DemoChannel[];
  } catch {
    return SEED_CHANNELS;
  }
}

export function fakeKey(id: number): string {
  return `sk-demo-${String(id).padStart(4, "0")}-Xy9Kd2Lm8Qp4Rn6Tv3Bs7`;
}
