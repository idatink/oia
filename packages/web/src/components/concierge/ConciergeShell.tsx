'use client';

import PatientSidebar from './PatientSidebar';
import ChatWindow from './ChatWindow';
import BottomTabNav from './BottomTabNav';
import Link from 'next/link';

const STUB_PATIENT = {
  name: 'Elena Rossi',
  patientId: 'NIA-99281',
  intents: ['Rhinoplasty', 'Septoplasty'],
  conciergeStatus: 'Your preliminary assessment is complete. Reviewing top-tier clinics in Seoul and Istanbul for your profile.',
};

export default function ConciergeShell() {
  return (
    <div className="flex flex-col h-screen bg-surface overflow-hidden">
      {/* Desktop nav */}
      <header className="hidden md:flex items-center justify-between px-[64px] h-16 border-b border-outline-variant/10 bg-surface/80 nav-blur shrink-0 fixed top-0 left-0 right-0 z-40">
        <Link href="/" className="font-display text-display-sm text-primary tracking-tight">
          Nia Medical Concierge
        </Link>
        <nav className="flex items-center gap-10">
          {[{ label: 'Treatments', href: '/treatments' }, { label: 'The Nia Way', href: '/about' }, { label: 'Clinics', href: '/clinics' }].map(item => (
            <Link key={item.label} href={item.href} className="font-body text-label-caps uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="w-32" /> {/* balance spacer */}
      </header>

      {/* Mobile header */}
      <div className="flex md:hidden items-center justify-between px-5 py-4 border-b border-outline-variant/20 bg-surface-container-lowest shrink-0">
        <button className="text-on-surface-variant">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
          </svg>
        </button>
        <span className="font-display text-display-sm text-primary">Nia AI</span>
        <button className="bg-primary text-on-primary px-4 py-1.5 rounded-lg font-body text-[10px] uppercase tracking-widest font-semibold">
          Consult AI
        </button>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden md:pt-16">
        {/* Sidebar — desktop only */}
        <div className="hidden md:flex">
          <PatientSidebar
            name={STUB_PATIENT.name}
            patientId={STUB_PATIENT.patientId}
            intents={STUB_PATIENT.intents}
            conciergeStatus={STUB_PATIENT.conciergeStatus}
          />
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
          {/* Mobile intro card */}
          <div className="md:hidden mx-4 mt-4 mb-2 bg-surface-container-low rounded-card p-5 border border-outline-variant/20">
            <div className="inline-flex items-center gap-2 mb-3">
              <svg className="w-3.5 h-3.5 text-primary fill-current" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
              <span className="font-body text-[10px] uppercase tracking-[0.15em] text-primary font-semibold">Secure Consultation</span>
            </div>
            <h1 className="font-display text-display-sm text-on-surface mb-1">
              Your Journey,<br />Personalized by Nia AI
            </h1>
            <p className="font-body text-body-sm text-on-surface-variant mb-4">
              Planning medical procedures abroad requires precision and care. Nia AI evaluates thousands of data points to ensure your safety and comfort.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Clinical Data', sub: '500+ Clinics' },
                { label: 'Logistics', sub: 'Global Coverage' },
              ].map(card => (
                <div key={card.label} className="bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/20">
                  <p className="font-body text-body-sm font-semibold text-on-surface mt-1">{card.label}</p>
                  <p className="font-body text-[11px] text-on-surface-variant">{card.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <ChatWindow patientName={STUB_PATIENT.name} />
        </div>
      </div>

      <BottomTabNav />
    </div>
  );
}
