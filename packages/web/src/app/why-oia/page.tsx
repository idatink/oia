'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import LeadCaptureModal from '@/components/LeadCaptureModal';

/* Treatment scope — honest catalogue, no invented stats or prices.
   Pricing lives in the chat estimate, where it is grounded. */
const SCOPE = [
  {
    category: 'Facial',
    items: ['Rhinoplasty (primary & revision)', 'Facelift & neck lift', 'Blepharoplasty', 'Brow lift', 'Facial fat transfer'],
  },
  {
    category: 'Breast',
    items: ['Augmentation', 'Lift', 'Reduction', 'Fat transfer', 'Reconstruction'],
  },
  {
    category: 'Body',
    items: ['Tummy tuck', 'Liposuction & VASER', 'Arm & thigh lift', 'Mommy makeover', 'Gynecomastia'],
  },
];

const FEATURES = [
  {
    n: '01',
    title: 'A conversation, not a form',
    body: 'Tell Oia what you long for in your own words — your goals, your timeline, your budget. She listens first and never rushes you toward a decision.',
  },
  {
    n: '02',
    title: 'Matching you can interrogate',
    body: 'Oia ranks surgeons on accreditation, specialism fit and verified patient reviews — and shows you the reasons behind every match. No mystery scores, no sponsored placements.',
  },
  {
    n: '03',
    title: 'One transparent estimate',
    body: 'Surgery, hospital, hotel, transfers and aftercare in a single all-inclusive figure, next to what the same procedure costs at home. £0 hidden fees.',
  },
  {
    n: '04',
    title: 'Your journey, held together',
    body: 'Flights, pre-op, surgery day, recovery check-ins — one itinerary, one point of contact, from first question to flying home.',
  },
  {
    n: '05',
    title: 'Aftercare that follows you home',
    body: 'Daily post-op check-ins, symptom tracking, and direct access to your surgical team through the same chat. Recovery, managed.',
  },
];

export default function FeaturesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="bg-surface-container-lowest min-h-screen">
      <Nav onCTAClick={() => setModalOpen(true)} />

      <main className="pt-16">
        {/* Hero — the manifesto */}
        <section className="py-20 md:py-28 px-6 text-center">
          <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-4">Why Oia</span>
          <h1 className="font-display text-4xl md:text-6xl text-on-surface max-w-3xl mx-auto leading-tight">
            Wanting to feel at home in your body <span className="italic text-primary">isn&apos;t vanity.</span>
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto mt-8 leading-relaxed">
            For too long, cosmetic surgery — and treatments as everyday as botox — have lived behind closed doors: whispered about, joked about, quietly judged. We think that&apos;s backwards. Caring about how you look is simply human. A tummy tuck after two children, a profile you finally love in photos, a fresher face that matches how you feel — these aren&apos;t secrets to keep. They&apos;re decisions to make well.
          </p>
          <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto mt-5 leading-relaxed">
            Oia exists to take the taboo out of looking after yourself: honest information, vetted surgeons, real prices, and a companion who never judges. No question is too small, too early, or &quot;too vain.&quot;
          </p>
        </section>

        {/* Imagery — every age, every body, zero shame */}
        <section className="px-6 pb-20 md:pb-28">
          <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden">
            <img src="/screens/why-oia-women.jpg" alt="Four women of different ages and skin tones sitting together, relaxed and smiling"
              className="w-full h-auto object-cover" />
          </div>
        </section>

        {/* Five capabilities */}
        <section className="py-20 md:py-28 bg-surface px-6">
          <div className="max-w-4xl mx-auto space-y-14">
            {FEATURES.map(f => (
              <div key={f.n} className="grid grid-cols-1 md:grid-cols-[80px_1fr] gap-4 md:gap-8 items-start">
                <span className="font-display text-2xl text-primary">{f.n}</span>
                <div>
                  <h2 className="font-display text-2xl md:text-3xl text-on-surface mb-3">{f.title}</h2>
                  <p className="font-body text-body-md text-on-surface-variant leading-relaxed max-w-2xl">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Treatment scope */}
        <section className="py-20 md:py-28 px-6">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-4">Scope</span>
            <h2 className="font-display text-3xl md:text-5xl text-on-surface">What Oia covers today.</h2>
            <p className="font-body text-body-md text-on-surface-variant mt-5 max-w-xl mx-auto">
              A vetted network across the UK, Germany, Lithuania, Spain, Greece, Turkey and Lebanon — new destinations join only when they clear our vetting bar. Every plan is bespoke: your all-inclusive price is quoted transparently in your estimate, never from a rate card.
            </p>
          </div>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {SCOPE.map(s => (
              <div key={s.category} className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-7">
                <h3 className="font-display text-xl text-primary mb-4">{s.category}</h3>
                <ul className="space-y-2.5">
                  {s.items.map(i => (
                    <li key={i} className="font-body text-body-sm text-on-surface-variant">{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-28 bg-surface-container-low px-6 text-center">
          <h2 className="font-display text-3xl md:text-5xl text-on-surface mb-6 max-w-xl mx-auto">Ask her anything first.</h2>
          <p className="font-body text-body-md text-on-surface-variant max-w-md mx-auto mb-8">Private. No forms. No pressure.</p>
          <button onClick={() => setModalOpen(true)}
            className="bg-primary text-on-primary px-8 py-4 rounded-lg font-body font-semibold text-label-caps uppercase tracking-widest hover:opacity-90 active:opacity-80 transition-all">
            Talk to Oia
          </button>
        </section>
      </main>

      <footer className="bg-surface border-t border-outline-variant/30 px-6 py-10 text-center">
        <p className="font-display italic text-xl text-on-surface mb-3">The decision of a lifetime, <span className="text-primary">held gently.</span></p>
        <p className="font-body text-[11px] text-on-surface-variant opacity-50">© 2026 Oia Medical Concierge.</p>
      </footer>

      <LeadCaptureModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
