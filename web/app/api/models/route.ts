import { NextResponse } from "next/server";
import { getSessionToken, napiFetch } from "@/lib/newapi-server";
import { isDemo, demoUser, DEMO_MODELS } from "@/lib/demo";

export async function GET() {
  if (isDemo()) {
    const user = await demoUser();
    if (!user) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
    return NextResponse.json({ success: true, data: DEMO_MODELS });
  }

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
