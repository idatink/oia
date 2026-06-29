'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import ChatMessage, { type Message } from './ChatMessage';
import QuickReplies from './QuickReplies';
import ChatInput from './ChatInput';
import TriageWidget, { type TriageAnswers } from './TriageWidget';
import type { ClinicCardData } from './ClinicCard';

const INITIAL_QUICK_REPLIES = [
  'Tell me about rhinoplasty options',
  'What procedures do you cover?',
  'How does the process work?',
];

const PLACEHOLDER_CLINICS: ClinicCardData[] = [
  {
    id: 'istanbul-aesthetic',
    name: 'Istanbul Aesthetic Centre',
    city: 'Istanbul',
    country: 'Turkey',
    rating: 4.9,
    reviewCount: 312,
    description: 'JCI-accredited centre specialising in facial sculpting and body contouring with 15 years of international patient care.',
    tags: ['JCI Accredited', 'English Speaking', 'VIP Suite'],
  },
  {
    id: 'barcelona-cmed',
    name: 'Barcelona CMed Clinic',
    city: 'Barcelona',
    country: 'Spain',
    rating: 4.8,
    reviewCount: 198,
    description: 'Boutique European clinic renowned for natural-looking rhinoplasty and advanced laser treatments.',
    tags: ['EU Standards', 'Bilingual Staff', 'Private Rooms'],
  },
  {
    id: 'bangkok-premium',
    name: 'Bangkok Premium Surgery',
    city: 'Bangkok',
    country: 'Thailand',
    rating: 4.9,
    reviewCount: 441,
    description: 'Award-winning facility offering full cosmetic surgery packages including 5-star recovery retreats.',
    tags: ['ISO Certified', 'Recovery Package', 'Airport Transfer'],
  },
];

interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

interface PhotoItem {
  base64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  previewUrl: string;
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
  let id = sessionStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(key, id); }
  return id;
}

export default function ChatWindow({ patientName, onProcedureDetected }: ChatWindowProps) {
  const sessionId = getOrCreateSessionId();
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>(INITIAL_QUICK_REPLIES);
  const [loading, setLoading] = useState(false);
  const [intakeComplete, setIntakeComplete] = useState(false);
  const [showTriage, setShowTriage] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const greeted = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;
    const greeting = patientName && patientName !== 'there'
      ? `Hello ${patientName}! I'm Nia, your personal medical concierge. I'm here to help you explore your options and connect you with the right clinic. What procedure are you interested in?`
      : "Hello! I'm Nia, your personal medical concierge. I'm here to help you explore cosmetic and reconstructive surgery options at world-class international clinics. What procedure are you considering?";
    setMessages([{ id: 'greeting', role: 'nia', content: greeting, timestamp: new Date() }]);
    setHistory([{ role: 'assistant', content: greeting }]);
  }, [patientName]);

  const sendMessage = useCallback(async (text: string, files?: File[]) => {
    if (loading) return;

    // Convert files to base64 photo items
    const photos: PhotoItem[] = [];
    if (files?.length) {
      for (const file of files) {
        try {
          photos.push(await fileToPhotoItem(file));
        } catch {
          console.error('Failed to read file', file.name);
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
          photos: photos.map(({ base64, mediaType }) => ({ base64, mediaType })),
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
              // Strip the <INTAKE> block from what the patient sees
              const visible = rawAccumulated.replace(/<INTAKE>[\s\S]*$/, '').trim();
              setMessages(m => m.map(msg =>
                msg.id === niaMsgId ? { ...msg, content: visible } : msg
              ));
            } else if (event.type === 'done') {
              const finalText = event.fullText ?? rawAccumulated.replace(/<INTAKE>[\s\S]*/, '').trim();
              setMessages(m => m.map(msg =>
                msg.id === niaMsgId ? { ...msg, content: finalText } : msg
              ));
              setHistory(h => [
                ...h,
                { role: 'user', content: displayText },
                { role: 'assistant', content: finalText },
              ]);
              // Attach gallery or clinic cards to the Nia message
              if (event.gallery || event.showClinics) {
                setMessages(m => m.map(msg =>
                  msg.id === niaMsgId
                    ? { ...msg, gallery: event.gallery ?? undefined }
                    : msg
                ));
              }

              if (event.intakeComplete && event.intake) {
                setIntakeComplete(true);
                setSuggestions([]);
                if (event.intake.procedure && onProcedureDetected) {
                  onProcedureDetected([event.intake.procedure as string]);
                }
                fetch('/api/submit-intake', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(event.intake),
                }).catch(console.error);
              } else if (event.showTriage) {
                setShowTriage(true);
                setSuggestions([]);
              } else {
                setSuggestions(INITIAL_QUICK_REPLIES);
              }

              // Attach clinic cards if Nia triggered the CLINICS display
              if (event.showClinics) {
                setMessages(m => m.map(msg =>
                  msg.id === niaMsgId
                    ? { ...msg, clinics: PLACEHOLDER_CLINICS }
                    : msg
                ));
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
  }, [loading, history, patientName]);

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
  }, [sendMessage]);

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
            <p className="font-body font-semibold text-on-surface">Nia AI Advisor</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
              <p className="font-body text-body-sm text-on-surface-variant">
                {loading ? 'Nia is typing…' : intakeComplete ? 'Consultation complete' : 'Online & Ready to Assist'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map(msg => (
          <ChatMessage
            key={msg.id}
            message={msg}
            patientInitial={(patientName !== 'there' ? patientName : 'Y').charAt(0).toUpperCase()}
            onClinicSelect={id => sendMessage(`Tell me more about clinic ${id}`)}
          />
        ))}

        {showTriage && !intakeComplete && (
          <TriageWidget onSubmit={submitTriage} />
        )}

        {intakeComplete && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl px-5 py-4 text-center">
            <svg className="w-8 h-8 text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="font-body font-semibold text-green-400 text-sm">Consultation Registered</p>
            <p className="font-body text-on-surface-variant text-xs mt-1">Our team will review your profile and reach out within 24–48 hours.</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {suggestions.length > 0 && !loading && !intakeComplete && !showTriage && (
        <QuickReplies suggestions={suggestions} onSelect={sendMessage} />
      )}

      {/* Input */}
      {!intakeComplete && !showTriage && (
        <ChatInput onSend={sendMessage} disabled={loading} />
      )}
    </div>
  );
}
