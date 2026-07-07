import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getAdminOrCoordinatorFromRequest } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// Returns the SmartMatch shortlist(s) for a lead's patient, with each surgeon's
// contact (WhatsApp) so the team can run the negotiation. Admins + coordinators.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const actor = await getAdminOrCoordinatorFromRequest(req);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lead = await db.lead.findUnique({
    where: { id: params.id },
    select: { consultation: { select: { patientId: true } } },
  });
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const matches = await db.providerMatch.findMany({
    where: { patientId: lead.consultation.patientId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        orderBy: { rank: 'asc' },
        include: {
          provider: {
            select: {
              id: true, surgeonName: true, clinicName: true, city: true, country: true,
              accreditations: true, reviewRating: true, reviewCount: true,
              website: true, instagram: true, whatsapp: true, verified: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ matches });
}
