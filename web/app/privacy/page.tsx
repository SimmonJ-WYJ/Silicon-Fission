export const metadata = { title: "隐私政策 · 硅基裂变" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold">隐私政策</h1>
      <p className="mt-1 text-sm text-[var(--color-faint)]">最后更新:2026-07-28</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--color-muted)]">
        <section>
          <h2 className="mb-2 text-base font-medium text-[var(--color-text)]">1. 我们收集的信息</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>账号信息:注册时提供的用户名、邮箱等;</li>
            <li>计费信息:充值记录、消费明细、API Key 用量;</li>
            <li>技术信息:调用时间、模型、token 数、请求元数据(用于计费与风控)。</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-medium text-[var(--color-text)]">2. 关于对话内容</h2>
          <p>
            本平台默认<strong className="text-[var(--color-text)]">不存储</strong>你发送给模型的提示词(prompt)与模型返回的正文内容,
            仅记录用于计费和排障的元数据(如 token 数量、耗时)。你的请求会被转发给对应的上游模型供应商,
            其如何处理数据请以该供应商的隐私政策为准。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-medium text-[var(--color-text)]">3. 信息的使用</h2>
          <p>我们仅将上述信息用于:提供与维护服务、计费结算、安全风控、以及在你同意的前提下的必要通知。</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-medium text-[var(--color-text)]">4. 信息共享</h2>
          <p>
            除为完成模型调用而必须转发给上游供应商的请求数据外,我们不会向第三方出售或出租你的个人信息。
            法律法规要求或为保护平台及用户合法权益时,我们可能依法披露必要信息。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-medium text-[var(--color-text)]">5. 数据安全</h2>
          <p>
            我们采用传输加密(HTTPS)、密码哈希存储、API Key 脱敏等措施保护你的数据。但请理解,
            没有任何互联网传输或存储方式是绝对安全的。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-medium text-[var(--color-text)]">6. 你的权利</h2>
          <p>你有权查询、更正或删除你的账号信息。如需注销账号或行使相关权利,请通过下方方式联系我们。</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-medium text-[var(--color-text)]">7. 联系方式</h2>
          <p>隐私相关问题请联系:[请填写你的联系邮箱]。</p>
        </section>

        <p className="border-t border-[var(--color-border-soft)] pt-4 text-xs text-[var(--color-faint)]">
          注:本政策为通用模板,正式运营前建议由法律专业人士审核,并根据实际数据处理情况调整。
        </p>
      </div>

      <a href="/login" className="mt-8 inline-block text-sm text-[var(--color-brand-2)]">
        ← 返回登录
      </a>
    </div>
  );
}
