'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import LeadCaptureModal from '@/components/LeadCaptureModal';

const VALUES = [
  {
    title: 'Hold it gently',
    body: 'Our patients are making one of the biggest decisions of their lives. Everything we build — every sentence, every screen — should lower the pressure, never raise it.',
  },
  {
    title: 'Honest by default',
    body: 'No invented numbers, no dark patterns, no pressure tactics. If a claim can’t be verified, it doesn’t ship. Trust is the entire product.',
  },
  {
    title: 'One journey, whole',
    body: 'We don’t hand patients off. From the first anonymous question to the last recovery check-in, the experience should feel like one pair of steady hands.',
  },
];

export default function CareersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="bg-surface-container-lowest min-h-screen">
      <Nav onCTAClick={() => setModalOpen(true)} />

      <main className="pt-16">
        <section className="py-20 md:py-28 px-6 text-center">
          <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-4">Careers</span>
          <h1 className="font-display text-4xl md:text-6xl text-on-surface max-w-3xl mx-auto leading-tight">
            Help us hold the biggest decisions, <span className="italic text-primary">gently.</span>
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-xl mx-auto mt-6">
            Oia is a small founding team building a private surgical concierge across London and Istanbul — AI where it helps, humans where it matters.
          </p>
        </section>

        <section className="pb-20 md:pb-28 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUES.map(v => (
              <div key={v.title} className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-7">
                <h3 className="font-display text-xl text-primary mb-3">{v.title}</h3>
                <p className="font-body text-body-sm text-on-surface-variant leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20 md:py-28 bg-surface px-6 text-center">
          <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-4">Open roles</span>
          <h2 className="font-display text-3xl md:text-4xl text-on-surface mb-6 max-w-xl mx-auto">
            No open listings right now.
          </h2>
          <p className="font-body text-body-md text-on-surface-variant max-w-md mx-auto mb-8">
            But exceptional people make their own openings. If you care about patients, craft and honesty, tell us who you are.
          </p>
          <a href="mailto:hello@heyoia.com?subject=Joining%20Oia"
            className="inline-block bg-primary text-on-primary px-8 py-4 rounded-lg font-body font-semibold text-label-caps uppercase tracking-widest hover:opacity-90 active:opacity-80 transition-all">
            Write to us
          </a>
        </section>
      </main>

      <footer className="bg-surface-container-lowest border-t border-outline-variant/30 px-6 py-10 text-center">
        <p className="font-display italic text-xl text-on-surface mb-3">The decision of a lifetime, <span className="text-primary">held gently.</span></p>
        <p className="font-body text-[11px] text-on-surface-variant opacity-50">© 2026 Oia — Your Bespoke Treatment Planner.</p>
      </footer>

      <LeadCaptureModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
