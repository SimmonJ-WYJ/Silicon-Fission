import { NextResponse } from "next/server";
import { getSessionToken, napiFetch, QUOTA_PER_USD } from "@/lib/newapi-server";
import { isDemo, demoUser } from "@/lib/demo";

interface SelfData {
  id: number;
  username: string;
  display_name: string;
  quota: number;
  used_quota?: number;
  group: string;
}

export async function GET() {
  if (isDemo()) {
    const user = await demoUser();
    if (!user) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
    return NextResponse.json({
      success: true,
      data: {
        id: 0,
        username: user,
        displayName: user,
        group: "demo",
        quota: 2_500_000,
        balanceUsd: 5,
      },
    });
  }

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

// 修改自己的账号:用户名 / 显示名 / 密码
export async function PUT(req: Request) {
  const input = (await req.json().catch(() => ({}))) as {
    username?: string;
    displayName?: string;
    password?: string;
  };

  const username = typeof input.username === "string" ? input.username.trim() : "";
  const displayName = typeof input.displayName === "string" ? input.displayName.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (username && username.length < 3) {
    return NextResponse.json({ success: false, message: "用户名至少 3 个字符" }, { status: 400 });
  }
  if (password && password.length < 8) {
    return NextResponse.json({ success: false, message: "密码至少 8 位" }, { status: 400 });
  }
  if (!username && !displayName && !password) {
    return NextResponse.json({ success: false, message: "没有需要修改的内容" }, { status: 400 });
  }

  if (isDemo()) {
    const user = await demoUser();
    if (!user) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
    return NextResponse.json({ success: true, demo: true, message: "演示模式:修改不会真正保存" });
  }

  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  // new-api 的 PUT /api/user/self 需要在原有资料基础上提交要更新的字段
  const { body: cur } = await napiFetch<SelfData>("/api/user/self", {}, token).catch(() => ({
    status: 502,
    body: { success: false, message: "无法连接 new-api 后端" } as const,
  }));
  if (!cur.success || !cur.data) {
    return NextResponse.json({ success: false, message: cur.message || "会话已过期,请重新登录" }, { status: 401 });
  }

  const payload: Record<string, unknown> = {
    username: username || cur.data.username,
    display_name: displayName || cur.data.display_name,
  };
  if (password) payload.password = password;

  const { body } = await napiFetch(
    "/api/user/self",
    { method: "PUT", body: JSON.stringify(payload) },
    token,
  ).catch(() => ({ status: 502, body: { success: false, message: "无法连接后端" } as const }));

  if (!body.success) {
    return NextResponse.json({ success: false, message: body.message || "修改失败" }, { status: 400 });
  }
  return NextResponse.json({ success: true, message: "修改成功" });
}
