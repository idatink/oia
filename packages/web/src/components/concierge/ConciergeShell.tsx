'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import PatientSidebar from './PatientSidebar';
import ChatWindow from './ChatWindow';
import Link from 'next/link';

export default function ConciergeShell() {
  const params = useSearchParams();
  const patientName = params.get('name') ?? 'there';
  const [detectedProcedures, setDetectedProcedures] = useState<string[]>([]);

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
        <div className="w-32" />
      </header>

      {/* Mobile header */}
      <div className="flex md:hidden items-center justify-between px-5 py-4 border-b border-outline-variant/20 bg-surface-container-lowest shrink-0">
        <Link href="/" className="text-on-surface-variant">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
          </svg>
        </Link>
        <span className="font-display text-display-sm text-primary">Nia AI</span>
        <div className="w-10" />
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden md:pt-16">
        {/* Sidebar — desktop only */}
        <div className="hidden md:flex">
          <PatientSidebar
            name={patientName !== 'there' ? patientName : 'Your Profile'}
            patientId=""
            intents={detectedProcedures}
            conciergeStatus={
              detectedProcedures.length > 0
                ? `Nia has identified your interest in ${detectedProcedures.join(' & ')}. Your personalised clinic match will be ready once consultation is complete.`
                : 'Nia is gathering your information. Your personalised match will be prepared once your consultation is complete.'
            }
          />
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
          <ChatWindow patientName={patientName} onProcedureDetected={setDetectedProcedures} />
        </div>
      </div>

    </div>
  );
}
