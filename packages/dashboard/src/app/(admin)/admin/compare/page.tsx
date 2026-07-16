'use client';

import { useEffect, useState } from 'react';

/* Stage-3 deep-dive delivery tool (INTAKE_REDESIGN.md → match→clinic funnel).
   Work queue = patient shortlists from the match room. For each: the team runs
   the clinic conversations (Clinic-mode playbook), enters the REAL results here
   (package, inclusions, availability), and sends — the patient gets a side-by-
   side /compare page + a WhatsApp ping. Prices must come from actual clinic
   quotes: this form is the honesty gate, nothing here is model-generated. */

type Shortlist = {
  messageId: string;
  createdAt: string;
  phone: string | null;
  patientName: string | null;
  procedure: string | null;
  providers: Array<{ id: string; name: string; country: string }>;
};

type EntryDraft = {
  include: boolean;
  name: string;
  country?: string;
  city: string;
  price: string;
  includes: string;
  availability: string;
  notes: string;
};

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ComparePage() {
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Shortlist | null>(null);
  const [drafts, setDrafts] = useState<EntryDraft[]>([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ link: string; whatsappQueued: boolean } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/compare');
        const data = await res.json();
        setShortlists(data.shortlists ?? []);
      } catch { /* empty list */ }
      setLoading(false);
    })();
  }, []);

  const open = (s: Shortlist) => {
    setActive(s);
    setResult(null);
    setError('');
    setDrafts(s.providers.map(p => ({
      include: true, name: p.name, country: p.country, city: '', price: '', includes: '', availability: '', notes: '',
    })));
  };

  const setDraft = (i: number, patch: Partial<EntryDraft>) =>
    setDrafts(d => d.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const send = async () => {
    if (!active || sending) return;
    const entries = drafts.filter(d => d.include && d.name).map(d => ({
      name: d.name, country: d.country, city: d.city || undefined, price: d.price || undefined,
      includes: d.includes || undefined, availability: d.availability || undefined, notes: d.notes || undefined,
    }));
    if (entries.length === 0) { setError('Include at least one surgeon.'); return; }
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/admin/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: active.phone, name: active.patientName ?? undefined,
          procedure: active.procedure ?? undefined, entries,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) setResult({ link: data.link, whatsappQueued: !!data.whatsappQueued });
      else setError(data.error || 'Failed to send');
    } catch {
      setError('Network error — try again');
    }
    setSending(false);
  };

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold mb-1">Deep-dive comparisons</h1>
      <p className="text-sm text-gray-500 mb-6">
        Patient shortlists from the match room. Run the clinic conversations, enter the real
        packages below, and send — the patient gets a side-by-side compare page + WhatsApp ping.
      </p>

      {loading ? (
        <p className="text-sm text-gray-400">Loading shortlists…</p>
      ) : shortlists.length === 0 ? (
        <p className="text-sm text-gray-400">No patient shortlists yet — they appear here the moment a patient sends one from her match room.</p>
      ) : (
        <div className="space-y-2 mb-8">
          {shortlists.map(s => (
            <button
              key={s.messageId}
              onClick={() => open(s)}
              className={`w-full text-left border rounded-lg px-4 py-3 hover:border-gray-400 transition-colors ${active?.messageId === s.messageId ? 'border-gray-800 bg-gray-50' : 'border-gray-200'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">
                  {s.patientName ?? s.phone ?? 'Unknown'} — {s.procedure ?? 'procedure'} · {s.providers.length} pick{s.providers.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-gray-400">{timeAgo(s.createdAt)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">{s.providers.map(p => p.name.split(',')[0]).join(' · ')}</p>
            </button>
          ))}
        </div>
      )}

      {active && (
        <div className="border-t pt-6">
          <h2 className="text-lg font-medium mb-1">
            {active.patientName ?? active.phone} — {active.procedure ?? 'procedure'}
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Enter ONLY real results from the clinic conversations. Leave a field blank if you don&apos;t have it — the patient page hides empty fields.
          </p>

          <div className="space-y-4">
            {drafts.map((d, i) => (
              <div key={i} className={`border rounded-lg p-4 ${d.include ? 'border-gray-300' : 'border-gray-200 opacity-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">{d.name} <span className="text-xs text-gray-400">({d.country})</span></p>
                  <label className="text-xs text-gray-500 flex items-center gap-1.5">
                    <input type="checkbox" checked={d.include} onChange={e => setDraft(i, { include: e.target.checked })} />
                    include
                  </label>
                </div>
                {d.include && (
                  <div className="grid grid-cols-2 gap-3">
                    <input className="border rounded px-3 py-2 text-sm" placeholder="City (e.g. Istanbul)" value={d.city} onChange={e => setDraft(i, { city: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-sm" placeholder="Package price (e.g. £4,200 all-in)" value={d.price} onChange={e => setDraft(i, { price: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-sm col-span-2" placeholder="What's included (surgeon fee, 2 nights hospital, transfers…)" value={d.includes} onChange={e => setDraft(i, { includes: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-sm" placeholder="Availability (e.g. from late August)" value={d.availability} onChange={e => setDraft(i, { availability: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-sm" placeholder="Notes for the patient" value={d.notes} onChange={e => setDraft(i, { notes: e.target.value })} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-4">
            <button
              onClick={send}
              disabled={sending}
              className="bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send comparison to patient'}
            </button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>

          {result && (
            <div className="mt-4 border border-green-200 bg-green-50 rounded-lg px-4 py-3 text-sm">
              <p className="font-medium text-green-800">Sent {result.whatsappQueued ? '— WhatsApp ping queued ✓' : '(WhatsApp queue failed — share the link manually)'}</p>
              <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-green-700 underline break-all">{result.link}</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
