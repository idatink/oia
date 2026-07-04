'use client';

import { useState, useRef } from 'react';
import Nav from '@/components/Nav';
import LeadCaptureModal from '@/components/LeadCaptureModal';
import { useSiteConfig } from '@/components/SiteComponents';

// ─── Data ────────────────────────────────────────────────────────────────────

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
    body: 'Oia AI handles analysis and coordination. Every clinical decision and patient communication is owned by a real, medically-trained coordinator. You always have a human to call.',
    accent: 'bg-primary/10 text-primary',
  },
];

// Q&A videos — replace videoId / reelCode with real content
type QAVideo = {
  id: string;
  question: string;
  platform: 'youtube' | 'instagram';
  videoId?: string;       // YouTube video ID
  reelCode?: string;      // Instagram reel shortcode (from instagram.com/reel/CODE)
  thumb?: string;         // fallback thumbnail for Instagram
  duration?: string;
  category: string;
};

const QA_VIDEOS: QAVideo[] = [
  {
    id: 'q1',
    question: 'What does rhinoplasty recovery actually look like week by week?',
    platform: 'youtube',
    videoId: 'J3Nss_H4wh0',
    duration: '5:14',
    category: 'Recovery',
  },
  {
    id: 'q2',
    question: "How does Oia’s AI decide which surgeon is right for me?",
    platform: 'instagram',
    reelCode: 'C7example01',
    thumb: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80',
    category: 'Process',
  },
  {
    id: 'q3',
    question: 'Is medical tourism actually safe? Honest answer.',
    platform: 'youtube',
    videoId: 'Gqld_mkn0co',
    duration: '8:41',
    category: 'Safety',
  },
  {
    id: 'q4',
    question: 'How much does body contouring really cost abroad vs the UK?',
    platform: 'instagram',
    reelCode: 'C7example02',
    thumb: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80',
    category: 'Pricing',
  },
  {
    id: 'q5',
    question: 'What happens if something goes wrong after my surgery?',
    platform: 'youtube',
    videoId: 'w28H6jVoHoc',
    duration: '6:03',
    category: 'Safety',
  },
  {
    id: 'q6',
    question: 'Can I really fly home 5 days after rhinoplasty?',
    platform: 'instagram',
    reelCode: 'C7example03',
    thumb: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80',
    category: 'Recovery',
  },
  {
    id: 'q7',
    question: 'How do I know my clinic is genuinely accredited?',
    platform: 'youtube',
    videoId: 'tgbNymZ7vqY',
    duration: '4:27',
    category: 'Safety',
  },
  {
    id: 'q8',
    question: 'What does a Oia coordinator actually do for you?',
    platform: 'instagram',
    reelCode: 'C7example04',
    thumb: 'https://images.unsplash.com/photo-1614859324967-bdf413c35b5a?w=400&q=80',
    category: 'Process',
  },
];

