'use client';

/* Stage-3 side-by-side comparison — the deep-dive results for the patient's
   shortlist (real packages, availability and notes gathered by the team from
   the clinics). Prices shown are REAL indicative quotes entered by the team,
   never model-generated — labelled indicative until confirmed at booking. */

export interface CompareEntry {
  name: string;
  country?: string;
  city?: string;
  price?: string;
  includes?: string;
  availability?: string;
  notes?: string;
}

const COUNTRY_NAMES: Record<string, string> = {
  TR: 'Turkey', GB: 'United Kingdom', DE: 'Germany', LT: 'Lithuania', ES: 'Spain',
  GR: 'Greece', LB: 'Lebanon', AE: 'UAE', KR: 'South Korea', CY: 'Cyprus', IR: 'Iran',
};
const countryLabel = (c?: string) => (c ? COUNTRY_NAMES[c] ?? c : '');

export default function CompareClient({ name, procedure, entries }:
  { name?: string | null; procedure: string; entries: CompareEntry[] }) {
  return (
    <div className="min-h-screen bg-surface-container-lowest">
      <header className="px-6 pt-14 pb-8 max-w-6xl mx-auto text-center">
        <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-3">Your comparison</span>
        <h1 className="font-display text-3xl md:text-5xl text-on-surface leading-tight">
          {name ? `${name}, here` : 'Here'} is the full picture for <span className="italic text-primary">{procedure}</span>.
        </h1>
        <p className="font-body text-body-md text-on-surface-variant max-w-xl mx-auto mt-5 leading-relaxed">
          I went deep on each of your picks — real packages, availability and the details that matter,
          side by side. Take your time; when one feels right, just tell me on WhatsApp and I&apos;ll take it from there.
        </p>
      </header>

      <main className="px-6 pb-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((e, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-card2 overflow-hidden border border-outline-variant/20 shadow-card flex flex-col">
              <div className="px-5 pt-5 pb-4 border-b border-outline-variant/10">
                <p className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                  {[e.city, countryLabel(e.country)].filter(Boolean).join(', ')}
                </p>
                <h2 className="font-display text-xl text-on-surface leading-snug">{e.name}</h2>
              </div>
              <div className="px-5 py-4 flex flex-col gap-3 flex-1">
                {e.price && (
                  <div>
                    <p className="font-body text-[10px] uppercase tracking-wider text-on-surface-variant">Indicative package</p>
                    <p className="font-display text-2xl text-primary">{e.price}</p>
                    <p className="font-body text-[10px] text-on-surface-variant/70">confirmed at booking — never more without your say-so</p>
                  </div>
                )}
                {e.includes && (
                  <div>
                    <p className="font-body text-[10px] uppercase tracking-wider text-on-surface-variant mb-0.5">What&apos;s included</p>
                    <p className="font-body text-body-sm text-on-surface leading-relaxed">{e.includes}</p>
                  </div>
                )}
                {e.availability && (
                  <div>
                    <p className="font-body text-[10px] uppercase tracking-wider text-on-surface-variant mb-0.5">Availability</p>
                    <p className="font-body text-body-sm text-on-surface">{e.availability}</p>
                  </div>
                )}
                {e.notes && (
                  <p className="font-body text-body-sm text-on-surface-variant leading-relaxed border-t border-outline-variant/10 pt-3 mt-auto">{e.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-surface border-t border-outline-variant/30 px-6 py-10 text-center">
        <p className="font-display italic text-xl text-on-surface mb-1">One of them feel right?</p>
        <p className="font-body text-body-sm text-on-surface-variant mb-4">
          Tell Oia which — she&apos;ll negotiate the final details and hold nothing back on your behalf.
        </p>
        <a
          href="https://wa.me/447752991023"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary text-on-primary font-body text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-all"
        >
          Message Oia on WhatsApp
        </a>
      </footer>
    </div>
  );
}
