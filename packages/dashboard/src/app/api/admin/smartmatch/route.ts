import { NextResponse } from 'next/server';
import { smartMatch, type PatientProfile } from '@nia/shared/src/smartmatch';
import { getAdminOrCoordinatorFromRequest } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// SmartMatch PLAYGROUND (internal). Runs the deterministic matcher for an
// arbitrary profile and returns the full ranked result — scores and reasons
// exposed — so the team can test/tune match quality with zero model cost and
// no session/patient pollution. Read-only: unlike /api/smartmatch it never
// persists a ProviderMatch. Admin/coordinator session required.
export async function POST(req: Request) {
  const user = await getAdminOrCoordinatorFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: PatientProfile & { limit?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = await smartMatch(body, Math.min(body.limit ?? 10, 24));
  return NextResponse.json(result);
}
