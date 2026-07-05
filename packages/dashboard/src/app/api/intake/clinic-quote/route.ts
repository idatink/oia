import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

/**
 * Clinic-quote intake — Oia's Clinic mode logs a negotiation + final quote here
 * (via the `submit_clinic_quote` skill). We store the whole clinic conversation
 * as a NIASession(surface="clinic") + NIAMessage rows, with the structured quote
 * on a final message's metadata, and link it to the patient's lead by phone/name.
 *
 * No schema migration: `surface` is a free string and the quote rides in message
 * metadata, so the existing admin sessions viewer and lead cockpit can read it.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.WHATSAPP_INTAKE_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    patientName?: string;
    patientPhone?: string;
    procedure?: string;
    clinicName?: string;
    clinicPhone?: string;
    currency?: string;
    headlinePrice?: number;
    inclusions?: string[];
    exclusions?: string[];
    validUntil?: string;
    negotiationStatus?: string;
    notes?: string;
    conversationTranscript?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const clinicPhone = body.clinicPhone?.replace(/\s+/g, '');
  if (!clinicPhone || !body.procedure) {
    return NextResponse.json({ error: 'clinicPhone and procedure are required' }, { status: 400 });
  }

  // ── Resolve which patient this quote belongs to ────────────────────────────
  // Prefer an exact WhatsApp-number match; fall back to the most recent patient
  // whose name matches; otherwise stash under a placeholder so nothing is lost.
  let patientId: string | null = null;
  let linked = false;

  const patientPhone = body.patientPhone?.replace(/\s+/g, '');
  if (patientPhone) {
    const byPhone = await db.patient.findUnique({ where: { whatsappNumber: patientPhone } });
    if (byPhone) { patientId = byPhone.id; linked = true; }
  }
  if (!patientId && body.patientName?.trim()) {
    const byName = await db.user.findFirst({
      where: { name: { equals: body.patientName.trim(), mode: 'insensitive' }, role: 'PATIENT' },
      orderBy: { createdAt: 'desc' },
      include: { patient: { select: { id: true } } },
    });
    if (byName?.patient) { patientId = byName.patient.id; linked = true; }
  }
  if (!patientId) {
    // No matching patient — keep the quote anyway under a clearly-labelled placeholder.
    const placeholderKey = `clinic_unlinked_${clinicPhone.replace(/[^0-9]/g, '')}`;
    const placeholder = await db.patient.upsert({
      where: { whatsappNumber: placeholderKey },
      update: {},
      create: {
        whatsappNumber: placeholderKey,
        user: {
          create: {
            email: `${placeholderKey}@clinic.oia.health`,
            name: body.clinicName ? `${body.clinicName} (unlinked quote)` : 'Unlinked clinic quote',
            role: 'PATIENT',
          },
        },
      },
    });
    patientId = placeholder.id;
  }

  // ── Upsert the clinic negotiation session (one per clinic⇄patient pairing) ──
  const identifier = `${clinicPhone}#${patientId}`;
  const session = await db.nIASession.upsert({
    where: { surface_identifier: { surface: 'clinic', identifier } },
    create: { patientId, surface: 'clinic', identifier, lastActiveAt: new Date() },
    update: { lastActiveAt: new Date() },
  });

  // Rebuild messages from the latest transcript (idempotent on re-submit).
  await db.nIAMessage.deleteMany({ where: { sessionId: session.id } });

  const transcriptMessages: { sessionId: string; role: 'PATIENT' | 'NIA'; content: string }[] = [];
  if (body.conversationTranscript) {
    for (const turn of body.conversationTranscript.split(/\n{1,2}/).filter(Boolean)) {
      const clinicMatch = turn.match(/^Clinic:\s*([\s\S]+)/i);
      const oiaMatch = turn.match(/^(?:Oia|Nia):\s*([\s\S]+)/i);
      if (clinicMatch) transcriptMessages.push({ sessionId: session.id, role: 'PATIENT', content: clinicMatch[1].trim() });
      else if (oiaMatch) transcriptMessages.push({ sessionId: session.id, role: 'NIA', content: oiaMatch[1].trim() });
    }
  }

  const quote = {
    type: 'clinic_quote' as const,
    clinicName: body.clinicName ?? null,
    clinicPhone,
    procedure: body.procedure,
    currency: body.currency ?? null,
    headlinePrice: body.headlinePrice ?? null,
    inclusions: body.inclusions ?? [],
    exclusions: body.exclusions ?? [],
    validUntil: body.validUntil ?? null,
    negotiationStatus: body.negotiationStatus ?? 'in_progress',
    notes: body.notes ?? null,
    patientName: body.patientName ?? null,
    linked,
  };

  const priceLabel = body.headlinePrice != null
    ? `${body.currency ?? ''} ${body.headlinePrice}`.trim()
    : 'no figure yet';

  await db.nIAMessage.createMany({
    data: [
      ...transcriptMessages,
      {
        sessionId: session.id,
        role: 'NIA' as const,
        content: `Clinic quote (${body.clinicName ?? clinicPhone}) for ${body.procedure}: ${priceLabel} — ${quote.negotiationStatus}`,
        metadata: quote,
      },
    ],
  });

  return NextResponse.json({ ok: true, patientId, sessionId: session.id, linked });
}
