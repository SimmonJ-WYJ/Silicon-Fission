import type { Locale } from '../lib/preferences';

interface CoreFeaturesProps {
  locale: Locale;
}

const copy = {
  'zh-CN': {
    title: '核心能力',
    features: [
      {
        title: '统一管理',
        description: '一个 API Key，管理所有模型调用。无需为每个模型提供商单独配置密钥和账户。',
        icon: '🔑',
      },
      {
        title: '广泛兼容',
        description: '兼容 OpenAI 与 Claude 的常见接入方式，支持多种客户端和开发工具。',
        icon: '🔌',
      },
      {
        title: '灵活选择',
        description: '根据质量、响应速度、上下文能力和成本为每个任务选择最合适的模型。',
        icon: '⚡',
      },
    ],
  },
  en: {
    title: 'Core Features',
    features: [
      {
        title: 'Unified Management',
        description: 'One API Key to manage all model calls. No need to configure separate keys and accounts for each provider.',
        icon: '🔑',
      },
      {
        title: 'Wide Compatibility',
        description: 'Compatible with common OpenAI and Claude integration methods, supporting multiple clients and development tools.',
        icon: '🔌',
      },
      {
        title: 'Flexible Selection',
        description: 'Choose the most suitable model for each task based on quality, response speed, context capability, and cost.',
        icon: '⚡',
      },
    ],
  },
} as const;

export function CoreFeatures({ locale }: CoreFeaturesProps) {
  const text = copy[locale];

  return (
    <section className="section section--features">
      <div className="container">
        <h2 className="section__title">{text.title}</h2>
        <div className="features-grid">
          {text.features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-card__icon" aria-hidden="true">
                {feature.icon}
              </div>
              <h3 className="feature-card__title">{feature.title}</h3>
              <p className="feature-card__description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
