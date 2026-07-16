'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { parsePhoneNumber } from 'libphonenumber-js';
import ChatMessage, { type Message } from './ChatMessage';
import QuickReplies from './QuickReplies';
import ChatInput from './ChatInput';
import TriageWidget, { type TriageAnswers } from './TriageWidget';
import PhotoGuideWidget, { type CapturedPhoto } from './PhotoGuideWidget';
import type { ClinicCardData } from './ClinicCard';
import { WAITLIST_MODE, WAITLIST_GREETING, WAITLIST_WHATSAPP_URL } from '@/lib/waitlist';

type IntakeData = Record<string, unknown> & { name?: string; procedure?: string };

const INITIAL_QUICK_REPLIES = [
  'How does Oia work?',
  'Why should I book with Oia?',
  'What procedures do you cover?',
];

const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER ?? '';

async function fetchMatchedClinics(procedure: string, country?: string | null, locationPreference?: string | null): Promise<ClinicCardData[]> {
  try {
    const q = `procedure=${encodeURIComponent(procedure)}${country ? `&country=${encodeURIComponent(country)}` : ''}${locationPreference ? `&locationPreference=${encodeURIComponent(locationPreference)}` : ''}`;
    const res = await fetch(`/api/clinics?${q}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

interface PhotoItem {
  base64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  previewUrl: string;
  angle?: string;
}

async function fileToPhotoItem(file: File): Promise<PhotoItem> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      const mediaType = (file.type || 'image/jpeg') as PhotoItem['mediaType'];
      resolve({ base64, mediaType, previewUrl: dataUrl });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface ChatWindowProps {
  patientName: string;
  onProcedureDetected?: (procedures: string[]) => void;
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return crypto.randomUUID();
  const key = 'nia_web_session_id';
  // localStorage (not sessionStorage) so the conversation survives a tab close or
  // accidental navigation — the id persists and we reload the saved messages.
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
}

export default function ChatWindow({ patientName, onProcedureDetected }: ChatWindowProps) {
  const sessionId = getOrCreateSessionId();
  // Invite-back-from-waitlist: a `?invite=<token>` opens the FULL intake (bypassing
  // the waitlist greeting/gate) prefilled with the patient's name + intention.
  const [inviteToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('invite') : null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>(INITIAL_QUICK_REPLIES);
  const [loading, setLoading] = useState(false);
  const [intakeComplete, setIntakeComplete] = useState(false);
  const [showTriage, setShowTriage] = useState(false);
  // Photo Guide: which procedure's angle set to show (null = not showing).
  const [photosProcedure, setPhotosProcedure] = useState<string | null>(null);
  // Anonymous-first (A3): intake data is held until the patient shares a number.
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [linking, setLinking] = useState(false);
  const [linked, setLinked] = useState(false);
  // Invited-back patients arrive with their WhatsApp number + name + intention
  // already in the invite token — captured here so we can auto-register them and
  // finalize (match) without re-asking for anything.
  const [invitedPhone, setInvitedPhone] = useState<string | null>(null);
  const [invitedProcedure, setInvitedProcedure] = useState<string | null>(null);
  // Match finalization: finding + delivering the SmartMatch shortlist.
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);
  // Intake is content-complete when BOTH the Photo Guide and the triage form are done.
  // Order-independent (photos now come before medical), so we track each and finalize
  // once both have happened — not off whichever widget submits last.
  const [photosDone, setPhotosDone] = useState(false);
  const [triageDone, setTriageDone] = useState(false);
  const [photosProc, setPhotosProc] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const greeted = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;

    (async () => {
      // Resume a saved conversation (same browser) before greeting fresh — so an
      // accidental close/refresh never makes the patient repeat themselves.
      try {
        const res = await fetch(`/api/chat/history?sessionId=${encodeURIComponent(sessionId)}`);
        if (res.ok) {
          const data = await res.json() as {
            messages: { role: 'PATIENT' | 'NIA'; content: string; photoUrls?: string[] }[];
          };
          if (data.messages?.length) {
            setMessages(data.messages.map((m, i) => ({
              id: `restored-${i}`,
              role: m.role === 'NIA' ? 'nia' : 'patient',
              content: m.content,
              timestamp: new Date(),
              ...(m.photoUrls?.length ? { photoPreviewUrls: m.photoUrls } : {}),
            })));
            setHistory(data.messages.map(m => ({
              role: m.role === 'NIA' ? 'assistant' : 'user',
              content: m.content,
            })));
            setSuggestions([]);
            return;
          }
        }
      } catch { /* fall through to a fresh greeting */ }

      // Invited back from the waitlist? verify the token → warm, personalised
      // greeting and the FULL intake (not the waitlist message).
      if (inviteToken) {
        try {
          const vr = await fetch('/api/invite/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: inviteToken }),
          });
          const v = await vr.json() as { valid: boolean; name?: string | null; procedure?: string | null; phone?: string | null };
          if (v.valid) {
            if (v.phone) setInvitedPhone(v.phone);
            if (v.procedure) setInvitedProcedure(v.procedure);
            const nm = v.name ? ` ${v.name}` : '';
            const proc = v.procedure ? ` for your ${v.procedure}` : '';
            // Opens directly on the local/travel question — the first step of the
            // streamlined flow (goals-probing was cut; photos carry the goals).
            const g = `Welcome back${nm} 🤍 A space has just opened${proc} — I'm so glad it's your turn. Let's plan everything together now. First things first: would you prefer to have it done close to home, or are you happy to travel for the right surgeon? Plenty of people like to see both, to compare.`;
            setMessages([{ id: 'greeting', role: 'nia', content: g, timestamp: new Date() }]);
            setHistory([{ role: 'assistant', content: g }]);
            return;
          }
        } catch { /* fall through to normal greeting */ }
      }

      const greeting = WAITLIST_MODE
        ? WAITLIST_GREETING
        : patientName && patientName !== 'there'
        ? `Hello ${patientName}! I'm Oia, your bespoke treatment planner. I'm here to help you explore your options and connect you with the right clinic. What procedure are you interested in?`
        : "Hello! I'm Oia, your bespoke treatment planner. I'm here to help you explore cosmetic and reconstructive surgery options at world-class international clinics. What procedure are you considering?";
      setMessages([{ id: 'greeting', role: 'nia', content: greeting, timestamp: new Date() }]);
      setHistory([{ role: 'assistant', content: greeting }]);
    })();
  }, [patientName, sessionId, inviteToken]);

  const sendMessage = useCallback(async (text: string, files?: File[], angles?: string[]) => {
    if (loading) return;

    // Convert files to base64 photo items. `angles` (optional, parallel to files)
    // carries the Photo Guide's angle label per file so photos land labelled.
    const photos: PhotoItem[] = [];
    if (files?.length) {
      for (let i = 0; i < files.length; i++) {
        try {
          const item = await fileToPhotoItem(files[i]);
          if (angles?.[i]) item.angle = angles[i];
          photos.push(item);
        } catch {
          console.error('Failed to read file', files[i].name);
        }
      }
    }

    if (!text.trim() && photos.length === 0) return;

    // Build the display text for the patient message
    const displayText = [
      text.trim(),
      photos.length ? `📎 ${photos.length} photo${photos.length > 1 ? 's' : ''} attached` : '',
    ].filter(Boolean).join(' — ');

    const userMsgId = Date.now().toString();
    const niaMsgId = (Date.now() + 1).toString();

    setMessages(m => [
      ...m,
      {
        id: userMsgId,
        role: 'patient',
        content: displayText,
        timestamp: new Date(),
        photoPreviewUrls: photos.map(p => p.previewUrl),
      },
      { id: niaMsgId, role: 'nia', content: '', timestamp: new Date() },
    ]);
    setSuggestions([]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history,
          patientName,
          sessionId,
          invite: inviteToken,
          photos: photos.map(({ base64, mediaType, angle }) => ({ base64, mediaType, ...(angle ? { angle } : {}) })),
        }),
      });

      if (!res.ok || !res.body) throw new Error('Network error');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let rawAccumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'delta') {
              rawAccumulated += event.text;
              // Strip the <INTAKE> block + any <REACT> tapback tag from what the patient sees
              const visible = rawAccumulated
                .replace(/<INTAKE>[\s\S]*$/, '')
                .replace(/<REACT>[\s\S]*?<\/REACT>/g, '')
                .trim();
              setMessages(m => m.map(msg =>
                msg.id === niaMsgId ? { ...msg, content: visible } : msg
              ));
            } else if (event.type === 'done') {
              const finalText = (event.fullText ?? rawAccumulated)
                .replace(/<INTAKE>[\s\S]*/, '')
                .replace(/<REACT>[\s\S]*?<\/REACT>/g, '')
                .trim();
              setMessages(m => m.map(msg =>
                msg.id === niaMsgId ? { ...msg, content: finalText } : msg
              ));
              // Oia reaction tapback → attach the emoji to the patient message she's replying to
              const reactMatch = rawAccumulated.match(/<REACT>\s*([\s\S]{1,12}?)\s*<\/REACT>/);
              const reactEmoji = reactMatch?.[1]?.trim();
              if (reactEmoji) {
                setMessages(m => m.map(msg =>
                  msg.id === userMsgId ? { ...msg, oiaReaction: reactEmoji } : msg
                ));
              }
              setHistory(h => [
                ...h,
                { role: 'user', content: displayText },
                { role: 'assistant', content: finalText },
              ]);
              // Attach gallery or clinic cards to the Oia message
              if (event.gallery || event.showClinics) {
                setMessages(m => m.map(msg =>
                  msg.id === niaMsgId
                    ? { ...msg, gallery: event.gallery ?? undefined }
                    : msg
                ));
              }

              if (event.intakeComplete && event.intake) {
                setIntakeComplete(true);
                setIntakeData(event.intake as IntakeData);
                setSuggestions([]);
                if (event.intake.procedure && onProcedureDetected) {
                  onProcedureDetected([event.intake.procedure as string]);
                }
                // Do NOT submit yet — we collect the patient's WhatsApp number
                // first (see the completion card) so the lead is contactable and
                // the anonymous session links to a real identity.
              } else if (event.showTriage) {
                setShowTriage(true);
                setSuggestions([]);
              } else if (event.photosProcedure) {
                setPhotosProcedure(event.photosProcedure as string);
                setSuggestions([]);
              }

              // Attach real clinic cards matched to the patient's procedure
              if (event.showClinics) {
                const procedure = event.intake?.procedure ?? text.trim();
                fetchMatchedClinics(procedure).then(clinics => {
                  setMessages(m => m.map(msg =>
                    msg.id === niaMsgId ? { ...msg, clinics } : msg
                  ));
                });
              }
            } else if (event.type === 'error') {
              setMessages(m => m.map(msg =>
                msg.id === niaMsgId ? { ...msg, content: event.message } : msg
              ));
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch {
      setMessages(m => m.map(msg =>
        msg.id === niaMsgId ? { ...msg, content: 'Something went wrong. Please try again.' } : msg
      ));
    } finally {
      setLoading(false);
    }
  }, [loading, history, patientName, inviteToken]);

  const submitTriage = useCallback((answers: TriageAnswers) => {
    setShowTriage(false);
    const LABELS: Record<string, string> = {
      diabetes: 'Diabetes', cancerTreatment: 'Cancer/cancer treatment', organTransplant: 'Organ transplant',
      dvt: 'DVT/blood clots', pacemaker: 'Pacemaker/cardiac implant', hypertension: 'High blood pressure',
      heartDisease: 'Heart disease', thyroidDisorder: 'Thyroid disorder', immuneDisorder: 'Immune disorder',
      pregnancy: 'Pregnant/trying to conceive', allergies: 'Severe allergies',
    };
    const yesItems = Object.entries(answers).filter(([, v]) => v).map(([k]) => LABELS[k]);
    const noItems  = Object.entries(answers).filter(([, v]) => !v).map(([k]) => LABELS[k]);
    const text = yesItems.length === 0
      ? `Medical screening answers: No to all conditions (${noItems.join(', ')}).`
      : `Medical screening answers — Yes: ${yesItems.join(', ')}. No: ${noItems.join(', ')}.`;
    sendMessage(text);
    setTriageDone(true);
  }, [sendMessage]);

  // Find + deliver the SmartMatch shortlist once intake is content-complete. Runs
  // deterministically off the Photo Guide submit (and as a fallback if Oia does emit
  // <INTAKE>), so completion no longer depends on Qwen emitting the control block —
  // which is exactly what silently dropped finished intakes before. Links the session
  // to the phone, calls /api/finalize-intake (reconcile → SmartMatch → queue the match
  // link to WhatsApp), then renders the matched surgeons inline in the chat.
  const finalizeStarted = useRef(false);
  const finalize = useCallback(async (rawPhone: string, opts?: { procedureHint?: string; alreadyLinked?: boolean }) => {
    const phoneE164 = (rawPhone || '').replace(/\s+/g, '');
    if (!phoneE164 || finalizeStarted.current) return;
    finalizeStarted.current = true;
    setFinalizing(true);
    const name = (intakeData?.name as string) || (patientName !== 'there' ? patientName : undefined);
    const procedure = (intakeData?.procedure as string) || opts?.procedureHint || invitedProcedure || undefined;
    const country = (intakeData?.countryOfResidence as string) || undefined;
    const locationPreference = (intakeData?.locationPreference as 'local' | 'travel' | 'both') || undefined;
    try {
      if (!opts?.alreadyLinked) {
        await fetch('/api/link-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, phone: phoneE164, name }),
        });
      }
      const res = await fetch('/api/finalize-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneE164, name, procedure, country, locationPreference }),
      });
      const data = await res.json() as { procedure?: string; country?: string | null; providerCount?: number; providers?: ClinicCardData[]; note?: string | null; link?: string; whatsappQueued?: boolean };
      const proc = data.procedure || procedure || '';
      // Only claim the WhatsApp delivery when it actually queued (honesty).
      const waLine = data.whatsappQueued ? " I've also sent this to your WhatsApp, so it's always easy to find." : '';
      let clinics = (data.providers && data.providers.length > 0) ? data.providers : [];
      let line: string;
      if (data.note === 'no_local_providers') {
        // Graceful degradation: no vetted surgeons in the patient's country yet. Be
        // honest, then offer the international network instead (never abroad-as-local).
        const intl = proc ? await fetchMatchedClinics(proc, undefined, 'travel') : [];
        clinics = intl;
        const where = data.country || 'your country';
        line = intl.length > 0
          ? `I'll be honest with you — we don't have vetted surgeons in ${where} in our network just yet. So I've focused on excellent international options, every one board-accredited. 🤍${waLine}`
          : `I'll be honest — I don't have surgeons in ${where} for you yet. I'm lining up international options and I'll bring them to you here shortly.`;
      } else {
        if (clinics.length === 0 && proc) clinics = await fetchMatchedClinics(proc, data.country ?? country, locationPreference);
        line = clinics.length > 0
          ? `Here are your top matches 🤍 Take your time — no rush at all. Your full match room below has every surgeon who fits you: pick the ones that draw you (up to 10) and I'll go deeper on each.${waLine}`
          : "Thank you — I'm putting your personalised surgeon matches together now and they'll appear here in just a moment.";
      }
      setMessages(m => [...m, { id: `matches-${m.length}`, role: 'nia', content: line, clinics, matchLink: clinics.length > 0 ? data.link : undefined, timestamp: new Date() }]);
      setLinked(true);
      setFinalized(true);
    } catch (err) {
      console.error('[finalize]', err);
      setMessages(m => [...m, { id: `matches-${m.length}`, role: 'nia', content: "Thank you — I'm putting your surgeon matches together now and they'll appear here shortly.", timestamp: new Date() }]);
      setLinked(true);
      setFinalized(true);
    } finally {
      setFinalizing(false);
    }
  }, [intakeData, patientName, sessionId, invitedProcedure]);

  // Photo Guide submit: send the captured (angle-labelled) photos to Oia with a
  // structured summary so she acknowledges and continues. For invited patients this
  // doubles as the deterministic "intake complete" signal → finalize + deliver matches.
  const submitPhotos = useCallback(async (captured: CapturedPhoto[]) => {
    const proc = photosProcedure;
    setPhotosProcedure(null);
    setPhotosProc(proc);
    if (captured.length === 0) {
      await sendMessage('Photos: the patient chose to skip sharing photos for now.');
    } else {
      const labels = captured.map(c => c.label).join(', ');
      await sendMessage(`Photos shared — the patient uploaded these angles: ${labels}.`, captured.map(c => c.file), captured.map(c => c.key));
    }
    // Photos now come BEFORE the safety questions, so this is no longer the last step —
    // the both-done effect below finalizes once triage is also submitted.
    setPhotosDone(true);
  }, [sendMessage, photosProcedure]);

  // Shared registration: link the number to this session's patient and submit the
  // intake. Used by the manual phone box (anonymous patients).
  const doSubmit = useCallback(async (normalized: string) => {
    if (linking || linked || !intakeData) return;
    setLinking(true);
    const name = (intakeData.name as string) || (patientName !== 'there' ? patientName : undefined);
    try {
      // 1. Attach the number to this anonymous session's patient (promote/merge).
      await fetch('/api/link-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, phone: normalized, name }),
      });
      // 2. Submit the intake against the now-identified patient. The turn-by-turn
      // conversation is already persisted on the (now phone-keyed) session by the
      // chat route, so we don't resend a transcript — that would duplicate it.
      await fetch('/api/submit-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...intakeData,
          phone: normalized,
          sessionId,
        }),
      });
      setLinked(true);
    } catch (err) {
      console.error('[link-and-submit]', err);
      // Even if the network hiccups, don't trap the patient — show success and
      // let the coordinator follow up; the session + number are already saved.
      setLinked(true);
    } finally {
      setLinking(false);
    }
  }, [linking, linked, intakeData, patientName, sessionId]);

  const linkAndSubmit = useCallback(async () => {
    if (linking || linked || !intakeData) return;
    const trimmed = phone.trim();
    let normalized = '';
    try {
      const parsed = parsePhoneNumber(trimmed);
      if (parsed?.isValid()) normalized = parsed.number;
    } catch { /* fall through to error */ }
    if (!normalized) {
      setPhoneError('Please enter a valid number with country code — e.g. +44 7911 123456.');
      return;
    }
    setPhoneError('');
    await doSubmit(normalized);
    // Deliver the SmartMatch shortlist (inline + WhatsApp) now that we have a number.
    await finalize(normalized, { alreadyLinked: true });
  }, [linking, linked, intakeData, phone, doSubmit, finalize]);

  // Invited patients: finalize once intake is content-complete. Deterministic trigger =
  // BOTH the Photo Guide and the triage form submitted (order-independent). Fallback =
  // a clean <INTAKE> block on the rare occasion Qwen emits one. Hard-guarded to run once.
  useEffect(() => {
    if (!inviteToken || !invitedPhone || finalized || finalizing) return;
    const contentComplete = (photosDone && triageDone) || intakeComplete;
    if (contentComplete) {
      finalize(invitedPhone, { procedureHint: (intakeData?.procedure as string) || photosProc || invitedProcedure || undefined });
    }
  }, [photosDone, triageDone, intakeComplete, inviteToken, invitedPhone, finalized, finalizing, intakeData, photosProc, invitedProcedure, finalize]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-surface-container-lowest shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <svg className="w-5 h-5 text-on-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
            </svg>
          </div>
          <div>
            <p className="font-body font-semibold text-on-surface">Oia AI Advisor</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
              <p className="font-body text-body-sm text-on-surface-variant">
                {loading ? 'Oia is typing…' : intakeComplete ? 'Consultation complete' : 'Online & Ready to Assist'}
              </p>
            </div>
          </div>
        </div>

        {WA_NUMBER && (
          <button
            onClick={() => {
              const msg = "Hi Oia, I'd like to continue our conversation here on WhatsApp.";
              window.open(`https://wa.me/${WA_NUMBER.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
            }}
            title="Continue this conversation on WhatsApp"
            className="flex items-center gap-1.5 text-[#25D366] border border-[#25D366]/40 hover:bg-[#25D366]/10 rounded-full px-3 py-1.5 transition-all shrink-0"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/>
            </svg>
            <span className="font-body text-[11px] font-semibold hidden sm:inline">Continue on WhatsApp</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map(msg => (
          <ChatMessage
            key={msg.id}
            message={msg}
            patientInitial={(patientName !== 'there' ? patientName : 'Y').charAt(0).toUpperCase()}
            onClinicSelect={id => {
              const clinic = messages.flatMap(m => m.clinics ?? []).find(c => c.id === id);
              if (clinic?.website) window.open(clinic.website, '_blank', 'noopener');
              else sendMessage(`Tell me more about this clinic`);
            }}
          />
        ))}

        {showTriage && !intakeComplete && (
          <TriageWidget onSubmit={submitTriage} />
        )}

        {photosProcedure && !intakeComplete && (
          <PhotoGuideWidget procedure={photosProcedure} onComplete={submitPhotos} />
        )}

        {/* Finding + delivering the SmartMatch shortlist (invited patients skip the
            phone box entirely — we already hold their number in the token). */}
        {finalizing && (
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl px-5 py-4 text-center">
            <svg className="w-5 h-5 animate-spin text-primary mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            <p className="font-body text-on-surface-variant text-xs">Finding the surgeons who best fit your goals…</p>
          </div>
        )}

        {intakeComplete && !linked && !finalizing && !finalized && !inviteToken && (
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl px-5 py-5">
            <div className="flex items-center gap-2 mb-1.5">
              <svg className="w-5 h-5 text-[#25D366] fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/>
              </svg>
              <p className="font-body font-semibold text-on-surface text-sm">Almost done — where should the team reach you?</p>
            </div>
            <p className="font-body text-on-surface-variant text-xs mb-3">
              Share your WhatsApp number so Oia and the clinical team can continue with you and send your personalised matches. It stays private to the team.
            </p>
            <input
              type="tel"
              inputMode="tel"
              placeholder="+44 7911 123456"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') linkAndSubmit(); }}
              disabled={linking}
              className={`w-full px-4 py-3 rounded-lg border font-body text-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 outline-none transition-all bg-surface-container-lowest ${
                phoneError ? 'border-error focus:ring-error' : 'border-outline-variant focus:ring-primary'
              }`}
            />
            {phoneError && <p className="font-body text-[11px] text-error mt-1.5">{phoneError}</p>}
            <button
              onClick={linkAndSubmit}
              disabled={linking}
              className="w-full mt-3 bg-primary text-on-primary py-3.5 rounded-lg font-body font-semibold text-label-caps uppercase tracking-widest hover:opacity-90 active:opacity-80 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {linking ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              ) : 'Submit My Profile'}
            </button>
            <p className="font-body text-[11px] text-on-surface-variant text-center mt-3 opacity-70">
              Include your country code. Your details are only seen by Oia and the clinical team.
            </p>
          </div>
        )}

        {/* Once finalized, the matched surgeons are rendered inline as a chat message,
            so this "registered but no matches yet" card only shows if delivery hasn't
            completed (e.g. finalize errored). */}
        {linked && !finalized && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl px-5 py-4 text-center">
            <svg className="w-8 h-8 text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="font-body font-semibold text-green-400 text-sm">Consultation Registered</p>
            <p className="font-body text-on-surface-variant text-xs mt-1">Oia is putting your personalised surgeon matches together now — she&apos;ll bring you your options here and on WhatsApp very soon.</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Waitlist: primary CTA is to continue on WhatsApp — the patient messages
          Oia first, so the thread is theirs and she can warmly re-engage later. */}
      {WAITLIST_MODE && !inviteToken && (
        <div className="px-6 pb-3 pt-1 shrink-0">
          <a
            href={WAITLIST_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full bg-white/70 backdrop-blur-sm text-[#1eae56] border-2 border-[#25D366] py-3.5 rounded-xl font-body font-semibold text-sm hover:bg-[#25D366]/8 active:bg-[#25D366]/12 transition-all"
          >
            <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.893c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.445h.006c6.585 0 11.946-5.359 11.949-11.893a11.821 11.821 0 00-3.495-8.411" />
            </svg>
            Continue on WhatsApp
          </a>
        </div>
      )}

      {/* Quick replies */}
      {suggestions.length > 0 && !loading && !intakeComplete && !showTriage && (!WAITLIST_MODE || inviteToken) && (
        <QuickReplies suggestions={suggestions} onSelect={sendMessage} />
      )}

      {/* Input */}
      {!intakeComplete && !showTriage && (
        <ChatInput onSend={sendMessage} disabled={loading} />
      )}
    </div>
  );
}
