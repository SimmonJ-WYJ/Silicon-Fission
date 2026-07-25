// 模型目录(mock 数据)。
// 后期把 getModels() 换成 fetch 后端 /v1/models 即可,页面无需改动 —— 见 lib/api.ts。

export interface ModelProvider {
  name: string;
  region: "境外" | "国内";
  input: number; // USD / 1M tokens
  output: number;
}

export interface Model {
  id: string;
  name: string;
  vendor: string;
  series: string;
  description: string;
  context: number;
  modality: ("text" | "image" | "audio")[];
  tokensPerWeek: number;
  providers: ModelProvider[];
}

export const MODELS: Model[] = [
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    vendor: "OpenAI",
    series: "GPT",
    description: "OpenAI 旗舰多模态模型,强推理与视觉能力,适合通用高质量场景。",
    context: 128000,
    modality: ["text", "image"],
    tokensPerWeek: 82e9,
    providers: [{ name: "OpenAI", region: "境外", input: 2.5, output: 10 }],
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o mini",
    vendor: "OpenAI",
    series: "GPT",
    description: "高性价比的小型多模态模型,速度快、成本低,适合大规模调用。",
    context: 128000,
    modality: ["text", "image"],
    tokensPerWeek: 210e9,
    providers: [{ name: "OpenAI", region: "境外", input: 0.15, output: 0.6 }],
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    vendor: "Anthropic",
    series: "Claude",
    description: "编码与长上下文表现顶尖,Claude Code 等编程工具的首选模型。",
    context: 200000,
    modality: ["text", "image"],
    tokensPerWeek: 156e9,
    providers: [{ name: "Anthropic", region: "境外", input: 3, output: 15 }],
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    vendor: "Google",
    series: "Gemini",
    description: "超长上下文(1M),多模态与检索增强场景表现优异。",
    context: 1000000,
    modality: ["text", "image", "audio"],
    tokensPerWeek: 64e9,
    providers: [{ name: "Google", region: "境外", input: 1.25, output: 10 }],
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3",
    vendor: "DeepSeek",
    series: "DeepSeek",
    description: "国产开源旗舰,通用能力强、价格极低,国内直连无需出海。",
    context: 128000,
    modality: ["text"],
    tokensPerWeek: 340e9,
    providers: [
      { name: "DeepSeek", region: "国内", input: 0.27, output: 1.1 },
      { name: "SiliconFlow", region: "国内", input: 0.35, output: 1.4 },
    ],
  },
  {
    id: "deepseek/deepseek-reasoner",
    name: "DeepSeek R1",
    vendor: "DeepSeek",
    series: "DeepSeek",
    description: "国产推理模型,数学与代码推理接近顶级闭源模型,成本极具优势。",
    context: 128000,
    modality: ["text"],
    tokensPerWeek: 128e9,
    providers: [
      { name: "DeepSeek", region: "国内", input: 0.55, output: 2.19 },
      { name: "SiliconFlow", region: "国内", input: 0.6, output: 2.4 },
    ],
  },
  {
    id: "qwen/qwen2.5-72b-instruct",
    name: "Qwen2.5 72B",
    vendor: "Alibaba",
    series: "Qwen",
    description: "阿里通义千问旗舰开源模型,中文能力强,国内直连。",
    context: 32000,
    modality: ["text"],
    tokensPerWeek: 74e9,
    providers: [{ name: "SiliconFlow", region: "国内", input: 0.57, output: 0.57 }],
  },
  {
    id: "moonshot/kimi-k2",
    name: "Kimi K2",
    vendor: "Moonshot",
    series: "Kimi",
    description: "月之暗面 Kimi,超长上下文与中文长文处理见长,国内直连。",
    context: 128000,
    modality: ["text"],
    tokensPerWeek: 48e9,
    providers: [{ name: "Moonshot", region: "国内", input: 0.6, output: 2.5 }],
  },
];

export function bestPrice(m: Model) {
  return {
    input: Math.min(...m.providers.map((p) => p.input)),
    output: Math.min(...m.providers.map((p) => p.output)),
  };
}

export function getModel(id: string) {
  return MODELS.find((m) => m.id === id);
}

export const SERIES = Array.from(new Set(MODELS.map((m) => m.series)));
export const REGIONS = ["境外", "国内"] as const;
