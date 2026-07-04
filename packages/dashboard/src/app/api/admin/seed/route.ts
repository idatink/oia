import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const secret = process.env.SEED_SECRET;
  const auth = req.headers.get('x-seed-secret');
  if (!secret || auth !== secret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const results: string[] = [];

  // Clinic
  const clinic = await db.clinic.upsert({
    where: { slug: 'nia-demo-clinic' },
    create: { name: 'Nia Demo Clinic', slug: 'nia-demo-clinic', country: 'KR', city: 'Seoul', description: 'Premium cosmetic surgery clinic in the Gangnam district.', isVerified: true, isActive: true },
    update: {},
  });
  results.push(`clinic: ${clinic.id}`);

  // Coordinator
  const passwordHash = await bcrypt.hash('nia-demo-2024', 12);
  const coordUser = await db.user.upsert({
    where: { email: 'coordinator@nia-demo.com' },
    create: { email: 'coordinator@nia-demo.com', name: 'Dr. Aldrich', role: 'COORDINATOR', passwordHash },
    update: { passwordHash },
  });
  const coordinator = await db.coordinator.upsert({
    where: { userId: coordUser.id },
    create: { userId: coordUser.id, clinicId: clinic.id, isOnDuty: true },
    update: {},
  });
  results.push(`coordinator: ${coordUser.id} → clinic ${clinic.id}`);

  // Procedures
  const procs = await Promise.all([
    db.procedure.upsert({ where: { slug: 'rhinoplasty' }, create: { slug: 'rhinoplasty', name: 'Rhinoplasty', category: 'FACIAL' }, update: {} }),
    db.procedure.upsert({ where: { slug: 'facelift' }, create: { slug: 'facelift', name: 'Face Lift', category: 'FACIAL' }, update: {} }),
    db.procedure.upsert({ where: { slug: 'blepharoplasty' }, create: { slug: 'blepharoplasty', name: 'Blepharoplasty', category: 'FACIAL' }, update: {} }),
    db.procedure.upsert({ where: { slug: 'tummy-tuck' }, create: { slug: 'tummy-tuck', name: 'Tummy Tuck (Abdominoplasty)', category: 'BODY' }, update: {} }),
    db.procedure.upsert({ where: { slug: 'liposuction-flanks' }, create: { slug: 'liposuction-flanks', name: 'Liposuction / Flanks', category: 'BODY' }, update: {} }),
    db.procedure.upsert({ where: { slug: 'arm-lift' }, create: { slug: 'arm-lift', name: 'Arm Lift (Brachioplasty)', category: 'BODY' }, update: {} }),
    db.procedure.upsert({ where: { slug: 'thigh-lift' }, create: { slug: 'thigh-lift', name: 'Thigh Lift', category: 'BODY' }, update: {} }),
    db.procedure.upsert({ where: { slug: '360-body-lift' }, create: { slug: '360-body-lift', name: '360 Body Lift', category: 'BODY' }, update: {} }),
  ]);
  results.push(`procedures: ${procs.map(p => p.slug).join(', ')}`);

  return NextResponse.json({ ok: true, coordinatorUserId: coordUser.id, clinicId: clinic.id, results });
}