const STEPS = [
  { n: '01', title: 'You share your goals', body: 'Oia asks you about the procedure you\'re considering, your aesthetic goals, timeline, and medical history — one natural conversation, no forms to fill.' },
  { n: '02', title: 'Oia builds your clinical profile', body: 'Your answers, photos, and screening data are processed to create a precise suitability profile — analysed against 50,000+ outcomes to assess candidacy and identify your optimal match.' },
  { n: '03', title: 'Your coordinator reviews & claims', body: 'A human coordinator at your matched clinic reviews your profile and claims your case. They prepare a fully itemised quote — surgeon fee, anaesthesia, hospital stay, aftercare — within 24–48 hours.' },
  { n: '04', title: 'You choose, we plan', body: 'Once you select your clinic, the full concierge service activates. Flights, private transfers, luxury accommodation and pre-op appointments are all coordinated for you.' },
  { n: '05', title: 'Your procedure & recovery', body: 'You arrive to a private pre-op consultation, surgery at your matched clinic, and 24/7 nursing-supported recovery. Every detail has been confirmed weeks in advance.' },
  { n: '06', title: 'Post-op follow-up', body: 'Oia schedules structured post-operative check-ins at Day 3, 7, 30 and 90. Your coordinator monitors healing and manages any follow-up care remotely or in-clinic.' },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const { images: siteImages } = useSiteConfig();

  function simg(key: string, fallback: string) {
    return siteImages[key] ?? fallback;
  }

  function scrollCarousel(dir: 'left' | 'right') {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: dir === 'right' ? 340 : -340, behavior: 'smooth' });
  }

  return (
    <>
      <Nav onCTAClick={() => setModalOpen(true)} />

      <main className="pt-16 flex-grow">

        {/* ── Hero with video ────────────────────────────────────────────── */}
        <section className="min-h-[70vh] flex items-center bg-surface py-20 overflow-hidden">
          <div className="max-w-container mx-auto px-6 md:px-[64px] grid md:grid-cols-2 gap-16 items-center">
            {/* Left — copy */}
            <div>
              <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-5">Our Methodology</span>
              <h1 className="font-display text-display-xl text-on-surface leading-[1.1] mb-6">
                Where Intelligence<br />
                Meets <span className="italic text-primary">Concierge Care.</span>
              </h1>
              <p className="font-body text-body-lg text-on-surface-variant max-w-md leading-relaxed mb-8">
                Oia was built on a single conviction: that the world&apos;s most advanced surgical expertise should be accessible to anyone, anywhere — managed with the rigour of a private family office.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="bg-primary text-on-primary px-8 py-4 rounded-lg font-body font-semibold text-label-caps uppercase tracking-widest hover:shadow-float transition-all flex items-center gap-3 w-fit"
              >
                Experience the Oia Way
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10"/></svg>
              </button>
            </div>

            {/* Right — hero video */}
            <div className="relative">
              <div className="relative rounded-card3 overflow-hidden shadow-concierge bg-surface-container aspect-video w-full">
                {activeVideo === 'hero' ? (
                  <iframe
                    src="https://www.youtube.com/embed/J3Nss_H4wh0?autoplay=1&rel=0&modestbranding=1"
                    title="Oia — The Medical Tourism Revolution"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : (
                  <>
                    {/* Thumbnail */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={simg('about-hero-video', 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=900&q=80')}
                      alt="Oia — The Oia Way"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                    {/* Play button */}
                    <button
                      onClick={() => setActiveVideo('hero')}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-4 group"
                    >
                      <div className="w-18 h-18 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:bg-white/30 transition-all shadow-concierge"
                        style={{ width: '72px', height: '72px' }}>
                        <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="font-display text-white text-lg font-semibold drop-shadow">The Oia Way</p>
                        <p className="font-body text-white/70 text-sm">Watch our story — 2 min</p>
                      </div>
                    </button>
                  </>
                )}
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-5 -left-5 bg-surface-container-lowest rounded-card2 px-5 py-4 shadow-concierge border border-outline-variant/20 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                </div>
                <div>
                  <p className="font-body text-[10px] font-bold text-on-surface uppercase tracking-wider">2,400+ patients</p>
                  <p className="font-body text-[10px] text-on-surface-variant">have experienced the Oia Way</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Four pillars ──────────────────────────────────────────────── */}
        <section className="py-24 bg-surface-container-low">
          <div className="max-w-container mx-auto px-6 md:px-[64px]">
            <div className="text-center mb-16">
              <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-4">Our Principles</span>
              <h2 className="font-display text-display-lg text-on-surface">Built on Four Unbreakable Commitments</h2>
              <p className="font-body text-body-md text-on-surface-variant mt-4 max-w-xl mx-auto">
                These are not aspirations. They are structural features of how Oia works — designed in from the beginning.
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

        {/* ── Q&A Video Carousel (3rd section) ──────────────────────────── */}
        <section className="py-24 bg-surface overflow-hidden">
          <div className="max-w-container mx-auto px-6 md:px-[64px]">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-4">Patient Questions</span>
                <h2 className="font-display text-display-lg text-on-surface">Real Questions.<br className="hidden md:block" /> Honest Answers.</h2>
                <p className="font-body text-body-md text-on-surface-variant mt-4 max-w-lg leading-relaxed">
                  From recovery timelines to safety standards — our team answers the questions patients actually ask, on YouTube and Instagram.
                </p>
              </div>
              {/* Carousel controls */}
              <div className="hidden md:flex gap-2 shrink-0 pb-1">
                <button
                  onClick={() => scrollCarousel('left')}
                  className="w-11 h-11 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all"
                  aria-label="Previous"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  className="w-11 h-11 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all"
                  aria-label="Next"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Carousel — bleeds edge-to-edge */}
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto scrollbar-none px-6 md:px-[64px] pb-2 snap-x snap-mandatory"
            style={{ scrollPaddingLeft: '64px' }}
          >
            {QA_VIDEOS.map((video, i) => (
              <QACard
                key={video.id}
                video={video}
                overrideThumb={video.platform === 'instagram' ? simg(`about-qa-${i + 1}`, video.thumb ?? '') : undefined}
                playing={activeVideo === video.id}
                onPlay={() => setActiveVideo(video.id)}
                onStop={() => setActiveVideo(null)}
              />
            ))}
            {/* Trailing space */}
            <div className="shrink-0 w-6 md:w-[calc(64px-16px)]" />
          </div>

          {/* Mobile scroll hint */}
          <p className="md:hidden text-center font-body text-[10px] text-on-surface-variant mt-4 uppercase tracking-wider">Swipe to explore →</p>
        </section>

        {/* ── The 6-step journey ────────────────────────────────────────── */}
        <section className="py-24 bg-surface-container-low">
          <div className="max-w-container mx-auto px-6 md:px-[64px]">
            <div className="text-center mb-16">
              <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-4">Your Journey</span>
              <h2 className="font-display text-display-lg text-on-surface">Six Steps, Zero Uncertainty</h2>
              <p className="font-body text-body-md text-on-surface-variant mt-4 max-w-xl mx-auto">
                Every Oia patient follows the same structured path. No ambiguity, no chasing clinics, no surprises on the day.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {STEPS.map((step, i) => (
                <div key={i} className="group relative bg-surface-container-lowest rounded-card2 border border-outline-variant/20 p-7 hover:shadow-concierge hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="font-display text-body-lg font-bold">{step.n}</span>
                    </div>
                    <span className="font-display text-display-xl text-outline-variant/20 leading-none">{step.n}</span>
                  </div>
                  <h4 className="font-display text-display-sm text-on-surface mb-3">{step.title}</h4>
                  <p className="font-body text-body-sm text-on-surface-variant leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Safety standards ─────────────────────────────────────────── */}
        <section className="py-24 bg-surface">
          <div className="max-w-container mx-auto px-6 md:px-[64px] grid md:grid-cols-2 gap-20 items-center">
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
            <div className="space-y-4">
              <div className="bg-primary rounded-card2 p-8 shadow-float">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <p className="font-body text-label-caps text-on-primary/60 uppercase tracking-wider mb-2">Overall Safety Record</p>
                    <p className="font-display text-[56px] leading-none text-on-primary font-medium">99.8%</p>
                  </div>
                  <svg className="w-12 h-12 text-on-primary/30" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
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
        <section className="py-24 bg-surface-container-low">
          <div className="max-w-container mx-auto px-6 md:px-[64px]">
            <div className="text-center mb-16">
              <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-4">Patient Voices</span>
              <h2 className="font-display text-display-lg text-on-surface">Trusted by Discerning Patients Globally</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-gutter">
              {[
                { quote: 'I had tried two other services before Oia. The difference is night and day — they actually understood what I wanted aesthetically, not just procedurally.', name: 'Elena V.', detail: 'London · Rhinoplasty revision' },
                { quote: 'The transparency is extraordinary. I could see exactly what each clinic was charging, why Oia recommended them over others, and what the complication rate was for my procedure.', name: 'James K.', detail: 'Dubai · Body contouring' },
                { quote: 'Having a coordinator who speaks Arabic and understood my cultural preferences made this feel personal, not transactional. I would go back without hesitation.', name: 'Layla M.', detail: 'Riyadh · Blepharoplasty' },
              ].map((t, i) => (
                <div key={i} className="relative pl-8 border-l-2 border-primary/20">
                  <svg className="absolute left-0 top-0 w-5 h-5 text-primary -translate-x-1" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
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
          <div className="max-w-container mx-auto px-6 md:px-[64px]">
            <div className="bg-primary rounded-card3 p-14 md:p-20 text-center text-on-primary">
              <span className="font-body text-label-caps uppercase tracking-[0.2em] text-on-primary/60 block mb-4">Begin Your Journey</span>
              <h2 className="font-display text-display-xl mb-6 max-w-xl mx-auto leading-[1.1]">Experience the Oia Way for yourself.</h2>
              <p className="font-body text-body-lg mb-10 opacity-80 max-w-lg mx-auto leading-relaxed">
                Your personalised AI consultation takes 10 minutes. Your coordinator responds within 24 hours. Your journey begins the day you decide.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="bg-surface-container-lowest text-primary px-10 py-5 rounded-xl font-body font-bold text-label-caps uppercase tracking-[0.2em] hover:shadow-float transition-all"
              >
                Start AI Assessment →
              </button>
            </div>
          </div>
        </section>
      </main>

      <LeadCaptureModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

// ─── Q&A Card ─────────────────────────────────────────────────────────────────

function QACard({ video, overrideThumb, playing, onPlay, onStop }: {
  video: QAVideo;
  overrideThumb?: string;
  playing: boolean;
  onPlay: () => void;
  onStop: () => void;
}) {
  const isYouTube = video.platform === 'youtube';
  const isInstagram = video.platform === 'instagram';

  // Instagram embed URL for reels
  const igEmbedSrc = `https://www.instagram.com/reel/${video.reelCode}/embed/`;

  return (
    <div className="shrink-0 w-[300px] snap-start rounded-card2 overflow-hidden border border-outline-variant bg-surface-container shadow-card hover:shadow-concierge transition-all flex flex-col">
      {/* Video area */}
      <div className="relative aspect-[9/16] bg-surface-container-high overflow-hidden" style={{ maxHeight: '340px' }}>
        {playing ? (
          isYouTube ? (
            <iframe
              src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0&modestbranding=1`}
              title={video.question}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <iframe
              src={igEmbedSrc}
              title={video.question}
              allowFullScreen
              scrolling="no"
              className="w-full h-full border-0"
            />
          )
        ) : (
          <>
            {/* Thumbnail */}
            {isYouTube && video.videoId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                alt={video.question}
                className="w-full h-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={overrideThumb ?? video.thumb}
                alt={video.question}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/25" />

            {/* Platform badge */}
            <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-[9px] font-bold uppercase tracking-wider ${isYouTube ? 'bg-red-600' : 'bg-gradient-to-r from-purple-600 to-pink-500'}`}>
              {isYouTube ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              ) : (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              )}
              {isYouTube ? 'YouTube' : 'Instagram'}
            </div>

            {/* Category tag */}
            <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-[9px] font-semibold uppercase tracking-widest px-2 py-1 rounded-full">
              {video.category}
            </div>

            {/* Duration */}
            {video.duration && (
              <div className="absolute bottom-12 right-3 bg-black/70 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                {video.duration}
              </div>
            )}

            {/* Play button */}
            <button
              onClick={onPlay}
              className="absolute inset-0 flex items-center justify-center group"
              aria-label="Play video"
            >
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:bg-white/35 group-hover:scale-105 transition-all">
                <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </button>
          </>
        )}

        {/* Stop button when playing */}
        {playing && (
          <button
            onClick={onStop}
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            aria-label="Close"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      {/* Question text */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <p className="font-display text-body-md text-on-surface leading-snug line-clamp-3">
          &ldquo;{video.question}&rdquo;
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold">{video.category}</span>
          <button
            onClick={onPlay}
            className="font-body text-[9px] text-primary uppercase tracking-widest font-semibold hover:opacity-70 transition-opacity flex items-center gap-1"
          >
            Watch
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
