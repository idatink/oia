'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { parsePhoneNumber } from 'libphonenumber-js';

interface LeadCaptureModalProps {
  open: boolean;
  onClose: () => void;
}

const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER ?? '';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateForm(form: { name: string; email: string; whatsapp: string }) {
  const errors: { name?: string; email?: string; whatsapp?: string } = {};

  const name = form.name.trim();
  if (!name) errors.name = 'Your name is required.';
  else if (name.length < 2) errors.name = 'Please enter your full name.';

  const email = form.email.trim();
  if (!email) errors.email = 'Your email address is required.';
  else if (!EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.';

  const phone = form.whatsapp.trim();
  if (!phone) {
    errors.whatsapp = 'Your WhatsApp number is required.';
  } else {
    let phoneOk = false;
    try { phoneOk = parsePhoneNumber(phone).isValid(); } catch { /* fall through */ }
    if (!phoneOk) errors.whatsapp = 'Please enter a valid number with country code — e.g. +44 7911 123456.';
  }

  return errors;
}

export default function LeadCaptureModal({ open, onClose }: LeadCaptureModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'surface'>('form');
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '' });
  const [touched, setTouched] = useState({ name: false, email: false, whatsapp: false });
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
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

  useEffect(() => {
    if (open) {
      setStep('form');
      setTouched({ name: false, email: false, whatsapp: false });
      setSubmitError('');
    }
  }, [open]);

  if (!open) return null;

  const fieldErrors = validateForm(form);
  const isValid = Object.keys(fieldErrors).length === 0;

  function blur(field: keyof typeof touched) {
    setTouched(t => ({ ...t, [field]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, whatsapp: true });
    if (!isValid) return;
    setSubmitError('');
    setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save');
      setStep('surface');
    } catch {
      setSubmitError('Something went wrong — please try again.');
    } finally {
      setLoading(false);
    }
  }

  function chooseWeb() {
    onClose();
    router.push(`/concierge?name=${encodeURIComponent(form.name)}`);
  }

  function chooseWhatsApp() {
    const firstName = form.name.trim().split(' ')[0];
    const message = `Hi Oia, I'm ${firstName}. I'm interested in exploring medical aesthetics abroad and would love to find out what's possible for me.`;
    const waUrl = `https://wa.me/${WA_NUMBER.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener');
    onClose();
  }

  function fieldClass(field: keyof typeof touched) {
    const hasError = touched[field] && fieldErrors[field];
    return `w-full px-4 py-3 rounded-lg border font-body text-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 outline-none transition-all bg-surface-container-low ${
      hasError
        ? 'border-error focus:ring-error'
        : 'border-outline-variant focus:ring-primary'
    }`;
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

        {step === 'form' && (
          <>
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-primary-fixed px-3 py-1 rounded-full mb-4">
                <svg className="w-3 h-3 text-primary fill-current" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                <span className="font-body text-[10px] uppercase tracking-[0.15em] text-primary font-semibold">Secure & Private</span>
              </div>
              <h2 className="font-display text-display-md text-on-surface">Begin Your Journey</h2>
              <p className="font-body text-body-sm text-on-surface-variant mt-2">
                Tell us a little about yourself and Oia will personalise your experience.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Name */}
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
                  onBlur={() => blur('name')}
                  className={fieldClass('name')}
                />
                {touched.name && fieldErrors.name && (
                  <p className="font-body text-[11px] text-error mt-1.5">{fieldErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block font-body text-label-caps text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="elena@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  onBlur={() => blur('email')}
                  className={fieldClass('email')}
                />
                {touched.email && fieldErrors.email && (
                  <p className="font-body text-[11px] text-error mt-1.5">{fieldErrors.email}</p>
                )}
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block font-body text-label-caps text-on-surface-variant uppercase tracking-wider mb-1.5">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  placeholder="+44 7911 123456"
                  value={form.whatsapp}
                  onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                  onBlur={() => blur('whatsapp')}
                  className={fieldClass('whatsapp')}
                />
                {touched.whatsapp && fieldErrors.whatsapp ? (
                  <p className="font-body text-[11px] text-error mt-1.5">{fieldErrors.whatsapp}</p>
                ) : (
                  <p className="font-body text-[11px] text-on-surface-variant mt-1.5">
                    Include your country code — e.g. +44 7911 123456 · +1 212 555 0180 · +971 52 123 4567
                  </p>
                )}
              </div>

              {submitError && (
                <p className="font-body text-body-sm text-error">{submitError}</p>
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
              Your data is encrypted and never shared. Oia AI provides planning support only — always consult a licensed surgeon before any procedure.
            </p>
          </>
        )}

        {step === 'surface' && (
          <>
            <div className="mb-8">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-primary fill-current" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
              </div>
              <h2 className="font-display text-display-md text-on-surface">How would you like to chat with Oia?</h2>
              <p className="font-body text-body-sm text-on-surface-variant mt-2">
                Hi {form.name.trim().split(' ')[0]} — choose where you&apos;d like your AI consultation to take place.
              </p>
            </div>

            <div className="space-y-3">
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

              <button
                onClick={chooseWeb}
                className="w-full group relative flex items-center gap-4 p-5 rounded-card2 border-2 border-outline-variant/40 bg-surface-container-low hover:border-primary/40 hover:bg-primary-fixed/30 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-on-surface">Continue on Website</p>
                  <p className="font-body text-body-sm text-on-surface-variant mt-0.5">Use our full AI chat widget with gallery and clinic matching</p>
                </div>
                <svg className="w-4 h-4 text-on-surface-variant group-hover:text-on-surface shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>

            <p className="font-body text-[11px] text-on-surface-variant text-center mt-6 opacity-70">
              Both channels are fully private. Your details are only seen by Oia and the clinical team.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
