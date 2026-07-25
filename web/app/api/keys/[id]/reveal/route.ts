import { NextResponse } from "next/server";
import { getSessionToken, napiFetch } from "@/lib/newapi-server";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ success: false, message: "非法 ID" }, { status: 400 });
  }

  const { body } = await napiFetch<{ key?: string } | string>(
    `/api/token/${id}/key`,
    { method: "POST" },
    token,
  ).catch(() => ({ status: 502, body: { success: false, message: "无法连接 new-api 后端" } as const }));

  if (!body.success) {
    return NextResponse.json({ success: false, message: body.message || "获取失败" }, { status: 400 });
  }
  const raw = typeof body.data === "string" ? body.data : body.data?.key;
  if (!raw) return NextResponse.json({ success: false, message: "后端未返回 Key" }, { status: 500 });
  return NextResponse.json({ success: true, data: { key: raw.startsWith("sk-") ? raw : `sk-${raw}` } });
}
