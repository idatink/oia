import type { SurfaceKind } from '../router/topo.js';

export function assertSurface(value: string): SurfaceKind {
  if (value === 'web' || value === 'dashboard' || value === 'whatsapp') {
    return value;
  }
  throw new Error(`Unknown surface: ${value}`);
}
