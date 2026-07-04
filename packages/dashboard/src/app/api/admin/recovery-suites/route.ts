import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export async function GET() {
  const suites = await db.recoverySuite.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(suites);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, city, country, description, photoUrls, pricePerNightEur,
    amenities, websiteUrl, whatsappNumber, internalNotes } = body;

  const suite = await db.recoverySuite.create({
    data: {
      name, city, country,
      description: description || null,
      photoUrls: photoUrls ?? [],
      pricePerNightEur: pricePerNightEur ? Number(pricePerNightEur) : null,
      amenities: amenities ?? [],
      websiteUrl: websiteUrl || null,
      whatsappNumber: whatsappNumber || null,
      internalNotes: internalNotes || null,
      isActive: true,
    },
  });
  return NextResponse.json(suite, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, ...data } = body;

  const suite = await db.recoverySuite.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.city !== undefined ? { city: data.city } : {}),
      ...(data.country !== undefined ? { country: data.country } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.photoUrls !== undefined ? { photoUrls: data.photoUrls } : {}),
      ...(data.pricePerNightEur !== undefined ? { pricePerNightEur: data.pricePerNightEur ? Number(data.pricePerNightEur) : null } : {}),
      ...(data.amenities !== undefined ? { amenities: data.amenities } : {}),
      ...(data.websiteUrl !== undefined ? { websiteUrl: data.websiteUrl } : {}),
      ...(data.whatsappNumber !== undefined ? { whatsappNumber: data.whatsappNumber } : {}),
      ...(data.internalNotes !== undefined ? { internalNotes: data.internalNotes } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
  return NextResponse.json(suite);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await db.recoverySuite.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
