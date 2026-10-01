import type { NavigationItem } from '../types/site';

export const DEFAULT_NAVIGATION: readonly NavigationItem[] = [
  { key: 'home', href: '/', requireAuth: false },
  { key: 'console', href: 'https://siliconfission.com/dashboard', requireAuth: false },
  { key: 'pricing', href: 'https://siliconfission.com/pricing', requireAuth: false },
  { key: 'rankings', href: 'https://siliconfission.com/rankings', requireAuth: false },
];
