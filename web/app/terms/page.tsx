export const metadata = { title: "服务条款 · 硅基裂变" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold">服务条款</h1>
      <p className="mt-1 text-sm text-[var(--color-faint)]">最后更新:2026-07-28</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--color-muted)]">
        <section>
          <h2 className="mb-2 text-base font-medium text-[var(--color-text)]">1. 服务说明</h2>
          <p>
            硅基裂变(以下简称"本平台")是一个大模型 API 聚合网关,通过统一接口为用户转发调用第三方大语言模型。
            用户在本平台注册账号、充值额度、创建 API Key 后,即可按量调用平台接入的模型。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-medium text-[var(--color-text)]">2. 账号与安全</h2>
          <p>
            用户应妥善保管账号密码及 API Key。因用户自身原因导致 Key 泄露而产生的一切损失,由用户自行承担。
            用户不得将账号用于任何违法、侵权或违反第三方模型供应商使用条款的用途。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-medium text-[var(--color-text)]">3. 计费与充值</h2>
          <p>
            本平台采用预付费(Credits)模式,按实际调用量扣费。充值金额及扣费明细以平台控制台展示为准。
            除法律强制要求或平台另有说明外,已充值金额一般不予退款。价格与倍率可能随上游供应商调整而变动。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-medium text-[var(--color-text)]">4. 可接受使用</h2>
          <p>用户在使用本平台时,不得利用模型生成或传播以下内容:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>违反所在地法律法规的内容;</li>
            <li>侵犯他人知识产权、隐私或其他合法权益的内容;</li>
            <li>恶意、欺诈、垃圾信息或用于攻击他人系统的内容。</li>
          </ul>
          <p className="mt-2">平台有权对违规账号采取限制、暂停或终止服务的措施。</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-medium text-[var(--color-text)]">5. 服务可用性与免责</h2>
          <p>
            本平台依赖第三方上游模型供应商,可能因上游故障、限流或政策变更导致服务中断。
            平台按"现状"提供服务,在法律允许的最大范围内,不对因服务中断或模型输出内容造成的间接损失承担责任。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-medium text-[var(--color-text)]">6. 条款变更</h2>
          <p>本平台有权更新本条款,更新后将在本页公示。继续使用即视为接受更新后的条款。</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-medium text-[var(--color-text)]">7. 联系方式</h2>
          <p>如有疑问,请联系:[请填写你的联系邮箱]。</p>
        </section>

        <p className="border-t border-[var(--color-border-soft)] pt-4 text-xs text-[var(--color-faint)]">
          注:本条款为通用模板,正式对外运营前建议由法律专业人士审核,并补充你的公司主体、管辖地等信息。
        </p>
      </div>

      <a href="/login" className="mt-8 inline-block text-sm text-[var(--color-brand-2)]">
        ← 返回登录
      </a>
    </div>
  );
}
