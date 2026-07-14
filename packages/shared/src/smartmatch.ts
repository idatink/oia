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
  locationPreference?: 'local' | 'travel' | 'both'; // patient's choice: home only, abroad, or compare both
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

const PILOT_COUNTRIES = ['GB', 'TR', 'ES', 'GR', 'LT', 'KR'];

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

// Colloquial procedure phrase → cluster. Patients rarely say "abdominoplasty";
// they say "tummy tuck", "nose job", "eye lift", "boob job". interpret() falls back
// to this when a term doesn't substring-match any treatment NAME. ORDER MATTERS:
// specific clusters are tested before Face (whose bare "lift" would otherwise grab
// "butt lift" / "breast lift"), so the Face pattern uses explicit compounds only.
// Leading \b anchors to a word start; NO trailing \b, so medical stems match their
// full words too — "abdomin" → "abdominoplasty", "rhino" → "rhinoplasty",
// "bleph" → "blepharoplasty", "mammo" → "mammoplasty", "gyneco" → "gynecomastia".
const CLUSTER_PATTERNS: [string, RegExp][] = [
  ['BBL',    /\b(bbl|brazilian|butt|buttock|booty|glute)/],
  ['Nose',   /\b(nose|rhino|nostril|septum|deviated|bridge|hump)/],
  ['Breast', /\b(breast|boob|mammo|areola|nipple|cleavage|uplift)/],
  ['Face',   /\b(face|eyelid|eye|bleph|brow|forehead|neck|jaw|jowl|chin|cheek|wrinkle|nasolabial|ptosis|droopy|hooded)/],
  ['Body',   /\b(tummy|abdomin|lipo|contour|arm ?lift|thigh|mommy|love ?handle|gyneco|bariatric|body|fat ?removal)/],
];

// Representative matchable treatment per cluster, used when the term maps to a
// cluster but no specific technique name matches.
const CLUSTER_HERO: Record<string, string> = {
  Nose: 'rhinoplasty',
  Breast: 'breast-augmentation',
  Face: 'facelift',
  Body: 'tummy-tuck',
  BBL: 'brazilian-butt-lift',
};

function clusterFromTerm(term: string): string | null {
  for (const [cluster, re] of CLUSTER_PATTERNS) if (re.test(term)) return cluster;
  return null;
}

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
  const termLc = term.toLowerCase();
  const concernTags = profile.concernTags || [];
  const STOP = new Set(['the', 'and', 'for', 'surgery', 'procedure', 'job', 'lift', 'reduction', 'my', 'area']);
  const termTokens = termLc.split(/[^a-z]+/).filter(w => w.length >= 3 && !STOP.has(w));

  const matchable = await db.treatment.findMany({
    where: { matchable: true },
    include: { category: true },
  });

  // Precise pass: full-phrase or per-token name/alias substring, plus concern tags.
  const scored = matchable
    .map(t => {
      const nameLc = t.name.toLowerCase();
      let s = 0;
      if (termLc && nameLc.includes(termLc)) s += 3; // whole phrase in the name
      for (const tok of termTokens) if (nameLc.includes(tok)) s += 1; // significant token
      const overlap = t.concernTags.filter(c => concernTags.includes(c)).length;
      s += overlap;
      return { t, s };
    })
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s);

  if (scored.length > 0) return { chosen: scored[0].t, candidates: scored.slice(0, 5).map(x => x.t.name) };

  // Fallback: no treatment name matched (colloquial term like "eye lift"). Detect
  // the cluster from the patient's words and match within it — providers are matched
  // by cluster anyway, so the right SURGEONS surface even when the exact technique
  // label is loose. This is what stops colloquial terms from silently returning zero.
  const cluster = clusterFromTerm(termLc);
  if (cluster) {
    const inCluster = matchable.filter(t => t.category?.cluster === cluster);
    if (inCluster.length > 0) {
      // Prefer a technique whose name shares the earliest significant token; else the
      // cluster's hero treatment; else any matchable treatment in the cluster.
      let chosen = null as (typeof inCluster)[number] | null;
      for (const tok of termTokens) {
        const hit = inCluster.find(t => t.name.toLowerCase().includes(tok));
        if (hit) { chosen = hit; break; }
      }
      chosen = chosen ?? inCluster.find(t => t.slug === CLUSTER_HERO[cluster]) ?? inCluster[0];
      return { chosen, candidates: [chosen.name] };
    }
  }

  return { chosen: null, candidates: [] };
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

  // Filter: active providers that cover this cluster, in the countries the patient's
  // locationPreference allows.
  //  - local        → their own country only (0 results → honest "no local yet", handled by caller)
  //  - travel / both → the full accredited network (their country ranked first if it's in scope)
  //  - unset         → network (backwards-compatible default)
  const patientCountry = (profile.country || '').toUpperCase();
  const countries = profile.locationPreference === 'local'
    ? (patientCountry ? [patientCountry] : [])
    : PILOT_COUNTRIES.includes(patientCountry)
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

  // Distinguish "no surgeons in your own country yet" (local preference, empty) from a
  // general empty result — so the caller can be honest about local supply.
  const note = ranked.length > 0
    ? undefined
    : profile.locationPreference === 'local'
      ? 'no_local_providers'
      : 'no_providers_in_scope';

  return {
    treatment: { name: chosen.name, slug: chosen.slug, cluster },
    cluster, candidates, providers: ranked,
    note,
  };
}
