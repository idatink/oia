import type { Config } from 'tailwindcss';
import { colors } from './tokens.js';

export const sharedConfig: Partial<Config> = {
  theme: {
    extend: {
      colors,
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 16px 0 rgba(44, 42, 41, 0.06)',
      },
      borderRadius: {
        card: '16px',
      },
      spacing: {
        card: '24px',
      },
    },
  },
};
