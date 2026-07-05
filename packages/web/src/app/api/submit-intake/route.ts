export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json();

  const dashboardUrl = process.env.DASHBOARD_URL ?? 'https://nia-medtourism-dashboard.vercel.app';
  const secret = process.env.WHATSAPP_INTAKE_SECRET;

  if (!secret) {
    console.error('[submit-intake] WHATSAPP_INTAKE_SECRET not set');
    return Response.json({ ok: false, error: 'Not configured' }, { status: 500 });
  }

  // Anonymous-first (A3): the patient shares their WhatsApp number at the end of
  // intake, which /api/link-session has already attached to the chat session.
  // Forward that real number so the dashboard keys the lead on the same patient
  // and the upsert lands on the existing conversation session. Only fall back to
  // a synthetic identifier if — despite the new flow — no number came through.
  const phone: string = body.phone?.toString().replace(/\s+/g, '') || `web_${Date.now()}`;

  const res = await fetch(`${dashboardUrl}/api/intake/whatsapp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      ...body,
      phone,
      surface: 'web',
    }),
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
