import type { Config } from 'tailwindcss'

/**
 * ScriptGuard Tailwind 配置
 * 关联: Wireframes §1.1-1.4 设计 Token
 */
const config: Config = {
  content: [
    './popup/**/*.{ts,tsx}',
    './options/**/*.{ts,tsx}',
    './content/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './ui/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 品牌色
        primary: {
          DEFAULT: '#3B82F6',
          foreground: '#FFFFFF',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // 健康状态
        success: '#10B981',    // healthy
        warning: '#F59E0B',    // degraded
        destructive: '#EF4444', // failed
        muted: '#6B7280',      // unknown
        // 报警级别
        'alert-low': '#10B981',
        'alert-medium': '#F59E0B',
        'alert-high': '#F97316',
        'alert-critical': '#DC2626',
      },
      fontFamily: {
        sans: [
          'Inter',
          '"PingFang SC"',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          'Menlo',
          'Monaco',
          'monospace',
        ],
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        'sg-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sg-md': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        'sg-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '75%': { transform: 'translateX(2px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        'shake': 'shake 300ms ease-in-out',
      },
    },
  },
  plugins: [],
}

export default config
