'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import LeadCaptureModal from '@/components/LeadCaptureModal';

/* Journal — honest notes from the team. No fake press, no invented milestones. */
const POSTS = [
  {
    date: 'July 2026',
    tag: 'Announcement',
    title: 'Oia opens early access',
    excerpt:
      'We’re inviting a first group of patients to speak with Oia — anonymously, with no forms and no commitment. Here’s what early access includes and how the invitation works.',
  },
  {
    date: 'July 2026',
    tag: 'Essay',
    title: 'Why we built a concierge, not a directory',
    excerpt:
      'Directories optimise for choice. Patients need clarity. On the difference between listing 500 clinics and standing beside one person through one decision.',
  },
  {
    date: 'June 2026',
    tag: 'Behind the scenes',
    title: 'Istanbul, vetted: how surgeons enter our network',
    excerpt:
      'Board certification, international accreditation, procedure-level experience, verified outcomes. What we check before a surgeon can ever be matched — and what disqualifies one.',
  },
];

export default function NewsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="bg-surface-container-lowest min-h-screen aurora overflow-hidden">
      <Nav onCTAClick={() => setModalOpen(true)} />

      <main className="pt-16">
        <section className="py-20 md:py-28 px-6 text-center">
          <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-4">News</span>
          <h1 className="font-display text-4xl md:text-6xl text-on-surface max-w-2xl mx-auto leading-tight">
            Notes from the <span className="italic text-primary">journey.</span>
          </h1>
        </section>

        <section className="pb-20 md:pb-28 px-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {POSTS.map(p => (
              <article key={p.title}
                className="glass-soft lift-card rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-body text-[10px] font-semibold uppercase tracking-widest text-primary bg-primary/8 rounded-full px-3 py-1">{p.tag}</span>
                  <span className="font-body text-[11px] uppercase tracking-widest text-on-surface-variant">{p.date}</span>
                </div>
                <h2 className="font-display text-2xl md:text-3xl text-on-surface mb-3">{p.title}</h2>
                <p className="font-body text-body-md text-on-surface-variant leading-relaxed">{p.excerpt}</p>
                <p className="font-body text-label-caps uppercase tracking-widest text-primary mt-5">Read soon</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-20 bg-surface-container-low px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl text-on-surface mb-6">Rather just talk it through?</h2>
          <button onClick={() => setModalOpen(true)}
            className="bg-primary text-on-primary px-8 py-4 rounded-xl font-body font-semibold text-label-caps uppercase tracking-widest hover:opacity-90 active:opacity-80 transition-all lift-cta">
            Talk to Oia
          </button>
        </section>
      </main>

      <footer className="bg-surface border-t border-outline-variant/30 px-6 py-10 text-center">
        <p className="font-display italic text-xl text-on-surface mb-3">The decision of a lifetime, <span className="text-primary">held gently.</span></p>
        <p className="font-body text-[11px] text-on-surface-variant opacity-50">© 2026 Oia — Your Bespoke Treatment Planner.</p>
      </footer>

      <LeadCaptureModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
