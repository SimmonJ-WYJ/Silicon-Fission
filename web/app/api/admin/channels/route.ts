import { NextResponse } from "next/server";
import { getSessionToken, napiFetch } from "@/lib/newapi-server";

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
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  const { name, baseUrl, key, models } = await req.json().catch(() => ({}));
  if (!name || !key || !models) {
    return NextResponse.json({ success: false, message: "名称、Key、模型均必填" }, { status: 400 });
  }

  try {
    const { body } = await napiFetch(
      "/api/channel/",
      {
        method: "POST",
        body: JSON.stringify({
          mode: "single",
          channel: {
            type: 1, // OpenAI 兼容(DeepSeek/SiliconFlow/Moonshot 等均适用,填对应 base_url)
            name,
            key,
            base_url: baseUrl || "",
            models,
            groups: ["default"],
            model_mapping: "",
            priority: 0,
          },
        }),
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
