'use client';

import { useEffect, useState } from 'react';

type Ticket = {
  id: string; subject: string; body: string; category: string;
  status: string; adminReply: string | null; repliedAt: string | null;
  createdAt: string; clinic: { id: string; name: string };
};

const STATUS_STYLE: Record<string, string> = {
  OPEN: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  IN_REVIEW: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  RESOLVED: 'bg-green-400/10 text-green-400 border-green-400/20',
  CLOSED: 'bg-white/5 text-white/30 border-white/10',
};

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch('/api/admin/support').then(r => r.ok ? r.json() : []).then(data => {
      setTickets(data);
      if (selected) setSelected(data.find((t: Ticket) => t.id === selected.id) ?? null);
    });
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = async (status?: string) => {
    if (!selected) return;
    setSaving(true);
    await fetch('/api/admin/support', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, status: status ?? selected.status, adminReply: reply || undefined }),
    });
    setReply('');
    load();
    setSaving(false);
  };

  const open = tickets.filter(t => t.status === 'OPEN').length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 py-5 border-b border-white/8 shrink-0">
        <h1 className="font-display text-2xl text-white">Support Tickets</h1>
        <p className="font-body text-[11px] text-white/40 mt-0.5">{open} open · {tickets.length} total</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* List */}
        <div className="w-[320px] shrink-0 border-r border-white/8 overflow-y-auto">
          {tickets.length === 0 && <p className="font-body text-white/30 text-center py-12 text-sm">No tickets yet</p>}
          {tickets.map(t => (
            <button
              key={t.id}
              onClick={() => { setSelected(t); setReply(t.adminReply ?? ''); }}
              className={`w-full text-left px-4 py-4 border-b border-white/5 transition-all hover:bg-white/5 ${selected?.id === t.id ? 'bg-white/8' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-body text-sm font-semibold text-white leading-tight">{t.subject}</p>
                <span className={`font-body text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${STATUS_STYLE[t.status]}`}>{t.status.replace(/_/g,' ')}</span>
              </div>
              <p className="font-body text-[10px] text-white/40 mt-1">{t.clinic.name} · {timeAgo(t.createdAt)}</p>
              <p className="font-body text-[10px] text-white/30 mt-1 truncate">{t.body}</p>
            </button>
          ))}
        </div>

        {/* Detail */}
        {selected ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl text-white">{selected.subject}</h2>
                  <div className="flex gap-2">
                    {['OPEN','IN_REVIEW','RESOLVED','CLOSED'].map(s => (
                      <button key={s} onClick={() => respond(s)} disabled={selected.status === s}
                        className={`px-2.5 py-1 rounded-lg font-body text-[9px] font-semibold border transition-all ${selected.status === s ? STATUS_STYLE[s] : 'border-white/10 text-white/30 hover:border-white/20 hover:text-white/60'}`}>
                        {s.replace(/_/g,' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="font-body text-[10px] text-white/40 mt-1">{selected.clinic.name} · {selected.category} · {timeAgo(selected.createdAt)}</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <p className="font-body text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{selected.body}</p>
              </div>

              {selected.adminReply && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                  <p className="font-body text-[9px] text-primary uppercase tracking-wider mb-2 font-semibold">Nia Admin Reply</p>
                  <p className="font-body text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{selected.adminReply}</p>
                  {selected.repliedAt && <p className="font-body text-[9px] text-white/30 mt-2">{timeAgo(selected.repliedAt)}</p>}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/8 shrink-0 space-y-3">
              <textarea
                rows={3}
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Write a reply to the clinic…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-body text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary resize-none"
              />
              <div className="flex gap-3">
                <button onClick={() => respond('IN_REVIEW')} disabled={saving || !reply.trim()}
                  className="flex-1 bg-primary text-on-primary py-2.5 rounded-xl font-body text-[10px] font-semibold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-40">
                  {saving ? 'Sending…' : 'Reply → Mark In Review'}
                </button>
                <button onClick={() => respond('RESOLVED')} disabled={saving || !reply.trim()}
                  className="flex-1 bg-green-500 text-white py-2.5 rounded-xl font-body text-[10px] font-semibold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-40">
                  Reply & Resolve
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-body text-white/30">Select a ticket to reply</p>
          </div>
        )}
      </div>
    </div>
  );
}
