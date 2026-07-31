import { NextResponse } from "next/server";

import { demoUser, isDemo } from "@/lib/demo";
import { getSessionToken, napiFetch } from "@/lib/newapi-server";
import { SYSTEM_SETTING_DEFINITIONS, toSystemSettings, validateSettingUpdate } from "@/lib/system-settings";

interface NapiOption {
  key: string;
  value: string;
}

const DEMO_OPTIONS = SYSTEM_SETTING_DEFINITIONS.map((item) => ({
  key: item.key,
  value: item.kind === "boolean" ? "true" : item.key === "RetryTimes" ? "2" : "0",
}));

export async function GET() {
  if (isDemo()) {
    if (!(await demoUser())) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
    return NextResponse.json({ success: true, data: toSystemSettings(DEMO_OPTIONS) });
  }

  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
  const { status, body } = await napiFetch<NapiOption[]>("/api/option/", {}, token).catch(() => ({
    status: 502,
    body: { success: false, message: "无法连接 New API 后端" } as const,
  }));
  if (!body.success || !Array.isArray(body.data)) {
    return NextResponse.json(
      { success: false, message: body.message || "获取系统设置失败，需要超级管理员账号" },
      { status: status === 401 ? 401 : status === 403 ? 403 : 502 },
    );
  }
  return NextResponse.json({ success: true, data: toSystemSettings(body.data) });
}

export async function PUT(req: Request) {
  const payload = await req.json().catch(() => null);
  if (!Array.isArray(payload?.updates) || payload.updates.length === 0) {
    return NextResponse.json({ success: false, message: "缺少需要保存的设置" }, { status: 400 });
  }
  const updates = [];
  for (const input of payload.updates) {
    const result = validateSettingUpdate(input);
    if (!result.ok) return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    updates.push(result);
  }
  if (new Set(updates.map((item) => item.key)).size !== updates.length) {
    return NextResponse.json({ success: false, message: "设置项不能重复" }, { status: 400 });
  }

  if (isDemo()) {
    if (!(await demoUser())) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
    return NextResponse.json({ success: true, demo: true });
  }
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  for (const update of updates) {
    const { body } = await napiFetch(
      "/api/option/",
      { method: "PUT", body: JSON.stringify({ key: update.key, value: update.value }) },
      token,
    ).catch(() => ({ body: { success: false, message: "无法连接 New API 后端" } }));
    if (!body.success) {
      return NextResponse.json(
        { success: false, message: `保存 ${update.key} 失败：${body.message || "未知错误"}` },
        { status: 400 },
      );
    }
  }
  return NextResponse.json({ success: true });
}
