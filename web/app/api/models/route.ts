import { NextResponse } from "next/server";
import { getSessionToken, napiFetch } from "@/lib/newapi-server";

// 已登录:返回该用户可用的模型列表(来自 new-api /api/user/models)
// 未登录:返回 401,前端回落到静态目录展示
export async function GET() {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  const { body } = await napiFetch<string[]>("/api/user/models", {}, token).catch(() => ({
    status: 502,
    body: { success: false, message: "无法连接 new-api 后端" } as const,
  }));
  if (!body.success) {
    return NextResponse.json({ success: false, message: body.message || "获取失败" }, { status: 401 });
  }
  return NextResponse.json({ success: true, data: body.data ?? [] });
}
