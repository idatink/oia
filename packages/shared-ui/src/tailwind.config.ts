import type { Config } from 'tailwindcss';
import { colors } from './tokens.js';

export const sharedConfig: Partial<Config> = {
  theme: {
    extend: {
      colors,
      fontFamily: {
        sans:    ['var(--font-work-sans)', 'system-ui', 'sans-serif'],
        serif:   ['var(--font-eb-garamond)', 'Georgia', 'serif'],
        body:    ['var(--font-work-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-eb-garamond)', 'Georgia', 'serif'],
      },
      fontSize: {
        'display-xl': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '500' }],
        'display-lg': ['36px', { lineHeight: '44px', letterSpacing: '-0.01em', fontWeight: '500' }],
        'display-md': ['28px', { lineHeight: '36px', fontWeight: '500' }],
        'display-sm': ['22px', { lineHeight: '28px', fontWeight: '500' }],
        'label-caps': ['12px', { lineHeight: '16px', letterSpacing: '0.08em', fontWeight: '600' }],
        'body-lg':    ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md':    ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm':    ['14px', { lineHeight: '20px', fontWeight: '400' }],
      },
      borderRadius: {
        card:  '16px',
        card2: '24px',
        card3: '40px',
      },
      boxShadow: {
        card:      '0 2px 16px 0 rgba(44,42,41,0.06)',
        concierge: '0 32px 64px -12px rgba(153,64,43,0.08)',
        float:     '0 8px 32px -4px rgba(153,64,43,0.12)',
      },
      spacing: {
        'container-max': '1280px',
        'margin-desktop': '64px',
        'margin-mobile':  '20px',
        gutter:           '24px',
      },
      maxWidth: {
        container: '1280px',
      },
    },
  },
};
