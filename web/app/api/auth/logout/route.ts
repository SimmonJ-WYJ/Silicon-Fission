import { NextResponse } from "next/server";
import { TOKEN_COOKIE } from "@/lib/newapi-server";
import { DEMO_COOKIE, DEMO_USER_COOKIE } from "@/lib/demo";

export async function POST() {
  const res = NextResponse.json({ success: true });
  for (const c of [TOKEN_COOKIE, DEMO_COOKIE, DEMO_USER_COOKIE]) {
    res.cookies.set(c, "", { httpOnly: true, path: "/", maxAge: 0 });
  }
  return res;
}
