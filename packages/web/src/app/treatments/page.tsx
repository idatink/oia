'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import LeadCaptureModal from '@/components/LeadCaptureModal';

const PROCEDURES = [
  {
    slug: 'rhinoplasty',
    title: 'Rhinoplasty',
    category: 'Facial Sculpting',
    tagline: 'Precision reshaping for harmonious facial balance.',
    desc: 'From subtle tip refinement to full profile correction, our partner surgeons specialise in natural-looking results tailored to your facial anatomy.',
    highlights: ['Tip refinement', 'Bridge reduction', 'Deviated septum correction', 'Revision rhinoplasty'],
    recovery: '2–3 weeks',
    from: '€2,800',
  },
  {
    slug: 'liposuction',
    title: 'Body Contouring',
    category: 'Body',
    tagline: 'High-definition sculpting for a refined silhouette.',
    desc: 'Advanced VASER and laser-assisted liposuction techniques for precise fat removal and skin tightening across the abdomen, flanks, thighs and arms.',
    highlights: ['VASER HD Liposuction', 'Abdominal etching', '360° body sculpting', 'Arm & thigh contouring'],
    recovery: '1–2 weeks',
    from: '€2,200',
  },
  {
    slug: 'blepharoplasty',
    title: 'Blepharoplasty',
    category: 'Facial Sculpting',
    tagline: 'Refresh tired eyes for a naturally rested appearance.',
    desc: 'Upper and lower eyelid surgery to remove excess skin and fat, restoring a youthful, alert look without changing your natural eye shape.',
    highlights: ['Upper eyelid lift', 'Lower eyelid rejuvenation', 'Combined blepharoplasty', 'Asian blepharoplasty'],
    recovery: '10–14 days',
    from: '€1,900',
  },
  {
    slug: 'facelift',
    title: 'Facelift',
    category: 'Facial Sculpting',
    tagline: 'Comprehensive facial rejuvenation with lasting results.',
    desc: 'Deep-plane and SMAS facelift techniques for natural, long-lasting facial rejuvenation — addressing jowls, neck laxity and mid-face volume loss.',
    highlights: ['Deep-plane facelift', 'Mini facelift', 'Neck lift', 'Mid-face lift'],
    recovery: '2–4 weeks',
    from: '€4,500',
  },
  {
    slug: 'breast-augmentation',
    title: 'Breast Augmentation',
    category: 'Body',
    tagline: 'Achieve your ideal silhouette with precision implant placement.',
    desc: 'Full range of implant types and sizes with sub-muscular or sub-glandular placement options, guided by 3D imaging to preview your results.',
    highlights: ['Silicone & anatomical implants', '3D result preview', 'Sub-muscular placement', 'Lift with augmentation'],
    recovery: '1–2 weeks',
    from: '€3,100',
  },
  {
    slug: 'abdominoplasty',
    title: 'Tummy Tuck',
    category: 'Body',
    tagline: 'Restore a flat, toned abdomen after weight loss or pregnancy.',
    desc: 'Full and mini abdominoplasty with muscle repair for post-bariatric and post-pregnancy body contouring, often combined with liposuction.',
    highlights: ['Full abdominoplasty', 'Mini tummy tuck', 'Muscle repair (diastasis)', 'Post-bariatric body lift'],
    recovery: '2–3 weeks',
    from: '€3,400',
  },
  {
    slug: 'skin-regeneration',
    title: 'Skin Regeneration',
    category: 'Aesthetic Medicine',
    tagline: 'Advanced technology for transformative skin renewal.',
    desc: 'Stem-cell therapies, fractional CO₂ laser, PRP and advanced chemical peels for comprehensive skin rejuvenation and scar revision.',
    highlights: ['Fractional CO₂ laser', 'PRP therapy', 'Stem-cell facials', 'Chemical peels'],
    recovery: '3–7 days',
    from: '€800',
  },
  {
    slug: 'corrective-care',
    title: 'Corrective & Revision Surgery',
    category: 'Specialist',
    tagline: 'Expert correction of previous procedures or trauma.',
    desc: 'Dedicated revision surgery specialists for secondary rhinoplasty, breast revision, scar correction and post-traumatic reconstruction.',
    highlights: ['Revision rhinoplasty', 'Breast revision', 'Scar revision', 'Reconstructive surgery'],
    recovery: 'Varies',
    from: 'On consultation',
  },
];

const CATEGORIES = ['All', 'Facial Sculpting', 'Body', 'Aesthetic Medicine', 'Specialist'];

