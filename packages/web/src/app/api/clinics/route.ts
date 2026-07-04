import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const procedure = searchParams.get('procedure')?.toLowerCase() ?? '';

  const all = await db.clinic.findMany({
    where: { isActive: true, isVerified: true },
    select: {
      id: true, name: true, city: true, country: true,
      shortDescription: true, description: true,
      niaScore: true, specialties: true, accreditations: true,
      website: true, photoUrls: true,
    },
    orderBy: { niaScore: 'desc' },
  });

  // Match by procedure: clinics whose specialties include the procedure (case-insensitive)
  // Fall back to all active clinics if no match
  let matched = procedure
    ? all.filter(c => c.specialties.some(s => s.toLowerCase().includes(procedure) || procedure.includes(s.toLowerCase())))
    : all;

  if (matched.length === 0) matched = all;

  // Return top 5
  return NextResponse.json(matched.slice(0, 5).map(c => ({
    id: c.id,
    name: c.name,
    city: c.city,
    country: c.country,
    description: c.shortDescription ?? c.description ?? '',
    niaScore: c.niaScore,
    accreditations: c.accreditations,
    specialties: c.specialties,
    website: c.website,
    photoUrl: c.photoUrls[0] ?? null,
  })));
}
