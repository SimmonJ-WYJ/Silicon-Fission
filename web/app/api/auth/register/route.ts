import { NextResponse } from "next/server";
import { napiFetch } from "@/lib/newapi-server";

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}));
  if (!username || !password) {
    return NextResponse.json({ success: false, message: "缺少用户名或密码" }, { status: 400 });
  }
  const { body } = await napiFetch("/api/user/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  }).catch(() => ({ status: 502, body: { success: false, message: "无法连接 new-api 后端" } as const }));

  if (!body.success) {
    return NextResponse.json({ success: false, message: body.message || "注册失败" }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
