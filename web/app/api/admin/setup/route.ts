import { NextResponse } from "next/server";
import { napiFetch } from "@/lib/newapi-server";
import { isDemo } from "@/lib/demo";

export async function GET() {
  if (isDemo()) {
    return NextResponse.json({ success: true, data: { initialized: true }, demo: true });
  }
  try {
    const { body } = await napiFetch<{ status: boolean; root_init?: boolean }>("/api/setup");
    return NextResponse.json({
      success: true,
      data: { initialized: Boolean((body.data as { status?: boolean })?.status) },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "无法连接 new-api 后端", offline: true },
      { status: 502 },
    );
  }
}

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}));
  if (!username || !password || password.length < 8) {
    return NextResponse.json({ success: false, message: "用户名必填,密码至少 8 位" }, { status: 400 });
  }
  if (isDemo()) {
    return NextResponse.json({ success: true, demo: true });
  }
  try {
    const { body } = await napiFetch("/api/setup", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
        confirmPassword: password,
        SelfUseModeEnabled: true,
        DemoSiteEnabled: false,
      }),
    });
    if (!body.success) {
      return NextResponse.json({ success: false, message: body.message || "初始化失败" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "无法连接 new-api 后端" }, { status: 502 });
  }
}
