'use client';

import { useEffect, useState } from 'react';
import BottomTabNav from '@/components/dashboard/BottomTabNav';

type Coordinator = { id: string; name: string };
type Ticket = { id: string; subject: string; category: string; status: string; adminReply: string | null; createdAt: string };

const TICKET_STATUS_STYLE: Record<string, string> = {
  OPEN: 'bg-yellow-50 text-yellow-700',
  IN_REVIEW: 'bg-blue-50 text-blue-700',
  RESOLVED: 'bg-green-50 text-green-700',
  CLOSED: 'bg-surface-container text-on-surface-variant',
};

const CATEGORIES = ['general', 'technical', 'billing', 'patient', 'other'];

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default function SettingsPage() {
  const [coordinator, setCoordinator] = useState<Coordinator | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const load = () => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(d => { if (d) setCoordinator(d); });
    fetch('/api/support-tickets').then(r => r.ok ? r.json() : []).then(setTickets);
  };

  useEffect(() => { load(); }, []);

  const nameInitial = coordinator?.name.trim()[0]?.toUpperCase() ?? 'C';

  const handleSubmit = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSubmitting(true);
    const res = await fetch('/api/support-tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body, category }),
    });
    if (res.ok) {
      setSubject(''); setBody(''); setCategory('general');
      setSubmitted(true); setShowContactForm(false);
      load();
    }
    setSubmitting(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-surface pb-32 lg:pb-12">
      {/* Mobile header */}
      <header className="bg-surface-container-lowest border-b border-outline-variant/20 px-5 py-4 flex items-center justify-between sticky top-0 z-30 lg:hidden">
        <h1 className="font-display text-display-sm text-on-surface">Settings</h1>
        <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center">
          <span className="font-display text-display-sm text-on-secondary-container">{nameInitial}</span>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-5 pt-8 pb-8 space-y-6">
        {/* Profile */}
        <div className="bg-surface-container-lowest rounded-card2 border border-outline-variant/20 p-6">
          <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold mb-4">Profile</p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
              <span className="font-display text-xl text-on-secondary-container font-semibold">{nameInitial}</span>
            </div>
            <div>
              <p className="font-body font-semibold text-on-surface">{coordinator?.name ?? '—'}</p>
              <p className="font-body text-body-sm text-on-surface-variant">Coordinator</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-surface-container-lowest rounded-card2 border border-outline-variant/20 p-6">
          <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold mb-3">Notifications</p>
          <p className="font-body text-body-sm text-on-surface-variant">Coming soon.</p>
        </div>

        {/* Integrations */}
        <div className="bg-surface-container-lowest rounded-card2 border border-outline-variant/20 p-6">
          <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold mb-3">Integrations</p>
          <p className="font-body text-body-sm text-on-surface-variant">Coming soon.</p>
        </div>

        {/* Contact Nia */}
        <div className="bg-surface-container-lowest rounded-card2 border border-outline-variant/20 overflow-hidden">
          <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between">
            <div>
              <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">Contact Nia</p>
              <p className="font-body text-[11px] text-on-surface-variant mt-0.5">Get help from the Nia team</p>
            </div>
            <button
              onClick={() => { setShowContactForm(f => !f); setSubmitted(false); }}
              className="bg-primary text-on-primary px-4 py-2 rounded-xl font-body text-[10px] font-semibold uppercase tracking-wider hover:opacity-90 transition-all"
            >
              {showContactForm ? 'Cancel' : '+ New Message'}
            </button>
          </div>

          {/* Contact form */}
          {showContactForm && (
            <div className="px-6 py-5 border-b border-outline-variant/10 space-y-4 bg-surface-container-low/40">
              <div>
                <label className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold block mb-1.5">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-lg border font-body text-[10px] font-semibold capitalize transition-all ${
                        category === c
                          ? 'border-primary bg-primary-fixed/50 text-primary'
                          : 'border-outline-variant/20 text-on-surface-variant hover:border-outline-variant'
                      }`}
                    >{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold block mb-1.5">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Question about patient data access"
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold block mb-1.5">Message</label>
                <textarea
                  rows={4}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Describe your issue or question…"
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary resize-none"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || !subject.trim() || !body.trim()}
                className="w-full bg-primary text-on-primary py-3 rounded-xl font-body text-[10px] font-semibold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-40"
              >
                {submitting ? 'Sending…' : 'Send to Nia Team →'}
              </button>
            </div>
          )}

          {submitted && !showContactForm && (
            <div className="px-6 py-4 bg-green-50 border-b border-green-100 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
              </svg>
              <p className="font-body text-[11px] text-green-800 font-semibold">Message sent — the Nia team will reply shortly.</p>
            </div>
          )}

          {/* Ticket history */}
          {tickets.length > 0 && (
            <div className="divide-y divide-outline-variant/10">
              {tickets.map(t => (
                <div key={t.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-semibold text-on-surface truncate">{t.subject}</p>
                      <p className="font-body text-[10px] text-on-surface-variant mt-0.5 capitalize">{t.category} · {timeAgo(t.createdAt)}</p>
                    </div>
                    <span className={`font-body text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${TICKET_STATUS_STYLE[t.status] ?? ''}`}>
                      {t.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {t.adminReply && (
                    <div className="mt-3 pl-3 border-l-2 border-primary/30">
                      <p className="font-body text-[9px] text-primary font-semibold uppercase tracking-wider mb-1">Nia reply</p>
                      <p className="font-body text-[11px] text-on-surface-variant leading-relaxed">{t.adminReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tickets.length === 0 && !showContactForm && (
            <div className="px-6 py-6 text-center">
              <p className="font-body text-[11px] text-on-surface-variant">No messages yet. Reach out anytime — we typically reply within a few hours.</p>
            </div>
          )}
        </div>

        {/* About */}
        <div className="bg-surface-container-lowest rounded-card2 border border-outline-variant/20 p-6">
          <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold mb-3">About</p>
          <p className="font-body text-body-sm text-on-surface-variant">Nia Coordinator Dashboard · Version 1.0</p>
        </div>
      </div>

      <BottomTabNav />
    </div>
  );
}
