export type ConsoleNavIcon =
  | "overview"
  | "key"
  | "models"
  | "chat"
  | "docs"
  | "credits"
  | "settings"
  | "channels"
  | "pricing";

export interface ConsoleNavItem {
  id: string;
  label: string;
  href: string;
  icon: ConsoleNavIcon;
}

export interface ConsoleNavSection {
  id: "workspace" | "account" | "administration";
  label: string;
  adminOnly?: boolean;
  items: ConsoleNavItem[];
}

export const CONSOLE_NAV_SECTIONS: ConsoleNavSection[] = [
  {
    id: "workspace",
    label: "工作区",
    items: [
      { id: "overview", label: "概览", href: "/dashboard", icon: "overview" },
      { id: "api-keys", label: "API Keys", href: "/dashboard#api-keys", icon: "key" },
      { id: "models", label: "模型", href: "/models", icon: "models" },
      { id: "chat", label: "对话测试", href: "/chat", icon: "chat" },
      { id: "docs", label: "接口文档", href: "/docs", icon: "docs" },
    ],
  },
  {
    id: "account",
    label: "账户",
    items: [
      { id: "credits", label: "充值与余额", href: "/topup", icon: "credits" },
      { id: "settings", label: "账号设置", href: "/settings", icon: "settings" },
    ],
  },
  {
    id: "administration",
    label: "管理",
    adminOnly: true,
    items: [
      { id: "channels", label: "渠道配置", href: "/admin", icon: "channels" },
      { id: "pricing", label: "倍率配置", href: "/admin/pricing", icon: "pricing" },
    ],
  },
];

export function visibleConsoleSections(isAdmin: boolean): ConsoleNavSection[] {
  return CONSOLE_NAV_SECTIONS.filter((section) => !section.adminOnly || isAdmin);
}

export function isConsoleItemActive(
  item: ConsoleNavItem,
  pathname: string,
  hash: string,
): boolean {
  const normalizedHash = hash && !hash.startsWith("#") ? `#${hash}` : hash;
  if (item.id === "overview") return pathname === "/dashboard" && normalizedHash !== "#api-keys";
  if (item.id === "api-keys") return pathname === "/dashboard" && normalizedHash === "#api-keys";
  return pathname === item.href;
}
