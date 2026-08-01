import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  NEWAPI_BASE,
  readUpstreamRefreshCookie,
  REFRESH_COOKIE,
  SESSION_COOKIE_OPTIONS,
  TOKEN_COOKIE,
  UPSTREAM_REFRESH_COOKIE,
} from "@/lib/newapi-server";

interface RefreshData {
  access_token: string;
}

export async function POST() {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return NextResponse.json({ success: false, message: "登录已过期" }, { status: 401 });

  let upstream: Response;
  try {
    const origin = new URL(NEWAPI_BASE).origin;
    upstream = await fetch(`${NEWAPI_BASE}/api/user/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${UPSTREAM_REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}`,
        Origin: origin,
      },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ success: false, message: "无法刷新登录状态" }, { status: 502 });
  }
  const body = await upstream.json().catch(() => null) as { success?: boolean; message?: string; data?: RefreshData } | null;
  if (!upstream.ok || !body?.success || !body.data?.access_token) {
    const res = NextResponse.json({ success: false, message: body?.message || "登录已过期" }, { status: 401 });
    res.cookies.set(REFRESH_COOKIE, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
    res.cookies.set(TOKEN_COOKIE, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
    return res;
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(TOKEN_COOKIE, body.data.access_token, SESSION_COOKIE_OPTIONS);
  res.cookies.set(
    REFRESH_COOKIE,
    readUpstreamRefreshCookie(upstream.headers) ?? refreshToken,
    SESSION_COOKIE_OPTIONS,
  );
  return res;
}
