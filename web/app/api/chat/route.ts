import { NextResponse } from "next/server";
import { NEWAPI_BASE } from "@/lib/newapi-server";

// Playground 的对话代理:用调用方提供的 sk- Key 打 new-api 的 OpenAI 兼容端点。
// 浏览器只知道本站地址,后端地址与拓扑不暴露。
export async function POST(req: Request) {
  const { model, messages, key } = await req.json().catch(() => ({}));
  if (!model || !Array.isArray(messages)) {
    return NextResponse.json({ error: { message: "`model` 和 `messages` 必填" } }, { status: 400 });
  }
  if (!key || typeof key !== "string" || !key.startsWith("sk-")) {
    return NextResponse.json(
      { error: { message: "请提供有效的 API Key(sk- 开头,可在控制台创建)" } },
      { status: 401 },
    );
  }

  try {
    const upstream = await fetch(`${NEWAPI_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages, stream: false }),
      cache: "no-store",
    });
    const data = await upstream.json().catch(() => null);
    if (!data) {
      return NextResponse.json(
        { error: { message: `后端返回异常 (HTTP ${upstream.status})` } },
        { status: 502 },
      );
    }
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { error: { message: "无法连接 new-api 后端,请确认服务已启动" } },
      { status: 502 },
    );
  }
}
