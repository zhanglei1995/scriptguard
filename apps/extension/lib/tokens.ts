/**
 * Design Token 工具函数
 * 关联: Wireframes §1 设计 Token
 */

export const COLORS = {
  primary: {
    DEFAULT: '#3B82F6',
    dark: '#60A5FA',
    foreground: { DEFAULT: '#FFFFFF', dark: '#0F172A' },
  },
  background: { DEFAULT: '#FFFFFF', dark: '#0F172A' },
  foreground: { DEFAULT: '#0F172A', dark: '#F1F5F9' },
  muted: { DEFAULT: '#F1F5F9', dark: '#1E293B' },
  'muted-foreground': { DEFAULT: '#64748B', dark: '#94A3B8' },
  border: { DEFAULT: '#E2E8F0', dark: '#334155' },
  card: { DEFAULT: '#FFFFFF', dark: '#1E293B' },
  success: '#10B981',
  warning: '#F59E0B',
  destructive: '#EF4444',
  unknown: '#6B7280',
  'alert-low': '#10B981',
  'alert-medium': '#F59E0B',
  'alert-high': '#F97316',
  'alert-critical': '#DC2626',
} as const;

export const FONT_FAMILY = {
  sans: ['Inter', 'PingFang SC', '-apple-system', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
} as const;

export const FONT_SIZE = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '30px',
} as const;

export const FONT_WEIGHT = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const SPACING = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '32px',
  8: '40px',
  9: '48px',
  10: '64px',
  11: '80px',
  12: '96px',
  13: '128px',
} as const;

export const BORDER_RADIUS = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
} as const;

export const BOX_SHADOW = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
} as const;

export const TRANSITION = {
  'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
  'duration-fast': '150ms',
  'duration-base': '250ms',
  'duration-slow': '400ms',
} as const;

/**
 * 从 CSS 变量读取 token 值
 * @param name - CSS 变量名（不含 -- 前缀），如 'primary', 'background'
 * @returns token 值，未定义则返回 undefined
 */
export function getToken(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  return value || undefined;
}

/**
 * 获取当前是否为暗色模式
 */
export function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}
