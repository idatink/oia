'use client';

import { useState } from 'react';

type Provider = {
  id: string;
  surgeonName: string;
  clinicName: string | null;
  city: string | null;
  country: string;
  accreditations: string[];
  reviewRating: number | null;
  reviewCount: number | null;
  score: number;
  reasons: string[];
};

type Result = {
  treatment: { name: string; slug: string; cluster: string | null } | null;
  cluster: string | null;
  candidates: string[];
  providers: Provider[];
  note?: string;
};

const COUNTRIES = [
  { code: '', label: 'Any (no home bonus)' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'TR', label: 'Turkey' },
  { code: 'ES', label: 'Spain' },
  { code: 'GR', label: 'Greece' },
  { code: 'LT', label: 'Lithuania' },
  { code: 'KR', label: 'South Korea' },
  { code: 'CH', label: 'Switzerland (out of pilot)' },
];

const EXAMPLES = ['tummy tuck', 'facelift', 'rhinoplasty', 'breast augmentation', 'BBL', 'liposuction'];

export default function SmartMatchPlayground() {
  const [procedure, setProcedure] = useState('tummy tuck');
  const [country, setCountry] = useState('GB');
  const [ageBand, setAgeBand] = useState('');
  const [concernTags, setConcernTags] = useState('');
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/smartmatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          procedure: procedure.trim() || undefined,
          country: country || undefined,
          ageBand: ageBand.trim() || undefined,
          concernTags: concernTags.trim() ? concernTags.split(',').map(s => s.trim()).filter(Boolean) : undefined,
          limit,
        }),
      });
      if (!res.ok) {
        setError(`Request failed (${res.status})`);
        setResult(null);
      } else {
        setResult(await res.json());
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const byCountry = result?.providers.reduce<Record<string, number>>((acc, p) => {
    acc[p.country] = (acc[p.country] || 0) + 1;
    return acc;
  }, {}) ?? {};

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f6f3f1]">
      {/* Header */}
      <div className="bg-white border-b border-[#dcc0ba]/30 px-6 py-5 shrink-0">
        <h1 className="text-xl font-serif text-[#1b1c1b] mb-0.5">SmartMatch Playground</h1>
        <p className="text-[11px] text-[#5c5f5c]">
          Run the matcher against any profile — scores &amp; reasons exposed. No model, no cost, no patient records touched.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Controls */}
        <div className="bg-white border-b border-[#dcc0ba]/30 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f5c]">Procedure</span>
              <input
                value={procedure}
                onChange={e => setProcedure(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && run()}
                placeholder="tummy tuck"
                className="px-3 py-2 text-sm border border-[#dcc0ba]/40 rounded-xl bg-[#f6f3f1] outline-none focus:border-[#99402b]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f5c]">Patient country</span>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="px-3 py-2 text-sm border border-[#dcc0ba]/40 rounded-xl bg-[#f6f3f1] outline-none focus:border-[#99402b]"
              >
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f5c]">Age band <span className="opacity-40">(optional)</span></span>
              <input
                value={ageBand}
                onChange={e => setAgeBand(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && run()}
                placeholder="35-44"
                className="px-3 py-2 text-sm border border-[#dcc0ba]/40 rounded-xl bg-[#f6f3f1] outline-none focus:border-[#99402b]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f5c]">Concern tags <span className="opacity-40">(comma-sep)</span></span>
              <input
                value={concernTags}
                onChange={e => setConcernTags(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && run()}
                placeholder="loose_skin, diastasis"
                className="px-3 py-2 text-sm border border-[#dcc0ba]/40 rounded-xl bg-[#f6f3f1] outline-none focus:border-[#99402b]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f5c]">Limit</span>
              <div className="flex gap-2">
                <input
                  type="number" min={1} max={24}
                  value={limit}
                  onChange={e => setLimit(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
                  className="w-20 px-3 py-2 text-sm border border-[#dcc0ba]/40 rounded-xl bg-[#f6f3f1] outline-none focus:border-[#99402b]"
                />
                <button
                  onClick={run}
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl bg-[#99402b] text-white transition-opacity disabled:opacity-40"
                >
                  {loading ? 'Matching…' : 'Match'}
                </button>
              </div>
            </label>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] text-[#5c5f5c]/60">Try:</span>
            {EXAMPLES.map(ex => (
              <button
                key={ex}
                onClick={() => { setProcedure(ex); }}
                className="text-[11px] px-2 py-0.5 rounded-full bg-[#99402b]/8 text-[#99402b] hover:bg-[#99402b]/16"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="px-6 py-5">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</div>
          )}

          {result && (
            <>
              {/* Interpretation summary */}
              <div className="bg-white rounded-2xl border border-[#dcc0ba]/30 px-5 py-4 mb-5">
                {result.treatment ? (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#5c5f5c] block">Resolved treatment</span>
                      <span className="font-semibold text-[#1b1c1b]">{result.treatment.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#5c5f5c] block">Cluster</span>
                      <span className="font-semibold text-[#1b1c1b]">{result.cluster ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#5c5f5c] block">Matches</span>
                      <span className="font-semibold text-[#1b1c1b]">{result.providers.length}</span>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <span className="text-[10px] uppercase tracking-wider text-[#5c5f5c] block">By country</span>
                      <span className="text-[#1b1c1b] text-[13px]">
                        {Object.entries(byCountry).map(([c, n]) => `${c} ${n}`).join(' · ') || '—'}
                      </span>
                    </div>
                    {result.candidates.length > 1 && (
                      <div className="flex-1 min-w-[200px]">
                        <span className="text-[10px] uppercase tracking-wider text-[#5c5f5c] block">Also considered</span>
                        <span className="text-[#5c5f5c] text-[12px]">{result.candidates.slice(1).join(', ')}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-[#1b1c1b]">No matchable treatment resolved from that input.</div>
                )}
                {result.note && (
                  <div className="mt-3 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    note: <code>{result.note}</code>
                    {result.note === 'no_providers_in_scope' && ' — treatment resolved but no active providers cover this cluster in a pilot country.'}
                    {result.note === 'no_matchable_treatment' && ' — the procedure text didn’t map to any matchable treatment.'}
                    {result.note === 'not_in_pilot_scope' && ' — resolved treatment has no cluster assigned.'}
                  </div>
                )}
              </div>

              {/* Ranked providers */}
              {result.providers.length > 0 && (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-[#5c5f5c] border-b border-[#dcc0ba]/30">
                      <th className="px-3 py-3 w-10">#</th>
                      <th className="px-3 py-3 w-16">Score</th>
                      <th className="px-3 py-3">Surgeon</th>
                      <th className="px-3 py-3">Clinic / City</th>
                      <th className="px-3 py-3 w-16">Country</th>
                      <th className="px-3 py-3">Accreditations</th>
                      <th className="px-3 py-3">Reviews</th>
                      <th className="px-3 py-3">Why (reasons)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.providers.map((p, i) => (
                      <tr key={p.id} className="border-b border-[#dcc0ba]/15 align-top hover:bg-white transition-colors">
                        <td className="px-3 py-3 text-sm text-[#5c5f5c]">{i + 1}</td>
                        <td className="px-3 py-3">
                          <span className="inline-block px-2 py-0.5 rounded-lg text-sm font-bold bg-[#99402b]/10 text-[#99402b]">{p.score}</span>
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-[#1b1c1b]">{p.surgeonName}</td>
                        <td className="px-3 py-3 text-[13px] text-[#5c5f5c]">
                          {p.clinicName || '—'}{p.city ? <span className="block text-[11px] opacity-70">{p.city}</span> : null}
                        </td>
                        <td className="px-3 py-3 text-sm text-[#5c5f5c]">{p.country}</td>
                        <td className="px-3 py-3 text-[11px] text-[#5c5f5c]">{p.accreditations.join(', ') || '—'}</td>
                        <td className="px-3 py-3 text-[12px] text-[#5c5f5c] whitespace-nowrap">
                          {p.reviewRating ? `${p.reviewRating}★ (${p.reviewCount ?? 0})` : '—'}
                        </td>
                        <td className="px-3 py-3 text-[12px] text-[#5c5f5c]">
                          {p.reasons.length ? (
                            <ul className="list-disc list-inside space-y-0.5">
                              {p.reasons.map((r, j) => <li key={j}>{r}</li>)}
                            </ul>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {!result && !error && (
            <div className="text-center py-16 text-sm text-[#5c5f5c]">Enter a profile and hit Match to see the ranked shortlist.</div>
          )}
        </div>
      </div>
    </div>
  );
}
