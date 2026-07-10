import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

// TEST-RESET. Wipes everything tied to a WhatsApp number so the founder can run
// a clean intake from the same phone (one number = one patient record, so without
// this every test persona piles onto the last one). Called by Oia's `reset_patient`
// skill in TEST MODE. Deletes children first (FK-safe), then the patient + user.
// Guarded by the shared WhatsApp secret. Returns what was removed.
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.WHATSAPP_INTAKE_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const phone = (body.phone ?? '').replace(/\s+/g, '');
  if (!phone) return NextResponse.json({ error: 'phone is required' }, { status: 400 });

  const patient = await db.patient.findUnique({
    where: { whatsappNumber: phone },
    select: { id: true, userId: true },
  });
  if (!patient) {
    // Nothing stored for this number — a "reset" is trivially already true.
    return NextResponse.json({ ok: true, phone, existed: false });
  }

  const patientId = patient.id;

  // Gather ids for the deeper chains.
  const sessions = await db.nIASession.findMany({ where: { patientId }, select: { id: true } });
  const sessionIds = sessions.map(s => s.id);

  const consultations = await db.consultation.findMany({ where: { patientId }, select: { id: true } });
  const consultationIds = consultations.map(c => c.id);

  const leads = consultationIds.length
    ? await db.lead.findMany({ where: { consultationId: { in: consultationIds } }, select: { id: true } })
    : [];
  const leadIds = leads.map(l => l.id);

  const complianceTimelines = consultationIds.length
    ? await db.complianceTimeline.findMany({ where: { consultationId: { in: consultationIds } }, select: { id: true } })
    : [];
  const timelineIds = complianceTimelines.map(t => t.id);

  const removed: Record<string, number> = {};
  const del = async (label: string, fn: () => Promise<{ count: number }>) => {
    try { removed[label] = (await fn()).count; }
    catch (e) { removed[label] = -1; console.error(`[reset] ${label} failed`, e); }
  };

  // Children first, then parents. deleteMany on empty sets is a harmless no-op.
  await del('providerMatches', () => db.providerMatch.deleteMany({ where: { patientId } })); // cascades items
  await del('niaMessages', () => db.nIAMessage.deleteMany({ where: { sessionId: { in: sessionIds } } }));
  await del('niaSessions', () => db.nIASession.deleteMany({ where: { patientId } }));

  if (leadIds.length) await del('offers', () => db.offer.deleteMany({ where: { leadId: { in: leadIds } } }));
  if (consultationIds.length) await del('leads', () => db.lead.deleteMany({ where: { consultationId: { in: consultationIds } } }));
  if (consultationIds.length) await del('bookings', () => db.booking.deleteMany({ where: { consultationId: { in: consultationIds } } }));
  if (timelineIds.length) await del('complianceItems', () => db.complianceItem.deleteMany({ where: { timelineId: { in: timelineIds } } }));
  if (consultationIds.length) await del('complianceTimelines', () => db.complianceTimeline.deleteMany({ where: { consultationId: { in: consultationIds } } }));
  await del('documents', () => db.document.deleteMany({ where: { patientId } }));
  if (consultationIds.length) await del('consultations', () => db.consultation.deleteMany({ where: { patientId } }));

  // Finally the patient + its user. If a stray FK blocks the patient delete,
  // fall back to freeing the number so a fresh intake still starts clean.
  let patientDeleted = false;
  try {
    await db.patient.delete({ where: { id: patientId } });
    await db.user.delete({ where: { id: patient.userId } }).catch(() => {});
    patientDeleted = true;
  } catch (e) {
    console.error('[reset] patient delete blocked, freeing number instead', e);
    await db.patient.update({ where: { id: patientId }, data: { whatsappNumber: null } }).catch(() => {});
  }

  return NextResponse.json({ ok: true, phone, existed: true, patientDeleted, removed });
}
