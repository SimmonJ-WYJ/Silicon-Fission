import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { getInitialLocale, getInitialTheme } from './lib/preferences';
import './styles/tokens.css';
import './styles/global.css';

const initialLocale = getInitialLocale();
const initialTheme = getInitialTheme();
document.documentElement.lang = initialLocale;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialLocale={initialLocale} initialTheme={initialTheme} />
  </StrictMode>,
);
