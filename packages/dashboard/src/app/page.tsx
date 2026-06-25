'use client';

import Link from 'next/link';
import BottomTabNav from '@/components/dashboard/BottomTabNav';

const PIPELINE = [
  {
    col: 'CLAIMED',
    patients: [
      { name: 'Elena Rodriguez', procedure: 'Blepharoplasty', note: 'Follow-up today', urgent: true },
      { name: 'David Chen', procedure: 'Liposuction', note: null, urgent: false },
    ],
  },
  {
    col: 'SCHEDULED',
    patients: [
      { name: 'Sophie V.', procedure: 'Breast Augmentation', note: 'Oct 12, 14:00', urgent: false },
    ],
  },
  {
    col: 'CONFIRMED',
    patients: [
      { name: 'James L.', procedure: 'Rhinoplasty', note: 'Nov 3', urgent: false },
    ],
  },
];

const TASK_QUEUE = [
  { name: 'Sarah J.', procedure: 'Rhinoplasty Enquiry', location: 'London, UK', isNew: true },
  { name: 'Marcus Thorne', procedure: 'Facelift Consultation', location: 'NYC, USA', isNew: true },
];

export default function DiscoverPage() {
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
        <div className="flex items-center gap-3">
          <button className="relative text-on-surface-variant">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
            </svg>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-on-error text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
          </button>
          <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center">
            <span className="font-display text-display-sm text-on-secondary-container">A</span>
          </div>
        </div>
      </header>

      <div className="px-5 pt-6 space-y-6">
        {/* Welcome */}
        <div>
          <p className="font-body text-label-caps text-primary uppercase tracking-widest font-semibold">Welcome back, Dr. Aldrich</p>
          <h1 className="font-display text-display-md text-on-surface mt-1">Coordinator Dashboard</h1>
        </div>

        {/* NIA Intelligence Alert */}
        <div className="bg-surface-container-lowest rounded-card2 border border-outline-variant/20 shadow-card p-5">
          <p className="font-body text-label-caps text-primary uppercase tracking-widest font-semibold mb-3">Nia Intelligence Alerts</p>
          <div className="border-l-2 border-primary pl-4 mb-4">
            <p className="font-body text-body-md text-on-surface leading-relaxed">
              Sarah J.&apos;s Rhinoplasty enquiry is{' '}
              <span className="text-primary font-semibold">high priority</span>. AI analysis suggests she is 85% ready to book for October.
            </p>
          </div>
          <Link href="/concierge">
            <button className="w-full bg-primary text-on-primary py-3 rounded-lg font-body text-label-caps uppercase tracking-widest font-semibold hover:opacity-90 transition-all">
              View Actionable Leads
            </button>
          </Link>
        </div>

        {/* Task Queue */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-display-sm text-on-surface">Task Queue</h2>
            <span className="bg-primary-fixed text-primary px-3 py-1 rounded-full font-body text-[10px] font-semibold uppercase tracking-wider">
              {TASK_QUEUE.length} New Leads
            </span>
          </div>
          <div className="space-y-3">
            {TASK_QUEUE.map(lead => (
              <div key={lead.name} className="bg-surface-container-lowest rounded-card2 border border-outline-variant/20 shadow-card p-4">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="font-body font-semibold text-on-surface">{lead.name}</p>
                    <p className="font-body text-body-sm text-on-surface-variant">{lead.procedure} · {lead.location}</p>
                  </div>
                  {lead.isNew && (
                    <span className="bg-primary-fixed text-primary px-2 py-0.5 rounded font-body text-[10px] font-semibold uppercase tracking-wider">New</span>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-lg font-body text-label-caps uppercase tracking-wider font-semibold hover:opacity-90 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"/>
                    </svg>
                    Claim Lead
                  </button>
                  <button className="w-11 h-11 flex items-center justify-center border border-outline-variant rounded-lg text-on-surface-variant hover:text-primary hover:border-primary transition-all">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Patient Pipeline */}
        <div>
          <h2 className="font-display text-display-sm text-on-surface mb-4">Patient Pipeline</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {PIPELINE.map(col => (
              <div key={col.col} className="bg-surface-container-low rounded-card2 p-4 min-w-[200px] shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-body text-label-caps text-on-surface-variant uppercase tracking-widest font-semibold">{col.col}</span>
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div className="space-y-2">
                  {col.patients.map(p => (
                    <div key={p.name} className="bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/20">
                      <p className="font-body font-semibold text-on-surface text-body-sm">{p.name}</p>
                      <p className="font-body text-[11px] text-on-surface-variant">{p.procedure}</p>
                      {p.note && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <svg className={`w-3 h-3 ${p.urgent ? 'text-error' : 'text-on-surface-variant'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <span className={`font-body text-[10px] font-semibold ${p.urgent ? 'text-error' : 'text-on-surface-variant'}`}>{p.note}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Response Time', value: '12m', sub: 'avg today' },
            { label: 'Conversion', value: '24%', sub: 'this month' },
          ].map(stat => (
            <div key={stat.label} className="bg-surface-container-low rounded-card2 p-5 border border-outline-variant/10">
              <p className="font-body text-label-caps text-on-surface-variant uppercase tracking-widest font-semibold">{stat.label}</p>
              <p className="font-display text-display-md text-on-surface mt-1">{stat.value}</p>
              <p className="font-body text-[11px] text-on-surface-variant mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <BottomTabNav />
    </div>
  );
}
