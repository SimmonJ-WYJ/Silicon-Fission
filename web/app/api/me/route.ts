import { NextResponse } from "next/server";
import { getSessionToken, napiFetch, QUOTA_PER_USD } from "@/lib/newapi-server";

interface SelfData {
  id: number;
  username: string;
  display_name: string;
  quota: number;
  used_quota?: number;
  group: string;
}

export async function GET() {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  const { body } = await napiFetch<SelfData>("/api/user/self", {}, token).catch(() => ({
    status: 502,
    body: { success: false, message: "无法连接 new-api 后端" } as const,
  }));
  if (!body.success || !body.data) {
    return NextResponse.json({ success: false, message: body.message || "会话已过期,请重新登录" }, { status: 401 });
  }
  const u = body.data;
  return NextResponse.json({
    success: true,
    data: {
      id: u.id,
      username: u.username,
      displayName: u.display_name || u.username,
      group: u.group,
      quota: u.quota,
      balanceUsd: Number((u.quota / QUOTA_PER_USD).toFixed(4)),
    },
  });
}
