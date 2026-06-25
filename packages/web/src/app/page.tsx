'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import LeadCaptureModal from '@/components/LeadCaptureModal';

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Nav onCTAClick={() => setModalOpen(true)} />

      <main className="flex-grow pt-16">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="min-h-[calc(100vh-64px)] flex items-center overflow-hidden bg-gradient-to-br from-surface to-surface-container-low">
          <div className="max-w-container mx-auto w-full px-[64px] grid grid-cols-1 md:grid-cols-2 gap-gutter items-center py-12 md:py-20">

            {/* Left */}
            <div className="z-10 order-2 md:order-1">
              <div className="inline-flex items-center gap-2 bg-surface-container-lowest px-4 py-1.5 rounded-full border border-outline-variant mb-6 shadow-card">
                <svg className="w-4 h-4 text-primary fill-current" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                <span className="font-body text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">Globally Accredited Excellence</span>
              </div>

              <h1 className="font-display text-display-xl text-on-surface mb-6 leading-[1.1]">
                Bespoke Surgical Journeys,{' '}
                <span className="text-primary italic">Managed by Intelligence.</span>
              </h1>

              <p className="font-body text-body-lg text-on-surface-variant mb-10 max-w-lg leading-relaxed">
                Experience the world&apos;s most prestigious aesthetic transformations with Nia. From AI-assisted specialist matching to 5-star post-operative care abroad.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setModalOpen(true)}
                  className="bg-primary text-on-primary px-8 py-4 rounded-lg font-body font-semibold text-label-caps uppercase tracking-widest hover:shadow-float transition-all flex items-center gap-3"
                >
                  Start AI Assessment
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                </button>
                <button className="border border-primary text-primary px-8 py-4 rounded-lg font-body font-semibold text-label-caps uppercase tracking-widest hover:bg-primary-fixed transition-all">
                  View Global Clinics
                </button>
              </div>

              <div className="mt-12 flex items-center gap-8 opacity-50 hover:opacity-100 transition-all grayscale hover:grayscale-0">
                <span className="font-body text-xs text-on-surface-variant">Featured in:</span>
                <div className="flex gap-6 items-center">
                  {['VOGUE', 'TATLER', 'Harpers'].map(pub => (
                    <span key={pub} className="font-display font-bold tracking-tight text-on-surface">{pub}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — hero image */}
            <div className="relative order-1 md:order-2 flex justify-center md:justify-end py-10 md:py-0">
              <div className="relative w-full max-w-[500px] aspect-[4/5] rounded-card3 overflow-hidden shadow-concierge bg-surface-container">
                {/* Placeholder gradient until real image is wired */}
                <div className="w-full h-full bg-gradient-to-br from-primary-fixed via-tertiary-fixed to-secondary-container" />

                {/* NIA agent bubble */}
                <div className="absolute bottom-8 left-8 right-8 bg-white/40 backdrop-blur-xl border border-white/20 p-5 rounded-card2 shadow-concierge">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-primary-container flex items-center justify-center">
                      <svg className="w-5 h-5 text-on-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    </div>
                    <div>
                      <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">Nia AI Agent</p>
                      <p className="font-display text-body-md text-on-surface italic">&ldquo;Analyzing clinic safety data in Seoul...&rdquo;</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating stat */}
              <div className="absolute -top-4 right-0 bg-surface-container-lowest p-5 rounded-card2 shadow-concierge border border-outline-variant z-20">
                <p className="text-primary font-display text-display-md leading-none">99.8%</p>
                <p className="font-body text-[10px] text-on-surface-variant mt-1 uppercase tracking-wider font-semibold">Safety Success Rate</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── The Nia Way ───────────────────────────────────────────────── */}
        <section className="py-24 bg-surface-container-low">
          <div className="max-w-container mx-auto px-[64px]">
            <div className="text-center mb-16">
              <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-4">Our Methodology</span>
              <h2 className="font-display text-display-lg text-on-surface">The Nia Way</h2>
              <p className="font-body text-body-md text-on-surface-variant mt-4 max-w-2xl mx-auto">
                We bridge the gap between world-class surgical expertise and seamless logistical peace of mind.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
              {/* AI Analysis — wide */}
              <div className="md:col-span-7 bg-surface-container-lowest p-10 rounded-card2 shadow-concierge flex flex-col justify-between min-h-[400px]">
                <div>
                  <div className="w-14 h-14 bg-primary-fixed rounded-xl flex items-center justify-center mb-8">
                    <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.338 2.798a10.5 10.5 0 01-7.864-3.55"/></svg>
                  </div>
                  <h3 className="font-display text-display-md text-on-surface mb-4">Precision AI Analysis</h3>
                  <p className="font-body text-body-md text-on-surface-variant max-w-md">
                    Our proprietary algorithms analyze your aesthetic goals against 50,000+ successful outcomes to match you with the specific surgeon whose expertise aligns with your vision.
                  </p>
                </div>
                <div className="mt-8 flex gap-2 flex-wrap">
                  {['Expert Matching', 'Risk Assessment'].map(tag => (
                    <span key={tag} className="bg-surface px-4 py-1.5 rounded-full border border-outline-variant font-body text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">{tag}</span>
                  ))}
                </div>
              </div>

              {/* Concierge Planning */}
              <div className="md:col-span-5 bg-tertiary-container p-10 rounded-card2 flex flex-col justify-between">
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-8 bg-tertiary-fixed opacity-60" />
                <div>
                  <h3 className="font-display text-display-md mb-4 text-on-primary">Concierge Planning</h3>
                  <p className="font-body text-body-md text-on-tertiary-container">
                    Your dedicated recovery specialist handles every flight, private transfer, and luxury accommodation detail.
                  </p>
                </div>
              </div>

              {/* Luxury Recovery */}
              <div className="md:col-span-5 bg-primary p-10 rounded-card2 text-on-primary">
                <div className="h-full flex flex-col justify-between">
                  <div>
                    <svg className="w-10 h-10 mb-6 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    <h3 className="font-display text-display-md mb-4">Luxury Recovery</h3>
                    <p className="font-body text-body-md text-on-primary/80">
                      Heal in curated wellness retreats with 24/7 private nursing and AI-monitored recovery tracking.
                    </p>
                  </div>
                  <div className="mt-12 flex items-end justify-between">
                    <div>
                      <p className="font-display text-display-md">120+</p>
                      <p className="font-body text-[10px] uppercase tracking-wider opacity-70 font-semibold mt-1">Partner Retreats</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="md:col-span-7 bg-surface p-10 border border-outline-variant rounded-card2 grid grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="font-display text-display-md text-on-surface mb-2">Global Excellence</h3>
                  <p className="font-body text-body-sm text-on-surface-variant">Our reach across the most prestigious medical hubs in Asia, Europe, and the Middle East.</p>
                </div>
                <div className="space-y-5">
                  {[
                    { label: 'Accredited Clinics', value: '85' },
                    { label: 'Partner Countries', value: '12' },
                    { label: 'Patient NPS', value: '98' },
                  ].map(stat => (
                    <div key={stat.label} className="flex justify-between items-end border-b border-outline-variant pb-2">
                      <span className="font-body text-label-caps text-on-surface-variant uppercase tracking-wider">{stat.label}</span>
                      <span className="font-display text-display-sm text-primary">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Treatments ────────────────────────────────────────────────── */}
        <section className="py-24 px-[64px] bg-surface overflow-hidden">
          <div className="max-w-container mx-auto">
            <div className="flex justify-between items-end mb-16">
              <div className="max-w-xl">
                <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-4">Specialties</span>
                <h2 className="font-display text-display-lg text-on-surface">Curated Surgical Excellence</h2>
              </div>
              <button className="text-primary font-body text-label-caps uppercase border-b border-primary pb-1 hover:opacity-70 transition-all">
                View All Procedures
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
              {[
                { title: 'Facial Sculpting', desc: 'Rhinoplasty, V-Line, and Anti-Aging procedures.' },
                { title: 'Body Contouring', desc: 'High-definition liposuction and 360 sculpting.' },
                { title: 'Skin Regeneration', desc: 'Stem-cell therapies and advanced laser resurfacing.' },
                { title: 'Corrective Care', desc: 'Revision surgery and post-traumatic reconstruction.' },
              ].map(proc => (
                <div key={proc.title} className="group cursor-pointer">
                  <div className="relative aspect-[3/4] rounded-card2 overflow-hidden mb-6 shadow-concierge bg-gradient-to-br from-secondary-container to-tertiary-fixed">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <h4 className="font-display text-display-sm text-on-surface mb-2">{proc.title}</h4>
                  <p className="font-body text-body-sm text-on-surface-variant">{proc.desc}</p>
                  <div className="mt-4 flex items-center gap-2 text-primary font-body text-[10px] tracking-widest font-semibold uppercase opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                    Explore Options
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ──────────────────────────────────────────────── */}
        <section className="py-24 bg-surface-container-low">
          <div className="max-w-container mx-auto px-[64px]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="font-display text-display-lg text-on-surface mb-8">Trusted by Discerning Patients Globally.</h2>
                <div className="space-y-12">
                  {[
                    { quote: 'Nia transformed my entire perception of medical travel. From the AI-matched surgeon in Seoul to the private villa recovery in Bali, every detail was handled with a level of care I didn\'t think existed.', name: 'Elena V.', detail: 'London, UK | Facelift Revision' },
                    { quote: 'The medical transparency provided by their AI dashboard gave me the confidence to fly across the world for a complex reconstruction. Truly world-class.', name: 'Mark S.', detail: 'Dubai, UAE | Body Sculpting' },
                  ].map(t => (
                    <div key={t.name} className="relative pl-12 border-l border-primary/20">
                      <svg className="absolute left-0 top-0 w-8 h-8 text-primary opacity-30" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
                      <p className="font-body text-body-lg text-on-surface mb-4 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary-container" />
                        <div>
                          <p className="font-body text-label-caps text-on-surface font-bold uppercase tracking-widest">{t.name}</p>
                          <p className="font-body text-body-sm text-on-surface-variant text-[12px]">{t.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="w-full aspect-square rounded-card3 overflow-hidden shadow-concierge bg-gradient-to-br from-tertiary-fixed to-secondary-container" />
                <div className="absolute -bottom-8 -left-8 bg-surface-container-lowest p-8 rounded-card2 shadow-concierge border border-outline-variant max-w-[280px]">
                  <div className="flex gap-1 mb-2 text-primary">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                    ))}
                  </div>
                  <p className="font-display text-body-sm text-on-surface italic">&ldquo;A standard of care that exceeds the finest private hospitals in the West.&rdquo;</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <section className="py-24 px-[64px]">
          <div className="max-w-container mx-auto bg-primary rounded-card3 p-12 md:p-20 text-center text-on-primary">
            <div className="max-w-2xl mx-auto">
              <h2 className="font-display text-display-xl mb-8">Begin Your Bespoke Transformation</h2>
              <p className="font-body text-body-lg mb-12 opacity-90">
                Let our AI concierge analyze your goals and match you with the world&apos;s leading specialists today.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => setModalOpen(true)}
                  className="bg-surface-container-lowest text-primary px-10 py-5 rounded-xl font-body font-bold text-label-caps uppercase tracking-[0.2em] hover:shadow-float transition-all"
                >
                  Start AI Assessment
                </button>
                <button className="border border-white/40 text-on-primary px-10 py-5 rounded-xl font-body text-label-caps uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                  Speak with a Human Concierge
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-surface-container-low border-t border-outline-variant/30">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-[64px] py-20 max-w-container mx-auto">
          <div className="space-y-6">
            <div className="font-display text-display-md text-primary">Nia</div>
            <p className="font-body text-body-sm text-on-surface-variant pr-8">Defining the future of global healthcare through artificial intelligence and white-glove concierge service.</p>
          </div>
          {[
            { title: 'Services', links: ['AI Analysis', 'Surgeon Matching', 'Medical Tourism', 'Recovery Retreats'] },
            { title: 'Company', links: ['Clinics', 'Safety Protocols', 'Patient Privacy', 'Careers'] },
            { title: 'Concierge', links: ['Contact Us', 'Book a Call'] },
          ].map(col => (
            <div key={col.title} className="space-y-6">
              <h5 className="font-body text-label-caps text-on-surface uppercase tracking-widest font-bold">{col.title}</h5>
              <ul className="space-y-4">
                {col.links.map(link => (
                  <li key={link}><a href="#" className="font-body text-body-sm text-on-surface-variant hover:text-primary transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="px-[64px] py-8 max-w-container mx-auto border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-[12px] text-on-surface-variant opacity-70 italic">© 2025 Nia Medical Concierge. Premium Surgical Excellence.</p>
          <div className="flex gap-8">
            {['Privacy Policy', 'Terms of Service'].map(l => (
              <a key={l} href="#" className="font-body text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-wider">{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* ── Floating sparkle ────────────────────────────────────────────── */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => setModalOpen(true)}
          className="w-16 h-16 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-float hover:scale-110 active:scale-95 transition-all duration-300"
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/></svg>
        </button>
      </div>

      <LeadCaptureModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
