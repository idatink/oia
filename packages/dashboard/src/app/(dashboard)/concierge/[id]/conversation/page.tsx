'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Message = { id: string; role: 'PATIENT' | 'NIA'; content: string; createdAt: string };

type ConversationData = {
  patientName: string;
  patientSelectedAt: string;
  surface: 'whatsapp' | 'web';
  messages: Message[];
};

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function formatDay(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
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

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ConversationData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/leads/${id}/conversation`);
    if (res.ok) {
      setData(await res.json());
    } else {
      const body = await res.json();
      setError(body.error ?? 'Failed to load conversation');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [data]);

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center lg:h-full">
      <p className="font-body text-body-sm text-on-surface-variant">Loading conversation…</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 px-8 text-center lg:h-full">
      <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center">
        <svg className="w-7 h-7 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
        </svg>
      </div>
      <div>
        <p className="font-display text-lg text-on-surface">Conversation locked</p>
        <p className="font-body text-body-sm text-on-surface-variant mt-1 max-w-xs">{error}</p>
      </div>
      <button onClick={() => router.back()} className="font-body text-label-caps text-primary uppercase tracking-wider font-semibold text-[10px]">
        ← Back to case
      </button>
    </div>
  );

  if (!data) return null;

  const groups = groupByDay(data.messages);
  const selectedDate = new Date(data.patientSelectedAt);

  return (
    <div className="min-h-screen bg-[#F5F4F0] flex flex-col lg:h-full lg:min-h-0">

      {/* Header */}
      <header className="bg-white border-b border-black/8 px-5 py-3.5 flex items-center gap-3 sticky top-0 z-30 shrink-0">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors font-body text-[11px] font-semibold shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
          </svg>
          Back
        </button>

        {/* Nia avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-on-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-semibold text-on-surface truncate">
            {data.patientName} × Nia
          </p>
          <p className="font-body text-[9px] text-on-surface-variant">
            {data.messages.length} messages · accepted {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Surface badge */}
          {data.surface === 'whatsapp' ? (
            <div className="flex items-center gap-1.5 bg-[#25D366]/10 border border-[#25D366]/30 rounded-full px-2.5 py-1">
              <svg className="w-3 h-3 text-[#25D366] fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="font-body text-[9px] text-[#128C7E] font-semibold">WhatsApp</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-primary-fixed border border-primary/20 rounded-full px-2.5 py-1">
              <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3"/>
              </svg>
              <span className="font-body text-[9px] text-primary font-semibold">Web Chat</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="font-body text-[9px] text-green-700 font-semibold">Offer accepted</span>
          </div>
        </div>
      </header>

      {/* Access notice */}
      <div className="bg-primary-fixed/30 border-b border-primary/10 px-5 py-2.5 flex items-center gap-2 shrink-0">
        <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
        </svg>
        <p className="font-body text-[10px] text-primary">
          Full conversation unlocked — <span className="font-semibold">{data.patientName}</span> accepted your offer on {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}. This includes the complete Nia intake session.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {groups.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <p className="font-body text-body-sm text-on-surface-variant">No conversation transcript available for this patient.</p>
          </div>
        )}

        {groups.map(group => (
          <div key={group.day} className="space-y-3">
            {/* Day label */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-black/8" />
              <span className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest">{formatDay(group.messages[0].createdAt)}</span>
              <div className="flex-1 h-px bg-black/8" />
            </div>

            {group.messages.map((msg, i) => {
              const isNia = msg.role === 'NIA';
              const prev = group.messages[i - 1];
              const sameRoleAsPrev = prev?.role === msg.role;

              return (
                <div key={msg.id} className={`flex gap-2.5 ${isNia ? '' : 'flex-row-reverse'} ${sameRoleAsPrev ? '-mt-1' : ''}`}>
                  {/* Avatar — only show when role changes */}
                  {!sameRoleAsPrev ? (
                    <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold ${
                      isNia
                        ? 'bg-gradient-to-br from-primary to-secondary text-on-primary'
                        : 'bg-secondary-container text-on-secondary-container'
                    }`}>
                      {isNia
                        ? <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>
                        : data.patientName.charAt(0).toUpperCase()
                      }
                    </div>
                  ) : (
                    <div className="w-7 shrink-0" />
                  )}

                  {/* Bubble */}
                  <div className={`max-w-[75%] space-y-1 ${isNia ? '' : 'items-end'}`}>
                    {!sameRoleAsPrev && (
                      <p className={`font-body text-[9px] text-on-surface-variant px-1 ${isNia ? '' : 'text-right'}`}>
                        {isNia ? 'Nia' : data.patientName}
                      </p>
                    )}
                    <div className={`rounded-2xl px-3.5 py-2.5 ${
                      isNia
                        ? 'bg-white border border-black/8 text-on-surface rounded-tl-sm'
                        : 'bg-primary text-on-primary rounded-tr-sm'
                    }`}>
                      <p className="font-body text-[12px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <p className={`font-body text-[9px] text-on-surface-variant/60 px-1 ${isNia ? '' : 'text-right'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Read-only notice */}
      <div className="bg-white border-t border-black/8 px-5 py-3 flex items-center gap-3 shrink-0">
        <svg className="w-4 h-4 text-on-surface-variant shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <p className="font-body text-[10px] text-on-surface-variant">
          This is a read-only view of the Nia conversation. Contact the patient directly via WhatsApp.
        </p>
      </div>
    </div>
  );
}
