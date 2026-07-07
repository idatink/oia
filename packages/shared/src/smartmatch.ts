import { db } from './db';

// ─── SmartMatch engine ───────────────────────────────────────────────────────
// Interpret → Filter → Score. Deterministic and explainable: every ranked
// provider carries the reasons it scored the way it did. Portfolio/tag
// similarity and per-technique experience enrich the score once that data
// exists; v1 ranks on accreditation (safety), specialism fit, and reviews.

export type PatientProfile = {
  procedure?: string; // free text: "facelift", "nose job"
  treatmentSlug?: string; // pre-resolved technique, if known
  concernTags?: string[]; // Oia-derived concern tags
  country?: string; // ISO alpha-2 of the patient, e.g. "GB"
  ageBand?: string; // "45-54"
  budget?: number; // GBP
  goalTags?: string[];
};

export type MatchedProvider = {
  id: string;
  surgeonName: string;
  clinicName: string | null;
  city: string | null;
  country: string;
  accreditations: string[];
  reviewRating: number | null;
  reviewCount: number | null;
  website: string | null;
  instagram: string | null;
  score: number; // 0–100
  reasons: string[];
};

export type MatchResult = {
  treatment: { name: string; slug: string; cluster: string | null } | null;
  cluster: string | null;
  candidates: string[]; // matchable treatment names considered
  providers: MatchedProvider[]; // ranked, top N
  note?: string; // e.g. out-of-scope explanation
};

const PILOT_COUNTRIES = ['GB', 'TR'];

// Accreditation → safety tier (0–1). Board / international bodies score highest.
function accredScore(accreditations: string[]): number {
  const s = accreditations.join(' ').toLowerCase();
  if (/ebopras|febopras|isaps|tprecd|epcd|\bfacs\b|\bfrcs\b|rhinoplasty society/.test(s)) return 1.0;
  if (/turkish board|\bboard\b/.test(s)) return 0.6;
  return 0.3; // affiliate / ENT / years-only / unstated
}

const CLUSTER_KEYWORDS: Record<string, string[]> = {
  Nose: ['rhino', 'nose'],
  Breast: ['breast', 'mammo'],
  Face: ['face', 'neck', 'brow', 'eyelid', 'bleph', 'lift'],
  Body: ['body', 'lipo', 'tummy', 'abdomin', 'contour', 'arm', 'gyneco', 'mommy', 'bariatric'],
  BBL: ['bbl', 'butt', 'buttock', 'brazilian'],
};

// Does the provider's free-text specialisms mention this cluster's work?
function specialismScore(specialisms: string | null, cluster: string | null): number {
  if (!specialisms || !cluster) return 0.5;
  const s = specialisms.toLowerCase();
  const kws = CLUSTER_KEYWORDS[cluster] || [];
  return kws.some(k => s.includes(k)) ? 1.0 : 0.5;
}

// Reviews → 0–1. Blends rating (quality) with a gentle volume factor; no data = neutral.
function reviewScore(rating: number | null, count: number | null): number {
  if (!rating) return 0.5;
  const quality = Math.min(1, rating / 5);
  const volume = Math.min(1, Math.log10((count || 0) + 1) / 2.5); // ~316 reviews saturates
  return 0.7 * quality + 0.3 * volume;
}

// Interpret: resolve the patient's words/tags to a matchable treatment + cluster.
async function interpret(profile: PatientProfile) {
  if (profile.treatmentSlug) {
    const t = await db.treatment.findUnique({
      where: { slug: profile.treatmentSlug },
      include: { category: true },
    });
    if (t && t.matchable) return { chosen: t, candidates: [t.name] };
  }

  const term = (profile.procedure || '').trim();
  const concernTags = profile.concernTags || [];

  // Candidates: name contains the term, OR concern-tag overlap.
  const matchable = await db.treatment.findMany({
    where: { matchable: true },
    include: { category: true },
  });

  const scored = matchable
    .map(t => {
      let s = 0;
      if (term && t.name.toLowerCase().includes(term.toLowerCase())) s += 2;
      const overlap = t.concernTags.filter(c => concernTags.includes(c)).length;
      s += overlap;
      return { t, s };
    })
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s);

  if (scored.length === 0) return { chosen: null, candidates: [] };
  return { chosen: scored[0].t, candidates: scored.slice(0, 5).map(x => x.t.name) };
}

export async function smartMatch(profile: PatientProfile, limit = 3): Promise<MatchResult> {
  const { chosen, candidates } = await interpret(profile);

  if (!chosen) {
    return { treatment: null, cluster: null, candidates: [], providers: [], note: 'no_matchable_treatment' };
  }
  const cluster = chosen.category.cluster;
  if (!cluster) {
    return {
      treatment: { name: chosen.name, slug: chosen.slug, cluster: null },
      cluster: null, candidates, providers: [], note: 'not_in_pilot_scope',
    };
  }

  // Filter: active providers in a pilot country that cover this cluster.
  const patientCountry = (profile.country || '').toUpperCase();
  const countries = PILOT_COUNTRIES.includes(patientCountry)
    ? [patientCountry, ...PILOT_COUNTRIES.filter(c => c !== patientCountry)]
    : PILOT_COUNTRIES;

  const eligible = await db.provider.findMany({
    where: { isActive: true, country: { in: countries }, clusters: { has: cluster } },
  });

  // Score.
  const ranked: MatchedProvider[] = eligible
    .map(p => {
      const acc = accredScore(p.accreditations);
      const spec = specialismScore(p.specialisms, cluster);
      const rev = reviewScore(p.reviewRating, p.reviewCount);
      const domestic = patientCountry && p.country === patientCountry ? 1 : 0;
      const score = 100 * (0.4 * acc + 0.35 * spec + 0.25 * rev) + 5 * domestic;

      const reasons: string[] = [];
      if (acc >= 1) reasons.push(`Board / international accreditation (${p.accreditations.slice(0, 2).join(', ')})`);
      else if (acc >= 0.6) reasons.push('Nationally board-certified');
      if (spec >= 1) reasons.push(`Specialises in ${cluster.toLowerCase()} work`);
      if (p.reviewRating) reasons.push(`${p.reviewRating}★ from ${p.reviewCount} reviews`);
      if (domestic) reasons.push('In your country');

      return {
        id: p.id, surgeonName: p.surgeonName, clinicName: p.clinicName, city: p.city,
        country: p.country, accreditations: p.accreditations, reviewRating: p.reviewRating,
        reviewCount: p.reviewCount, website: p.website, instagram: p.instagram,
        score: Math.round(score), reasons,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    treatment: { name: chosen.name, slug: chosen.slug, cluster },
    cluster, candidates, providers: ranked,
    note: ranked.length === 0 ? 'no_providers_in_scope' : undefined,
  };
}
