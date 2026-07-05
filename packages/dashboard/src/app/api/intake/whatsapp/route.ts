import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.WHATSAPP_INTAKE_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    name: string;
    phone: string;
    surface?: string;
    procedure: string;
    intent: string;
    dateOfBirth?: string;
    countryOfResidence?: string;
    preferredLanguage?: string;
    medicalScreening?: Record<string, boolean>;
    photoDescriptions?: string[];
    photoUrls?: string[];
    photosDeclined?: boolean;
    conversationTranscript?: string;
    aiScore?: number;
    aiPriority?: string;
    aiRationale?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.name || !body.phone) {
    return NextResponse.json({ error: 'name and phone are required' }, { status: 400 });
  }

  const phone = body.phone.replace(/\s+/g, '');
  const surface = (body.surface === 'web' ? 'web' : 'whatsapp') as 'web' | 'whatsapp';

  // Upsert the user/patient by phone number
  const existingPatient = await db.patient.findUnique({
    where: { whatsappNumber: phone },
    include: { user: true },
  });

  let patientId: string;

  if (existingPatient) {
    patientId = existingPatient.id;
    await db.patient.update({
      where: { id: existingPatient.id },
      data: {
        countryOfResidence: body.countryOfResidence ?? existingPatient.countryOfResidence,
        preferredLanguage: body.preferredLanguage ?? existingPatient.preferredLanguage,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : existingPatient.dateOfBirth,
        user: { update: { name: body.name, phone } },
      },
    });
  } else {
    const placeholderEmail = `wa_${phone.replace(/[^0-9]/g, '')}@whatsapp.nia.health`;
    const newPatient = await db.patient.create({
      data: {
        whatsappNumber: phone,
        countryOfResidence: body.countryOfResidence,
        preferredLanguage: body.preferredLanguage,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        user: {
          create: { email: placeholderEmail, name: body.name, phone, role: 'PATIENT' },
        },
      },
    });
    patientId = newPatient.id;
  }

  // Upsert NIASession
  const session = await db.nIASession.upsert({
    where: { surface_identifier: { surface, identifier: phone } },
    create: { patientId, surface, identifier: phone, lastActiveAt: new Date() },
    update: { lastActiveAt: new Date() },
  });

  // Store full intake + Nia's suitability assessment as structured metadata
  const intakeSummary = {
    procedure: body.procedure,
    intent: body.intent,
    dateOfBirth: body.dateOfBirth ?? null,
    medicalScreening: body.medicalScreening ?? {},
    photoDescriptions: body.photoDescriptions ?? [],
    photosDeclined: body.photosDeclined ?? false,
    aiScore: body.aiScore ?? null,
    aiPriority: body.aiPriority ?? null,
    aiRationale: body.aiRationale ?? null,
  };

  // Parse transcript into individual message rows so the coordinator view can
  // render a proper chat thread. Format expected: "Patient: ...\nOia: ...\n\n"
  // (accepts legacy "Nia:" too so older records still parse). NIA is the DB enum.
  const transcriptMessages: { sessionId: string; role: 'PATIENT' | 'NIA'; content: string }[] = [];
  if (body.conversationTranscript) {
    const turns = body.conversationTranscript.split(/\n{1,2}/).filter(Boolean);
    for (const turn of turns) {
      const patientMatch = turn.match(/^Patient:\s*([\s\S]+)/i);
      const niaMatch = turn.match(/^(?:Oia|Nia):\s*([\s\S]+)/i);
      if (patientMatch) {
        transcriptMessages.push({ sessionId: session.id, role: 'PATIENT', content: patientMatch[1].trim() });
      } else if (niaMatch) {
        transcriptMessages.push({ sessionId: session.id, role: 'NIA', content: niaMatch[1].trim() });
      }
    }
  }

  await db.nIAMessage.createMany({
    data: [
      ...transcriptMessages,
      {
        sessionId: session.id,
        role: 'NIA' as const,
        content: `Intake completed: ${body.procedure}`,
        metadata: intakeSummary,
      },
    ],
  });

  // Auto-convert to lead if no hard contraindications and score is sufficient
  const HARD_FLAGS = ['cancerTreatment', 'organTransplant', 'dvt', 'pacemaker', 'heartDisease'] as const;
  const screening = body.medicalScreening ?? {};
  const hasHardFlag = HARD_FLAGS.some(k => screening[k] === true);
  const score = body.aiScore ?? 0;
  let leadId: string | null = null;

  if (!hasHardFlag && score >= 50) {
    try {
      const procedureName = body.procedure.toLowerCase();
      let procedure = await db.procedure.findFirst({
        where: { name: { contains: procedureName, mode: 'insensitive' } },
      });
      if (!procedure) {
        procedure = await db.procedure.create({
          data: {
            name: body.procedure,
            slug: body.procedure.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            category: 'OTHER',
          },
        });
      }

      const clinic = await db.clinic.findFirst({
        where: { isActive: true, isVerified: true },
        orderBy: { createdAt: 'asc' },
      });

      if (clinic) {
        const result = await db.$transaction(async tx => {
          const consultation = await tx.consultation.create({
            data: { patientId, clinicId: clinic.id, procedureId: procedure!.id, status: 'ENQUIRY' },
          });
          const lead = await tx.lead.create({
            data: {
              consultationId: consultation.id,
              status: 'NEW',
              scope: [],
              source: surface,
              patientLocation: body.countryOfResidence ?? undefined,
              aiScore: body.aiScore ?? null,
              aiPriority: body.aiPriority ?? null,
              aiRationale: body.aiRationale ?? null,
              intent: body.intent ?? null,
              medicalScreening: Object.fromEntries(
                ['diabetes','cancerTreatment','organTransplant','dvt','pacemaker','hypertension',
                 'bloodClotting','heartDisease','thyroidDisorder','immuneDisorder','pregnancy','allergies']
                  .map(k => [k, screening[k] ?? false])
              ),
              photoUrls: body.photoUrls ?? [],
            },
          });
          return lead.id;
        });
        leadId = result;
      }
    } catch (err) {
      console.error('[intake] auto-convert failed', err);
    }
  }

  return NextResponse.json({ ok: true, patientId, sessionId: session.id, leadId, autoConverted: !!leadId });
}
