import { NextResponse } from 'next/server';
import { smartMatch } from '@nia/shared/src/smartmatch';

export const dynamic = 'force-dynamic';

// The web concierge "your matches" gallery now runs the real SmartMatch engine
// (the same one Oia calls on WhatsApp) against the provider table — deterministic,
// accreditation-first, every match carrying plain-language reasons. This replaces
// the old legacy `clinic`-table keyword lookup so web and WhatsApp match identically.
//
// Results are mapped into the ClinicCardData shape the concierge UI already renders,
// so no frontend change is needed: the surgeon is the hero (card title), the clinic
// name + warm reasons sit in the blurb, and the raw 0–100 score is NEVER surfaced to
// the patient (niaScore: null) — the reasons carry the "why", per the SmartMatch doctrine.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const procedure = searchParams.get('procedure') ?? '';
  const country = searchParams.get('country') ?? undefined;
  const lp = searchParams.get('locationPreference');
  const locationPreference = (lp === 'local' || lp === 'travel' || lp === 'both') ? lp : undefined;
  // Chat shows a shortlist (default 5); the full "match room" page passes a
  // higher limit to show the patient every surgeon who fits her goals.
  const limit = Math.min(Number(searchParams.get('limit')) || 5, 200);

  const result = await smartMatch({ procedure, country, locationPreference }, limit);

  return NextResponse.json(
    result.providers.map(p => ({
      id: p.id,
      name: p.surgeonName,
      city: p.city ?? '',
      country: p.country,
      description: [p.clinicName, p.reasons.join(' · ')].filter(Boolean).join(' — '),
      niaScore: null, // never surface the raw match score to the patient
      accreditations: p.accreditations,
      specialties: [],
      website: p.website,
      photoUrl: null,
    })),
  );
}
