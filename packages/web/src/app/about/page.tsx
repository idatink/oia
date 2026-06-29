'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import LeadCaptureModal from '@/components/LeadCaptureModal';

const STEPS = [
  {
    n: '01',
    title: 'You share your goals',
    body: 'Nia asks you about the procedure you\'re considering, your aesthetic goals, timeline, and medical history — one natural conversation, no forms to fill.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>
      </svg>
    ),
  },
  {
    n: '02',
    title: 'Nia builds your clinical profile',
    body: 'Your answers, photos, and screening data are processed to create a precise suitability profile — analysed against 50,000+ outcomes to assess candidacy and identify your optimal match.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
      </svg>
    ),
  },
  {
    n: '03',
    title: 'Your coordinator reviews & claims',
    body: 'A human coordinator at your matched clinic reviews your profile and claims your case. They prepare a fully itemised quote — surgeon fee, anaesthesia, hospital stay, aftercare — within 24–48 hours.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
      </svg>
    ),
  },
  {
    n: '04',
    title: 'You choose, we plan',
    body: 'Once you select your clinic, the full concierge service activates. Flights, private transfers, luxury accommodation and pre-op appointments are all coordinated for you.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/>
      </svg>
    ),
  },
  {
    n: '05',
    title: 'Your procedure & recovery',
    body: 'You arrive to a private pre-op consultation, surgery at your matched clinic, and 24/7 nursing-supported recovery. Every detail has been confirmed weeks in advance.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
      </svg>
    ),
  },
  {
    n: '06',
    title: 'Post-op follow-up',
    body: 'Nia schedules structured post-operative check-ins at Day 3, 7, 30 and 90. Your coordinator monitors healing and manages any follow-up care remotely or in-clinic.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
  },
];

const PILLARS = [
  {
    title: 'Intelligent Matching',
    body: 'We never suggest a clinic — we calculate the correct one. Our AI weighs your procedure, anatomy, medical history, timeline and budget against the full performance record of every surgeon in our network.',
    accent: 'bg-primary/10 text-primary',
  },
  {
    title: 'Absolute Privacy',
    body: 'Your identity, photos, and medical data are never shown to a clinic until you explicitly choose them. Only your procedure type and AI suitability score are visible during the matching phase.',
    accent: 'bg-secondary-container/60 text-secondary',
  },
  {
    title: 'Transparent Pricing',
    body: 'Every quote is fully itemised — surgeon fee, anaesthesia, facility, aftercare, accommodation. No commission tiers, no hidden mark-ups. You see exactly what you are paying for.',
    accent: 'bg-tertiary-fixed/60 text-tertiary',
  },
  {
    title: 'Human Oversight',
    body: 'Nia AI handles analysis and coordination. Every clinical decision and patient communication is owned by a real, medically-trained coordinator. You always have a human to call.',
    accent: 'bg-primary/10 text-primary',
  },
];