export default function TreatmentsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selected, setSelected] = useState<typeof PROCEDURES[0] | null>(null);

  const filtered = activeCategory === 'All'
    ? PROCEDURES
    : PROCEDURES.filter(p => p.category === activeCategory);

  return (
    <>
      <Nav onCTAClick={() => setModalOpen(true)} />

      <main className="flex-grow pt-16">
        {/* Hero */}
        <section className="bg-surface-container-low py-20 px-[64px]">
          <div className="max-w-container mx-auto">
            <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-4">Our Specialties</span>
            <h1 className="font-display text-display-xl text-on-surface max-w-2xl">Curated Surgical Excellence</h1>
            <p className="font-body text-body-lg text-on-surface-variant mt-4 max-w-xl">
              Each procedure is performed by hand-selected specialists at JCI-accredited partner clinics across Istanbul, Barcelona, Bangkok and beyond.
            </p>
          </div>
        </section>

        {/* Filter tabs */}
        <div className="sticky top-16 z-20 bg-surface border-b border-outline-variant/20 px-[64px]">
          <div className="max-w-container mx-auto flex gap-6 overflow-x-auto scrollbar-none py-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`py-4 font-body text-label-caps uppercase tracking-widest shrink-0 border-b-2 transition-all ${
                  activeCategory === cat
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <section className="py-16 px-[64px]">
          <div className="max-w-container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
            {filtered.map(proc => (
              <div
                key={proc.slug}
                onClick={() => setSelected(proc)}
                className="group bg-surface-container-lowest rounded-card2 border border-outline-variant/20 overflow-hidden cursor-pointer hover:shadow-concierge transition-shadow"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-secondary-container to-tertiary-fixed relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-3 left-3">
                    <span className="font-body text-[9px] font-bold uppercase tracking-widest bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full">
                      {proc.category}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-display-sm text-on-surface mb-1">{proc.title}</h3>
                  <p className="font-body text-body-sm text-on-surface-variant mb-4 leading-relaxed line-clamp-2">{proc.tagline}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
                    <div>
                      <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider">From</p>
                      <p className="font-display text-display-sm text-primary">{proc.from}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider">Recovery</p>
                      <p className="font-body text-body-sm font-semibold text-on-surface">{proc.recovery}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-[64px] bg-surface-container-low">
          <div className="max-w-container mx-auto bg-primary rounded-card3 p-12 text-center text-on-primary">
            <h2 className="font-display text-display-lg mb-4">Not sure which procedure is right for you?</h2>
            <p className="font-body text-body-md mb-8 opacity-90">Let Nia analyse your goals and match you with the ideal treatment and surgeon.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-surface-container-lowest text-primary px-8 py-4 rounded-xl font-body font-bold text-label-caps uppercase tracking-widest hover:shadow-float transition-all"
            >
              Start AI Assessment
            </button>
          </div>
        </section>
      </main>

      {/* Procedure detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-surface rounded-card2 shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 sticky top-0 bg-surface z-10">
              <div>
                <p className="font-body text-[9px] text-primary uppercase tracking-widest font-semibold">{selected.category}</p>
                <h2 className="font-display text-xl text-on-surface">{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-on-surface-variant hover:text-on-surface">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="aspect-[16/7] bg-gradient-to-br from-secondary-container to-tertiary-fixed rounded-xl" />

              <p className="font-body text-body-md text-on-surface-variant leading-relaxed">{selected.desc}</p>

              <div>
                <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold mb-3">What We Offer</p>
                <div className="grid grid-cols-2 gap-2">
                  {selected.highlights.map(h => (
                    <div key={h} className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2">
                      <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      <span className="font-body text-[11px] text-on-surface">{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <div className="flex-1 bg-surface-container-low rounded-xl p-4 text-center">
                  <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">Starting From</p>
                  <p className="font-display text-display-md text-primary">{selected.from}</p>
                </div>
                <div className="flex-1 bg-surface-container-low rounded-xl p-4 text-center">
                  <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">Recovery</p>
                  <p className="font-display text-display-md text-on-surface">{selected.recovery}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/20 flex gap-3">
              <button onClick={() => setSelected(null)} className="flex-1 border border-outline-variant text-on-surface-variant py-3 rounded-xl font-body text-[10px] font-semibold uppercase tracking-wider hover:border-primary hover:text-primary transition-all">
                Back
              </button>
              <button
                onClick={() => { setSelected(null); setModalOpen(true); }}
                className="flex-1 bg-primary text-on-primary py-3 rounded-xl font-body text-[10px] font-semibold uppercase tracking-wider hover:opacity-90 transition-all"
              >
                Start AI Assessment →
              </button>
            </div>
          </div>
        </div>
      )}

      <LeadCaptureModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
