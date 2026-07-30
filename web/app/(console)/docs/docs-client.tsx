"use client";

import { useState } from "react";

type Lang = "curl" | "python" | "node";

export function DocsClient() {
  const base = "https://api.siliconfission.com/v1";
  const anthropicBase = "https://api.siliconfission.com";
  const [lang, setLang] = useState<Lang>("python");
  const [copied, setCopied] = useState(false);

  const snippets: Record<Lang, string> = {
    curl: `curl ${base}/chat/completions \\
  -H "Authorization: Bearer $SF_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "你好,介绍一下你自己"}]
  }'`,
    python: `from openai import OpenAI

client = OpenAI(
    base_url="${base}",
    api_key="你的 sk- Key",
)

resp = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "你好,介绍一下你自己"}],
)
print(resp.choices[0].message.content)`,
    node: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${base}",
  apiKey: "你的 sk- Key",
});

const resp = await client.chat.completions.create({
  model: "deepseek-chat",
  messages: [{ role: "user", content: "你好,介绍一下你自己" }],
});
console.log(resp.choices[0].message.content);`,
  };

  const current = snippets[lang];

  function copy() {
    navigator.clipboard.writeText(current);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-8 space-y-10">
      <section className="card p-5 text-sm text-[var(--color-muted)]">
        <div className="font-medium text-[var(--color-text)]">先看清楚:两种接入方式</div>
        <ul className="mt-2 space-y-1.5">
          <li>
            · <span className="font-medium text-[var(--color-text)]">OpenAI 兼容接口</span>:
            base_url 用 <code className="rounded bg-[var(--color-panel-2)] px-1.5 py-0.5">{base}</code>。
          </li>
          <li>
            · <span className="font-medium text-[var(--color-text)]">Claude Code / Anthropic 兼容接入</span>:
            base_url 用 <code className="rounded bg-[var(--color-panel-2)] px-1.5 py-0.5">{anthropicBase}</code>,不带
            <code className="mx-1 rounded bg-[var(--color-panel-2)] px-1.5 py-0.5">/v1</code>。
          </li>
        </ul>
      </section>

      {/* Step 1 */}
      <section>
        <h2 className="text-lg font-semibold">第 1 步:获取本站 API Key</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          进入 <a href="/dashboard" className="text-[var(--color-brand-2)]">控制台</a>,点「新建 Key」创建一个
          sk- 开头的密钥,妥善保存(它等同于你的消费权限,请勿泄露)。无论是 OpenAI 兼容接口还是 Claude Code,
          都填写这个本站 Key。
        </p>
      </section>

      {/* Step 2 */}
      <section>
        <h2 className="text-lg font-semibold">第 2 步:按接入方式填写 base_url</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-[var(--color-border-soft)]">
                <td className="w-40 bg-[var(--color-panel)] px-4 py-3 font-medium">base_url</td>
                <td className="px-4 py-3 font-mono text-[var(--color-muted)]">{base}</td>
              </tr>
              <tr>
                <td className="bg-[var(--color-panel)] px-4 py-3 font-medium">api_key</td>
                <td className="px-4 py-3 font-mono text-[var(--color-muted)]">你的 sk- Key</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          上面这一组是给 OpenAI SDK 用的。Claude Code 终端/桌面端请看下面的单独说明。
        </p>
      </section>

      {/* Step 3: code */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">第 3 步:发起调用</h2>
          <div className="flex gap-1 rounded-lg bg-[var(--color-panel-2)] p-1 text-sm">
            {(["python", "node", "curl"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-md px-3 py-1 transition ${
                  lang === l
                    ? "bg-[var(--color-bg)] font-medium text-[var(--color-text)] shadow"
                    : "text-[var(--color-muted)]"
                }`}
              >
                {l === "python" ? "Python" : l === "node" ? "Node.js" : "cURL"}
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          <button
            onClick={copy}
            className="absolute right-3 top-3 rounded-md bg-[var(--color-panel-2)] px-2.5 py-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            {copied ? "已复制 ✓" : "复制"}
          </button>
          <pre className="overflow-x-auto rounded-xl bg-[#16181d] p-5 text-sm leading-relaxed">
            <code className="font-mono text-gray-300">{current}</code>
          </pre>
        </div>
      </section>

      {/* Endpoints */}
      <section>
        <h2 className="text-lg font-semibold">支持的接口</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">与 OpenAI 一致,常用端点:</p>
        <ul className="mt-3 space-y-1.5 text-sm text-[var(--color-muted)]">
          <li><code className="rounded bg-[var(--color-panel-2)] px-1.5 py-0.5">POST /v1/chat/completions</code> — 对话补全(支持 stream)</li>
          <li><code className="rounded bg-[var(--color-panel-2)] px-1.5 py-0.5">GET /v1/models</code> — 可用模型列表</li>
          <li><code className="rounded bg-[var(--color-panel-2)] px-1.5 py-0.5">POST /v1/embeddings</code> — 向量嵌入(取决于所配渠道)</li>
        </ul>
      </section>

      {/* Claude Code */}
      <section>
        <h2 className="text-lg font-semibold">Claude Code / Anthropic 接入</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-[var(--color-border-soft)]">
                <td className="w-40 bg-[var(--color-panel)] px-4 py-3 font-medium">ANTHROPIC_BASE_URL</td>
                <td className="px-4 py-3 font-mono text-[var(--color-muted)]">{anthropicBase}</td>
              </tr>
              <tr>
                <td className="bg-[var(--color-panel)] px-4 py-3 font-medium">ANTHROPIC_AUTH_TOKEN</td>
                <td className="px-4 py-3 font-mono text-[var(--color-muted)]">你的本站 sk- Key</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 rounded-xl bg-[var(--color-panel-2)] p-4 text-sm text-[var(--color-muted)]">
          <div className="font-medium text-[var(--color-text)]">关键规则</div>
          <ul className="mt-2 space-y-1.5">
            <li>· Claude Code 这类客户端不要填 `/v1`。</li>
            <li>· 这里只填域名根部,客户端会自己拼接消息路径。</li>
            <li>· 如果你看见 `v1`,那是 OpenAI 兼容文档,不是 Claude Code 文档。</li>
          </ul>
        </div>
      </section>

      {/* Model names */}
      <section>
        <h2 className="text-lg font-semibold">模型名怎么填</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          <code className="rounded bg-[var(--color-panel-2)] px-1.5 py-0.5">model</code> 字段填后台已接入的模型名,例如
          <code className="mx-1 rounded bg-[var(--color-panel-2)] px-1.5 py-0.5">deepseek-chat</code>、
          <code className="mx-1 rounded bg-[var(--color-panel-2)] px-1.5 py-0.5">deepseek-reasoner</code>。
          完整可用列表见 <a href="/models" className="text-[var(--color-brand-2)]">模型市场</a> 或调用 <code>/v1/models</code>。
        </p>
      </section>

      {/* Notes */}
      <section className="card p-5 text-sm text-[var(--color-muted)]">
        <div className="font-medium text-[var(--color-text)]">说明</div>
        <ul className="mt-2 space-y-1.5">
          <li>· 计费按实际 token 用量从账户余额扣除,可在控制台查看消费明细。</li>
          <li>· 请求经本站转发到上游模型,终端只需要填写本站的 base_url 和自己的 sk- Key。</li>
          <li>· 遇到 401 请检查 Key;余额不足会返回相应错误。</li>
        </ul>
      </section>
    </div>
  );
}
