// 后端对接层(seam)。当前返回 mock 数据;上线时把实现换成 fetch 真实后端即可,
// 页面组件不需要改动。
//
// 例(对接自研 gateway 或 new-api):
//   const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/v1/models`, {
//     headers: { Authorization: `Bearer ${key}` },
//   });

import { MODELS, type Model } from "./models";

export async function getModels(): Promise<Model[]> {
  return MODELS;
}

/** 网关地址,Chat Playground 直接打这个 OpenAI 兼容端点 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8788";
