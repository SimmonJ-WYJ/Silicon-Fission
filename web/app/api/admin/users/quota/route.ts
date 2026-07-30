import { NextResponse } from "next/server";

import { isDemo } from "@/lib/demo";
import { getSessionToken, napiFetch } from "@/lib/newapi-server";
import {
  parseQuotaAdjustment,
  toNewApiQuotaRequest,
} from "@/lib/quota-adjustment";

export async function POST(req: Request) {
  const input = await req.json().catch(() => null);
  const parsed = parseQuotaAdjustment(input);
  if (!parsed.ok) {
    return NextResponse.json(
      { success: false, message: parsed.message },
      { status: 400 },
    );
  }

  if (isDemo()) {
    return NextResponse.json({
      success: true,
      demo: true,
      message: "演示模式：额度调整不会真正生效",
    });
  }

  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
  }

  const payload = toNewApiQuotaRequest(parsed.value);
  const { status, body } = await napiFetch(
    "/api/user/manage",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  ).catch(() => ({
    status: 502,
    body: { success: false, message: "无法连接后端" } as const,
  }));

  if (!body.success) {
    return NextResponse.json(
      { success: false, message: body.message || "额度调整失败" },
      { status: status >= 400 ? status : 400 },
    );
  }

  const verb = parsed.value.action === "increase" ? "增加" : "扣减";
  return NextResponse.json({
    success: true,
    message: `已${verb} $${parsed.value.amount.toFixed(4)} 额度`,
  });
}
