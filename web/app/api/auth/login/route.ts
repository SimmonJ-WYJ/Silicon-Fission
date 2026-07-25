import { NextResponse } from "next/server";
import { napiFetch, TOKEN_COOKIE } from "@/lib/newapi-server";

interface LoginData {
  access_token: string;
  access_expires_at: number;
}

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}));
  if (!username || !password) {
    return NextResponse.json({ success: false, message: "缺少用户名或密码" }, { status: 400 });
  }

  const { body } = await napiFetch<LoginData>("/api/user/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  }).catch(() => ({ status: 502, body: { success: false, message: "无法连接 new-api 后端,请确认 NEWAPI_BASE 配置且服务已启动" } as const }));

  if (!body.success || !body.data?.access_token) {
    return NextResponse.json(
      { success: false, message: body.message || "用户名或密码错误" },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ success: true });
  const maxAge = Math.max(60, (body.data.access_expires_at ?? 0) - Math.floor(Date.now() / 1000) - 10);
  res.cookies.set(TOKEN_COOKIE, body.data.access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return res;
}
