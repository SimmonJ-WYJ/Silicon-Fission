import Link from "next/link";
import { NavAuth } from "./nav-auth";

const LINKS = [
  { href: "/models", label: "模型" },
  { href: "/chat", label: "对话" },
  { href: "/rankings", label: "榜单" },
  { href: "/docs", label: "文档" },
  { href: "/dashboard", label: "控制台" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border-soft)] bg-[var(--color-bg)]/80 backdrop-blur">
      <div className="flex h-14 w-full items-center gap-6 px-4 sm:px-6 lg:px-14">
        <Link href="/" className="flex shrink-0 items-center" aria-label="SiliconFission 首页">
          <img src="/brand/siliconfission-mark.svg" alt="SiliconFission" className="h-7 w-auto sm:hidden" />
          <img src="/brand/siliconfission-logo.svg" alt="SiliconFission" className="hidden h-7 w-auto sm:block" />
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
          <NavAuth />
        </div>
      </div>
    </header>
  );
}
