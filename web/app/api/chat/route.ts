import { NextResponse } from "next/server";
import { NEWAPI_BASE } from "@/lib/newapi-server";
import { isDemo } from "@/lib/demo";

export async function POST(req: Request) {
  const { model, messages, key } = await req.json().catch(() => ({}));
  if (!model || !Array.isArray(messages)) {
    return NextResponse.json({ error: { message: "`model` 和 `messages` 必填" } }, { status: 400 });
  }

  // 演示模式:返回固定回复,无需真实上游
  if (isDemo()) {
    const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    return NextResponse.json({
      id: "chatcmpl-demo",
      object: "chat.completion",
      model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: `【演示模式】你选择了模型「${model}」,并发送了:"${String(last).slice(0, 40)}"。\n\n这是内置的示例回复——界面链路已跑通。配置真实后端(设置 NEWAPI_BASE 并在渠道里接入上游模型)后,这里会返回模型的真实回答。`,
          },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 40, total_tokens: 50 },
    });
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
