import { NextResponse } from "next/server";
import { napiFetch } from "@/lib/newapi-server";

// GET: 后端初始化状态;POST: 初始化(创建 root 管理员,默认开启自用模式)
export async function GET() {
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
  try {
    const { body } = await napiFetch("/api/setup", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
        confirmPassword: password,
        SelfUseModeEnabled: true, // 自用模式:跳过逐模型定价,配好渠道即可调用
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
