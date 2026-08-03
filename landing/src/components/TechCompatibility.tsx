import type { Locale } from '../lib/preferences';

interface TechCompatibilityProps {
  locale: Locale;
}

const copy = {
  'zh-CN': {
    title: '技术兼容性',
    subtitle: '支持主流的模型生态、请求格式和客户端工具',
    categories: [
      {
        title: '模型生态',
        items: ['OpenAI', 'Claude', 'Gemini'],
      },
      {
        title: '请求格式',
        items: ['OpenAI API', 'Anthropic API'],
      },
      {
        title: '客户端工具',
        items: ['Cherry Studio', 'CC Switch', 'OpenAI SDK', 'Anthropic SDK'],
      },
    ],
  },
  en: {
    title: 'Technical Compatibility',
    subtitle: 'Supporting mainstream model ecosystems, request formats, and client tools',
    categories: [
      {
        title: 'Model Ecosystems',
        items: ['OpenAI', 'Claude', 'Gemini'],
      },
      {
        title: 'Request Formats',
        items: ['OpenAI API', 'Anthropic API'],
      },
      {
        title: 'Client Tools',
        items: ['Cherry Studio', 'CC Switch', 'OpenAI SDK', 'Anthropic SDK'],
      },
    ],
  },
} as const;

export function TechCompatibility({ locale }: TechCompatibilityProps) {
  const text = copy[locale];

  return (
    <section className="section section--compatibility">
      <div className="container">
        <h2 className="section__title">{text.title}</h2>
        <p className="section__subtitle">{text.subtitle}</p>
        <div className="compatibility-grid">
          {text.categories.map((category, index) => (
            <div key={index} className="compatibility-card">
              <h3 className="compatibility-card__title">{category.title}</h3>
              <ul className="compatibility-card__list">
                {category.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
