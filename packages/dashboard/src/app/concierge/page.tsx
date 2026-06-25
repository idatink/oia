'use client';

import { useState } from 'react';
import BottomTabNav from '@/components/dashboard/BottomTabNav';

const LEADS = [
  {
    id: 'sarah-j',
    name: 'Marcus T.',
    procedure: 'Rhinoplasty',
    location: 'London, UK',
    isNew: true,
    expanded: false,
  },
  {
    id: 'elena-r',
    name: 'Elena R.',
    procedure: 'Face Lift',
    location: 'Dubai, UAE',
    isNew: true,
    expanded: false,
  },
];

const EXPANDED_LEAD = {
  name: 'Sarah J.',
  verified: true,
  intent: 'Seeking Facial Rejuvenation & Personalized Recovery Package in Seoul.',
  claimedAgo: '02:45 ago',
  aiScore: 94,
  aiRationale: 'Patient has inquired about VIP transfers and private nursing support. Highly likely to book within 14 days.',
  scope: ['Full SMAS Face Lift', 'Secondary: Upper Blepharoplasty', 'Prefers: Gangnam District Clinic'],
  lastInteraction: '10:45 AM',
  assignedTo: 'You (Coordinator)',
  status: 'Active',
};

export default function ConciergePage() {
  const [sessionTime] = useState('04:12:45');

  return (
    <div className="min-h-screen bg-surface pb-20">
      {/* Header */}
      <header className="bg-surface-container-lowest border-b border-outline-variant/20 px-5 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button className="text-on-surface-variant">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
            </svg>
          </button>
          <span className="font-display text-display-sm text-primary tracking-tight">Nia AI</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center">
          <span className="font-display text-display-sm text-on-secondary-container">A</span>
        </div>
      </header>

      <div className="px-5 pt-6 space-y-5">
        {/* Active session */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-label-caps text-primary uppercase tracking-widest font-semibold">Active Concierge Pipeline</p>
            <h1 className="font-display text-display-md text-on-surface mt-0.5">Lead Management</h1>
          </div>
          <div className="text-right">
            <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-wider">Session Active</p>
            <p className="font-body font-semibold text-on-surface">{sessionTime}</p>
          </div>
        </div>

        {/* New requests */}
        <div>
          <p className="font-body text-label-caps text-on-surface-variant uppercase tracking-wider mb-3">New Requests</p>
          <div className="space-y-2">
            {LEADS.map(lead => (
              <div key={lead.id} className="bg-surface-container-lowest rounded-card border border-outline-variant/20 px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-body font-semibold text-on-surface">{lead.name}</p>
                    <span className="bg-primary-fixed text-primary px-2 py-0.5 rounded font-body text-[9px] font-semibold uppercase tracking-wider">{lead.procedure}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <svg className="w-3 h-3 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                    </svg>
                    <p className="font-body text-[11px] text-on-surface-variant">{lead.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expanded lead card — Sarah J. */}
        <div className="bg-surface-container-lowest rounded-card2 border border-outline-variant/20 shadow-card overflow-hidden">
          {/* Patient header */}
          <div className="relative h-28 bg-gradient-to-br from-secondary-container to-tertiary-fixed">
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-on-surface/60 text-inverse-on-surface px-2.5 py-1 rounded-full">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span className="font-body text-[10px] font-semibold">Claimed {EXPANDED_LEAD.claimedAgo}</span>
            </div>
          </div>
          <div className="px-4 pt-3 pb-5 space-y-4">
            <div className="flex items-center gap-2">
              <p className="font-display text-display-md text-on-surface">{EXPANDED_LEAD.name}</p>
              <svg className="w-5 h-5 text-primary fill-current" viewBox="0 0 24 24">
                <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p className="font-body text-body-sm text-on-surface-variant">{EXPANDED_LEAD.intent}</p>

            {/* AI Score */}
            <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/20">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
                </svg>
                <span className="font-body text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">AI Lead Scoring</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-body text-body-sm text-on-surface">High Intent Probability</span>
                <span className="font-display text-display-sm text-primary font-bold">{EXPANDED_LEAD.aiScore}%</span>
              </div>
              <div className="h-2 bg-outline-variant rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${EXPANDED_LEAD.aiScore}%` }}
                />
              </div>
              <p className="font-body text-body-sm text-on-surface-variant mt-3 italic leading-relaxed">
                &ldquo;{EXPANDED_LEAD.aiRationale}&rdquo;
              </p>
            </div>

            {/* Scope */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>
                </svg>
                <span className="font-body text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">Consultation Scope</span>
              </div>
              <ul className="space-y-1.5">
                {EXPANDED_LEAD.scope.map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span className="font-body text-body-sm text-on-surface">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3 rounded-lg font-body text-label-caps uppercase tracking-wider font-semibold hover:opacity-90 transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
                </svg>
                Contact via WhatsApp
              </button>
              <button className="w-full border border-outline-variant text-on-surface py-3 rounded-lg font-body text-label-caps uppercase tracking-wider font-semibold hover:border-primary hover:text-primary transition-all">
                View Full Case
              </button>
            </div>

            {/* Footer meta */}
            <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20">
              <div>
                <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-wider">Last Interaction</p>
                <p className="font-body text-body-sm font-semibold text-on-surface">{EXPANDED_LEAD.lastInteraction}</p>
              </div>
              <div className="text-right">
                <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-wider">Assigned To</p>
                <p className="font-body text-body-sm font-semibold text-on-surface">{EXPANDED_LEAD.assignedTo}</p>
              </div>
              <span className="bg-primary-fixed text-primary px-2.5 py-1 rounded-full font-body text-[10px] font-semibold uppercase tracking-wider">
                {EXPANDED_LEAD.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <BottomTabNav />
    </div>
  );
}
