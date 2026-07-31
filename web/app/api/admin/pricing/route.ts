import { NextResponse } from "next/server";
import { getSessionToken, napiFetch } from "@/lib/newapi-server";
import { isDemo, demoUser } from "@/lib/demo";
import {
  fromPricingRows,
  parseRatioJson,
  toPricingRows,
  validatePricingRow,
  type ModelPricingRow,
} from "@/lib/pricing";

interface NapiOption {
  key: string;
  value: string;
}

const DEMO_ROWS: ModelPricingRow[] = [
  { model: "deepseek-chat", inputRatio: 0.14, outputRatio: 2, perCallPrice: null },
  { model: "deepseek-reasoner", inputRatio: 0.28, outputRatio: 4, perCallPrice: null },
  { model: "glm-4.6", inputRatio: 0.3, outputRatio: 3, perCallPrice: null },
  { model: "kimi-k2-0711-preview", inputRatio: 0.6, outputRatio: 2.5, perCallPrice: null },
];

/** 从 new-api 的 option 列表里挑出倍率相关的三个 key */
function readTables(options: NapiOption[]) {
  const byKey = new Map(options.map((o) => [o.key, o.value]));
  return {
    modelRatio: parseRatioJson(byKey.get("ModelRatio")),
    completionRatio: parseRatioJson(byKey.get("CompletionRatio")),
    modelPrice: parseRatioJson(byKey.get("ModelPrice")),
  };
}

export async function GET() {
  if (isDemo()) {
    const who = await demoUser();
    if (!who) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
    return NextResponse.json({ success: true, data: DEMO_ROWS });
  }

  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  const { body } = await napiFetch<NapiOption[]>("/api/option/", {}, token).catch(() => ({
    status: 502,
    body: { success: false, message: "无法连接 new-api 后端" } as const,
  }));

  if (!body.success || !body.data) {
    return NextResponse.json(
      { success: false, message: body.message || "获取倍率失败(需要超级管理员账号)" },
      { status: 403 },
    );
  }

  const rows = toPricingRows(readTables(Array.isArray(body.data) ? body.data : []));
  return NextResponse.json({ success: true, data: rows });
}

export async function PUT(req: Request) {
  const payload = await req.json().catch(() => null);
  const rows: unknown = payload?.rows;

  if (!Array.isArray(rows)) {
    return NextResponse.json({ success: false, message: "缺少 rows 数组" }, { status: 400 });
  }

  // 逐行校验，把行号带回去，UI 才能指到具体哪一行填错了
  const typed = rows as ModelPricingRow[];
  for (const [i, row] of typed.entries()) {
    const error = validatePricingRow(row);
    if (error) {
      return NextResponse.json(
        { success: false, message: `第 ${i + 1} 行：${error}`, rowIndex: i },
        { status: 400 },
      );
    }
  }

  const names = typed.map((r) => r.model.trim());
  const duplicate = names.find((n, i) => names.indexOf(n) !== i);
  if (duplicate) {
    return NextResponse.json(
      { success: false, message: `模型 ${duplicate} 重复出现` },
      { status: 400 },
    );
  }

  if (isDemo()) {
    const who = await demoUser();
    if (!who) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
    // 演示模式不落库，直接回显，避免 cookie 超出大小上限
    return NextResponse.json({ success: true, demo: true });
  }

  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  const tables = fromPricingRows(typed);
  const updates: NapiOption[] = [
    { key: "ModelRatio", value: JSON.stringify(tables.modelRatio) },
    { key: "CompletionRatio", value: JSON.stringify(tables.completionRatio) },
    { key: "ModelPrice", value: JSON.stringify(tables.modelPrice) },
  ];

  // new-api 的 option 接口一次只收一个 key，串行写以便定位失败点
  for (const option of updates) {
    const { body } = await napiFetch(
      "/api/option/",
      { method: "PUT", body: JSON.stringify(option) },
      token,
    ).catch(() => ({
      status: 502,
      body: { success: false, message: "无法连接 new-api 后端" } as const,
    }));

    if (!body.success) {
      return NextResponse.json(
        { success: false, message: `保存 ${option.key} 失败：${body.message || "未知错误"}` },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ success: true });
}
