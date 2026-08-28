'use client';

import { useEffect, useState, useCallback } from 'react';
import { IcLock } from '@/components/OiaIcons';

interface ResearchClubModalProps {
  open: boolean;
  onClose: () => void;
}

// Oia's WhatsApp number — same source as LeadCaptureModal, kept in sync there.
const WA_NUMBER = (process.env.NEXT_PUBLIC_WA_NUMBER || '447752991023').replace(/[^0-9]/g, '');
const WA_INVITE_GREETING = "Hi Oia, I have an invite to the Research Club.";

const PREVIEW_CLIPS = ['/research-club/card1.gif', '/research-club/card2.gif', '/research-club/card3.gif'];

type FormState = 'idle' | 'submitting' | 'done' | 'error';

/**
 * The Oia Research Club — a closed, invite-only group where members share their
 * own before/during/after journeys. This is a standalone marketing/trust surface
 * with its own lead capture (POST /api/leads), separate from the in-chat
 * capacity/waitlist gate (see lib/waitlist.ts + LeadCaptureModal).
 */
export default function ResearchClubModal({ open, onClose }: ResearchClubModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState<FormState>('idle');

  // Close on Escape, lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // Reset form state each time the modal is reopened.
  useEffect(() => {
    if (open) setState('idle');
  }, [open]);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !email.trim()) return;
      setState('submitting');
      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: email.trim() }),
        });
        if (!res.ok) throw new Error('request failed');
        setState('done');
      } catch {
        setState('error');
      }
    },
    [name, email],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="research-club-title"
    >
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Modal card */}
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-surface/90 backdrop-blur-xl border border-white/50 rounded-t-card3 sm:rounded-card2 px-6 pt-7 pb-8 sm:p-8 mx-0 sm:mx-6 animate-[sheetUp_0.28s_cubic-bezier(0.22,1,0.36,1)]"
        style={{ boxShadow: 'var(--elev-float), inset 0 1px 0 rgba(255,255,255,0.6)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>

        {/* Grabber (mobile sheet affordance) */}
        <div className="sm:hidden mx-auto mb-5 h-1 w-10 rounded-full bg-outline-variant" />

        {/* Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="shrink-0 w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center text-primary">
            <IcLock size={16} />
          </span>
          <span className="font-body font-semibold text-[11px] uppercase tracking-[0.15em] text-primary bg-primary/8 border border-primary/25 rounded-full px-3 py-1.5">
            Invite only
          </span>
        </div>

        <h2 id="research-club-title" className="font-display text-[26px] sm:text-[30px] leading-tight text-on-surface pr-8">
          The Oia Research Club
        </h2>
        <p className="mt-2 font-body text-[15px] text-on-surface-variant leading-relaxed max-w-md">
          A closed circle where members share their own journeys — before, during, and six months after —
          so the next woman considering the same thing can see a real outcome first.
        </p>

        {/* Preview clips */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {PREVIEW_CLIPS.map((src) => (
            <div key={src} className="relative rounded-card overflow-hidden bg-surface-container-lowest border border-outline-variant/50">
              <div className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF; next/image would strip motion */}
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="absolute bottom-1.5 right-1.5 font-body font-semibold text-[8px] uppercase tracking-wide text-on-primary bg-on-surface/60 rounded px-1.5 py-0.5">
                Preview
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 font-body text-[11.5px] leading-relaxed text-on-surface-variant">
          Shown with participant consent ahead of the Research Club&apos;s launch. Results vary by person; Oia never guarantees an outcome.
        </p>

        {/* Invite form */}
        <form onSubmit={submit} className="mt-6 pt-6 border-t border-outline-variant/50">
          <h3 className="font-display text-[18px] text-on-surface mb-1.5">Currently invite-only</h3>

          {state === 'done' ? (
            <div className="rounded-card bg-primary/8 border border-primary/20 px-4 py-4">
              <p className="font-body text-[14px] text-on-surface">
                Thank you — we have your details and will reach out as a place opens.
              </p>
            </div>
          ) : (
            <>
              <p className="font-body text-[13.5px] text-on-surface-variant leading-relaxed mb-4">
                Know a member? Ask them for an introduction. Otherwise, leave your details and we&apos;ll reach out when a place opens.
              </p>
              <div className="space-y-2.5">
                <input
                  type="text"
                  required
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full font-body text-[14px] px-4 py-3 rounded-card border border-outline-variant/60"
                />
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full font-body text-[14px] px-4 py-3 rounded-card border border-outline-variant/60"
                />
                <button
                  type="submit"
                  disabled={state === 'submitting'}
                  className="lift-cta w-full bg-primary text-on-primary font-body font-semibold text-[14px] px-5 py-3.5 rounded-card disabled:opacity-60"
                >
                  {state === 'submitting' ? 'Sending…' : 'Request an introduction'}
                </button>
              </div>
              {state === 'error' && (
                <p className="mt-2.5 font-body text-[12.5px] text-error">
                  Something went wrong — please try again in a moment.
                </p>
              )}
              <p className="mt-3 font-body text-[11.5px] text-on-surface-variant">
                Already have an invite?{' '}
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_INVITE_GREETING)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-semibold hover:underline"
                >
                  Message Oia on WhatsApp
                </a>
                . By continuing you agree to our Privacy Policy and Terms.
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
