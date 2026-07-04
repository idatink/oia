import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { verifySession, COOKIE } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getActorFromRequest(req: Request) {
  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  const session = match?.[1] ? await verifySession(match[1]) : null;
  if (!session) return null;
  if (session.role !== 'ADMIN' && session.role !== 'NIA_ADMIN' && session.role !== 'COORDINATOR') return null;
  return session;
}

export async function GET() {
  const [procedures, clinics] = await Promise.all([
    db.procedure.findMany({ select: { id: true, name: true, category: true }, orderBy: { name: 'asc' } }),
    db.clinic.findMany({ where: { isActive: true }, select: { id: true, name: true, city: true }, orderBy: { name: 'asc' } }),
  ]);
  return NextResponse.json({ procedures, clinics });
}

export async function POST(req: Request) {
  const actor = await getActorFromRequest(req);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    // Patient
    name: string; email: string; phone: string;
    dateOfBirth: string; countryOfResidence: string; preferredLanguage: string;
    // Lead
    procedureId: string; clinicId: string;
    patientLocation?: string; source?: string;
    aiScore: number; aiPriority: string; aiRationale?: string;
    intent?: string;
    medicalScreening: Record<string, boolean>;
    photoUrls?: string[];
  };

  // Auto-generate placeholder email for WhatsApp patients who don't have one
  if (!body.email && body.phone) {
    body.email = `wa_${body.phone.replace(/[^0-9]/g, '')}@whatsapp.nia.health`;
  }

  // Validate required fields
  const missing = ['name','phone','dateOfBirth','countryOfResidence','preferredLanguage','procedureId','clinicId','aiScore','aiPriority','medicalScreening']
    .filter(k => !body[k as keyof typeof body]);
  if (missing.length) return NextResponse.json({ error: `Missing: ${missing.join(', ')}` }, { status: 400 });

  // Create user → patient → consultation → lead atomically
  const result = await db.$transaction(async tx => {
    // Try to find existing patient by phone (WhatsApp intake creates with placeholder email)
    const existingByPhone = body.phone
      ? await tx.patient.findUnique({ where: { whatsappNumber: body.phone }, include: { user: true } })
      : null;

    // Check if user exists by email
    let user = existingByPhone?.user ?? await tx.user.findUnique({ where: { email: body.email } });
    if (!user) {
      user = await tx.user.create({
        data: {
          email: body.email,
          name: body.name,
          phone: body.phone,
          role: 'PATIENT',
          passwordHash: '',
        },
      });
    } else {
      // Update name/email if we have better data than the placeholder
      if (!body.email.includes('@whatsapp.nia.health')) {
        user = await tx.user.update({ where: { id: user.id }, data: { name: body.name, email: body.email, phone: body.phone } });
      }
    }

    // Check if patient record exists
    let patient = existingByPhone ?? await tx.patient.findUnique({ where: { userId: user.id } });
    if (!patient) {
      patient = await tx.patient.create({
        data: {
          userId: user.id,
          dateOfBirth: new Date(body.dateOfBirth),
          countryOfResidence: body.countryOfResidence,
          preferredLanguage: body.preferredLanguage,
          whatsappNumber: body.phone,
        },
      });
    } else {
      patient = await tx.patient.update({
        where: { id: patient.id },
        data: {
          dateOfBirth: new Date(body.dateOfBirth),
          countryOfResidence: body.countryOfResidence,
          preferredLanguage: body.preferredLanguage,
          whatsappNumber: body.phone,
        },
      });
    }

    const consultation = await tx.consultation.create({
      data: {
        patientId: patient.id,
        clinicId: body.clinicId,
        procedureId: body.procedureId,
        status: 'ENQUIRY',
      },
    });

    const lead = await tx.lead.create({
      data: {
        consultationId: consultation.id,
        status: 'NEW',
        scope: [],
        source: body.source ?? 'admin_intake',
        patientLocation: body.patientLocation ?? body.countryOfResidence,
        aiScore: body.aiScore,
        aiPriority: body.aiPriority,
        aiRationale: body.aiRationale ?? null,
        intent: body.intent ?? null,
        medicalScreening: body.medicalScreening,
        photoUrls: body.photoUrls ?? [],
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: 'lead.created_via_intake',
        entityType: 'Lead',
        entityId: lead.id,
      },
    });

    return { leadId: lead.id, patientId: patient.id };
  }).catch((err: Error) => {
    const detail = { message: err.message, code: (err as any).code, meta: (err as any).meta };
    console.error('[intake POST] transaction failed:', detail);
    return NextResponse.json({ error: 'Database error', detail, submitted: { clinicId: body.clinicId, procedureId: body.procedureId, email: body.email } }, { status: 500 });
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result, { status: 201 });
}
