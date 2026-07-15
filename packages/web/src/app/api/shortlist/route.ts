import { verifyMatchToken } from '@/lib/matchToken';

export const dynamic = 'force-dynamic';

// Match-room shortlist submit. The signed match token is the auth: it carries the
// patient's phone (minted server-side at finalize), so the client can never
// shortlist on someone else's behalf. Proxies to the dashboard, which stores the
// pick and queues the WhatsApp confirmation.
export async function POST(req: Request) {
  const dashboardUrl = process.env.DASHBOARD_URL ?? 'https://oia-dashboard-beryl.vercel.app';
  const secret = process.env.WHATSAPP_INTAKE_SECRET;
  if (!secret) return Response.json({ ok: false, error: 'Not configured' }, { status: 500 });

  let body: { token?: string; providers?: Array<{ id: string; name: string; country: string }> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const room = verifyMatchToken(body.token ?? '');
  if (!room) return Response.json({ ok: false, error: 'invalid link' }, { status: 401 });
  if (!room.phone) {
    // Old links minted before the phone was added — can't attach a shortlist.
    return Response.json({ ok: false, error: 'link_too_old' }, { status: 410 });
  }

  const res = await fetch(`${dashboardUrl}/api/intake/shortlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
    body: JSON.stringify({
      phone: room.phone,
      name: room.name,
      procedure: room.procedure,
      providers: (body.providers ?? []).slice(0, 10),
    }),
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
