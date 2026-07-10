'use client';

import { useEffect, useMemo, useState } from 'react';

type Lead = {
  id: string;
  sessionId: string | null;
  name: string | null;
  whatsapp: string | null;
  email: string | null;
  age: string | number | null;
  procedure: string | null;
  notes: string | null;
  source: string | null;
  inviteStatus: string | null;
  createdAt: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// wa.me needs international digits only (no +, spaces or dashes).
function waLink(num: string | null) {
  if (!num) return null;
  const digits = num.replace(/[^\d]/g, '');
  return digits.length >= 7 ? `https://wa.me/${digits}` : null;
}

function toCsv(leads: Lead[]) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = ['Name', 'WhatsApp', 'Email', 'Procedure', 'Channel', 'Notes', 'Joined'];
  const rows = leads.map(l => [l.name, l.whatsapp, l.email, l.procedure, l.source, l.notes, formatDate(l.createdAt)].map(esc).join(','));
  return [header.join(','), ...rows].join('\n');
}

export default function AdminWaitlistPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inviting, setInviting] = useState<string | null>(null);

  async function markReady(l: Lead) {
    if (!l.whatsapp) { alert('No WhatsApp number on this entry — can’t invite.'); return; }
    if (!confirm(`Invite ${l.name || l.whatsapp} back to the web experience? Oia will WhatsApp them a private intake link.`)) return;
    setInviting(l.id);
    try {
      const res = await fetch('/api/admin/waitlist/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: l.id }),
      });
      if (res.ok) {
        setLeads(prev => prev.map(x => (x.id === l.id ? { ...x, inviteStatus: 'queued' } : x)));
      } else {
        const e = await res.json().catch(() => ({}));
        alert(`Couldn’t invite: ${e.error ?? res.status}`);
      }
    } finally {
      setInviting(null);
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch('/api/admin/waitlist');
      if (res.ok) setLeads(await res.json());
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(l =>
      [l.name, l.whatsapp, l.email, l.procedure, l.notes].some(v => (v ?? '').toString().toLowerCase().includes(q)),
    );
  }, [leads, search]);

  function downloadCsv() {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oia-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f6f3f1]">
      {/* Header */}
      <div className="bg-white border-b border-[#dcc0ba]/30 px-6 py-5 shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-serif text-[#1b1c1b] mb-0.5">Waitlist</h1>
            <p className="text-[11px] text-[#5c5f5c]">
              People who left their details while Oia is at capacity
              {!loading && ` · ${leads.length} total`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, number, procedure…"
              className="w-64 px-3 py-2 text-sm border border-[#dcc0ba]/30 rounded-xl bg-[#f6f3f1] outline-none focus:border-[#99402b] placeholder:text-[#5c5f5c]/50"
            />
            <button
              onClick={downloadCsv}
              disabled={filtered.length === 0}
              className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl bg-[#99402b] text-white transition-opacity disabled:opacity-40"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-16 text-[11px] text-[#5c5f5c]">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-[#5c5f5c]">
            {leads.length === 0 ? 'No one has joined the waitlist yet.' : 'No matches.'}
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-[#f6f3f1] z-10">
              <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-[#5c5f5c] border-b border-[#dcc0ba]/30">
                <th className="px-6 py-3">Name</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Procedure</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-center">Ready</th>
                <th className="px-6 py-3 text-right">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const wa = waLink(l.whatsapp);
                return (
                  <tr key={l.id} className="border-b border-[#dcc0ba]/15 hover:bg-white transition-colors align-top">
                    <td className="px-6 py-3.5 text-sm font-semibold text-[#1b1c1b]">{l.name || '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-[#1b1c1b] whitespace-nowrap">
                      {l.whatsapp ? (
                        wa ? (
                          <a href={wa} target="_blank" rel="noopener noreferrer" className="text-[#99402b] hover:underline font-medium">
                            {l.whatsapp}
                          </a>
                        ) : (
                          l.whatsapp
                        )
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#5c5f5c] whitespace-nowrap">
                      {l.email ? <a href={`mailto:${l.email}`} className="text-[#99402b] hover:underline">{l.email}</a> : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#5c5f5c] capitalize">{l.procedure || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${l.source === 'whatsapp' ? 'bg-[#25D366]/15 text-[#128C4A]' : 'bg-[#99402b]/10 text-[#99402b]'}`}>
                        {l.source === 'whatsapp' ? 'WhatsApp' : 'Web'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[#5c5f5c] max-w-xs">{l.notes || '—'}</td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {l.inviteStatus === 'sent' ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#128C4A]/15 text-[#128C4A]">Invited ✓</span>
                      ) : l.inviteStatus === 'queued' ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Sending…</span>
                      ) : (
                        <button
                          onClick={() => markReady(l)}
                          disabled={inviting === l.id || !l.whatsapp}
                          className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-[#99402b] text-white transition-opacity disabled:opacity-40"
                          title={l.whatsapp ? 'WhatsApp them a link back to the web intake' : 'No WhatsApp number'}
                        >
                          {inviting === l.id ? '…' : l.inviteStatus === 'failed' ? 'Retry' : 'Mark ready'}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <span className="text-[12px] text-[#1b1c1b]">{formatDate(l.createdAt)}</span>
                      <span className="block text-[10px] text-[#5c5f5c]/60">{timeAgo(l.createdAt)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
