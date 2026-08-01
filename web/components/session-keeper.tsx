"use client";

import { useEffect } from "react";

export function SessionKeeper() {
  useEffect(() => {
    const refresh = () => void fetch("/api/auth/refresh", { method: "POST" }).catch(() => undefined);
    refresh();
    const timer = window.setInterval(refresh, 10 * 60 * 1000);
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return null;
}
