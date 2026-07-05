import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

/**
 * Anonymous-first intake (Decision A3).
 *
 * A web visitor chats anonymously — the chat route creates a NIASession
 * { surface: 'web', identifier: <browser sessionId> } owned by a placeholder
 * patient keyed `web_anon_<sessionId>`. When they later share a real WhatsApp
 * number, we attach it to that session's patient so the coordinator has a
 * contactable lead WITH the full conversation.
 *
 * Two cases:
 *  - PROMOTE: no patient owns this number yet → give the anon patient the number.
 *  - MERGE:   a patient already owns this number (e.g. from WhatsApp) → repoint
 *             the anon patient's sessions/consultations onto it and delete the
 *             anon records, unifying web + WhatsApp history under one patient.
 *
 * The conversation session's identifier is migrated to the phone number when
 * that slot is free, so the subsequent /api/submit-intake upsert (keyed by
 * phone) lands on the SAME session and appends the intake summary in place.
 */
export async function POST(req: Request) {
  let body: { sessionId?: string; phone?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim();
  const phone = body.phone?.replace(/\s+/g, '');
  const name = body.name?.trim() || undefined;

  if (!sessionId || !phone) {
    return NextResponse.json({ error: 'sessionId and phone are required' }, { status: 400 });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const anonSession = await tx.nIASession.findUnique({
        where: { surface_identifier: { surface: 'web', identifier: sessionId } },
        include: { patient: { include: { user: true } } },
      });

      const targetPatient = await tx.patient.findUnique({
        where: { whatsappNumber: phone },
        include: { user: true },
      });

      // Is the phone's own web-session slot free? (only then may we migrate the
      // conversation session's identifier onto the phone without a unique clash)
      const phoneSlotTaken = await tx.nIASession.findUnique({
        where: { surface_identifier: { surface: 'web', identifier: phone } },
        select: { id: true },
      });

      // No conversation session logged yet — just make sure a patient exists.
      if (!anonSession) {
        if (targetPatient) {
          if (name && !targetPatient.user.name) {
            await tx.user.update({ where: { id: targetPatient.userId }, data: { name } });
          }
          return { patientId: targetPatient.id, merged: false };
        }
        const created = await tx.patient.create({
          data: {
            whatsappNumber: phone,
            user: {
              create: {
                email: `wa_${phone.replace(/[^0-9]/g, '')}@whatsapp.nia.health`,
                name: name ?? 'Web visitor',
                phone,
                role: 'PATIENT',
              },
            },
          },
        });
        return { patientId: created.id, merged: false };
      }

      const anonPatient = anonSession.patient;

      // Already linked to this number.
      if (anonPatient.whatsappNumber === phone) {
        return { patientId: anonPatient.id, merged: false };
      }

      if (targetPatient && targetPatient.id !== anonPatient.id) {
        // MERGE onto the existing phone-owning patient.
        await tx.nIASession.updateMany({
          where: { patientId: anonPatient.id },
          data: { patientId: targetPatient.id },
        });
        await tx.consultation.updateMany({
          where: { patientId: anonPatient.id },
          data: { patientId: targetPatient.id },
        });
        if (!phoneSlotTaken) {
          await tx.nIASession.update({
            where: { id: anonSession.id },
            data: { identifier: phone },
          });
        }
        await tx.patient.update({
          where: { id: targetPatient.id },
          data: {
            countryOfResidence: targetPatient.countryOfResidence ?? anonPatient.countryOfResidence,
            preferredLanguage: targetPatient.preferredLanguage ?? anonPatient.preferredLanguage,
            dateOfBirth: targetPatient.dateOfBirth ?? anonPatient.dateOfBirth,
            user: { update: { name: name ?? targetPatient.user.name ?? anonPatient.user.name } },
          },
        });
        await tx.patient.delete({ where: { id: anonPatient.id } });
        await tx.user.delete({ where: { id: anonPatient.userId } });
        return { patientId: targetPatient.id, merged: true };
      }

      // PROMOTE the anon patient to a real one.
      if (!phoneSlotTaken) {
        await tx.nIASession.update({
          where: { id: anonSession.id },
          data: { identifier: phone },
        });
      }
      await tx.patient.update({
        where: { id: anonPatient.id },
        data: {
          whatsappNumber: phone,
          user: { update: { name: name ?? anonPatient.user.name, phone } },
        },
      });
      return { patientId: anonPatient.id, merged: false };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[link-session]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
