'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LeadCaptureModalProps {
  open: boolean;
  onClose: () => void;
}

const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER ?? '';

/**
 * Anonymous-first entry (Decision A3).
 *
 * No name/email/phone is required to begin. The patient simply chooses where to
 * talk to Oia — the website chat (fully anonymous; Oia collects details
 * conversationally and asks for a WhatsApp number only at the end) or WhatsApp.
 */
export default function LeadCaptureModal({ open, onClose }: LeadCaptureModalProps) {
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  function chooseWeb() {
    onClose();
    router.push('/concierge');
  }

  function chooseWhatsApp() {
    const message = "Hi Oia, I'm interested in exploring medical aesthetics abroad and would love to find out what's possible for me.";
    const waUrl = `https://wa.me/${WA_NUMBER.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-surface-container-lowest rounded-card2 shadow-float w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-primary-fixed px-3 py-1 rounded-full mb-4">
            <svg className="w-3 h-3 text-primary fill-current" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            <span className="font-body text-[10px] uppercase tracking-[0.15em] text-primary font-semibold">No details needed to start</span>
          </div>
          <h2 className="font-display text-display-md text-on-surface">Chat with Oia</h2>
          <p className="font-body text-body-sm text-on-surface-variant mt-2">
            Ask anything — anonymously. Oia only needs a number at the very end, once you&apos;re ready for the team to follow up.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={chooseWeb}
            className="w-full group relative flex items-center gap-4 p-5 rounded-card2 border-2 border-primary/30 bg-primary-fixed/30 hover:border-primary hover:bg-primary-fixed/50 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-6 h-6 text-on-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body font-semibold text-on-surface">Start chatting here</p>
              <p className="font-body text-body-sm text-on-surface-variant mt-0.5">Our full AI chat with gallery and clinic matching — no sign-up</p>
            </div>
            <svg className="w-4 h-4 text-on-surface-variant group-hover:text-on-surface shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </button>

          <button
            onClick={chooseWhatsApp}
            className="w-full group relative flex items-center gap-4 p-5 rounded-card2 border-2 border-[#25D366]/30 bg-[#25D366]/5 hover:border-[#25D366] hover:bg-[#25D366]/10 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body font-semibold text-on-surface">Continue on WhatsApp</p>
              <p className="font-body text-body-sm text-on-surface-variant mt-0.5">Chat with Oia directly from your WhatsApp — works on any device</p>
            </div>
            <svg className="w-4 h-4 text-on-surface-variant group-hover:text-on-surface shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <p className="font-body text-[11px] text-on-surface-variant text-center mt-6 opacity-70">
          Both channels are fully private. Oia AI provides planning support only — always consult a licensed surgeon before any procedure.
        </p>
      </div>
    </div>
  );
}
