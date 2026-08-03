import type { Locale } from '../lib/preferences';

interface GettingStartedProps {
  locale: Locale;
}

const copy = {
  'zh-CN': {
    title: '快速开始',
    steps: [
      {
        number: '1',
        title: '注册或登录',
        description: '创建您的 Siliconfission 账户，支持邮箱密码、Google 和 GitHub 登录。',
      },
      {
        number: '2',
        title: '创建 API Key',
        description: '在控制台中生成您的 API Key，用于所有模型调用的身份验证。',
      },
      {
        number: '3',
        title: '选择模型并发送请求',
        description: '从模型广场选择合适的模型，通过统一的 API 端点发送请求。',
      },
    ],
  },
  en: {
    title: 'Getting Started',
    steps: [
      {
        number: '1',
        title: 'Sign up or log in',
        description: 'Create your Siliconfission account with email, Google, or GitHub authentication.',
      },
      {
        number: '2',
        title: 'Create an API Key',
        description: 'Generate your API Key in the console for authenticating all model calls.',
      },
      {
        number: '3',
        title: 'Choose a model and send requests',
        description: 'Select the right model from the marketplace and send requests through the unified API endpoint.',
      },
    ],
  },
} as const;

export function GettingStarted({ locale }: GettingStartedProps) {
  const text = copy[locale];

  return (
    <section className="section section--steps">
      <div className="container">
        <h2 className="section__title">{text.title}</h2>
        <div className="steps">
          {text.steps.map((step) => (
            <div key={step.number} className="step-card">
              <div className="step-card__number" aria-hidden="true">
                {step.number}
              </div>
              <h3 className="step-card__title">{step.title}</h3>
              <p className="step-card__description">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
