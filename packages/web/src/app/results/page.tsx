'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import LeadCaptureModal from '@/components/LeadCaptureModal';
import { useSiteConfig } from '@/components/SiteComponents';

// ─── Data ────────────────────────────────────────────────────────────────────

type ResultCard = {
  id: string;
  age: number;
  height: string;
  surgery: string;
  surgerySlug: string;
  weeksAfter: number;
  location: string;
  story: string;
  img: string;
  imgAspect: 'tall' | 'square' | 'wide';
  tags: string[];
};

const RESULTS: ResultCard[] = [
  {
    id: 'r1',
    age: 34,
    height: '5\'6"',
    surgery: 'Rhinoplasty',
    surgerySlug: 'facial-sculpting',
    weeksAfter: 12,
    location: 'Seoul, South Korea',
    story: 'After years of self-consciousness I finally took the leap. Nia matched me with Dr. Kim and coordinated everything — visa, clinic, recovery villa. The results exceeded every expectation.',
    img: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=600&q=80',
    imgAspect: 'tall',
    tags: ['Rhinoplasty', 'Seoul'],
  },
  {
    id: 'r2',
    age: 29,
    height: '5\'4"',
    surgery: 'Body Contouring 360°',
    surgerySlug: 'body-contouring',
    weeksAfter: 8,
    location: 'Istanbul, Turkey',
    story: 'Three pregnancies left me with skin I didn\'t recognise. The entire journey was handled seamlessly and I returned home with a confidence I hadn\'t felt in a decade.',
    img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80',
    imgAspect: 'square',
    tags: ['Body Contouring', 'Istanbul'],
  },
  {
    id: 'r3',
    age: 42,
    height: '5\'9"',
    surgery: 'Facelift & Neck Lift',
    surgerySlug: 'facial-sculpting',
    weeksAfter: 16,
    location: 'Zurich, Switzerland',
    story: 'I was sceptical about medical tourism until Nia\'s AI matched me with a Swiss-trained surgeon with 20 years of facelift specialisation. People think I\'ve had an amazing holiday.',
    img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80',
    imgAspect: 'tall',
    tags: ['Facelift', 'Switzerland'],
  },
  {
    id: 'r4',
    age: 31,
    height: '5\'3"',
    surgery: 'Skin Regeneration',
    surgerySlug: 'skin-regeneration',
    weeksAfter: 6,
    location: 'Bangkok, Thailand',
    story: 'Acne scarring had defined my face for 15 years. The stem-cell laser protocol at the Nia partner clinic in Bangkok cleared 80% of my scarring in a single session.',
    img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80',
    imgAspect: 'square',
    tags: ['Skin', 'Bangkok'],
  },
  {
    id: 'r5',
    age: 38,
    height: '6\'1"',
    surgery: 'V-Line Jaw Contouring',
    surgerySlug: 'facial-sculpting',
    weeksAfter: 10,
    location: 'Seoul, South Korea',
    story: 'As a man I felt there was no space to discuss aesthetic surgery. Nia\'s concierge team made the whole process discreet and professional. The jaw definition is extraordinary.',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80',
    imgAspect: 'wide',
    tags: ['Jaw', 'Seoul'],
  },
  {
    id: 'r6',
    age: 45,
    height: '5\'5"',
    surgery: 'Corrective Revision',
    surgerySlug: 'corrective-care',
    weeksAfter: 20,
    location: 'Dubai, UAE',
    story: 'A previous rhinoplasty had left asymmetry I\'d lived with for 7 years. Dr. Al Rashidi at the Dubai clinic corrected everything in a single procedure. I wish I\'d found Nia sooner.',
    img: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80',
    imgAspect: 'tall',
    tags: ['Revision', 'Dubai'],
  },
  {
    id: 'r7',
    age: 27,
    height: '5\'7"',
    surgery: 'High-Definition Liposuction',
    surgerySlug: 'body-contouring',
    weeksAfter: 14,
    location: 'Istanbul, Turkey',
    story: 'Despite rigorous training I could never shift certain fat deposits. The high-def lipo at my Nia-matched Istanbul clinic revealed muscle definition I didn\'t know I had.',
    img: 'https://images.unsplash.com/photo-1583500178690-594ce74b4618?w=600&q=80',
    imgAspect: 'square',
    tags: ['Liposuction', 'Istanbul'],
  },
  {
    id: 'r8',
    age: 52,
    height: '5\'8"',
    surgery: 'Full Facial Rejuvenation',
    surgerySlug: 'facial-sculpting',
    weeksAfter: 24,
    location: 'Montreux, Switzerland',
    story: 'Blepharoplasty, brow lift, and fat grafting — Nia coordinated a comprehensive plan across three specialists. The recovery suite overlooking Lake Geneva made healing feel like a retreat.',
    img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80',
    imgAspect: 'tall',
    tags: ['Full Facial', 'Switzerland'],
  },
  {
    id: 'r9',
    age: 36,
    height: '5\'2"',
    surgery: 'Stem-Cell Skin Therapy',
    surgerySlug: 'skin-regeneration',
    weeksAfter: 4,
    location: 'Tokyo, Japan',
    story: 'Melasma from pregnancy had resisted every topical treatment. The Japanese stem-cell protocol the Nia AI recommended was entirely non-invasive. My skin hasn\'t looked this even since I was 18.',
    img: 'https://images.unsplash.com/photo-1614859324967-bdf413c35b5a?w=600&q=80',
    imgAspect: 'square',
    tags: ['Skin', 'Tokyo'],
  },
];

