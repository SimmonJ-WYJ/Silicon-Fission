import { NextResponse } from "next/server";
import { getSessionToken, napiFetch, QUOTA_PER_USD } from "@/lib/newapi-server";
import {
  isDemo,
  demoUser,
  demoKeys,
  fakeKey,
  DEMO_KEYS_COOKIE,
  COOKIE_OPTS,
  type DemoKey,
} from "@/lib/demo";

interface TokenItem {
  id: number;
  name: string;
  key: string;
  status: number;
  created_time: number;
  remain_quota: number;
  used_quota: number;
  unlimited_quota: boolean;
}

export async function GET() {
  if (isDemo()) {
    const user = await demoUser();
    if (!user) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
    const keys = await demoKeys();
    return NextResponse.json({
      success: true,
      data: keys.map((k) => ({
        id: k.id,
        name: k.name,
        maskedKey: `${fakeKey(k.id).slice(0, 12)}••••••••`,
        enabled: true,
        createdAt: k.createdAt,
        usedUsd: 0,
        remainUsd: null,
      })),
    });
  }

  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  const { body } = await napiFetch<{ items: TokenItem[]; total: number }>(
    "/api/token/?p=1&size=100",
    {},
    token,
  ).catch(() => ({ status: 502, body: { success: false, message: "无法连接 new-api 后端" } as const }));

  if (!body.success || !body.data) {
    return NextResponse.json({ success: false, message: body.message || "获取失败" }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    data: (body.data.items ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      // 只下发打码形式:洗掉 new-api 自带的 * 打码,统一用圆点。完整 key 仅创建时返回一次。
      maskedKey: `sk-${t.key.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6)}${"•".repeat(8)}`,
      enabled: t.status === 1,
      createdAt: new Date(t.created_time * 1000).toISOString().slice(0, 10),
      usedUsd: Number((t.used_quota / QUOTA_PER_USD).toFixed(4)),
      remainUsd: t.unlimited_quota ? null : Number((t.remain_quota / QUOTA_PER_USD).toFixed(4)),
    })),
  });
}

export async function POST(req: Request) {
  const { name } = await req.json().catch(() => ({}));
  if (!name || typeof name !== "string" || name.length > 50) {
    return NextResponse.json({ success: false, message: "请提供合法的 Key 名称(≤50 字符)" }, { status: 400 });
  }

  if (isDemo()) {
    const user = await demoUser();
    if (!user) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
    const keys = await demoKeys();
    const id = (keys.at(-1)?.id ?? 0) + 1;
    const next: DemoKey[] = [...keys, { id, name, createdAt: new Date().toISOString().slice(0, 10) }];
    const res = NextResponse.json({ success: true, key: fakeKey(id) });
    res.cookies.set(DEMO_KEYS_COOKIE, JSON.stringify(next), COOKIE_OPTS);
    return res;
  }

  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  const { body } = await napiFetch(
    "/api/token/",
    {
      method: "POST",
      body: JSON.stringify({ name, remain_quota: 0, unlimited_quota: true, expired_time: -1 }),
    },
    token,
  ).catch(() => ({ status: 502, body: { success: false, message: "无法连接 new-api 后端" } as const }));

  if (!body.success) {
    return NextResponse.json({ success: false, message: body.message || "创建失败" }, { status: 400 });
  }

  // new-api 创建接口不直接返回 key,且列表里的 key 是打码的。
  // 因此:先从列表定位刚建的这条拿到 id,再用专门的取 key 接口拿完整 key,一次性回给前端。
  const { body: list } = await napiFetch<{ items: TokenItem[] }>(
    "/api/token/?p=1&size=100",
    {},
    token,
  ).catch(() => ({ status: 502, body: { success: false } as const }));

  let fullKey: string | null = null;
  if (list.success && list.data) {
    const mine = (list.data.items ?? [])
      .filter((t) => t.name === name)
      .sort((a, b) => b.id - a.id)[0];
    if (mine?.id) {
      const { body: keyBody } = await napiFetch<{ key?: string } | string>(
        `/api/token/${mine.id}/key`,
        { method: "POST" },
        token,
      ).catch(() => ({ status: 502, body: { success: false } as const }));
      if (keyBody.success) {
        const raw = typeof keyBody.data === "string" ? keyBody.data : keyBody.data?.key;
        if (raw) fullKey = raw.startsWith("sk-") ? raw : `sk-${raw}`;
      }
    }
  }

  return NextResponse.json({ success: true, key: fullKey });
}
