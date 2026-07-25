import { NextResponse } from "next/server";
import { TOKEN_COOKIE } from "@/lib/newapi-server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(TOKEN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
