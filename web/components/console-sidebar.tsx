"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { fetchMe } from "@/lib/api";
import {
  isConsoleItemActive,
  type ConsoleNavIcon,
  visibleConsoleSections,
} from "@/lib/console-navigation";

function NavIcon({ name }: { name: ConsoleNavIcon }) {
  const paths: Record<ConsoleNavIcon, React.ReactNode> = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8m-3 3 3 3m-6 0 3 3" /></>,
    models: <><path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" /><path d="m4 12 8 4.5 8-4.5M4 16.5l8 4.5 8-4.5" /></>,
    chat: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" /><path d="M8 9h8M8 13h5" /></>,
    docs: <><path d="M5 3h10l4 4v14H5V3Z" /><path d="M14 3v5h5M8 12h8M8 16h8" /></>,
    credits: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    channels: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
    pricing: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    users: <><path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" /><circle cx="9.5" cy="7" r="3.5" /><path d="M17 11a3 3 0 1 0 0-6M21 19v-1a3.5 3.5 0 0 0-2.5-3.4" /></>,
    logs: <><path d="M4 5h16M4 10h16M4 15h10M4 20h7" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export function ConsoleSidebar() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeMobileMenu = useCallback((restoreFocus = true) => {
    setMobileOpen(false);
    if (restoreFocus) requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  useEffect(() => {
    let active = true;
    fetchMe()
      .then((me) => {
        if (active) setIsAdmin(Boolean(me?.isAdmin));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) closeMobileMenu(false);
    };
    desktop.addEventListener("change", closeAtDesktop);
    return () => desktop.removeEventListener("change", closeAtDesktop);
  }, [closeMobileMenu]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobileMenu();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMobileMenu, mobileOpen]);

  const navigation = (
    <nav aria-label="控制台导航" className="space-y-6 px-3 py-5">
      {visibleConsoleSections(isAdmin).map((section) => (
        <div key={section.id}>
          <div className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-faint)]">
            {section.label}
          </div>
          <div className="space-y-1">
            {section.items.map((item) => {
              const active = isConsoleItemActive(item, pathname, hash);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => closeMobileMenu(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? "bg-[var(--color-brand)]/10 font-medium text-[var(--color-brand)]"
                      : "text-[var(--color-muted)] hover:bg-[var(--color-panel)] hover:text-[var(--color-text)]"
                  }`}
                >
                  <NavIcon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-[var(--color-border-soft)] bg-[var(--color-bg)] md:block">
        <div className="border-b border-[var(--color-border-soft)] p-4">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm font-medium">
            默认工作区
          </div>
        </div>
        {navigation}
      </aside>

      <button
        ref={menuButtonRef}
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-expanded={mobileOpen}
        className="absolute left-4 top-3 z-30 flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm shadow-sm md:hidden"
      >
        <span aria-hidden="true">☰</span>
        控制台菜单
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" aria-label="关闭控制台导航" onClick={() => closeMobileMenu()} className="absolute inset-0 bg-black/35" tabIndex={-1} />
          <aside ref={drawerRef} role="dialog" aria-modal="true" aria-label="控制台导航" className="relative h-full w-[min(82vw,280px)] overflow-y-auto bg-[var(--color-bg)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] px-5 py-4">
              <span className="font-semibold">默认工作区</span>
              <button ref={closeButtonRef} type="button" onClick={() => closeMobileMenu()} aria-label="关闭" className="rounded-md px-2 py-1 text-xl text-[var(--color-muted)] hover:bg-[var(--color-panel)]">×</button>
            </div>
            {navigation}
          </aside>
        </div>
      )}
    </>
  );
}
