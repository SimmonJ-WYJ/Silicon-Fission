import { Check, Copy } from 'lucide-react';
import { useRef, useState, type KeyboardEvent } from 'react';
import type { Locale } from '../lib/preferences';

interface CodeDemoProps {
  locale: Locale;
}

const examples = {
  chat: {
    label: 'OpenAI Chat',
    endpoint: 'POST /v1/chat/completions',
    code: `curl https://api.siliconfission.com/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "your-model",
    "messages": [{ "role": "user", "content": "Hello" }]
  }'`,
  },
  responses: {
    label: 'Responses',
    endpoint: 'POST /v1/responses',
    code: `curl https://api.siliconfission.com/v1/responses \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "your-model",
    "input": "Hello"
  }'`,
  },
  claude: {
    label: 'Claude',
    endpoint: 'POST /v1/messages',
    code: `curl https://api.siliconfission.com/v1/messages \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "your-model",
    "max_tokens": 1024,
    "messages": [{ "role": "user", "content": "Hello" }]
  }'`,
  },
} as const;

type ExampleKey = keyof typeof examples;

const interfaceCopy = {
  'zh-CN': {
    copy: '复制代码',
    copied: '代码已复制',
    failed: '复制失败，已选中代码，请手动复制。',
    label: 'API 请求示例',
  },
  en: {
    copy: 'Copy code',
    copied: 'Code copied',
    failed: 'Copy failed. The code is selected for manual copying.',
    label: 'API request examples',
  },
} as const;

export function CodeDemo({ locale }: CodeDemoProps) {
  const [activeKey, setActiveKey] = useState<ExampleKey>('chat');
  const [announcement, setAnnouncement] = useState('');
  const codeRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Partial<Record<ExampleKey, HTMLButtonElement>>>({});
  const exampleKeys = Object.keys(examples) as ExampleKey[];
  const activeExample = examples[activeKey];
  const labels = interfaceCopy[locale];

  function selectExample(key: ExampleKey, moveFocus = false): void {
    setActiveKey(key);
    setAnnouncement('');
    if (moveFocus) tabRefs.current[key]?.focus();
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, key: ExampleKey): void {
    const currentIndex = exampleKeys.indexOf(key);
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % exampleKeys.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + exampleKeys.length) % exampleKeys.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = exampleKeys.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    selectExample(exampleKeys[nextIndex], true);
  }

  function selectCode(): void {
    if (!codeRef.current || typeof window.getSelection !== 'function') return;
    const range = document.createRange();
    range.selectNodeContents(codeRef.current);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  async function copyCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(activeExample.code);
      setAnnouncement(labels.copied);
    } catch {
      selectCode();
      setAnnouncement(labels.failed);
    }
  }

  return (
    <div className="code-demo" aria-label={labels.label}>
      <div className="code-demo__toolbar">
        <div className="code-demo__tabs" role="tablist" aria-label={labels.label}>
          {exampleKeys.map((key) => (
            <button
              key={key}
              ref={(element) => {
                tabRefs.current[key] = element ?? undefined;
              }}
              id={`code-tab-${key}`}
              className="code-demo__tab"
              type="button"
              role="tab"
              aria-controls="code-demo-panel"
              aria-selected={activeKey === key}
              tabIndex={activeKey === key ? 0 : -1}
              onClick={() => selectExample(key)}
              onKeyDown={(event) => handleTabKeyDown(event, key)}
            >
              {examples[key].label}
            </button>
          ))}
        </div>
        <button className="code-demo__copy" type="button" aria-label={labels.copy} onClick={copyCode}>
          {announcement === labels.copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        </button>
      </div>
      <div className="code-demo__endpoint">{activeExample.endpoint}</div>
      <pre
        id="code-demo-panel"
        className="code-demo__content"
        role="tabpanel"
        aria-labelledby={`code-tab-${activeKey}`}
      >
        <code ref={codeRef}>{activeExample.code}</code>
      </pre>
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
