export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json();

  const dashboardUrl = process.env.DASHBOARD_URL ?? 'https://nia-medtourism-dashboard.vercel.app';
  const secret = process.env.WHATSAPP_INTAKE_SECRET;

  if (!secret) {
    console.error('[submit-intake] WHATSAPP_INTAKE_SECRET not set');
    return Response.json({ ok: false, error: 'Not configured' }, { status: 500 });
  }

  // Synthesize a phone-like identifier for web sessions
  const webIdentifier = `web_${Date.now()}`;

  const res = await fetch(`${dashboardUrl}/api/intake/whatsapp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      ...body,
      phone: body.phone ?? webIdentifier,
      surface: 'web',
    }),
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
