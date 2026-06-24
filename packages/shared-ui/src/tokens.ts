export const colors = {
  'brand-terracotta': '#C86446',
  'brand-warm-bone': '#F9F6F0',
  'brand-peach': '#FCECE5',
  'brand-deep-charcoal': '#2C2A29',
} as const;

export type ColorToken = keyof typeof colors;
