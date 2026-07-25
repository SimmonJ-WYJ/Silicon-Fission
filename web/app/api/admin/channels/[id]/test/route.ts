import { NextResponse } from "next/server";
import { getSessionToken, napiFetch } from "@/lib/newapi-server";
import { isDemo, demoUser } from "@/lib/demo";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ success: false, message: "非法 ID" }, { status: 400 });
  }

  if (isDemo()) {
    const user = await demoUser();
    if (!user) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
    return NextResponse.json({ success: true, message: "演示模式:示例渠道,连通正常(0.32s)" });
  }

  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
  try {
    const { body } = await napiFetch<{ time?: number }>(`/api/channel/test/${id}`, {}, token);
    return NextResponse.json({
      success: Boolean(body.success),
      message: body.success
        ? `连通正常,耗时 ${((body as { time?: number }).time ?? 0).toFixed?.(2) ?? "?"}s`
        : body.message || "测试失败",
    });
  } catch {
    return NextResponse.json({ success: false, message: "无法连接 new-api 后端" }, { status: 502 });
  }
}
