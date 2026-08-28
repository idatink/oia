'use client';

import { useEffect, useRef, useState, useCallback, type FormEvent } from 'react';
import { IcLock } from '@/components/OiaIcons';

interface ResearchClubModalProps {
  open: boolean;
  onClose: () => void;
}

// Oia's WhatsApp number — same source as LeadCaptureModal, kept in sync there.
const WA_NUMBER = (process.env.NEXT_PUBLIC_WA_NUMBER || '447752991023').replace(/[^0-9]/g, '');
const WA_INVITE_GREETING = "Hi Oia, I have an invite to the Research Club.";

interface PreviewClip {
  src: string;
  procedure: string;
  /** Faces modified with AI to protect the participant's identity. */
  illustrative?: boolean;
}

// Procedure labels reflect the most-searched-for plastic surgery categories
// (ASPS procedural statistics), matched to what's visible in each clip.
const PREVIEW_CLIPS: PreviewClip[] = [
  { src: '/research-club/card1.gif', procedure: 'Liposuction' },
  { src: '/research-club/card2.gif', procedure: 'Rhinoplasty' },
  { src: '/research-club/card3.gif', procedure: 'Brazilian Butt Lift' },
  { src: '/research-club/card4.gif', procedure: 'Tummy Tuck', illustrative: true },
  { src: '/research-club/card5.gif', procedure: 'Arm Lift', illustrative: true },
  { src: '/research-club/card6.gif', procedure: 'Rhinoplasty', illustrative: true },
];

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

  // Preview clip carousel
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeClip, setActiveClip] = useState(0);

  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    const first = el?.children[0] as HTMLElement | undefined;
    if (!el || !first) return;
    const step = first.getBoundingClientRect().width + 12; // matches gap-3
    const idx = Math.round(el.scrollLeft / step);
    setActiveClip(Math.max(0, Math.min(PREVIEW_CLIPS.length - 1, idx)));
  }, []);

  const goToClip = useCallback((idx: number) => {
    const el = carouselRef.current;
    const clamped = Math.max(0, Math.min(PREVIEW_CLIPS.length - 1, idx));
    const target = el?.children[clamped] as HTMLElement | undefined;
    if (!el || !target) return;
    el.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
  }, []);

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
    async (e: FormEvent) => {
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

        {/* Preview clips — swipeable carousel so visitors can find a procedure that relates to them */}
        <div className="mt-6">
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="relative flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 -mx-6 px-6 sm:mx-0 sm:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {PREVIEW_CLIPS.map((clip) => (
              <div
                key={clip.src}
                className="relative shrink-0 w-[64%] sm:w-[42%] snap-center rounded-card overflow-hidden bg-surface-container-lowest border border-outline-variant/50"
              >
                <div className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF; next/image would strip motion */}
                  <img src={clip.src} alt={`${clip.procedure} preview`} className="w-full h-full object-cover" />
                </div>
                {clip.illustrative && (
                  <span className="absolute top-1.5 left-1.5 font-body font-semibold text-[8px] uppercase tracking-wide text-on-surface-variant bg-surface/85 backdrop-blur-sm rounded px-1.5 py-0.5">
                    Illustrative
                  </span>
                )}
                <span className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-3.5rem)] font-body font-semibold text-[9px] uppercase tracking-wide text-on-surface bg-surface/85 backdrop-blur-sm rounded px-1.5 py-0.5 truncate">
                  {clip.procedure}
                </span>
                <span className="absolute bottom-1.5 right-1.5 font-body font-semibold text-[8px] uppercase tracking-wide text-on-primary bg-on-surface/60 rounded px-1.5 py-0.5">
                  Preview
                </span>
              </div>
            ))}
          </div>

          {/* Dots + arrows */}
          <div className="mt-2.5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => goToClip(activeClip - 1)}
              disabled={activeClip === 0}
              aria-label="Previous preview"
              className="hidden sm:flex w-6 h-6 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container disabled:opacity-30 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="flex items-center gap-1.5">
              {PREVIEW_CLIPS.map((clip, i) => (
                <button
                  key={clip.src}
                  type="button"
                  onClick={() => goToClip(i)}
                  aria-label={`Show ${clip.procedure} preview`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeClip ? 'w-4 bg-primary' : 'w-1.5 bg-outline-variant'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => goToClip(activeClip + 1)}
              disabled={activeClip === PREVIEW_CLIPS.length - 1}
              aria-label="Next preview"
              className="hidden sm:flex w-6 h-6 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container disabled:opacity-30 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        <p className="mt-3 font-body text-[11.5px] leading-relaxed text-on-surface-variant">
          Shown with participant consent ahead of the Research Club&apos;s launch. Clips marked &ldquo;Illustrative&rdquo; have faces modified with AI to protect participant identity. Results vary by person; Oia never guarantees an outcome.
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
