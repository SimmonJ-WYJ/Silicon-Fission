import { NextResponse } from "next/server";
import { getSessionToken, napiFetch } from "@/lib/newapi-server";
import { parseChannelCreate } from "@/lib/channel-create";
import {
  isDemo,
  demoUser,
  demoChannels,
  DEMO_CH_COOKIE,
  COOKIE_OPTS,
  type DemoChannel,
} from "@/lib/demo";

interface ChannelItem {
  id: number;
  type: number;
  name: string;
  status: number;
  base_url: string;
  models: string;
  group: string;
  used_quota: number;
  response_time: number;
}

export async function GET() {
  if (isDemo()) {
    const user = await demoUser();
    if (!user) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
    return NextResponse.json({ success: true, data: await demoChannels() });
  }

  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  try {
    const { body } = await napiFetch<{ items: ChannelItem[] }>(
      "/api/channel/?p=1&page_size=100",
      {},
      token,
    );
    if (!body.success || !body.data) {
      return NextResponse.json(
        { success: false, message: body.message || "获取渠道失败(需要管理员账号)" },
        { status: 403 },
      );
    }
    return NextResponse.json({
      success: true,
      data: (body.data.items ?? []).map((c) => ({
        id: c.id,
        type: c.type,
        name: c.name,
        baseUrl: c.base_url,
        models: c.models,
        enabled: c.status === 1,
        usedQuota: c.used_quota,
        responseTimeMs: c.response_time,
      })),
    });
  } catch {
    return NextResponse.json({ success: false, message: "无法连接 new-api 后端" }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const parsed = parseChannelCreate(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ success: false, message: parsed.message }, { status: 400 });
  const channel = parsed.payload.channel as Record<string, unknown>;

  if (isDemo()) {
    const user = await demoUser();
    if (!user) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
    const list = await demoChannels();
    const id = (list.at(-1)?.id ?? 0) + 1;
    const next: DemoChannel[] = [
      ...list,
      {
        id,
        name: String(channel.name),
        baseUrl: String(channel.base_url || ""),
        models: String(channel.models),
        protocol: "openai",
        enabled: true,
        usedQuota: 0,
        responseTimeMs: 0,
      },
    ];
    const res = NextResponse.json({ success: true });
    res.cookies.set(DEMO_CH_COOKIE, JSON.stringify(next), COOKIE_OPTS);
    return res;
  }

  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  try {
    const { body } = await napiFetch(
      "/api/channel/",
      {
        method: "POST",
        body: JSON.stringify(parsed.payload),
      },
      token,
    );
    if (!body.success) {
      return NextResponse.json(
        { success: false, message: body.message || "创建渠道失败(需要管理员账号)" },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "无法连接 new-api 后端" }, { status: 502 });
  }
}
