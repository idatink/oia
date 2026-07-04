import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

const DEFAULTS = [
  { key: 'persona.tone', value: 'warm', label: 'Conversation Tone', category: 'persona' },
  { key: 'persona.name', value: 'Nia', label: 'AI Name', category: 'persona' },
  { key: 'persona.language', value: 'en', label: 'Default Language', category: 'persona' },
  { key: 'suitability.minAiScore', value: 50, label: 'Min AI Score to Share Lead', category: 'suitability' },
  { key: 'suitability.requirePhotos', value: true, label: 'Require Photos Before Sharing', category: 'suitability' },
  { key: 'suitability.requireMedicalScreening', value: true, label: 'Require Medical Screening', category: 'suitability' },
  { key: 'intake.maxPhotos', value: 5, label: 'Max Photos per Intake', category: 'intake' },
  { key: 'intake.photoPrompt', value: 'Please share photos of the treatment area so I can assess your case accurately.', label: 'Photo Request Message', category: 'intake' },
  { key: 'matching.maxClinicsPerLead', value: 5, label: 'Max Clinics per Lead', category: 'matching' },
  { key: 'matching.offerWindowHours', value: 48, label: 'Offer Collection Window (hours)', category: 'matching' },
];

export async function GET() {
  const saved = await db.niaConfig.findMany();
  const savedMap = Object.fromEntries(saved.map(s => [s.key, s]));

  const config = DEFAULTS.map(d => ({
    ...d,
    value: savedMap[d.key]?.value ?? d.value,
    updatedAt: savedMap[d.key]?.updatedAt ?? null,
    updatedBy: savedMap[d.key]?.updatedBy ?? null,
  }));

  return NextResponse.json(config);
}

export async function PATCH(req: Request) {
  const updates: { key: string; value: unknown }[] = await req.json();
  const results = await Promise.all(
    updates.map(u =>
      db.niaConfig.upsert({
        where: { key: u.key },
        create: {
          key: u.key,
          value: u.value as never,
          label: DEFAULTS.find(d => d.key === u.key)?.label ?? u.key,
          category: DEFAULTS.find(d => d.key === u.key)?.category ?? 'general',
        },
        update: { value: u.value as never },
        select: { key: true, value: true, updatedAt: true },
      })
    )
  );
  return NextResponse.json(results);
}
