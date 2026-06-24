import type { SurfaceKind } from '../../router/topo.js';

export function normalizeSurface(s: string): SurfaceKind | undefined {
  const lower = s.toLowerCase();
  if (lower === 'web' || lower === 'dashboard' || lower === 'whatsapp') {
    return lower as SurfaceKind;
  }
  return undefined;
}
