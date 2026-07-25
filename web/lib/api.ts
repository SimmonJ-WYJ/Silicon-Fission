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

// ---- 账户与充值(mock,待后端就绪后替换为真实请求) ----

export interface AuthResult {
  ok: boolean;
  message: string;
}

/** 登录/注册。后端就绪后改为 POST /api/auth/login 等 */
export async function login(email: string, _password: string): Promise<AuthResult> {
  await new Promise((r) => setTimeout(r, 600)); // 模拟网络延迟
  return { ok: true, message: `欢迎回来,${email}(演示模式,后端未接入)` };
}

export async function register(email: string, _password: string): Promise<AuthResult> {
  await new Promise((r) => setTimeout(r, 600));
  return { ok: true, message: `账号 ${email} 注册成功(演示模式,后端未接入)` };
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
