import Link from "next/link";

const LINKS = [
  { href: "/models", label: "模型" },
  { href: "/chat", label: "对话" },
  { href: "/rankings", label: "榜单" },
  { href: "/dashboard", label: "控制台" },
  { href: "/admin", label: "渠道配置" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border-soft)] bg-[var(--color-bg)]/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-2)] text-sm text-white">
            裂
          </span>
          <span className="hidden sm:inline">硅基裂变</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-sm text-[var(--color-muted)] transition hover:bg-[var(--color-panel)] hover:text-[var(--color-text)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1.5 text-sm text-[var(--color-muted)] lg:flex">
            <span>🔍</span>
            <span>搜索模型…</span>
            <kbd className="ml-6 rounded bg-[var(--color-panel-2)] px-1.5 text-xs">⌘K</kbd>
          </div>
          <Link
            href="/login"
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-panel)]"
          >
            登录
          </Link>
          <Link
            href="/topup"
            className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
          >
            充值
          </Link>
        </div>
      </div>
    </header>
  );
}
