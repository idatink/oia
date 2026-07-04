import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export async function GET() {
  const clinics = await db.clinic.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, slug: true, country: true, city: true,
      description: true, shortDescription: true, website: true,
      whatsappNumber: true, internalNotes: true,
      niaScore: true, specialties: true, photoUrls: true, accreditations: true,
      isVerified: true, isActive: true, createdAt: true,
      coordinators: { select: { id: true, user: { select: { name: true, email: true } } } },
      consultations: {
        select: {
          lead: {
            select: {
              status: true, aiScore: true, patientSelectedAt: true,
              offers: { select: { totalPrice: true, currency: true } },
            },
          },
        },
      },
    },
  });

  const result = clinics.map(c => {
    const leads = c.consultations.map(con => con.lead).filter(Boolean);
    const selected = leads.filter(l => l?.patientSelectedAt).length;
    const totalOffers = leads.flatMap(l => l?.offers ?? []);
    const avgOffer = totalOffers.length
      ? Math.round(totalOffers.reduce((s, o) => s + o.totalPrice, 0) / totalOffers.length)
      : null;
    return {
      id: c.id, name: c.name, slug: c.slug, country: c.country, city: c.city,
      description: c.description, shortDescription: c.shortDescription,
      website: c.website, whatsappNumber: c.whatsappNumber, internalNotes: c.internalNotes,
      niaScore: c.niaScore, specialties: c.specialties,
      photoUrls: c.photoUrls, accreditations: c.accreditations,
      isVerified: c.isVerified, isActive: c.isActive, createdAt: c.createdAt,
      coordinators: c.coordinators,
      totalLeads: leads.length,
      selectedLeads: selected,
      conversionRate: leads.length ? Math.round((selected / leads.length) * 100) : 0,
      avgOfferEur: avgOffer,
      totalOffersSent: totalOffers.length,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, city, country, description, shortDescription, website,
    whatsappNumber, internalNotes, niaScore, specialties, accreditations, isVerified, isActive } = body;

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const uniqueSlug = `${slug}-${Date.now()}`;

  const clinic = await db.clinic.create({
    data: {
      name, city, country, slug: uniqueSlug,
      description: description || null,
      shortDescription: shortDescription || null,
      website: website || null,
      whatsappNumber: whatsappNumber || null,
      internalNotes: internalNotes || null,
      niaScore: niaScore ? Number(niaScore) : null,
      specialties: specialties ?? [],
      accreditations: accreditations ?? [],
      isVerified: isVerified ?? false,
      isActive: isActive ?? true,
    },
  });
  return NextResponse.json(clinic, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, ...data } = body;

  const clinic = await db.clinic.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.city !== undefined ? { city: data.city } : {}),
      ...(data.country !== undefined ? { country: data.country } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.shortDescription !== undefined ? { shortDescription: data.shortDescription } : {}),
      ...(data.website !== undefined ? { website: data.website } : {}),
      ...(data.whatsappNumber !== undefined ? { whatsappNumber: data.whatsappNumber } : {}),
      ...(data.internalNotes !== undefined ? { internalNotes: data.internalNotes } : {}),
      ...(data.niaScore !== undefined ? { niaScore: data.niaScore ? Number(data.niaScore) : null } : {}),
      ...(data.specialties !== undefined ? { specialties: data.specialties } : {}),
      ...(data.accreditations !== undefined ? { accreditations: data.accreditations } : {}),
      ...(data.isVerified !== undefined ? { isVerified: data.isVerified } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
  return NextResponse.json(clinic);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await db.clinic.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
