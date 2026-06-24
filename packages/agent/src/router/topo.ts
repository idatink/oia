export type DispatchContext = Record<string, unknown>;

export type SurfaceKind = "web" | "dashboard" | "whatsapp";

export interface SurfaceAdapter {
  surface: SurfaceKind;
  handle(input: DispatchContext): Promise<DispatchContext> | DispatchContext;
}

export interface AgentOutput {
  ok: boolean;
  surface: SurfaceKind;
  response: DispatchContext;
  error?: string;
}

export type SurfaceNames = SurfaceKind;

export interface RouterConfig {
  surfaceNames?: SurfaceNames;
  caseReducer?: unknown;
}

export class TopoRouter<C extends RouterConfig = RouterConfig> {
  private cfg: Required<C> & { surfaceNames: SurfaceNames };

  constructor(initial: C = {} as C) {
    this.cfg = {
      surfaceNames: initial.surfaceNames ?? ["web", "dashboard", "whatsapp"],
      caseReducer: initial.caseReducer,
    } as any;
  }

  surfaceNames(): SurfaceNames {
    return this.cfg.surfaceNames;
  }

  normalize(n: string): SurfaceKind | undefined {
    const lower = n.toLowerCase();
    if (["web", "dashboard", "whatsapp", "whatsApp"].includes(lower)) {
      return lower === "whatsapp" ? "whatsapp" : (lower as SurfaceKind);
    }
    return undefined;
  }
}

// Fallback stub for missing router/ triage files
export const stubRoute = (router: TopoRouter) => async (ctx: DispatchContext) => ({
  ok: true,
  surface: router.surfaceNames()[0],
  response: { ...ctx },
});
