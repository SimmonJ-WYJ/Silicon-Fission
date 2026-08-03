export const navigationCopy = {
  'zh-CN': {
    home: '首页', console: '控制台', pricing: '模型广场', rankings: '排行榜',
    docs: '文档', about: '关于', search: '搜索', account: '登录 / 注册',
  },
  en: {
    home: 'Home', console: 'Console', pricing: 'Models', rankings: 'Leaderboard',
    docs: 'Docs', about: 'About', search: 'Search', account: 'Sign in / Register',
  },
} as const;

export const pageCopy = {
  'zh-CN': {
    eyebrow: '统一的大模型接入平台',
    title: '一个 API Key，连接多种大模型',
    subtitle: '通过统一、兼容的接口接入 OpenAI 与 Claude 生态，为每个任务灵活选择合适的模型。',
    primaryCta: '创建 API Key',
    secondaryCta: '浏览模型',
    featuresTitle: '一次接入，保留更多模型选择',
    features: [
      ['一个 Key，统一管理', '无需维护多套凭证，通过一个平台管理不同模型的调用。'],
      ['延续熟悉的开发方式', '兼容常见的 OpenAI 与 Claude 请求格式，降低迁移与集成成本。'],
      ['为任务选择合适模型', '根据质量、响应速度、上下文能力和成本灵活选择。'],
    ],
    stepsTitle: '三步开始调用',
    steps: ['注册或登录', '创建 API Key', '选择模型并发送请求'],
    compatibilityTitle: '连接你熟悉的 AI 工作流',
    logoCloudTitle: '兼容你熟悉的模型与工具',
    finalTitle: '准备好开始构建了吗？',
    finalBody: '用一个 API Key，连接你的产品所需的大模型能力。',
  },
  en: {
    eyebrow: 'UNIFIED MODEL ACCESS',
    title: 'One API Key. Multiple AI models.',
    subtitle: 'Access models across the OpenAI and Claude ecosystems through one unified, compatible interface.',
    primaryCta: 'Create API Key',
    secondaryCta: 'Explore Models',
    featuresTitle: 'Integrate once. Keep more model options.',
    features: [
      ['One key, centrally managed', 'Manage requests to different models without juggling separate credentials.'],
      ['Keep your existing workflow', 'Use familiar OpenAI- and Claude-compatible request formats with less integration work.'],
      ['Choose the right model', 'Balance quality, latency, context capacity, and cost for each task.'],
    ],
    stepsTitle: 'Start in three steps',
    steps: ['Register or sign in', 'Create an API key', 'Choose a model and send a request'],
    compatibilityTitle: 'Connect your existing AI workflow',
    logoCloudTitle: 'Compatible with the models and tools you know',
    finalTitle: 'Ready to start building?',
    finalBody: 'Use one API key to connect the model capabilities your product needs.',
  },
} as const;
