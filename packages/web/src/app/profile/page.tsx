'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import LeadCaptureModal from '@/components/LeadCaptureModal';
import Link from 'next/link';

export default function ProfilePage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Nav onCTAClick={() => setModalOpen(true)} />

      <main className="flex-grow pt-16 min-h-screen bg-surface-container-low">
        <div className="max-w-lg mx-auto px-6 py-16 text-center">

          {/* Avatar placeholder */}
          <div className="w-24 h-24 rounded-full bg-primary-fixed flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
            </svg>
          </div>

          <h1 className="font-display text-display-lg text-on-surface mb-2">Your Profile</h1>
          <p className="font-body text-body-md text-on-surface-variant mb-10 max-w-sm mx-auto">
            Sign in to track your consultation, view your matches, and manage your journey with Nia.
          </p>

          {/* Quick actions */}
          <div className="space-y-3 mb-10">
            <button
              onClick={() => setModalOpen(true)}
              className="w-full flex items-center gap-4 bg-surface-container-lowest rounded-xl border border-outline-variant/20 px-5 py-4 text-left hover:border-primary/40 hover:bg-primary-fixed/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-body text-sm font-semibold text-on-surface">Start AI Assessment</p>
                <p className="font-body text-[11px] text-on-surface-variant mt-0.5">Let Nia match you with the right clinic and surgeon</p>
              </div>
              <svg className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>

            <Link
              href="/concierge"
              className="w-full flex items-center gap-4 bg-surface-container-lowest rounded-xl border border-outline-variant/20 px-5 py-4 text-left hover:border-primary/40 hover:bg-primary-fixed/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-body text-sm font-semibold text-on-surface">Continue with Nia</p>
                <p className="font-body text-[11px] text-on-surface-variant mt-0.5">Resume your AI consultation</p>
              </div>
              <svg className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </Link>

            <Link
              href="/treatments"
              className="w-full flex items-center gap-4 bg-surface-container-lowest rounded-xl border border-outline-variant/20 px-5 py-4 text-left hover:border-primary/40 hover:bg-primary-fixed/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.338 2.798a10.5 10.5 0 01-7.864-3.55"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-body text-sm font-semibold text-on-surface">Browse Treatments</p>
                <p className="font-body text-[11px] text-on-surface-variant mt-0.5">Explore all procedures and pricing</p>
              </div>
              <svg className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {/* Privacy note */}
          <div className="flex items-center gap-2 justify-center text-on-surface-variant">
            <svg className="w-4 h-4 text-primary shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            <p className="font-body text-[11px]">Your data is encrypted and never shared without your consent.</p>
          </div>
        </div>
      </main>

      <LeadCaptureModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
