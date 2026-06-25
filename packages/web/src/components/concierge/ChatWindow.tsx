'use client';

import { useEffect, useRef, useState } from 'react';
import ChatMessage, { type Message } from './ChatMessage';
import QuickReplies from './QuickReplies';
import ChatInput from './ChatInput';
import { type ClinicCardData } from './ClinicCard';

const STUB_CLINICS: ClinicCardData[] = [
  {
    id: 'clinic-1',
    name: 'Glow Plastic Surgery',
    city: 'Seoul',
    country: 'KR',
    rating: 4.9,
    reviewCount: 210,
    description: 'Experts in 3D-simulated rhinoplasty with a focus on harmonious proportions.',
    tags: ['Vectra 3D', 'In-House Recovery'],
  },
  {
    id: 'clinic-2',
    name: 'Elite Esthetics Clinic',
    city: 'Istanbul',
    country: 'TR',
    rating: 4.8,
    reviewCount: 156,
    description: 'Led by world-renowned structural surgeons specialising in preservation rhinoplasty.',
    tags: ['Preservation PT', 'Luxury Concierge'],
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'nia',
    content: 'Hello! I\'m Nia, your personal medical concierge. Based on your interest, I\'ve been reviewing clinics that specialise in facial contouring. To give you the most accurate recommendations, could you tell me more about your desired outcome — or upload a reference photo?',
    timestamp: new Date(Date.now() - 120000),
  },
];

const QUICK_SUGGESTIONS = [
  'Tell me about recovery in Seoul',
  'Flight & Logistics support',
  'Insurance coverage?',
];

interface ChatWindowProps {
  patientName: string;
}

export default function ChatWindow({ patientName }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [suggestions, setSuggestions] = useState<string[]>(QUICK_SUGGESTIONS);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(text: string, files?: File[]) {
    if (files?.length) {
      // Photo upload — acknowledge and request more angles
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'patient',
        content: `[Uploaded ${files.length} photo${files.length > 1 ? 's' : ''}]`,
        timestamp: new Date(),
      };
      setMessages(m => [...m, userMsg]);
      setSuggestions([]);
      setLoading(true);
      await delay(1200);
      const niaReply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'nia',
        content: 'Thank you for the photos. I can see you\'re looking for natural refinement. Based on your images and goals, here are three elite clinics I recommend:',
        clinics: STUB_CLINICS,
        timestamp: new Date(),
      };
      setMessages(m => [...m, niaReply]);
      setSuggestions(['Tell me about recovery in Seoul', 'Flight & Logistics support', 'Insurance coverage?']);
      setLoading(false);
      return;
    }

    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'patient',
      content: text,
      timestamp: new Date(),
    };
    setMessages(m => [...m, userMsg]);
    setSuggestions([]);
    setLoading(true);

    await delay(1400);

    // Stub NIA response — will be replaced by real API call
    const niaReply: Message = {
      id: (Date.now() + 1).toString(),
      role: 'nia',
      content: getNiaReply(text),
      timestamp: new Date(),
    };
    setMessages(m => [...m, niaReply]);
    setSuggestions(QUICK_SUGGESTIONS);
    setLoading(false);
  }

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
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <p className="font-body text-body-sm text-on-surface-variant">Online & Ready to Assist</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-on-surface-variant">
          <button className="hover:text-primary transition-colors" aria-label="Help">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>
            </svg>
          </button>
          <button className="hover:text-primary transition-colors" aria-label="Settings">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map(msg => (
          <ChatMessage
            key={msg.id}
            message={msg}
            patientInitial={patientName.charAt(0)}
            onClinicSelect={id => handleSend(`Tell me more about clinic ${id}`)}
          />
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-on-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
              </svg>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/20 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-on-surface-variant/40 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {suggestions.length > 0 && !loading && (
        <QuickReplies suggestions={suggestions} onSelect={handleSend} />
      )}

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getNiaReply(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('recovery') || lower.includes('seoul')) {
    return 'Recovery in Seoul typically takes 7–10 days before you\'re comfortable flying. Most patients stay in a serviced apartment near the clinic. I can arrange private nursing, daily check-ins, and airport transfers — all coordinated through your concierge.';
  }
  if (lower.includes('flight') || lower.includes('logistics')) {
    return 'I work with a network of medical travel specialists to handle flights, accommodation, and ground transfers. Once you select a clinic, I\'ll prepare a full travel itinerary and pre-op logistics plan for your approval.';
  }
  if (lower.includes('insurance')) {
    return 'Several of our partner clinics offer procedure guarantees and revision coverage. I can also connect you with medical travel insurance providers who specialise in cosmetic procedures abroad. Shall I send you a comparison?';
  }
  return 'Thank you for sharing that. Based on what you\'ve told me, I\'d like to understand a little more about your goals. Could you describe the specific changes you\'re hoping to achieve, or upload a reference photo so I can provide more accurate recommendations?';
}
