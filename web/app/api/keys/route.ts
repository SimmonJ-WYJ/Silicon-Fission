import { NextResponse } from "next/server";
import { getSessionToken, napiFetch, QUOTA_PER_USD } from "@/lib/newapi-server";

interface TokenItem {
  id: number;
  name: string;
  key: string; // 打码后的 key
  status: number;
  created_time: number;
  remain_quota: number;
  used_quota: number;
  unlimited_quota: boolean;
}

export async function GET() {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  const { body } = await napiFetch<{ items: TokenItem[]; total: number }>(
    "/api/token/?p=1&size=100",
    {},
    token,
  ).catch(() => ({ status: 502, body: { success: false, message: "无法连接 new-api 后端" } as const }));

  if (!body.success || !body.data) {
    return NextResponse.json({ success: false, message: body.message || "获取失败" }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    data: (body.data.items ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      maskedKey: `sk-${t.key}`,
      enabled: t.status === 1,
      createdAt: new Date(t.created_time * 1000).toISOString().slice(0, 10),
      usedUsd: Number((t.used_quota / QUOTA_PER_USD).toFixed(4)),
      remainUsd: t.unlimited_quota ? null : Number((t.remain_quota / QUOTA_PER_USD).toFixed(4)),
    })),
  });
}

export async function POST(req: Request) {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  const { name } = await req.json().catch(() => ({}));
  if (!name || typeof name !== "string" || name.length > 50) {
    return NextResponse.json({ success: false, message: "请提供合法的 Key 名称(≤50 字符)" }, { status: 400 });
  }

  const { body } = await napiFetch(
    "/api/token/",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        remain_quota: 0,
        unlimited_quota: true, // 额度随账户余额,由账户统一扣费
        expired_time: -1,
      }),
    },
    token,
  ).catch(() => ({ status: 502, body: { success: false, message: "无法连接 new-api 后端" } as const }));

  if (!body.success) {
    return NextResponse.json({ success: false, message: body.message || "创建失败" }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
