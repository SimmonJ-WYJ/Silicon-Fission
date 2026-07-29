import { NextResponse } from "next/server";

import {
  buildChannelUpdatePayload,
  deletionNameMatches,
  parseChannelId,
  parseDeletionConfirmation,
  parseChannelUpdate,
} from "@/lib/channel-mutations";
import {
  COOKIE_OPTS,
  DEMO_CH_COOKIE,
  demoChannels,
  demoUser,
  isDemo,
  type DemoChannel,
} from "@/lib/demo";
import { getSessionToken, napiFetch } from "@/lib/newapi-server";

type RouteContext = { params: Promise<{ id: string }> };

async function getChannelId(ctx: RouteContext): Promise<number | null> {
  const { id } = await ctx.params;
  return parseChannelId(id);
}

export async function PUT(req: Request, ctx: RouteContext) {
  const id = await getChannelId(ctx);
  if (!id) {
    return NextResponse.json({ success: false, message: "非法 ID" }, { status: 400 });
  }

  const parsed = parseChannelUpdate(await req.json().catch(() => null));
  if ("error" in parsed) {
    return NextResponse.json({ success: false, message: parsed.error }, { status: 400 });
  }
  const input = parsed.value;

  if (isDemo()) {
    const user = await demoUser();
    if (!user) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
    const channels = await demoChannels();
    const existing = channels.find((channel) => channel.id === id);
    if (!existing) {
      return NextResponse.json({ success: false, message: "渠道不存在" }, { status: 404 });
    }
    const next: DemoChannel[] = channels.map((channel) =>
      channel.id === id
        ? {
            ...channel,
            name: input.name,
            baseUrl: input.baseUrl,
            models: input.models,
            enabled: input.enabled,
          }
        : channel,
    );
    const res = NextResponse.json({ success: true });
    res.cookies.set(DEMO_CH_COOKIE, JSON.stringify(next), COOKIE_OPTS);
    return res;
  }

  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  try {
    const current = await napiFetch<Record<string, unknown>>(`/api/channel/${id}`, {}, token);
    if (!current.body.success || !current.body.data) {
      return NextResponse.json(
        { success: false, message: current.body.message || "渠道不存在" },
        { status: current.status === 404 ? 404 : 400 },
      );
    }
    const wasEnabled = current.body.data.status === 1;
    const payload = buildChannelUpdatePayload(current.body.data, id, input);
    const updated = await napiFetch(
      "/api/channel/",
      { method: "PUT", body: JSON.stringify(payload) },
      token,
    );
    if (!updated.body.success) {
      return NextResponse.json(
        { success: false, message: updated.body.message || "更新渠道失败" },
        { status: 400 },
      );
    }

    if (wasEnabled !== input.enabled) {
      const statusResult = await napiFetch(
        `/api/channel/${id}/status`,
        {
          method: "POST",
          body: JSON.stringify({ status: input.enabled ? 1 : 2 }),
        },
        token,
      );
      if (!statusResult.body.success) {
        return NextResponse.json(
          {
            success: false,
            message: `参数已更新，但状态更新失败：${statusResult.body.message || "未知错误"}`,
          },
          { status: 409 },
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "无法连接 new-api 后端" }, { status: 502 });
  }
}

export async function DELETE(req: Request, ctx: RouteContext) {
  const id = await getChannelId(ctx);
  if (!id) {
    return NextResponse.json({ success: false, message: "非法 ID" }, { status: 400 });
  }
  const confirmName = parseDeletionConfirmation(await req.json().catch(() => null));

  if (isDemo()) {
    const user = await demoUser();
    if (!user) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
    const channels = await demoChannels();
    const existing = channels.find((channel) => channel.id === id);
    if (!existing) {
      return NextResponse.json({ success: false, message: "渠道不存在" }, { status: 404 });
    }
    if (!deletionNameMatches(existing.name, confirmName)) {
      return NextResponse.json({ success: false, message: "渠道名称确认不匹配" }, { status: 400 });
    }
    const res = NextResponse.json({ success: true });
    res.cookies.set(
      DEMO_CH_COOKIE,
      JSON.stringify(channels.filter((channel) => channel.id !== id)),
      COOKIE_OPTS,
    );
    return res;
  }

  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  try {
    const current = await napiFetch<Record<string, unknown>>(`/api/channel/${id}`, {}, token);
    if (!current.body.success || !current.body.data) {
      return NextResponse.json(
        { success: false, message: current.body.message || "渠道不存在" },
        { status: current.status === 404 ? 404 : 400 },
      );
    }
    const existingName = typeof current.body.data.name === "string" ? current.body.data.name : "";
    if (!deletionNameMatches(existingName, confirmName)) {
      return NextResponse.json({ success: false, message: "渠道名称确认不匹配" }, { status: 400 });
    }
    const deleted = await napiFetch(`/api/channel/${id}`, { method: "DELETE" }, token);
    if (!deleted.body.success) {
      return NextResponse.json(
        { success: false, message: deleted.body.message || "删除渠道失败" },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "无法连接 new-api 后端" }, { status: 502 });
  }
}
