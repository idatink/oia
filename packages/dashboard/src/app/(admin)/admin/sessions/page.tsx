'use client';

import { useEffect, useState, useCallback } from 'react';

type Session = {
  id: string;
  surface: 'web' | 'whatsapp';
  patientName: string;
  patientEmail: string;
  messageCount: number;
  lastActiveAt: string;
  createdAt: string;
  lastMessage: { role: string; content: string; createdAt: string } | null;
};

type Message = {
  id: string;
  role: 'PATIENT' | 'NIA';
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

type SessionDetail = {
  id: string;
  surface: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  lastActiveAt: string;
  createdAt: string;
  messages: Message[];
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

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const y = new Date(today); y.setDate(today.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function groupByDay(messages: Message[]) {
  const groups: { day: string; messages: Message[] }[] = [];
  for (const m of messages) {
    const day = new Date(m.createdAt).toDateString();
    const last = groups[groups.length - 1];
    if (last?.day === day) last.messages.push(m);
    else groups.push({ day, messages: [m] });
  }
  return groups;
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<SessionDetail | null>(null);
  const [filter, setFilter] = useState<'all' | 'web' | 'whatsapp'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('surface', filter);
    if (search) params.set('q', search);
    const res = await fetch(`/api/admin/sessions?${params}`);
    if (res.ok) setSessions(await res.json());
    setLoading(false);
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);

  async function openSession(id: string) {
    setDetailLoading(true);
    const res = await fetch(`/api/admin/sessions/${id}`);
    if (res.ok) setSelected(await res.json());
    setDetailLoading(false);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f3f1]">
      {/* Sidebar */}
      <div className="w-80 shrink-0 bg-white border-r border-[#dcc0ba]/30 flex flex-col">
        <div className="px-5 py-5 border-b border-[#dcc0ba]/20">
          <h1 className="text-xl font-serif text-[#1b1c1b] mb-0.5">All Conversations</h1>
          <p className="text-[11px] text-[#5c5f5c]">Every Nia session — web & WhatsApp</p>

          <div className="flex gap-1.5 mt-3">
            {(['all', 'web', 'whatsapp'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                  filter === f ? 'bg-[#99402b] text-white' : 'bg-[#f6f3f1] text-[#5c5f5c]'
                }`}
              >
                {f === 'all' ? 'All' : f === 'web' ? 'Web' : 'WA'}
              </button>
            ))}
          </div>

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patient name…"
            className="mt-3 w-full px-3 py-2 text-sm border border-[#dcc0ba]/30 rounded-xl bg-[#f6f3f1] outline-none focus:border-[#99402b] placeholder:text-[#5c5f5c]/50"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12 text-[11px] text-[#5c5f5c]">Loading…</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-[11px] text-[#5c5f5c]">No sessions yet</div>
          ) : sessions.map(s => (
            <button
              key={s.id}
              onClick={() => openSession(s.id)}
              className={`w-full text-left px-4 py-3.5 border-b border-[#dcc0ba]/15 transition-all hover:bg-[#f6f3f1] ${
                selected?.id === s.id ? 'bg-[#fdf5f3] border-l-2 border-l-[#99402b]' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-semibold text-[#1b1c1b] text-sm truncate">{s.patientName}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                    s.surface === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {s.surface === 'whatsapp' ? 'WA' : 'Web'}
                  </span>
                  <span className="text-[10px] text-[#5c5f5c]">{timeAgo(s.lastActiveAt)}</span>
                </div>
              </div>
              {s.lastMessage && (
                <p className="text-[11px] text-[#5c5f5c] line-clamp-1">
                  <span className="font-medium">{s.lastMessage.role === 'NIA' ? 'Oia: ' : 'Patient: '}</span>
                  {s.lastMessage.content}
                </p>
              )}
              <p className="text-[10px] text-[#5c5f5c]/60 mt-1">{s.messageCount} messages</p>
            </button>
          ))}
        </div>
      </div>

      {/* Transcript */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected && !detailLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#5c5f5c]">
            <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>
            </svg>
            <p className="text-sm">Select a session to view transcript</p>
          </div>
        ) : detailLoading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-[#5c5f5c]">Loading…</div>
        ) : selected ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-[#dcc0ba]/20 px-6 py-4 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#1b1c1b]">{selected.patientName}</p>
                  <p className="text-[11px] text-[#5c5f5c]">
                    {selected.patientEmail}
                    {selected.patientPhone ? ` · ${selected.patientPhone}` : ''}
                    {' · '}
                    <span className={`font-semibold ${selected.surface === 'whatsapp' ? 'text-green-600' : 'text-blue-500'}`}>
                      {selected.surface === 'whatsapp' ? 'WhatsApp' : 'Web'}
                    </span>
                    {' · '}{selected.messages.length} messages
                  </p>
                </div>
                <span className="text-[11px] text-[#5c5f5c]">
                  {new Date(selected.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 bg-[#f6f3f1]">
              {groupByDay(selected.messages).map(group => (
                <div key={group.day} className="space-y-2">
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-[#dcc0ba]/30" />
                    <span className="text-[9px] text-[#5c5f5c] uppercase tracking-widest">{formatDay(group.messages[0].createdAt)}</span>
                    <div className="flex-1 h-px bg-[#dcc0ba]/30" />
                  </div>
                  {group.messages.map((msg, i) => {
                    const isNia = msg.role === 'NIA';
                    const prev = group.messages[i - 1];
                    const sameRole = prev?.role === msg.role;
                    // Skip internal intake-complete system messages from display
                    if (msg.content.startsWith('Intake completed:') && msg.metadata) return null;
                    const photoUrls: string[] = (msg.metadata as Record<string, unknown> | null)?.photoUrls as string[] ?? [];
                    const intakeMeta = msg.metadata && !msg.content.startsWith('Intake') ? msg.metadata : null;
                    return (
                      <div key={msg.id} className={`flex gap-2 ${isNia ? '' : 'flex-row-reverse'} ${sameRole ? '-mt-1' : ''}`}>
                        {!sameRole ? (
                          <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                            isNia ? 'bg-[#99402b] text-white' : 'bg-[#dcc0ba] text-[#1b1c1b]'
                          }`}>
                            {isNia ? 'N' : selected.patientName.charAt(0).toUpperCase()}
                          </div>
                        ) : <div className="w-7 shrink-0" />}
                        <div className={`max-w-[72%] ${isNia ? '' : 'items-end flex flex-col'}`}>
                          {/* Photo thumbnails — shown above the bubble */}
                          {photoUrls.length > 0 && (
                            <div className={`flex flex-wrap gap-1.5 mb-1.5 ${isNia ? '' : 'justify-end'}`}>
                              {photoUrls.map((url, pi) => (
                                <a key={pi} href={url} target="_blank" rel="noopener noreferrer">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={url}
                                    alt={`Patient photo ${pi + 1}`}
                                    className="w-28 h-28 object-cover rounded-xl border border-[#dcc0ba]/30 hover:opacity-90 transition-opacity"
                                  />
                                </a>
                              ))}
                            </div>
                          )}
                          <div className={`rounded-2xl px-4 py-2.5 ${
                            isNia ? 'bg-white border border-[#dcc0ba]/20 text-[#1b1c1b] rounded-tl-sm' : 'bg-[#99402b] text-white rounded-tr-sm'
                          }`}>
                            <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            {intakeMeta && (
                              <details className="mt-2">
                                <summary className="text-[9px] opacity-40 cursor-pointer">intake data</summary>
                                <pre className="text-[9px] opacity-60 mt-1 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(intakeMeta, null, 2)}</pre>
                              </details>
                            )}
                          </div>
                          <p className={`text-[9px] text-[#5c5f5c]/50 mt-0.5 px-1 ${isNia ? '' : 'text-right'}`}>{formatTime(msg.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              {selected.messages.length === 0 && (
                <div className="flex items-center justify-center h-32 text-sm text-[#5c5f5c]">No messages in this session</div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