export default function AboutPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Nav onCTAClick={() => setModalOpen(true)} />

      <main className="pt-16 flex-grow">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="min-h-[60vh] flex items-center bg-surface py-24 overflow-hidden">
          <div className="max-w-container mx-auto px-[64px] grid md:grid-cols-2 gap-20 items-center">
            <div>
              <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-5">Our Methodology</span>
              <h1 className="font-display text-display-xl text-on-surface leading-[1.1] mb-6">
                Where Intelligence<br />
                Meets <span className="italic text-primary">Concierge Care.</span>
              </h1>
              <p className="font-body text-body-lg text-on-surface-variant max-w-md leading-relaxed mb-8">
                Nia was built on a single conviction: that the world&apos;s most advanced surgical expertise should be accessible to anyone, anywhere — managed with the rigour of a private family office.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="bg-primary text-on-primary px-8 py-4 rounded-lg font-body font-semibold text-label-caps uppercase tracking-widest hover:shadow-float transition-all flex items-center gap-3 w-fit"
              >
                Experience the Nia Way
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10"/></svg>
              </button>
            </div>
            {/* Decorative stat cards */}
            <div className="hidden md:grid grid-cols-2 gap-4">
              <div className="bg-surface-container-lowest rounded-card2 p-8 border border-outline-variant/20 shadow-card">
                <p className="font-display text-display-xl text-primary leading-none mb-2">50k+</p>
                <p className="font-body text-body-sm text-on-surface-variant">Outcomes analysed</p>
              </div>
              <div className="bg-primary rounded-card2 p-8 shadow-float col-span-1">
                <p className="font-display text-display-xl text-on-primary leading-none mb-2">24h</p>
                <p className="font-body text-body-sm text-on-primary/70">Coordinator response</p>
              </div>
              <div className="bg-surface-container-lowest rounded-card2 p-8 border border-outline-variant/20 shadow-card col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-body text-label-caps text-on-surface-variant uppercase tracking-wider">Nia Safety Protocol</p>
                  <span className="font-body text-[8px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="space-y-2">
                  {['JCI Accreditation verified', 'Medical screening complete', 'Surgeon credentials confirmed'].map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      <span className="font-body text-[11px] text-on-surface">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Four pillars ──────────────────────────────────────────────── */}
        <section className="py-24 bg-surface-container-low">
          <div className="max-w-container mx-auto px-[64px]">
            <div className="text-center mb-16">
              <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-4">Our Principles</span>
              <h2 className="font-display text-display-lg text-on-surface">Built on Four Unbreakable Commitments</h2>
              <p className="font-body text-body-md text-on-surface-variant mt-4 max-w-xl mx-auto">
                These are not aspirations. They are structural features of how Nia works — designed in from the beginning.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-gutter">
              {PILLARS.map((p, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-card2 p-8 border border-outline-variant/20">
                  <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${p.accent} mb-6`}>
                    <span className="font-display text-display-sm font-bold leading-none">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="font-display text-display-md text-on-surface mb-3">{p.title}</h3>
                  <p className="font-body text-body-md text-on-surface-variant leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── The 6-step journey ────────────────────────────────────────── */}
        <section className="py-24 bg-surface">
          <div className="max-w-container mx-auto px-[64px]">
            <div className="text-center mb-16">
              <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-4">Your Journey</span>
              <h2 className="font-display text-display-lg text-on-surface">Six Steps, Zero Uncertainty</h2>
              <p className="font-body text-body-md text-on-surface-variant mt-4 max-w-xl mx-auto">
                Every Nia patient follows the same structured path. No ambiguity, no chasing clinics, no surprises on the day.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {STEPS.map((step, i) => (
                <div key={i} className="group relative bg-surface-container-lowest rounded-card2 border border-outline-variant/20 p-7 hover:shadow-concierge hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      {step.icon}
                    </div>
                    <span className="font-display text-display-xl text-outline-variant/40 leading-none">{step.n}</span>
                  </div>
                  <h4 className="font-display text-display-sm text-on-surface mb-3">{step.title}</h4>
                  <p className="font-body text-body-sm text-on-surface-variant leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Safety standards ─────────────────────────────────────────── */}
        <section className="py-24 bg-surface-container-low">
          <div className="max-w-container mx-auto px-[64px] grid md:grid-cols-2 gap-20 items-center">
            <div>
              <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-5">Safety First</span>
              <h2 className="font-display text-display-lg text-on-surface mb-6">A Standard the NHS Would Recognise</h2>
              <p className="font-body text-body-md text-on-surface-variant leading-relaxed mb-8">
                Every partner clinic in our network holds or is actively pursuing JCI accreditation — the international equivalent of NHS hospital accreditation. We conduct annual on-site audits, review complication rates and patient feedback, and remove clinics that fall below our threshold.
              </p>
              <div className="space-y-3">
                {[
                  { title: 'JCI Accreditation', sub: 'Required for all partner clinics' },
                  { title: '11-point Medical Screening', sub: 'Every patient screened before matching' },
                  { title: 'Surgeon Credential Verification', sub: 'Board certification confirmed by our medical team' },
                  { title: 'Annual Clinic Audits', sub: 'On-site performance and safety reviews' },
                  { title: 'Transparent Complication Rates', sub: 'Disclosed to matched patients on request' },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                    <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <div>
                      <p className="font-body text-sm font-semibold text-on-surface">{item.title}</p>
                      <p className="font-body text-[11px] text-on-surface-variant mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — stat block */}
            <div className="space-y-4">
              <div className="bg-primary rounded-card2 p-8 shadow-float">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <p className="font-body text-label-caps text-on-primary/60 uppercase tracking-wider mb-2">Overall Safety Record</p>
                    <p className="font-display text-[56px] leading-none text-on-primary font-medium">99.8%</p>
                  </div>
                  <svg className="w-12 h-12 text-on-primary/30" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                </div>
                <p className="font-body text-body-sm text-on-primary/70">Across all procedures in our accredited clinic network, 2019–2024</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: '85+', sub: 'Vetted partner clinics' },
                  { label: '12', sub: 'Countries' },
                  { label: '4.9', sub: 'Average patient rating' },
                  { label: '0', sub: 'Hidden fees, ever' },
                ].map(s => (
                  <div key={s.label} className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/20 text-center">
                    <p className="font-display text-display-lg text-primary mb-1">{s.label}</p>
                    <p className="font-body text-[11px] text-on-surface-variant">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────────────────── */}
        <section className="py-24 bg-surface">
          <div className="max-w-container mx-auto px-[64px]">
            <div className="text-center mb-16">
              <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-4">Patient Voices</span>
              <h2 className="font-display text-display-lg text-on-surface">Trusted by Discerning Patients Globally</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-gutter">
              {[
                {
                  quote: 'I had tried two other services before Nia. The difference is night and day — they actually understood what I wanted aesthetically, not just procedurally.',
                  name: 'Elena V.',
                  detail: 'London · Rhinoplasty revision',
                },
                {
                  quote: 'The transparency is extraordinary. I could see exactly what each clinic was charging, why Nia recommended them over others, and what the complication rate was for my procedure.',
                  name: 'James K.',
                  detail: 'Dubai · Body contouring',
                },
                {
                  quote: 'Having a coordinator who speaks Arabic and understood my cultural preferences made this feel personal, not transactional. I would go back without hesitation.',
                  name: 'Layla M.',
                  detail: 'Riyadh · Blepharoplasty',
                },
              ].map((t, i) => (
                <div key={i} className="relative pl-8 border-l-2 border-primary/20">
                  <svg className="absolute left-0 top-0 w-5 h-5 text-primary -translate-x-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                  </svg>
                  <p className="font-body text-body-md text-on-surface leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center">
                      <span className="font-display text-sm text-on-secondary-container">{t.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-body text-[11px] font-bold text-on-surface uppercase tracking-wider">{t.name}</p>
                      <p className="font-body text-[10px] text-on-surface-variant">{t.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="py-20 bg-surface-container-low">
          <div className="max-w-container mx-auto px-[64px]"><div className="bg-primary rounded-card3 p-14 md:p-20 text-center text-on-primary">
            <span className="font-body text-label-caps uppercase tracking-[0.2em] text-on-primary/60 block mb-4">Begin Your Journey</span>
            <h2 className="font-display text-display-xl mb-6 max-w-xl mx-auto leading-[1.1]">
              Experience the Nia Way for yourself.
            </h2>
            <p className="font-body text-body-lg mb-10 opacity-80 max-w-lg mx-auto leading-relaxed">
              Your personalised AI consultation takes 10 minutes. Your coordinator responds within 24 hours. Your journey begins the day you decide.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-surface-container-lowest text-primary px-10 py-5 rounded-xl font-body font-bold text-label-caps uppercase tracking-[0.2em] hover:shadow-float transition-all"
            >
              Start AI Assessment →
            </button>
          </div></div>
        </section>
      </main>

      <LeadCaptureModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
