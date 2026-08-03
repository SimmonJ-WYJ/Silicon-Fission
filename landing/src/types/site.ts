export type NavKey = 'home' | 'console' | 'pricing' | 'rankings' | 'docs' | 'about';

export interface NavigationItem {
  key: NavKey;
  href: string;
  requireAuth: boolean;
}

export interface SiteConfig {
  systemName: string;
  logoUrl: string;
  footerHtml: string;
  navigation: NavigationItem[];
  applications: string[];
  registration: {
    enabled: boolean;
    password: boolean;
    github: boolean;
    oidc: boolean;
  };
}
