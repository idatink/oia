'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomTabNav from '@/components/dashboard/BottomTabNav';

type ConvSummary = {
  id: string; status: string; aiPriority: string | null;
  patientSelectedAt: string | null; patientName: string;
  whatsappNumber: string | null; procedureName: string;
  additionalCount: number; lastActiveAt: string;
  lastMessage: { role: string; snippet: string; createdAt: string } | null;
};

type Message = { id: string; role: string; content: string; createdAt: string };

type ConvDetail = {
  patientName: string;
  patientSelectedAt: string;
  messages: Message[];
};

const PRIORITY_DOT: Record<string, string> = {
  High: 'bg-error', Medium: 'bg-yellow-400', Low: 'bg-green-500',
};

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(d: string) {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function groupByDay(messages: Message[]) {
  const groups: { day: string; messages: Message[] }[] = [];
  for (const m of messages) {
    const day = new Date(m.createdAt).toDateString();
    const last = groups[groups.length - 1];
    if (last && last.day === day) { last.messages.push(m); }
    else { groups.push({ day, messages: [m] }); }
  }
  return groups;
}

// ── Thread item ────────────────────────────────────────────────────────────────

function ThreadItem({ conv, selected, onClick }: {
  conv: ConvSummary; selected: boolean; onClick: () => void;
}) {
  const isNiaLast = conv.lastMessage?.role === 'NIA';
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-black/6 transition-all ${
        selected ? 'bg-primary-fixed/40' : 'hover:bg-surface-container-low/60'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center font-display text-sm font-bold text-on-secondary-container">
            {conv.patientName.charAt(0).toUpperCase()}
          </div>
          {conv.aiPriority && (
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${PRIORITY_DOT[conv.aiPriority] ?? 'bg-surface-container'}`} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-body text-sm font-semibold text-on-surface truncate">{conv.patientName}</p>
            <span className="font-body text-[9px] text-on-surface-variant shrink-0">{timeAgo(conv.lastActiveAt)}</span>
          </div>
          <p className="font-body text-[10px] text-primary font-semibold truncate mt-0.5">
            {conv.procedureName}{conv.additionalCount > 0 ? ` +${conv.additionalCount}` : ''}
          </p>
          {conv.lastMessage && (
            <p className="font-body text-[10px] text-on-surface-variant truncate mt-0.5">
              {isNiaLast ? 'Oia: ' : ''}{conv.lastMessage.snippet}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Chat panel ────────────────────────────────────────────────────────────────

function ChatPanel({ conv, detail, loading }: {
  conv: ConvSummary | null; detail: ConvDetail | null; loading: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [detail]);

  if (!conv) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-surface-container mx-auto flex items-center justify-center">
          <svg className="w-6 h-6 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>
          </svg>
        </div>
        <p className="font-body text-body-sm text-on-surface-variant">Select a conversation</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Chat header */}
      <div className="bg-white border-b border-black/8 px-5 py-3 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center font-display text-sm font-bold text-on-secondary-container shrink-0">
          {conv.patientName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-semibold text-on-surface">{conv.patientName}</p>
          <p className="font-body text-[9px] text-on-surface-variant">
            {conv.procedureName}{conv.additionalCount > 0 ? ` +${conv.additionalCount} more` : ''} · via Nia AI
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {conv.whatsappNumber && (
            <a
              href={`https://web.whatsapp.com/send?phone=${conv.whatsappNumber.replace(/\D/g, '')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#25D366] text-white px-3 py-1.5 rounded-lg font-body text-[10px] font-semibold hover:opacity-90 transition-all"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
              </svg>
              WhatsApp
            </a>
          )}
          <Link href={`/concierge/${conv.id}`} className="border border-outline-variant text-on-surface px-3 py-1.5 rounded-lg font-body text-[10px] font-semibold hover:border-primary hover:text-primary transition-all">
            View Brief
          </Link>
        </div>
      </div>

      {/* Access notice */}
      <div className="bg-primary-fixed/20 border-b border-primary/10 px-4 py-2 flex items-center gap-2 shrink-0">
        <svg className="w-3 h-3 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
        </svg>
        <p className="font-body text-[9px] text-primary">
          Visible from when patient selected your clinic · earlier messages remain private
        </p>
      </div>

      {/* Messages */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-body text-body-sm text-on-surface-variant">Loading…</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 bg-[#F5F4F0]">
          {detail && groupByDay(detail.messages).map(group => (
            <div key={group.day} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-black/8" />
                <span className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest">{formatDay(group.messages[0].createdAt)}</span>
                <div className="flex-1 h-px bg-black/8" />
              </div>

              {group.messages.map((msg, i) => {
                const isNia = msg.role === 'NIA';
                const prev = group.messages[i - 1];
                const sameRole = prev?.role === msg.role;
                return (
                  <div key={msg.id} className={`flex gap-2 ${isNia ? '' : 'flex-row-reverse'} ${sameRole ? '-mt-1' : ''}`}>
                    {!sameRole ? (
                      <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${
                        isNia ? 'bg-gradient-to-br from-primary to-secondary' : 'bg-secondary-container'
                      }`}>
                        {isNia
                          ? <svg className="w-3.5 h-3.5 text-on-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>
                          : <span className="font-display text-[10px] font-bold text-on-secondary-container">{conv.patientName.charAt(0)}</span>
                        }
                      </div>
                    ) : <div className="w-7 shrink-0" />}

                    <div className={`max-w-[70%] ${isNia ? '' : 'items-end'}`}>
                      {!sameRole && (
                        <p className={`font-body text-[9px] text-on-surface-variant px-1 mb-0.5 ${isNia ? '' : 'text-right'}`}>
                          {isNia ? 'Nia' : conv.patientName}
                        </p>
                      )}
                      <div className={`rounded-2xl px-3.5 py-2.5 ${
                        isNia ? 'bg-white border border-black/8 text-on-surface rounded-tl-sm' : 'bg-primary text-on-primary rounded-tr-sm'
                      }`}>
                        <p className="font-body text-[12px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <p className={`font-body text-[9px] text-on-surface-variant/50 px-1 mt-0.5 ${isNia ? '' : 'text-right'}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {detail && detail.messages.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <p className="font-body text-body-sm text-on-surface-variant">No messages since patient selected your clinic yet.</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* Read-only bar */}
      <div className="bg-white border-t border-black/8 px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="flex-1 bg-surface-container rounded-xl px-4 py-2.5 flex items-center gap-2">
          <svg className="w-4 h-4 text-on-surface-variant/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
          </svg>
          <span className="font-body text-[11px] text-on-surface-variant/60">Read-only · Reply via WhatsApp</span>
        </div>
        {conv.whatsappNumber && (
          <a
            href={`https://web.whatsapp.com/send?phone=${conv.whatsappNumber.replace(/\D/g, '')}`}
            target="_blank" rel="noopener noreferrer"
            className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center hover:opacity-90 transition-all shrink-0"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function ConversationsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [convs, setConvs] = useState<ConvSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('id'));
  const [detail, setDetail] = useState<ConvDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchConvs = useCallback(async () => {
    const res = await fetch('/api/conversations');
    if (res.ok) {
      const data: ConvSummary[] = await res.json();
      setConvs(data);
      if (!selectedId && data.length > 0) setSelectedId(data[0].id);
    }
  }, [selectedId]);

  const fetchDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    setDetail(null);
    const res = await fetch(`/api/leads/${id}/conversation`);
    if (res.ok) setDetail(await res.json());
    setLoadingDetail(false);
  }, []);

  useEffect(() => { fetchConvs(); }, [fetchConvs]);
  useEffect(() => { if (selectedId) fetchDetail(selectedId); }, [selectedId, fetchDetail]);

  const selectedConv = convs.find(c => c.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-[#F5F4F0] pb-20 lg:pb-0 lg:min-h-0 lg:h-full lg:flex lg:flex-col">

      {/* Mobile header */}
      <header className="bg-white border-b border-black/8 px-5 py-4 flex items-center justify-between sticky top-0 z-30 lg:hidden">
        <h1 className="font-display text-display-sm text-on-surface">Conversations</h1>
        <span className="bg-primary text-on-primary font-body text-[9px] font-bold px-2 py-0.5 rounded-full">{convs.length}</span>
      </header>

      {/* Mobile: thread list */}
      <div className="lg:hidden">
        {convs.map(c => (
          <ThreadItem
            key={c.id}
            conv={c}
            selected={selectedId === c.id}
            onClick={() => router.push(`/concierge/${c.id}/conversation`)}
          />
        ))}
        {convs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 px-8 text-center">
            <p className="font-body text-body-sm text-on-surface-variant">No conversations yet. They appear here once a patient selects your clinic.</p>
          </div>
        )}
      </div>

      {/* Desktop: split pane */}
      <div className="hidden lg:flex lg:flex-1 lg:overflow-hidden">
        {/* Left: thread list */}
        <div className="w-[300px] shrink-0 border-r border-black/8 bg-white flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-black/6 flex items-center justify-between shrink-0">
            <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider font-semibold">Active Threads · {convs.length}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="font-body text-[9px] text-on-surface-variant font-semibold">Live</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convs.map(c => (
              <ThreadItem
                key={c.id}
                conv={c}
                selected={selectedId === c.id}
                onClick={() => setSelectedId(c.id)}
              />
            ))}
            {convs.length === 0 && (
              <div className="px-4 py-12 text-center">
                <p className="font-body text-[11px] text-on-surface-variant">No conversations yet.</p>
                <p className="font-body text-[10px] text-on-surface-variant/60 mt-1">They appear here once a patient selects your clinic after seeing your offer.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: chat */}
        <ChatPanel conv={selectedConv} detail={detail} loading={loadingDetail} />
      </div>

      <BottomTabNav />
    </div>
  );
}

export default function ConversationsPage() {
  return <Suspense><ConversationsInner /></Suspense>;
}
