import { NextResponse } from "next/server";
import { getSessionToken, napiFetch, QUOTA_PER_USD } from "@/lib/newapi-server";
import { isDemo, demoUser } from "@/lib/demo";

interface NapiUser {
  id: number;
  username: string;
  display_name: string;
  role: number; // 1 common, 10 admin, 100 root
  status: number; // 1 enabled, 2 disabled
  email: string;
  quota: number;
  used_quota: number;
  group: string;
  created_time?: number;
}

const ROLE_LABEL: Record<number, string> = { 1: "普通用户", 10: "管理员", 100: "超级管理员" };

function shape(u: NapiUser) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name || u.username,
    role: u.role,
    roleLabel: ROLE_LABEL[u.role] ?? `role${u.role}`,
    isAdmin: u.role >= 10,
    enabled: u.status === 1,
    email: u.email || "",
    group: u.group,
    balanceUsd: Number((u.quota / QUOTA_PER_USD).toFixed(4)),
    usedUsd: Number((u.used_quota / QUOTA_PER_USD).toFixed(4)),
  };
}

export async function GET() {
  if (isDemo()) {
    const who = await demoUser();
    if (!who) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
    return NextResponse.json({
      success: true,
      data: [
        shape({ id: 1, username: who, display_name: "Root User", role: 100, status: 1, email: "", quota: 2_500_000, used_quota: 0, group: "default" }),
        shape({ id: 2, username: "demo_user", display_name: "示例用户", role: 1, status: 1, email: "user@example.com", quota: 500_000, used_quota: 120_000, group: "default" }),
      ],
    });
  }

  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  const { body } = await napiFetch<{ items: NapiUser[] } | NapiUser[]>(
    "/api/user/?p=1&page_size=100",
    {},
    token,
  ).catch(() => ({ status: 502, body: { success: false, message: "无法连接后端" } as const }));

  if (!body.success || !body.data) {
    return NextResponse.json(
      { success: false, message: body.message || "获取失败(需要管理员账号)" },
      { status: 403 },
    );
  }
  const items = Array.isArray(body.data) ? body.data : body.data.items ?? [];
  return NextResponse.json({ success: true, data: items.map(shape) });
}
