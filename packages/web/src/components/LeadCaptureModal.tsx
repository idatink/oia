'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface LeadCaptureModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LeadCaptureModal({ open, onClose }: LeadCaptureModalProps) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.whatsapp.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save');
      onClose();
      router.push('/concierge');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface-container-lowest rounded-card2 shadow-float w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-primary-fixed px-3 py-1 rounded-full mb-4">
            <svg className="w-3 h-3 text-primary fill-current" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            <span className="font-body text-[10px] uppercase tracking-[0.15em] text-primary font-semibold">Secure & Private</span>
          </div>
          <h2 className="font-display text-display-md text-on-surface">Begin Your Journey</h2>
          <p className="font-body text-body-sm text-on-surface-variant mt-2">
            Tell us a little about yourself and Nia will personalise your experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-body text-label-caps text-on-surface-variant uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              ref={firstInputRef}
              type="text"
              placeholder="Elena Rossi"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-low font-body text-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block font-body text-label-caps text-on-surface-variant uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              placeholder="elena@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-low font-body text-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block font-body text-label-caps text-on-surface-variant uppercase tracking-wider mb-1.5">
              WhatsApp Number
            </label>
            <input
              type="tel"
              placeholder="+44 7700 900000"
              value={form.whatsapp}
              onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-low font-body text-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary outline-none transition-all"
            />
            <p className="font-body text-[11px] text-on-surface-variant mt-1.5">
              Nia will follow up on WhatsApp after your consultation.
            </p>
          </div>

          {error && (
            <p className="font-body text-body-sm text-error">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-primary text-on-primary py-4 rounded-lg font-body font-semibold text-label-caps uppercase tracking-widest hover:opacity-90 active:opacity-80 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : (
              <>
                Start My AI Assessment
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10"/>
                </svg>
              </>
            )}
          </button>
        </form>

        <p className="font-body text-[11px] text-on-surface-variant text-center mt-6 opacity-70">
          Your data is encrypted and never shared. Nia AI provides planning support only — always consult a licensed surgeon before any procedure.
        </p>
      </div>
    </div>
  );
}
