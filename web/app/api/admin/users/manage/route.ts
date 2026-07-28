import { NextResponse } from "next/server";
import { getSessionToken, napiFetch } from "@/lib/newapi-server";
import { isDemo } from "@/lib/demo";

const ALLOWED = new Set(["promote", "demote", "enable", "disable", "delete"]);

export async function POST(req: Request) {
  const { id, action } = await req.json().catch(() => ({}));
  if (typeof id !== "number" || !ALLOWED.has(action)) {
    return NextResponse.json({ success: false, message: "参数不合法" }, { status: 400 });
  }

  if (isDemo()) {
    return NextResponse.json({ success: true, demo: true, message: "演示模式:操作不会真正生效" });
  }

  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  const { body } = await napiFetch(
    "/api/user/manage",
    { method: "POST", body: JSON.stringify({ id, action }) },
    token,
  ).catch(() => ({ status: 502, body: { success: false, message: "无法连接后端" } as const }));

  if (!body.success) {
    return NextResponse.json({ success: false, message: body.message || "操作失败" }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
