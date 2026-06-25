'use client';

import { useState } from 'react';
import BottomTabNav from '@/components/dashboard/BottomTabNav';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const DATES = [9, 10, 11, 12, 13];
const ACTIVE_DATE = 11;

const ARRIVALS = [
  {
    id: 1,
    name: 'Kemal Ozturk',
    procedure: 'Rhinoplasty & Septoplasty',
    time: '08:50 AM · 4 Hours',
    status: 'CLEARED',
    statusColor: 'text-green-600 bg-green-50',
    action: 'Manage',
    actionVariant: 'outline',
  },
  {
    id: 2,
    name: 'Nina Petrov',
    procedure: 'Facelift Consultation',
    time: '01:30 PM · Room 104',
    status: 'ACTION REQUIRED',
    statusColor: 'text-primary bg-primary-fixed',
    actions: [{ label: 'Send Reminder', variant: 'primary' }, { label: 'Reschedule', variant: 'outline' }],
  },
  {
    id: 3,
    name: 'Elena Soroka',
    procedure: 'Virtual Intake Session',
    time: '03:00 PM · Zoom',
    status: 'CONFIRMED',
    statusColor: 'text-blue-600 bg-blue-50',
    action: 'Join Link',
    actionVariant: 'primary',
  },
];

export default function BookingsPage() {
  const [activeDate, setActiveDate] = useState(ACTIVE_DATE);

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
          <h1 className="font-display text-display-sm text-on-surface">Bookings</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative text-on-surface-variant">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
            </svg>
          </button>
          <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center">
            <span className="font-display text-display-sm text-on-secondary-container">A</span>
          </div>
        </div>
      </header>

      <div className="px-5 pt-6 space-y-5">
        {/* Month + week strip */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-display-sm text-on-surface">September 2024</h2>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <button className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {DAYS.map((day, i) => {
              const date = DATES[i];
              const isActive = date === activeDate;
              return (
                <button
                  key={day}
                  onClick={() => setActiveDate(date)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${isActive ? 'bg-primary text-on-primary' : 'hover:bg-surface-container-low'}`}
                >
                  <span className={`font-body text-[10px] font-semibold uppercase tracking-wider ${isActive ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>{day}</span>
                  <span className={`font-display text-display-sm leading-none ${isActive ? 'text-on-primary' : 'text-on-surface'}`}>{date}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-on-primary/60" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Today's arrivals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-body text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">Today&apos;s Arrivals</p>
            <button className="font-body text-body-sm text-primary font-semibold hover:opacity-70 transition-all">View all (12)</button>
          </div>

          <div className="space-y-3">
            {ARRIVALS.map(arrival => (
              <div key={arrival.id} className="bg-surface-container-lowest rounded-card2 border border-outline-variant/20 shadow-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                      <span className="font-display text-display-sm text-on-secondary-container">{arrival.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-body font-semibold text-on-surface">{arrival.name}</p>
                      <p className="font-body text-[11px] text-on-surface-variant">{arrival.procedure}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-body text-[9px] font-bold uppercase tracking-wider ${arrival.statusColor}`}>
                    {arrival.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mb-3 ml-13">
                  <svg className="w-3.5 h-3.5 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span className="font-body text-body-sm text-on-surface-variant">{arrival.time}</span>
                </div>

                {'actions' in arrival && arrival.actions ? (
                  <div className="flex gap-2">
                    {arrival.actions.map(a => (
                      <button
                        key={a.label}
                        className={`flex-1 py-2 rounded-lg font-body text-label-caps uppercase tracking-wider font-semibold text-[10px] transition-all ${
                          a.variant === 'primary'
                            ? 'bg-primary text-on-primary hover:opacity-90'
                            : 'border border-outline-variant text-on-surface hover:border-primary hover:text-primary'
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    className={`w-full py-2 rounded-lg font-body text-label-caps uppercase tracking-wider font-semibold text-[10px] transition-all ${
                      arrival.actionVariant === 'primary'
                        ? 'bg-primary text-on-primary hover:opacity-90'
                        : 'border border-outline-variant text-on-surface hover:border-primary hover:text-primary'
                    }`}
                  >
                    {arrival.action}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Today summary */}
        <div className="bg-surface-container-low rounded-card2 p-5 border border-outline-variant/10">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="font-body text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">Today</p>
              <p className="font-display text-display-md text-on-surface mt-0.5">12 <span className="font-body text-body-md text-on-surface-variant font-normal">Bookings</span></p>
            </div>
            <div className="flex gap-4">
              {[{ label: 'Surgeries', value: 2 }, { label: 'Consults', value: 10 }].map(s => (
                <div key={s.label} className="text-center">
                  <p className="font-display text-display-sm text-on-surface">{s.value}</p>
                  <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-body text-[10px] text-on-surface-variant uppercase tracking-wider">Capacity</span>
              <span className="font-body text-[10px] font-semibold text-on-surface">75%</span>
            </div>
            <div className="h-2 bg-outline-variant/40 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '75%' }} />
            </div>
          </div>
        </div>

        {/* NIA Insight */}
        <div className="bg-on-surface rounded-card2 p-5 text-inverse-on-surface">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-primary-fixed" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
            </svg>
            <span className="font-body text-label-caps text-primary-fixed uppercase tracking-widest font-semibold">Insight</span>
          </div>
          <p className="font-body text-body-sm text-inverse-on-surface/80 italic mb-4 leading-relaxed">
            &ldquo;Nina Petrov&apos;s travel itinerary shows a flight delay. She may be late for her 1:30 PM appointment.&rdquo;
          </p>
          <button className="w-full bg-primary text-on-primary py-3 rounded-lg font-body text-label-caps uppercase tracking-widest font-semibold hover:opacity-90 transition-all">
            Resolve Issue
          </button>
        </div>

        {/* Assign tasks */}
        <div className="bg-surface-container-low rounded-card2 p-5 border border-outline-variant/10 flex items-center justify-between">
          <div>
            <svg className="w-5 h-5 text-on-surface-variant mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
            </svg>
            <p className="font-body font-semibold text-on-surface text-body-sm">Assign Tasks</p>
            <p className="font-body text-[11px] text-on-surface-variant">Delegate pre-op calls to the nursing team for tomorrow&apos;s list.</p>
          </div>
          <button className="w-10 h-10 bg-primary text-on-primary rounded-full flex items-center justify-center hover:opacity-90 transition-all shrink-0 ml-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
          </button>
        </div>
      </div>

      <BottomTabNav />
    </div>
  );
}