const ALL_TAGS = Array.from(new Set(RESULTS.flatMap(r => r.tags.filter(t => ['Rhinoplasty', 'Body Contouring', 'Facelift', 'Skin', 'Jaw', 'Revision', 'Liposuction', 'Full Facial'].includes(t)))));
const SURGERY_FILTERS = ['All', 'Facial', 'Body', 'Skin', 'Revision'];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ResultsGallery() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const { images: siteImages } = useSiteConfig();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [clinicModalCard, setClinicModalCard] = useState<ResultCard | null>(null);

  const filtered = RESULTS.filter(r => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Facial') return ['Rhinoplasty', 'Facelift', 'Jaw', 'Full Facial'].some(t => r.tags.includes(t));
    if (activeFilter === 'Body') return ['Body Contouring', 'Liposuction'].some(t => r.tags.includes(t));
    if (activeFilter === 'Skin') return r.tags.includes('Skin');
    if (activeFilter === 'Revision') return r.tags.includes('Revision');
    return true;
  });

  return (
    <>
      <Nav onCTAClick={() => setModalOpen(true)} />
      <LeadCaptureModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Clinic info request modal */}
      {clinicModalCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={() => setClinicModalCard(null)}>
          <div className="bg-surface rounded-card2 shadow-concierge border border-outline-variant max-w-md w-full p-8" onClick={e => e.stopPropagation()}>
            <p className="font-body text-[10px] uppercase tracking-widest text-primary font-semibold mb-2">Request Clinic Information</p>
            <h3 className="font-display text-display-sm text-on-surface mb-1">{clinicModalCard.surgery}</h3>
            <p className="font-body text-body-sm text-on-surface-variant mb-6">{clinicModalCard.location}</p>
            <p className="font-body text-body-sm text-on-surface-variant mb-6 leading-relaxed">
              Nia will send you the clinic name, accreditation details, surgeon profiles, pricing guide, and availability for this procedure type — privately and with no obligation.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setClinicModalCard(null); setModalOpen(true); }}
                className="w-full bg-primary text-on-primary py-3.5 rounded-lg font-body font-semibold text-label-caps uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Start via Nia AI
              </button>
              <button onClick={() => setClinicModalCard(null)} className="text-center font-body text-body-sm text-on-surface-variant hover:text-on-surface transition-colors py-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="pt-16 bg-surface min-h-screen">

        {/* ── Hero ── */}
        <section className="py-20 px-6 md:px-[64px] bg-gradient-to-b from-surface-container-low to-surface">
          <div className="max-w-container mx-auto text-center">
            <span className="font-body text-[10px] uppercase tracking-[0.2em] text-primary font-semibold block mb-4">Verified Patient Outcomes</span>
            <h1 className="font-display text-display-xl text-on-surface mb-5 leading-tight">
              Real Results.<br />
              <span className="text-primary italic">Real Stories.</span>
            </h1>
            <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
              Every case below is a verified Nia patient outcome. No filters, no retouching — just the transformations our global network of accredited surgeons achieves every day.
            </p>

            {/* Stats bar */}
            <div className="inline-flex items-center gap-8 md:gap-12 bg-surface-container-lowest border border-outline-variant rounded-2xl px-8 py-5 shadow-card">
              {[
                { value: '2,400+', label: 'Verified Outcomes' },
                { value: '99.8%', label: 'Complication-Free' },
                { value: '4.9★', label: 'Avg Patient Rating' },
                { value: '38', label: 'Partner Countries' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="font-display text-display-sm text-primary leading-none">{s.value}</p>
                  <p className="font-body text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Filters ── */}
        <div className="sticky top-16 z-20 bg-surface/90 backdrop-blur-md border-b border-outline-variant px-6 md:px-[64px] py-3">
          <div className="max-w-container mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
            {SURGERY_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`shrink-0 px-5 py-2 rounded-full font-body text-[11px] font-semibold uppercase tracking-widest transition-all ${
                  activeFilter === f
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                {f}
              </button>
            ))}
            <span className="ml-auto shrink-0 font-body text-[11px] text-on-surface-variant">
              {filtered.length} results
            </span>
          </div>
        </div>

        {/* ── Masonry Gallery ── */}
        <section className="px-4 md:px-[64px] py-10">
          <div className="max-w-container mx-auto">
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
              {filtered.map((card, i) => {
                const slotKey = `result-${RESULTS.indexOf(card) + 1}`;
                const overrideImg = siteImages[slotKey];
                return (
                <ResultCardComponent
                  key={card.id}
                  card={card}
                  overrideImg={overrideImg}
                  expanded={expandedCard === card.id}
                  onExpand={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                  onRequestClinic={() => setClinicModalCard(card)}
                  onStartAssessment={() => setModalOpen(true)}
                />
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 px-6 md:px-[64px] bg-surface-container-low text-center">
          <div className="max-w-xl mx-auto">
            <span className="font-body text-[10px] uppercase tracking-[0.2em] text-primary font-semibold block mb-4">Your Journey Starts Here</span>
            <h2 className="font-display text-display-lg text-on-surface mb-4">Ready to See Your Outcome?</h2>
            <p className="font-body text-body-md text-on-surface-variant mb-8 leading-relaxed">
              Tell Nia your goals and she will match you with the surgeon whose results most closely align with your vision — from this very gallery.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-primary text-on-primary px-10 py-4 rounded-lg font-body font-semibold text-label-caps uppercase tracking-widest hover:shadow-float transition-all inline-flex items-center gap-3"
            >
              Start AI Assessment
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10"/></svg>
            </button>
          </div>
        </section>

      </main>
    </>
  );
}

// ─── Card Component ───────────────────────────────────────────────────────────

function ResultCardComponent({ card, overrideImg, expanded, onExpand, onRequestClinic, onStartAssessment }: {
  card: ResultCard;
  overrideImg?: string;
  expanded: boolean;
  onExpand: () => void;
  onRequestClinic: () => void;
  onStartAssessment: () => void;
}) {
  const aspectClass = card.imgAspect === 'tall' ? 'aspect-[3/4]' : card.imgAspect === 'wide' ? 'aspect-[4/3]' : 'aspect-square';

  return (
    <div className="break-inside-avoid mb-4 group">
      <div className="rounded-card2 overflow-hidden bg-surface-container border border-outline-variant shadow-card hover:shadow-concierge transition-all duration-300">

        {/* Image */}
        <div className={`relative ${aspectClass} overflow-hidden`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={overrideImg ?? card.img}
            alt={`${card.surgery} result`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Bottom overlay — identity tags */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {card.tags.map(tag => (
                <span key={tag} className="bg-white/20 backdrop-blur-sm text-white text-[9px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/20">
                  {tag}
                </span>
              ))}
            </div>
            <h3 className="font-display text-white text-lg leading-tight font-semibold">{card.surgery}</h3>
            <p className="font-body text-white/80 text-[11px] mt-0.5 uppercase tracking-widest">
              {card.age} yrs · {card.height} · {card.weeksAfter}w post-op
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <svg className="w-3 h-3 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span className="font-body text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">{card.location}</span>
          </div>

          {/* Story — expandable */}
          <p className={`font-body text-body-sm text-on-surface-variant leading-relaxed transition-all ${expanded ? '' : 'line-clamp-3'}`}>
            &ldquo;{card.story}&rdquo;
          </p>
          {card.story.length > 120 && (
            <button
              onClick={onExpand}
              className="mt-1.5 font-body text-[10px] text-primary uppercase tracking-widest font-semibold hover:opacity-70 transition-opacity"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={onRequestClinic}
              className="flex-1 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary font-body text-[10px] font-semibold uppercase tracking-widest transition-all"
            >
              Request Clinic Info
            </button>
            <button
              onClick={onStartAssessment}
              className="flex-1 py-2 rounded-lg bg-primary text-on-primary font-body text-[10px] font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Start Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
