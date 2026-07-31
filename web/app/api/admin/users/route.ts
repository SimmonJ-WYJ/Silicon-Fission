import { NextResponse } from "next/server";
import { getSessionToken, napiFetch, QUOTA_PER_USD } from "@/lib/newapi-server";
import { isDemo, demoUser } from "@/lib/demo";
import {
  parseNewUser,
  parseUserSearchQuery,
  toNewApiCreateUserRequest,
  toNewApiUserPath,
} from "@/lib/user-admin";

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

export async function GET(req: Request) {
  const query = parseUserSearchQuery(new URL(req.url).searchParams);

  if (isDemo()) {
    const who = await demoUser();
    if (!who) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
    const all = [
      shape({ id: 1, username: who, display_name: "Root User", role: 100, status: 1, email: "", quota: 2_500_000, used_quota: 0, group: "default" }),
      shape({ id: 2, username: "demo_user", display_name: "示例用户", role: 1, status: 1, email: "user@example.com", quota: 500_000, used_quota: 120_000, group: "default" }),
      shape({ id: 3, username: "demo_admin", display_name: "示例管理员", role: 10, status: 1, email: "admin@example.com", quota: 1_000_000, used_quota: 40_000, group: "default" }),
      shape({ id: 4, username: "disabled_user", display_name: "已禁用用户", role: 1, status: 2, email: "", quota: 0, used_quota: 8_000, group: "default" }),
    ];
    // 演示模式下本地过滤,让筛选交互看起来是真的
    const keyword = query.keyword.toLowerCase();
    const filtered = all.filter(
      (u) =>
        (!keyword ||
          u.username.toLowerCase().includes(keyword) ||
          u.displayName.toLowerCase().includes(keyword)) &&
        (query.role === null || u.role === query.role) &&
        (query.status === null || u.enabled === (query.status === 1)),
    );
    return NextResponse.json({ success: true, data: filtered, total: filtered.length });
  }

  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  const { body } = await napiFetch<{ items: NapiUser[]; total?: number } | NapiUser[]>(
    toNewApiUserPath(query),
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
  const total = Array.isArray(body.data) ? items.length : body.data.total ?? items.length;
  return NextResponse.json({ success: true, data: items.map(shape), total });
}

export async function POST(req: Request) {
  const parsed = parseNewUser(await req.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ success: false, message: parsed.message }, { status: 400 });
  }

  if (isDemo()) {
    const who = await demoUser();
    if (!who) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
    return NextResponse.json({ success: true, demo: true, message: "演示模式:用户未真正创建" });
  }

  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  const { body } = await napiFetch(
    "/api/user/",
    { method: "POST", body: JSON.stringify(toNewApiCreateUserRequest(parsed.value)) },
    token,
  ).catch(() => ({ status: 502, body: { success: false, message: "无法连接后端" } as const }));

  if (!body.success) {
    return NextResponse.json(
      { success: false, message: body.message || "创建用户失败(需要管理员账号)" },
      { status: 400 },
    );
  }
  return NextResponse.json({ success: true });
}
