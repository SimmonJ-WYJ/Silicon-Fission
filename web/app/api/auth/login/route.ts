import { NextResponse } from "next/server";
import { napiFetch, readUpstreamRefreshCookie, REFRESH_COOKIE, SESSION_COOKIE_OPTIONS, TOKEN_COOKIE } from "@/lib/newapi-server";
import { isDemo, DEMO_COOKIE, DEMO_USER_COOKIE, COOKIE_OPTS } from "@/lib/demo";

interface LoginData {
  access_token: string;
  access_expires_at: number;
}

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}));
  if (!username || !password) {
    return NextResponse.json({ success: false, message: "缺少用户名或密码" }, { status: 400 });
  }

  // 演示模式:任意用户名密码即可登录,数据为示例
  if (isDemo()) {
    const res = NextResponse.json({ success: true, demo: true });
    res.cookies.set(DEMO_COOKIE, "1", COOKIE_OPTS);
    res.cookies.set(DEMO_USER_COOKIE, String(username).slice(0, 40), COOKIE_OPTS);
    return res;
  }

  const { body, headers } = await napiFetch<LoginData>("/api/user/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  }).catch(() => ({ status: 502, headers: new Headers(), body: { success: false, message: "无法连接 new-api 后端,请确认 NEWAPI_BASE 配置且服务已启动" } as const }));

  if (!body.success || !body.data?.access_token) {
    return NextResponse.json(
      { success: false, message: body.message || "用户名或密码错误" },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(TOKEN_COOKIE, body.data.access_token, SESSION_COOKIE_OPTIONS);
  const refreshToken = readUpstreamRefreshCookie(headers);
  if (refreshToken) res.cookies.set(REFRESH_COOKIE, refreshToken, SESSION_COOKIE_OPTIONS);
  return res;
}
