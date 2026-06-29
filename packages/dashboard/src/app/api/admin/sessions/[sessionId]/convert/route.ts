import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { verifySession, COOKIE } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  const actor = match?.[1] ? await verifySession(match[1]) : null;
  if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'NIA_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Load the session with all messages and patient data
  const session = await db.nIASession.findUnique({
    where: { id: params.sessionId },
    include: {
      patient: {
        include: { user: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  // Find the intake summary message (last NIA message with metadata)
  const intakeMsg = session.messages.find(m => m.role === 'NIA' && m.metadata);
  const meta = intakeMsg?.metadata as {
    procedure?: string;
    intent?: string;
    dateOfBirth?: string | null;
    medicalScreening?: Record<string, boolean>;
    photoDescriptions?: string[];
    photosDeclined?: boolean;
    aiScore?: number | null;
    aiPriority?: string | null;
    aiRationale?: string | null;
  } | null;

  if (!meta?.procedure) {
    return NextResponse.json({ error: 'No completed intake found for this session' }, { status: 400 });
  }

  // Validate all required triage fields are present
  const REQUIRED_SCREENING_KEYS = ['diabetes', 'cancerTreatment', 'organTransplant', 'dvt', 'pacemaker',
    'hypertension', 'heartDisease', 'thyroidDisorder', 'immuneDisorder', 'pregnancy', 'allergies'];
  const screening = meta.medicalScreening ?? {};
  const missingScreening = REQUIRED_SCREENING_KEYS.filter(k => !(k in screening));

  const missingFields: string[] = [];
  if (!meta.dateOfBirth) missingFields.push('Date of birth');
  if (missingScreening.length > 0) missingFields.push(`Medical screening incomplete (missing: ${missingScreening.join(', ')})`);
  if (!meta.photosDeclined && (!meta.photoDescriptions || meta.photoDescriptions.length === 0)) {
    missingFields.push('Treatment area photos (patient must share or explicitly decline)');
  }

  if (missingFields.length > 0) {
    return NextResponse.json({
      error: 'Intake is incomplete — cannot convert to lead',
      missingFields,
    }, { status: 422 });
  }

  // Find or create the procedure by name match
  const procedureName = meta.procedure.toLowerCase();
  let procedure = await db.procedure.findFirst({
    where: { name: { contains: procedureName, mode: 'insensitive' } },
  });
  if (!procedure) {
    // Create the procedure if it doesn't exist
    procedure = await db.procedure.create({
      data: {
        name: meta.procedure,
        slug: meta.procedure.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        category: 'OTHER',
      },
    });
  }

  // Get the body for optional clinicId override
  let clinicId: string | undefined;
  try {
    const body = await req.json();
    clinicId = body.clinicId;
  } catch {}

  // Default to first active verified clinic if not specified
  if (!clinicId) {
    const clinic = await db.clinic.findFirst({
      where: { isActive: true, isVerified: true },
      orderBy: { createdAt: 'asc' },
    });
    clinicId = clinic?.id;
  }

  if (!clinicId) {
    return NextResponse.json({ error: 'No active clinic available. Please add a clinic first.' }, { status: 400 });
  }

  const patient = session.patient;

  // Build medical screening with standard keys
  const SCREENING_KEYS = ['diabetes', 'cancerTreatment', 'organTransplant', 'dvt', 'pacemaker', 'hypertension', 'bloodClotting', 'heartDisease', 'thyroidDisorder', 'immuneDisorder', 'pregnancy', 'allergies'];
  const rawScreening = meta.medicalScreening ?? {};
  const medicalScreening = Object.fromEntries(SCREENING_KEYS.map(k => [k, rawScreening[k] ?? false]));

  // Create Consultation + Lead in one transaction
  const result = await db.$transaction(async tx => {
    const consultation = await tx.consultation.create({
      data: {
        patientId: patient.id,
        clinicId,
        procedureId: procedure!.id,
        status: 'ENQUIRY',
      },
    });

    const lead = await tx.lead.create({
      data: {
        consultationId: consultation.id,
        status: 'NEW',
        scope: [],
        source: 'whatsapp',
        patientLocation: patient.countryOfResidence ?? undefined,
        aiScore: meta?.aiScore ?? null,
        aiPriority: meta?.aiPriority ?? null,
        aiRationale: meta?.aiRationale ?? null,
        intent: meta?.intent ?? null,
        medicalScreening,
        photoUrls: [],
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: 'lead.converted_from_whatsapp',
        entityType: 'Lead',
        entityId: lead.id,
        meta: { sessionId: params.sessionId },
      },
    });

    return { leadId: lead.id, patientId: patient.id };
  });

  return NextResponse.json(result, { status: 201 });
}
