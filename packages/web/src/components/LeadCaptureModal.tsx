'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface LeadCaptureModalProps {
  open: boolean;
  onClose: () => void;
}

// Oia's WhatsApp number. Prefer the env var; fall back to the known number so
// the WhatsApp option always works even if the env isn't set on a given deploy.
const WA_NUMBER = (process.env.NEXT_PUBLIC_WA_NUMBER || '447752991023').replace(/[^0-9]/g, '');
const WA_GREETING = "Hi Oia, I'd like to chat about a treatment. 🤍";

/**
 * Channel-selection modal. When a visitor presses any "Talk to Oia" / "Ask Oia"
 * CTA (all of which toggle `open`), they choose how they'd like to chat:
 *   • Here on the web  → the concierge chat (/concierge)
 *   • On WhatsApp      → opens WhatsApp to Oia's number
 *
 * Either way Oia gathers all the details in the conversation itself.
 */
export default function LeadCaptureModal({ open, onClose }: LeadCaptureModalProps) {
  const router = useRouter();

  const startWeb = useCallback(() => {
    onClose();
    router.push('/concierge');
  }, [onClose, router]);

  const startWhatsApp = useCallback(() => {
    window.open(
      `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_GREETING)}`,
      '_blank',
      'noopener',
    );
    onClose();
  }, [onClose]);

  // Close on Escape, and lock background scroll while open.
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="oia-channel-title"
    >
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative w-full sm:max-w-md bg-surface rounded-t-card3 sm:rounded-card2 shadow-concierge px-6 pt-7 pb-8 sm:p-8 mx-0 sm:mx-6 animate-[sheetUp_0.28s_cubic-bezier(0.22,1,0.36,1)]">
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>

        {/* Grabber (mobile sheet affordance) */}
        <div className="sm:hidden mx-auto mb-5 h-1 w-10 rounded-full bg-outline-variant" />

        <h2
          id="oia-channel-title"
          className="font-display text-[26px] leading-tight text-on-surface pr-8"
        >
          Chat with Oia
        </h2>
        <p className="mt-2 font-body text-[15px] text-on-surface-variant">
          How would you like to start? Oia will guide you either way — pick what suits you.
        </p>

        <div className="mt-6 space-y-3">
          {/* Web */}
          <button
            onClick={startWeb}
            className="group w-full flex items-center gap-4 rounded-card border border-outline-variant/60 hover:border-primary bg-surface-container-lowest hover:bg-primary-fixed/40 px-5 py-4 text-left transition-all"
          >
            <span className="shrink-0 w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="flex-1">
              <span className="block font-body font-semibold text-[16px] text-on-surface">
                Here on the web
              </span>
              <span className="block font-body text-[13px] text-on-surface-variant">
                Start instantly in your browser
              </span>
            </span>
            <svg className="w-5 h-5 text-on-surface-variant group-hover:text-primary group-hover:translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* WhatsApp */}
          <button
            onClick={startWhatsApp}
            className="group w-full flex items-center gap-4 rounded-card border border-[#25D366]/40 hover:border-[#25D366] bg-surface-container-lowest hover:bg-[#25D366]/10 px-5 py-4 text-left transition-all"
          >
            <span className="shrink-0 w-11 h-11 rounded-full bg-[#25D366]/12 text-[#25D366] flex items-center justify-center">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.892c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a12.062 12.062 0 0 0 5.71 1.447h.006c6.585 0 11.946-5.335 11.949-11.896C24 8.156 22.797 5.657 20.52 3.449" />
              </svg>
            </span>
            <span className="flex-1">
              <span className="block font-body font-semibold text-[16px] text-on-surface">
                On WhatsApp
              </span>
              <span className="block font-body text-[13px] text-on-surface-variant">
                Message Oia — pick up anytime on your phone
              </span>
            </span>
            <svg className="w-5 h-5 text-on-surface-variant group-hover:text-[#25D366] group-hover:translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <p className="mt-5 font-body text-[12px] text-on-surface-variant/80 text-center">
          Private &amp; secure. Your details are only seen by the Oia clinical team.
        </p>
      </div>
    </div>
  );
}
