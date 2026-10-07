import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--text-primary)',
        muted: 'var(--text-muted)',
        line: 'var(--border-subtle)',
        canvas: 'var(--page-background)',
        brand: {
          DEFAULT: 'var(--primary)',
          dark: 'var(--primary-hover)',
          pale: 'var(--primary-light)',
        },
        cyan: { DEFAULT: 'var(--cyan)', pale: '#e9f9fb' },
      },
      boxShadow: { soft: 'var(--shadow)' },
      borderRadius: { xl2: '1.125rem' },
    },
  },
  plugins: [],
} satisfies Config;
