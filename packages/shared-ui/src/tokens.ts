export const colors = {
  // ── Primary (terracotta) ─────────────────────────────────────────────────
  primary:                    '#99402b',
  'primary-container':        '#b95841',
  'primary-fixed':            '#ffdad2',
  'primary-fixed-dim':        '#ffb4a3',
  'on-primary':               '#ffffff',
  'on-primary-container':     '#fffbff',
  'on-primary-fixed':         '#3d0600',
  'on-primary-fixed-variant': '#7d2c19',
  'inverse-primary':          '#ffb4a3',

  // ── Secondary (warm brown) ───────────────────────────────────────────────
  secondary:                      '#675c56',
  'secondary-container':          '#ecddd4',
  'secondary-fixed':              '#eee0d7',
  'secondary-fixed-dim':          '#d2c4bb',
  'on-secondary':                 '#ffffff',
  'on-secondary-container':       '#6b615a',
  'on-secondary-fixed':           '#211a15',
  'on-secondary-fixed-variant':   '#4e453f',

  // ── Tertiary (dusty rose) ────────────────────────────────────────────────
  tertiary:                   '#6d574f',
  'tertiary-container':       '#876f67',
  'tertiary-fixed':           '#fadcd1',
  'tertiary-fixed-dim':       '#ddc0b6',
  'on-tertiary':              '#ffffff',
  'on-tertiary-container':    '#fffbff',
  'on-tertiary-fixed':        '#271811',
  'on-tertiary-fixed-variant':'#56423b',

  // ── Surface ──────────────────────────────────────────────────────────────
  surface:                    '#fcf9f7',
  'surface-dim':              '#dcd9d8',
  'surface-bright':           '#fcf9f7',
  'surface-container-lowest': '#ffffff',
  'surface-container-low':    '#f6f3f1',
  'surface-container':        '#f0edeb',
  'surface-container-high':   '#eae8e6',
  'surface-container-highest':'#e5e2e0',
  'surface-variant':          '#e5e2e0',
  'surface-tint':             '#9c422d',
  'inverse-surface':          '#30302f',
  'inverse-on-surface':       '#f3f0ee',

  // ── On-surface ───────────────────────────────────────────────────────────
  'on-surface':               '#1b1c1b',
  'on-surface-variant':       '#56423e',
  'on-background':            '#1b1c1b',
  background:                 '#fcf9f7',

  // ── Outline ──────────────────────────────────────────────────────────────
  outline:                    '#89726d',
  'outline-variant':          '#dcc0ba',

  // ── Error ────────────────────────────────────────────────────────────────
  error:                      '#ba1a1a',
  'error-container':          '#ffdad6',
  'on-error':                 '#ffffff',
  'on-error-container':       '#93000a',

  // ── Legacy aliases (keep existing code working) ──────────────────────────
  'brand-terracotta':  '#99402b',
  'brand-warm-bone':   '#f6f3f1',
  'brand-peach':       '#ffdad2',
  'brand-deep-charcoal':'#1b1c1b',
} as const;

export type ColorToken = keyof typeof colors;
