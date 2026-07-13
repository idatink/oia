export const dynamic = 'force-dynamic';

// Finalize a completed web intake: proxy to the dashboard, which rescues the lead,
// runs SmartMatch, and queues the match-room link to the patient's WhatsApp. Returns
// the match token + procedure/country so the chat can render the surgeons inline.
// The caller MUST have run /api/link-session first (migrates the session to the phone).
export async function POST(req: Request) {
  const dashboardUrl = process.env.DASHBOARD_URL ?? 'https://oia-dashboard-beryl.vercel.app';
  const secret = process.env.WHATSAPP_INTAKE_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: 'Not configured' }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const res = await fetch(`${dashboardUrl}/api/intake/finalize-web`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
