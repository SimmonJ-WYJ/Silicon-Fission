import type { Locale } from '../lib/preferences';

interface CallToActionProps {
  locale: Locale;
}

const copy = {
  'zh-CN': {
    title: '准备好开始构建了吗？',
    button: '创建 API Key',
  },
  en: {
    title: 'Ready to start building?',
    button: 'Create API Key',
  },
} as const;

const CONSOLE_KEY_URL = 'https://console.siliconfission.com/token';

export function CallToAction({ locale }: CallToActionProps) {
  const text = copy[locale];

  return (
    <section className="section section--cta">
      <div className="container">
        <div className="cta">
          <h2 className="cta__title">{text.title}</h2>
          <a href={CONSOLE_KEY_URL} className="btn btn--primary btn--large">
            {text.button}
          </a>
        </div>
      </div>
    </section>
  );
}
