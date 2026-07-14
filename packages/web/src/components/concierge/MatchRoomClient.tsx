'use client';

import { useEffect, useMemo, useState } from 'react';

/* The "match room" grid — the browse/compare surface chat can't be. Rendered by
   /matches/[token] after the signed token is verified server-side. Powered by
   the same SmartMatch engine as chat (/api/clinics), just a fuller, filterable view. */

interface Match {
  id: string;
  name: string;
  city: string;
  country: string;
  description: string;
  accreditations: string[];
  website: string | null;
}

const COUNTRY_NAMES: Record<string, string> = {
  TR: 'Turkey', GB: 'United Kingdom', DE: 'Germany', LT: 'Lithuania', ES: 'Spain',
  GR: 'Greece', LB: 'Lebanon', AE: 'UAE', KR: 'South Korea', CY: 'Cyprus', IR: 'Iran',
};
const countryLabel = (c: string) => COUNTRY_NAMES[c] ?? c;

export default function MatchRoomClient({ procedure, country: homeRaw, name, locationPreference }:
  { procedure: string; country?: string; name?: string; locationPreference?: 'local' | 'travel' | 'both' }) {
  const home = (homeRaw || '').toUpperCase();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  // view: 'all' | 'local' | 'abroad' | <countryCode>
  const [view, setView] = useState<string>('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Full network so the patient can browse/compare everything; home country
        // passed so it ranks first. Grouping into local vs abroad happens client-side.
        const q = `procedure=${encodeURIComponent(procedure)}&limit=200${home ? `&country=${encodeURIComponent(home)}` : ''}`;
        const res = await fetch(`/api/clinics?${q}`);
        setMatches(res.ok ? await res.json() : []);
      } catch { setMatches([]); }
      setLoading(false);
    })();
  }, [procedure, home]);

  const localMatches = useMemo(() => home ? matches.filter(m => m.country === home) : [], [matches, home]);
  const abroadMatches = useMemo(() => home ? matches.filter(m => m.country !== home) : matches, [matches, home]);
  const countries = useMemo(() => Array.from(new Set(matches.map(m => m.country))).sort(), [matches]);

  // Default the view to the patient's stated preference, but only land on "local" if
  // there's actually something there — otherwise "all", so they never hit a blank first.
  useEffect(() => {
    if (loading) return;
    if (locationPreference === 'local' && localMatches.length > 0) setView('local');
    else setView('all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const shown = view === 'all' ? matches
    : view === 'local' ? localMatches
    : view === 'abroad' ? abroadMatches
    : matches.filter(m => m.country === view);

  const showLocalAbroad = home && localMatches.length >= 0 && abroadMatches.length > 0;

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      <header className="px-6 pt-14 pb-8 max-w-6xl mx-auto text-center">
        <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-3">Your matches</span>
        <h1 className="font-display text-3xl md:text-5xl text-on-surface leading-tight">
          {name ? `${name}, here` : 'Here'} are your surgeons for <span className="italic text-primary">{procedure}</span>.
        </h1>
        <p className="font-body text-body-md text-on-surface-variant max-w-xl mx-auto mt-5 leading-relaxed">
          Every surgeon here fits your goals — vetted for accreditation, specialism and real patient reviews.
          Take your time exploring, then tell Oia which two or three draw you and she&apos;ll secure your rates.
        </p>
      </header>

      {matches.length > 0 && (
        <div className="px-6 max-w-6xl mx-auto flex flex-wrap gap-2 justify-center mb-10">
          <FilterChip active={view === 'all'} onClick={() => setView('all')}>
            All ({matches.length})
          </FilterChip>
          {showLocalAbroad && (
            <>
              <FilterChip active={view === 'local'} onClick={() => setView('local')}>
                Local · {countryLabel(home)} ({localMatches.length})
              </FilterChip>
              <FilterChip active={view === 'abroad'} onClick={() => setView('abroad')}>
                Abroad ({abroadMatches.length})
              </FilterChip>
            </>
          )}
          {countries.map(c => (
            <FilterChip key={c} active={view === c} onClick={() => setView(c)}>
              {countryLabel(c)} ({matches.filter(m => m.country === c).length})
            </FilterChip>
          ))}
        </div>
      )}

      <main className="px-6 pb-20 max-w-6xl mx-auto">
        {loading ? (
          <p className="text-center font-body text-on-surface-variant py-20">Finding your matches…</p>
        ) : view === 'local' && localMatches.length === 0 ? (
          <div className="text-center py-20 max-w-lg mx-auto">
            <p className="font-body text-body-md text-on-surface mb-2">
              We don&apos;t have vetted surgeons in {home ? countryLabel(home) : 'your country'} yet.
            </p>
            <p className="font-body text-body-sm text-on-surface-variant">
              Our network there is still growing. In the meantime, here are excellent international options —{' '}
              <button className="text-primary underline" onClick={() => setView('abroad')}>see them</button>.
            </p>
          </div>
        ) : shown.length === 0 ? (
          <p className="text-center font-body text-on-surface-variant py-20">
            No matches in this filter yet — new destinations join as our network grows.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shown.map(m => <MatchCard key={m.id} m={m} />)}
          </div>
        )}
      </main>

      <footer className="bg-surface border-t border-outline-variant/30 px-6 py-10 text-center">
        <p className="font-display italic text-xl text-on-surface mb-1">Found the ones that feel right?</p>
        <p className="font-body text-body-sm text-on-surface-variant">
          Message Oia with their names — she&apos;ll get you the partner rate and handle the rest.
        </p>
      </footer>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`font-body text-body-sm px-4 py-2 rounded-full border transition-all ${
        active
          ? 'bg-primary text-on-primary border-primary'
          : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/40 hover:border-primary/40'
      }`}
    >
      {children}
    </button>
  );
}

function MatchCard({ m }: { m: Match }) {
  const hasClinic = m.description.includes(' — ');
  const clinic = hasClinic ? m.description.split(' — ')[0] : '';
  const reasons = hasClinic ? m.description.split(' — ').slice(1).join(' — ') : m.description;
  return (
    <div className="bg-surface-container-lowest rounded-card2 overflow-hidden border border-outline-variant/20 shadow-card hover:shadow-concierge hover:border-primary/30 transition-all flex flex-col">
      <div className="h-28 bg-gradient-to-br from-secondary-container to-tertiary-fixed relative">
        <span className="absolute bottom-3 left-3 bg-on-surface/70 text-inverse-on-surface px-2.5 py-1 rounded-full font-body text-[10px] uppercase tracking-widest font-semibold">
          {m.city ? `${m.city}, ` : ''}{countryLabel(m.country)}
        </span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display text-xl text-on-surface mb-2 leading-snug">{m.name}</h3>
        {m.accreditations.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {m.accreditations.slice(0, 3).map(a => (
              <span key={a} className="bg-primary-fixed/30 text-primary px-2 py-0.5 rounded font-body text-[9px] uppercase tracking-wider font-semibold">
                {a}
              </span>
            ))}
          </div>
        )}
        {clinic && <p className="font-body text-body-sm text-on-surface-variant leading-relaxed mb-1">{clinic}</p>}
        <p className="font-body text-body-sm text-on-surface-variant/80 leading-relaxed flex-1">{reasons}</p>
        {m.website && (
          <a href={m.website.startsWith('http') ? m.website : `https://${m.website}`} target="_blank" rel="noopener noreferrer"
            className="mt-4 font-body text-[11px] font-semibold uppercase tracking-wider text-primary hover:opacity-80">
            View profile →
          </a>
        )}
      </div>
    </div>
  );
}
