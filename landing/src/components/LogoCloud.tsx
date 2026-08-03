import { PlusIcon } from 'lucide-react';
import { pageCopy } from '../config/copy';
import type { Locale } from '../lib/preferences';

interface LogoCloudProps {
  applications: string[];
  locale: Locale;
}

interface LogoDefinition {
  name: string;
  src: string;
  preserveColor?: boolean;
}

const ICON_BASE = 'https://unpkg.com/@lobehub/icons-static-svg@1.94.0/icons';

const protocolLogos: LogoDefinition[] = [
  { name: 'OpenAI', src: `${ICON_BASE}/openai.svg` },
  { name: 'Claude', src: `${ICON_BASE}/claude.svg` },
  { name: 'Gemini', src: `${ICON_BASE}/gemini.svg` },
  { name: 'DeepSeek', src: `${ICON_BASE}/deepseek.svg` },
];

const applicationLogos: Record<string, LogoDefinition> = {
  'Cherry Studio': { name: 'Cherry Studio', src: `${ICON_BASE}/cherrystudio.svg` },
  'CC Switch': {
    name: 'CC Switch',
    src: 'https://raw.githubusercontent.com/farion1231/cc-switch/main/src-tauri/icons/icon.png',
    preserveColor: true,
  },
};

export function LogoCloud({ applications, locale }: LogoCloudProps) {
  const configuredLogos = applications.flatMap((application) =>
    applicationLogos[application] ? [applicationLogos[application]] : [],
  );
  const logos = [...protocolLogos, ...configuredLogos];

  return (
    <section className="logo-cloud" aria-labelledby="logo-cloud-title">
      <div className="page-shell">
        <h2 id="logo-cloud-title" className="logo-cloud__title">
          {pageCopy[locale].logoCloudTitle}
        </h2>
        <div className="logo-cloud__grid">
          {logos.map((logo, index) => (
            <div className="logo-cloud__cell" key={logo.name}>
              <PlusIcon className="logo-cloud__plus logo-cloud__plus--start" aria-hidden="true" />
              {(index === logos.length - 1 || index === 3) && (
                <PlusIcon className="logo-cloud__plus logo-cloud__plus--end" aria-hidden="true" />
              )}
              <img
                className={logo.preserveColor ? 'logo-cloud__logo' : 'logo-cloud__logo logo-cloud__logo--mono'}
                src={logo.src}
                alt={`${logo.name} logo`}
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
