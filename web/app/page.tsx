import Link from "next/link";
import { getModels } from "@/lib/api";
import { ModelCard } from "@/components/model-card";
import { fmtTokens } from "@/lib/format";

const STATS = [
  { label: "可用模型", value: "80+" },
  { label: "上游供应商", value: "20+" },
  { label: "本周处理 Token", value: "1.2T" },
  { label: "平均可用性", value: "99.9%" },
];

export default async function Home() {
  const models = await getModels();
  const featured = models.slice(0, 6);
  const totalWeek = models.reduce((s, m) => s + m.tokensPerWeek, 0);

  return (
    <>
      {/* Hero */}
      <section className="hero-glow">
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-20 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
            一个接口,<span className="brand-gradient">裂变</span>所有大模型的算力
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--color-muted)]">
            OpenAI 兼容的统一入口,聚合国内外主流大模型。智能路由、自动容灾、人民币计费 ——
            换个 base URL 就能用。
          </p>

          <div className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-2">
            <span className="pl-2 text-[var(--color-faint)]">🔍</span>
            <input
              className="flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-[var(--color-faint)]"
              placeholder="搜索模型,如 Claude、GPT、DeepSeek…"
            />
            <Link
              href="/models"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              浏览模型
            </Link>
          </div>

          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-[var(--color-bg)] px-4 py-5">
                <div className="text-2xl font-semibold">{s.value}</div>
                <div className="mt-1 text-xs text-[var(--color-faint)]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured models */}
      <section className="mx-auto max-w-7xl px-6">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">热门模型</h2>
          <Link href="/models" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]">
            查看全部 →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((m) => (
            <ModelCard key={m.id} model={m} />
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-[var(--color-faint)]">
          本周全平台处理 {fmtTokens(totalWeek)} tokens(示例数据)
        </p>
      </section>

      {/* Code example */}
      <section className="mx-auto mt-20 max-w-7xl px-6">
        <div className="card overflow-hidden">
          <div className="grid gap-8 p-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold">和 OpenAI SDK 完全兼容</h2>
              <p className="mt-3 text-[var(--color-muted)]">
                无需改代码,只换 <code className="rounded bg-[var(--color-panel-2)] px-1">base_url</code> 和
                API Key。所有模型统一为 OpenAI 协议,内置跨供应商自动容灾。
              </p>
              <Link
                href="/dashboard"
                className="mt-6 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                获取 API Key
              </Link>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-[#16181d] p-5 text-sm leading-relaxed">
              <code className="font-mono text-gray-300">
{`from openai import OpenAI

client = OpenAI(
  base_url="https://api.siliconfission.com/v1",
  api_key="sk-sf-...",
)

resp = client.chat.completions.create(
  model="anthropic/claude-sonnet-4",
  messages=[{"role":"user","content":"你好"}],
)`}
              </code>
            </pre>
          </div>
        </div>
      </section>
    </>
  );
}
