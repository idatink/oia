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

const SHORTLIST_CAP = 10;

export default function MatchRoomClient({ procedure, country: homeRaw, name, locationPreference, token, canShortlist }:
  { procedure: string; country?: string; name?: string; locationPreference?: 'local' | 'travel' | 'both'; token?: string; canShortlist?: boolean }) {
  const home = (homeRaw || '').toUpperCase();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  // view: 'all' | 'local' | 'abroad' | <countryCode>
  const [view, setView] = useState<string>('all');
  // Stage-2 shortlist: pick up to 10, send to Oia (see INTAKE_REDESIGN.md funnel).
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const toggleSelect = (id: string) => {
    if (sent) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < SHORTLIST_CAP) next.add(id);
      return next;
    });
  };

  const sendShortlist = async () => {
    if (!token || sending || sent || selected.size === 0) return;
    setSending(true);
    try {
      const providers = matches.filter(m => selected.has(m.id)).map(m => ({ id: m.id, name: m.name, country: m.country }));
      const res = await fetch('/api/shortlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, providers }),
      });
      if (res.ok) setSent(true);
    } catch { /* leave the bar so they can retry */ }
    setSending(false);
  };

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
          {canShortlist
            ? <>Every surgeon here is vetted for accreditation and specialism. Take your time — tap the ♡ on the ones that draw you (up to {SHORTLIST_CAP}), send them to Oia, and she&apos;ll go deeper on each: real before-and-afters, availability and full packages.</>
            : <>Every surgeon here fits your goals — vetted for accreditation and specialism. Take your time exploring, then tell Oia which ones draw you and she&apos;ll go deeper on each.</>}
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
            {shown.map(m => (
              <MatchCard
                key={m.id}
                m={m}
                selectable={!!canShortlist && !sent}
                selected={selected.has(m.id)}
                onToggle={() => toggleSelect(m.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Sticky shortlist bar */}
      {canShortlist && (selected.size > 0 || sent) && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest/95 backdrop-blur border-t border-outline-variant/30 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            {sent ? (
              <p className="font-body text-body-sm text-on-surface flex-1 text-center">
                <span className="font-semibold text-green-500">Sent to Oia ✓</span>
                {' '}— she&apos;s going deeper on your {selected.size} pick{selected.size > 1 ? 's' : ''} and will come back with before/afters, availability and packages.
              </p>
            ) : (
              <>
                <p className="font-body text-body-sm text-on-surface">
                  <span className="font-semibold">{selected.size} of {SHORTLIST_CAP}</span> selected
                  {selected.size >= SHORTLIST_CAP && <span className="text-on-surface-variant"> — that&apos;s the limit, choose your favourites</span>}
                </p>
                <button
                  onClick={sendShortlist}
                  disabled={sending}
                  className="bg-primary text-on-primary font-body text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {sending ? 'Sending…' : 'Send my shortlist to Oia'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <footer className="bg-surface border-t border-outline-variant/30 px-6 py-10 pb-28 text-center">
        <p className="font-display italic text-xl text-on-surface mb-1">Found the ones that feel right?</p>
        <p className="font-body text-body-sm text-on-surface-variant">
          {canShortlist
            ? <>Tap the ♡ on your favourites and send them to Oia — she&apos;ll go deeper on each and get you the full picture.</>
            : <>Message Oia with their names — she&apos;ll get you the partner rate and handle the rest.</>}
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

function MatchCard({ m, selectable, selected, onToggle }: { m: Match; selectable?: boolean; selected?: boolean; onToggle?: () => void }) {
  const hasClinic = m.description.includes(' — ');
  const clinic = hasClinic ? m.description.split(' — ')[0] : '';
  const reasons = hasClinic ? m.description.split(' — ').slice(1).join(' — ') : m.description;
  return (
    <div className={`bg-surface-container-lowest rounded-card2 overflow-hidden border shadow-card hover:shadow-concierge transition-all flex flex-col ${
      selected ? 'border-primary ring-1 ring-primary/40' : 'border-outline-variant/20 hover:border-primary/30'
    }`}>
      <div className="h-28 bg-gradient-to-br from-secondary-container to-tertiary-fixed relative">
        <span className="absolute bottom-3 left-3 bg-on-surface/70 text-inverse-on-surface px-2.5 py-1 rounded-full font-body text-[10px] uppercase tracking-widest font-semibold">
          {m.city ? `${m.city}, ` : ''}{countryLabel(m.country)}
        </span>
        {selectable && (
          <button
            onClick={onToggle}
            aria-label={selected ? 'Remove from shortlist' : 'Add to shortlist'}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              selected ? 'bg-primary text-on-primary' : 'bg-white/85 text-on-surface hover:bg-white'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill={selected ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
            </svg>
          </button>
        )}
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
