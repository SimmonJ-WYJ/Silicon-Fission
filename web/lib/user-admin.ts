// 管理员创建/筛选用户的校验层。
// 字段上限对齐 new-api 的 model.User validate 标签:
//   username max=20 / password min=8,max=20 / display_name max=20
// 角色取值对齐 common/constants.go:RoleCommonUser=1, RoleAdminUser=10。
// 不开放创建 root(100):new-api 侧也会以「不能创建同级或更高角色」拒绝。

export const USER_ROLE_COMMON = 1;
export const USER_ROLE_ADMIN = 10;
export const USER_ROLE_ROOT = 100;

const USERNAME_MAX = 20;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 20;
const DISPLAY_NAME_MAX = 20;

export type CreatableRole = typeof USER_ROLE_COMMON | typeof USER_ROLE_ADMIN;

export interface NewUser {
  username: string;
  password: string;
  displayName: string;
  role: CreatableRole;
}

type ParseResult = { ok: true; value: NewUser } | { ok: false; message: string };

/** 只允许字母、数字、下划线、连字符,避免上游唯一索引和展示层出现意外字符 */
const USERNAME_PATTERN = /^[A-Za-z0-9_-]+$/;

export function parseNewUser(input: unknown): ParseResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, message: "参数不合法" };
  }
  const data = input as Record<string, unknown>;

  if (typeof data.username !== "string") {
    return { ok: false, message: "用户名不合法" };
  }
  const username = data.username.trim();
  if (!username) return { ok: false, message: "用户名不能为空" };
  if (username.length > USERNAME_MAX) {
    return { ok: false, message: `用户名不能超过 ${USERNAME_MAX} 个字符` };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return { ok: false, message: "用户名只能包含字母、数字、下划线和连字符" };
  }

  if (typeof data.password !== "string") {
    return { ok: false, message: "密码不合法" };
  }
  // 密码两端空格可能是用户有意设置的,不做 trim
  if (data.password.length < PASSWORD_MIN || data.password.length > PASSWORD_MAX) {
    return { ok: false, message: `密码长度需在 ${PASSWORD_MIN}-${PASSWORD_MAX} 个字符之间` };
  }

  if (data.displayName !== undefined && typeof data.displayName !== "string") {
    return { ok: false, message: "显示名称不合法" };
  }
  const displayName = typeof data.displayName === "string" ? data.displayName.trim() : "";
  if (displayName.length > DISPLAY_NAME_MAX) {
    return { ok: false, message: `显示名称不能超过 ${DISPLAY_NAME_MAX} 个字符` };
  }

  const role = data.role === undefined ? USER_ROLE_COMMON : data.role;
  if (role !== USER_ROLE_COMMON && role !== USER_ROLE_ADMIN) {
    return { ok: false, message: "只能创建普通用户或管理员" };
  }

  return {
    ok: true,
    value: {
      username,
      password: data.password,
      // 留空时回落到用户名,与 new-api 的 CreateUser 行为一致
      displayName: displayName || username,
      role,
    },
  };
}

export function toNewApiCreateUserRequest(user: NewUser) {
  return {
    username: user.username,
    password: user.password,
    display_name: user.displayName,
    role: user.role,
  };
}

export interface UserSearchQuery {
  keyword: string;
  role: number | null;
  status: number | null;
  page: number;
  pageSize: number;
}

const PAGE_SIZE_MAX = 100;

/** 把前端传来的筛选条件收敛成安全范围,避免把非法值透传给上游 */
export function parseUserSearchQuery(params: URLSearchParams): UserSearchQuery {
  const keyword = (params.get("keyword") ?? "").trim().slice(0, 64);

  const rawRole = Number(params.get("role"));
  const role =
    params.get("role") && [USER_ROLE_COMMON, USER_ROLE_ADMIN, USER_ROLE_ROOT].includes(rawRole)
      ? rawRole
      : null;

  const rawStatus = Number(params.get("status"));
  const status = params.get("status") && (rawStatus === 1 || rawStatus === 2) ? rawStatus : null;

  const rawPage = Number(params.get("page"));
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const rawSize = Number(params.get("pageSize"));
  const pageSize =
    Number.isSafeInteger(rawSize) && rawSize > 0 ? Math.min(rawSize, PAGE_SIZE_MAX) : PAGE_SIZE_MAX;

  return { keyword, role, status, page, pageSize };
}

/** 有筛选条件时走 /api/user/search,否则走列表接口 */
export function toNewApiUserPath(query: UserSearchQuery): string {
  const search = new URLSearchParams({
    p: String(query.page),
    page_size: String(query.pageSize),
  });

  const filtered = query.keyword || query.role !== null || query.status !== null;
  if (!filtered) return `/api/user/?${search.toString()}`;

  if (query.keyword) search.set("keyword", query.keyword);
  if (query.role !== null) search.set("role", String(query.role));
  if (query.status !== null) search.set("status", String(query.status));
  return `/api/user/search?${search.toString()}`;
}
