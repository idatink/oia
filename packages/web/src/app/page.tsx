'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import LeadCaptureModal from '@/components/LeadCaptureModal';
import { useSiteConfig } from '@/components/SiteComponents';

const DEFAULT_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80',
  'recovery-suite': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=700&q=80',
  'facial-sculpting': 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80',
  'body-contouring': 'https://images.unsplash.com/photo-1609557927087-f9cf8e88de18?w=600&q=80',
  'skin-regeneration': 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=80',
  'corrective-care': 'https://images.unsplash.com/photo-1595272568891-123402d0fb3b?w=600&q=80',
  'concierge-about': 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=700&q=80',
};

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const { images: siteImages, loaded: configLoaded } = useSiteConfig();

  function img(key: keyof typeof DEFAULT_IMAGES): string | undefined {
    if (!configLoaded) return undefined;
    return siteImages[key] ?? DEFAULT_IMAGES[key];
  }

  return (
    <>
      <Nav onCTAClick={() => setModalOpen(true)} />

      <main className="flex-grow pt-16">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="min-h-[calc(100vh-64px)] flex items-center overflow-hidden bg-gradient-to-br from-surface to-surface-container-low">
          <div className="max-w-container mx-auto w-full px-6 md:px-[64px] grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-gutter items-center py-8 md:py-20">

            {/* Left — always first on mobile */}
            <div className="z-10">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-surface-container-lowest px-4 py-1.5 rounded-full border border-outline-variant mb-5 shadow-card">
                <svg className="w-3.5 h-3.5 text-primary fill-current" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                <span className="font-body text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">Globally Accredited Excellence</span>
              </div>

              {/* Headline — tighter on mobile */}
              <h1 className="font-display text-[2rem] leading-[1.08] sm:text-5xl md:text-display-xl text-on-surface mb-3 md:mb-5">
                Your surgeon,{' '}
                <span className="text-primary italic">found by AI.</span>
              </h1>

              {/* Sub — short and punchy on mobile */}
              <p className="font-body text-body-md text-on-surface-variant mb-6 md:mb-8 max-w-lg leading-relaxed">
                Tell Nia your goals, timeline, and budget. She matches you to the right surgeon — accredited, available, and within your reach.
              </p>

              {/* ── Chat preview — visible on mobile, hidden on desktop ── */}
              <div className="md:hidden mb-6 rounded-card2 border border-outline-variant bg-surface-container-lowest shadow-card overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-outline-variant/50 bg-surface-container-low">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 100 100" fill="none"><path d="M50 0C50 0 56 44 100 50C56 56 50 100 50 100C50 100 44 56 0 50C44 44 50 0 50 0Z" fill="white"/></svg>
                  </div>
                  <div>
                    <p className="font-body text-[11px] font-semibold text-on-surface uppercase tracking-widest">Nia</p>
                    <p className="font-body text-[10px] text-primary">● Online now</p>
                  </div>
                </div>
                {/* Messages */}
                <div className="px-4 py-3 space-y-2.5">
                  {/* Nia */}
                  <div className="flex gap-2 items-end">
                    <div className="w-6 h-6 rounded-full bg-primary shrink-0 flex items-center justify-center mb-0.5">
                      <svg width="10" height="10" viewBox="0 0 100 100" fill="none"><path d="M50 0C50 0 56 44 100 50C56 56 50 100 50 100C50 100 44 56 0 50C44 44 50 0 50 0Z" fill="white"/></svg>
                    </div>
                    <div className="bg-surface-container px-3 py-2 rounded-2xl rounded-bl-sm max-w-[80%]">
                      <p className="font-body text-[12px] text-on-surface leading-snug">What are you hoping to achieve, and when are you thinking of travelling?</p>
                    </div>
                  </div>
                  {/* Patient */}
                  <div className="flex justify-end">
                    <div className="bg-primary px-3 py-2 rounded-2xl rounded-br-sm max-w-[80%]">
                      <p className="font-body text-[12px] text-on-primary leading-snug">Rhinoplasty. Something natural. I&apos;m free in October.</p>
                    </div>
                  </div>
                  {/* Nia */}
                  <div className="flex gap-2 items-end">
                    <div className="w-6 h-6 rounded-full bg-primary shrink-0 flex items-center justify-center mb-0.5">
                      <svg width="10" height="10" viewBox="0 0 100 100" fill="none"><path d="M50 0C50 0 56 44 100 50C56 56 50 100 50 100C50 100 44 56 0 50C44 44 50 0 50 0Z" fill="white"/></svg>
                    </div>
                    <div className="bg-surface-container px-3 py-2 rounded-2xl rounded-bl-sm max-w-[80%]">
                      <p className="font-body text-[12px] text-on-surface leading-snug">Perfect — I have 3 surgeons in Istanbul available in October, each specialising in natural rhinoplasty. Let me show you their profiles.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setModalOpen(true)}
                  className="bg-primary text-on-primary px-7 py-3.5 rounded-lg font-body font-semibold text-label-caps uppercase tracking-widest hover:shadow-float transition-all flex items-center justify-center gap-3"
                >
                  Talk to Nia
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                </button>
                <a href="/results" className="border border-outline-variant text-on-surface-variant px-7 py-3.5 rounded-lg font-body font-semibold text-label-caps uppercase tracking-widest hover:border-primary hover:text-primary transition-all inline-flex items-center justify-center gap-3">
                  See Results
                </a>
              </div>

              {/* Press — subtle, desktop only to save space */}
              <div className="hidden md:flex mt-10 items-center gap-6 opacity-50 hover:opacity-100 transition-all grayscale hover:grayscale-0">
                <span className="font-body text-xs text-on-surface-variant">Featured in:</span>
                <div className="flex gap-5 items-center">
                  {['VOGUE', 'TATLER', 'Harpers'].map(pub => (
                    <span key={pub} className="font-display font-bold tracking-tight text-on-surface text-sm">{pub}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — hero image, desktop only */}
            <div className="hidden md:flex relative justify-end">
              <div className="relative w-full max-w-[500px] aspect-[4/5] rounded-card3 overflow-hidden shadow-concierge bg-surface-container">
                {img('hero') && <img src={img('hero')} alt="Patient journey" className="w-full h-full object-cover object-top" />}
                {/* Chat bubble overlay */}
                <div className="absolute bottom-5 right-5 w-[calc(100%-2.5rem)] max-w-[260px] bg-white/40 backdrop-blur-xl border border-white/20 p-4 rounded-card2 shadow-concierge">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 shrink-0 rounded-full bg-primary flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 100 100" fill="none"><path d="M50 0C50 0 56 44 100 50C56 56 50 100 50 100C50 100 44 56 0 50C44 44 50 0 50 0Z" fill="white"/></svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold">Nia AI</p>
                      <p className="font-display text-[13px] text-on-surface italic truncate">&ldquo;I found 3 surgeons free in October&rdquo;</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── The Nia Way ───────────────────────────────────────────────── */}
        <section className="py-14 md:py-24 bg-surface-container-low">
          <div className="max-w-container mx-auto px-6 md:px-[64px]">
            <div className="text-center mb-10 md:mb-16">
              <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-3">Our Methodology</span>
              <h2 className="font-display text-3xl md:text-display-lg text-on-surface">The Nia Way</h2>
              <p className="font-body text-body-md text-on-surface-variant mt-3 max-w-2xl mx-auto">
                We bridge the gap between world-class surgical expertise and seamless logistical peace of mind.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-gutter">
              {/* AI Analysis — wide */}
              <div className="md:col-span-7 bg-surface-container-lowest p-6 md:p-10 rounded-card2 shadow-concierge flex flex-col justify-between min-h-[280px] md:min-h-[400px]">
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
              <div className="md:col-span-5 bg-tertiary-container p-6 md:p-10 rounded-card2 flex flex-col justify-between">
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-5 md:mb-8">
                  {img('recovery-suite') && <img src={img('recovery-suite')} alt="Luxury recovery suite" className="w-full h-full object-cover" />}
                </div>
                <div>
                  <h3 className="font-display text-display-md mb-4 text-on-primary">Concierge Planning</h3>
                  <p className="font-body text-body-md text-on-tertiary-container">
                    Your dedicated recovery specialist handles every flight, private transfer, and luxury accommodation detail.
                  </p>
                </div>
              </div>

              {/* Luxury Recovery */}
              <div className="md:col-span-5 bg-primary p-6 md:p-10 rounded-card2 text-on-primary">
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
              <div className="md:col-span-7 bg-surface p-6 md:p-10 border border-outline-variant rounded-card2 grid grid-cols-2 gap-6 md:gap-8 items-center">
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
        <section className="py-14 md:py-24 px-6 md:px-[64px] bg-surface overflow-hidden">
          <div className="max-w-container mx-auto">
            <div className="flex justify-between items-end mb-10 md:mb-16">
              <div className="max-w-xl">
                <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-3">Specialties</span>
                <h2 className="font-display text-3xl md:text-display-lg text-on-surface">Curated Surgical Excellence</h2>
              </div>
              <a href="/treatments" className="hidden sm:block text-primary font-body text-label-caps uppercase border-b border-primary pb-1 hover:opacity-70 transition-all shrink-0 ml-4">
                View All
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
              {[
                { title: 'Facial Sculpting', desc: 'Rhinoplasty, V-Line, and Anti-Aging procedures.', img: img('facial-sculpting') },
                { title: 'Body Contouring', desc: 'High-definition liposuction and 360 sculpting.', img: img('body-contouring') },
                { title: 'Skin Regeneration', desc: 'Stem-cell therapies and advanced laser resurfacing.', img: img('skin-regeneration') },
                { title: 'Corrective Care', desc: 'Revision surgery and post-traumatic reconstruction.', img: img('corrective-care') },
              ].map(proc => (
                <div key={proc.title} className="group cursor-pointer">
                  <div className="relative aspect-[3/4] rounded-card2 overflow-hidden mb-6 shadow-concierge">
                    {proc.img && <img src={proc.img} alt={proc.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
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
        <section className="py-14 md:py-24 bg-surface-container-low">
          <div className="max-w-container mx-auto px-6 md:px-[64px]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-20 items-center">
              <div>
                <h2 className="font-display text-3xl md:text-display-lg text-on-surface mb-6 md:mb-8">Trusted by Discerning Patients Globally.</h2>
                <div className="space-y-8 md:space-y-12">
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

              <div className="relative pb-0 md:pb-10">
                <div className="w-full aspect-[4/3] md:aspect-square rounded-card3 overflow-hidden shadow-concierge">
                  {img('concierge-about') && <img src={img('concierge-about')} alt="Patient recovery" className="w-full h-full object-cover object-top" />}
                </div>
                {/* Pull-out quote card — inline on mobile, overlapping on desktop */}
                <div className="mt-4 md:mt-0 md:absolute md:-bottom-8 md:-left-8 bg-surface-container-lowest p-5 md:p-8 rounded-card2 shadow-concierge border border-outline-variant md:max-w-[280px]">
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
        <section className="py-10 md:py-24 px-6 md:px-[64px]">
          <div className="max-w-container mx-auto bg-primary rounded-card3 p-8 md:p-20 text-center text-on-primary">
            <div className="max-w-2xl mx-auto">
              <h2 className="font-display text-2xl md:text-display-xl mb-4 md:mb-8">Begin Your Bespoke Transformation</h2>
              <p className="font-body text-body-md md:text-body-lg mb-8 md:mb-12 opacity-90">
                Tell Nia your goals. She finds the right surgeon, at the right clinic, when you&apos;re ready to travel.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
                <button
                  onClick={() => setModalOpen(true)}
                  className="bg-surface-container-lowest text-primary px-8 md:px-10 py-4 md:py-5 rounded-xl font-body font-bold text-label-caps uppercase tracking-[0.2em] hover:shadow-float transition-all"
                >
                  Talk to Nia
                </button>
                <button className="border border-white/40 text-on-primary px-8 md:px-10 py-4 md:py-5 rounded-xl font-body text-label-caps uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                  Speak with a Concierge
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-surface-container-low border-t border-outline-variant/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-gutter px-6 md:px-[64px] py-12 md:py-20 max-w-container mx-auto">
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
        <div className="px-6 md:px-[64px] py-8 max-w-container mx-auto border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-[12px] text-on-surface-variant opacity-70 italic">© 2025 Nia Medical Concierge. Premium Surgical Excellence.</p>
          <div className="flex gap-8">
            {['Privacy Policy', 'Terms of Service'].map(l => (
              <a key={l} href="#" className="font-body text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-wider">{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* ── Floating Nia orb — IBM pearl style, coral/orange/pink/red ──────── */}
      <div className="nia-orb-wrap fixed bottom-5 right-5 md:bottom-8 md:right-8 z-50" style={{ width: 60, height: 60 }}>

        <button
          onClick={() => setModalOpen(true)}
          aria-label="Chat with Nia"
          className="nia-orb absolute inset-0 rounded-full overflow-hidden active:scale-95"
          style={{ transform: 'translateZ(0)' }}
        >
          {/* ① Pearl base — semi-transparent, page shows through */}
          <span className="absolute inset-0" style={{
            background: 'radial-gradient(circle at 44% 40%, rgba(255,249,247,0.35) 0%, rgba(253,218,208,0.28) 40%, rgba(245,185,168,0.18) 70%, rgba(229,142,122,0.08) 100%)',
            backdropFilter: 'blur(8px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(8px) saturate(1.2)',
          }} />

          {/* ② Coral-orange core light */}
          <span className="nia-core absolute animate-[niaCore_3.6s_ease-in-out_infinite]" style={{
            top: '18%', left: '12%', width: '75%', height: '64%',
            background: 'radial-gradient(ellipse at 42% 52%, rgba(235,90,50,0.45) 0%, rgba(220,68,80,0.3) 32%, rgba(210,55,90,0.12) 58%, transparent 80%)',
            filter: 'blur(7px)',
            borderRadius: '50%',
          }} />

          {/* ③ Pink-red sweep */}
          <span className="nia-sweep absolute animate-[niaSweep_3.6s_ease-in-out_infinite]" style={{
            top: '28%', left: '-12%', width: '124%', height: '44%',
            background: 'radial-gradient(ellipse at 38% 58%, rgba(215,50,95,0.35) 0%, rgba(228,80,60,0.22) 28%, rgba(240,115,65,0.08) 58%, transparent 78%)',
            filter: 'blur(5px)',
            borderRadius: '50%',
          }} />

          {/* ④ Orange bloom — lower hemisphere */}
          <span className="nia-bloom absolute animate-[niaBloom_3.6s_ease-in-out_0.5s_infinite]" style={{
            bottom: '2%', left: '8%', width: '84%', height: '58%',
            background: 'radial-gradient(ellipse at 50% 18%, rgba(240,120,50,0.3) 0%, rgba(228,88,55,0.15) 40%, transparent 70%)',
            filter: 'blur(8px)',
            borderRadius: '50%',
          }} />

          {/* ⑤ Inner concentric shells */}
          <span className="absolute inset-0 rounded-full" style={{
            boxShadow: 'inset 0 0 0 7px rgba(248,195,178,0.12), inset 0 0 0 16px rgba(242,168,150,0.08), inset 0 0 0 26px rgba(235,140,118,0.05)',
          }} />

          {/* ⑥ Very soft limb shading */}
          <span className="absolute inset-0 rounded-full" style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 50%, rgba(175,60,50,0.04) 70%, rgba(140,40,40,0.1) 88%, rgba(105,25,25,0.15) 100%)',
          }} />

          {/* ⑦ Specular gloss — upper-left bright cap */}
          <span className="absolute animate-[niaGloss_3.6s_ease-in-out_infinite]" style={{
            top: '5%', left: '8%', width: '50%', height: '36%',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.92) 0%, rgba(255,245,240,0.45) 45%, transparent 78%)',
            filter: 'blur(2px)',
            borderRadius: '50%',
          }} />

          {/* ⑧ Micro pinpoint */}
          <span className="absolute" style={{
            top: '9%', left: '16%', width: '17%', height: '12%',
            background: 'radial-gradient(ellipse, rgba(255,255,255,1) 0%, transparent 80%)',
            filter: 'blur(0.5px)',
            borderRadius: '50%',
          }} />

          {/* ⑨ Diamond spark — brand maroon */}
          <span className="nia-spark absolute inset-0 flex items-center justify-center select-none" style={{
            opacity: 0.5,
            filter: 'drop-shadow(0 0 3px rgba(110,28,18,0.55))',
            transition: 'opacity 0.4s ease, filter 0.4s ease',
            zIndex: 10,
          }}>
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 0 C50 0 56 44 100 50 C56 56 50 100 50 100 C50 100 44 56 0 50 C44 44 50 0 50 0Z" fill="#7d2c19"/>
            </svg>
          </span>
        </button>
      </div>

      <style>{`
        /* Core coral light pulses: dim → ignite → hold → cool */
        @keyframes niaCore {
          0%,100% { opacity: 0.42; transform: scale(0.86); filter: blur(7px) brightness(0.78); }
          40%      { opacity: 1;    transform: scale(1.14); filter: blur(5px) brightness(1.55); }
          56%      { opacity: 0.9;  transform: scale(1.09); filter: blur(5px) brightness(1.38); }
        }
        /* Pink-red sweep tilts and surges */
        @keyframes niaSweep {
          0%,100% { opacity: 0.38; transform: rotate(-3deg) scaleX(0.88) translateY(5px);  filter: blur(5px) brightness(0.82); }
          42%      { opacity: 1;    transform: rotate(2.5deg) scaleX(1.12) translateY(-7px); filter: blur(4px) brightness(1.5); }
          58%      { opacity: 0.88; transform: rotate(1deg) scaleX(1.07) translateY(-5px);  filter: blur(4px) brightness(1.3); }
        }
        /* Orange bloom rises */
        @keyframes niaBloom {
          0%,100% { opacity: 0.32; transform: translateY(0)     scale(0.9);  filter: blur(8px); }
          48%      { opacity: 0.88; transform: translateY(-10px) scale(1.12); filter: blur(6px); }
        }
        /* Gloss drifts subtly */
        @keyframes niaGloss {
          0%,100% { opacity: 0.82; transform: translate(0,0); }
          50%      { opacity: 1;    transform: translate(2px,-2px); }
        }
        /* Orb glow pulses in sync with core — no scaling */
        .nia-orb {
          animation: niaBreath 3.6s ease-in-out infinite;
          transition: box-shadow 0.3s ease;
        }
        @keyframes niaBreath {
          0%,100% { box-shadow: 0 0 18px 4px rgba(215,80,55,0.22), 0 6px 24px rgba(0,0,0,0.08); }
          45%      { box-shadow: 0 0 38px 14px rgba(215,70,55,0.48), 0 6px 24px rgba(0,0,0,0.12); }
        }
        /* Hover — deeper glow only, no scale */
        .nia-orb-wrap:hover .nia-orb {
          box-shadow: 0 0 55px 20px rgba(210,70,55,0.58), 0 8px 30px rgba(0,0,0,0.14) !important;
        }
        .nia-orb-wrap:hover .nia-core  { opacity: 1 !important; filter: blur(4px) brightness(1.9) !important; transform: scale(1.16) !important; }
        .nia-orb-wrap:hover .nia-sweep { opacity: 1 !important; }
        .nia-orb-wrap:hover .nia-bloom { opacity: 0.95 !important; }
        .nia-orb-wrap:hover .nia-spark {
          opacity: 0.88 !important;
          filter: drop-shadow(0 0 8px rgba(165,50,25,1)) drop-shadow(0 0 18px rgba(255,170,130,0.7)) !important;
        }
      `}</style>

      <LeadCaptureModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
