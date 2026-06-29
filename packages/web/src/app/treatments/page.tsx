'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import LeadCaptureModal from '@/components/LeadCaptureModal';

const PROCEDURES = [
  {
    slug: 'rhinoplasty',
    title: 'Rhinoplasty',
    category: 'Facial',
    tagline: 'Harmonious reshaping for balanced facial proportion.',
    desc: 'From subtle tip refinement to full profile correction, our hand-selected surgeons specialise in anatomically precise, natural-looking rhinoplasty — preserving ethnic identity while achieving your aesthetic vision.',
    highlights: ['Tip refinement', 'Bridge reduction', 'Septum correction', 'Revision rhinoplasty', 'Ethnic rhinoplasty'],
    recovery: '2–3 weeks',
    from: '€2,800',
    gradient: 'from-[#ffdad2] to-[#fadcd1]',
    img: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80',
  },
  {
    slug: 'blepharoplasty',
    title: 'Blepharoplasty',
    category: 'Facial',
    tagline: 'Refresh tired eyes for a naturally rested appearance.',
    desc: 'Upper and lower eyelid surgery to remove excess skin and fat, restoring a youthful, alert expression without altering your natural eye shape.',
    highlights: ['Upper eyelid lift', 'Lower eyelid rejuvenation', 'Combined blepharoplasty', 'Asian double eyelid'],
    recovery: '10–14 days',
    from: '€1,900',
    gradient: 'from-[#ecddd4] to-[#fadcd1]',
    img: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80',
  },
  {
    slug: 'facelift',
    title: 'Facelift',
    category: 'Facial',
    tagline: 'Comprehensive rejuvenation with enduring results.',
    desc: 'Deep-plane and SMAS facelift techniques address jowls, neck laxity and mid-face volume loss — delivering natural, long-lasting results that look like a rested, younger version of yourself.',
    highlights: ['Deep-plane facelift', 'Mini facelift', 'Neck lift', 'Mid-face lift', 'Brow lift'],
    recovery: '2–4 weeks',
    from: '€4,500',
    gradient: 'from-[#ffdad2] to-[#ecddd4]',
    img: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&q=80',
  },
  {
    slug: 'liposuction',
    title: 'Body Contouring',
    category: 'Body',
    tagline: 'High-definition sculpting for a refined silhouette.',
    desc: 'Advanced VASER and laser-assisted liposuction for precise fat removal and skin tightening — targeting the abdomen, flanks, thighs, arms and back.',
    highlights: ['VASER HD Liposuction', 'Abdominal etching', '360° sculpting', 'Arm & thigh contouring'],
    recovery: '1–2 weeks',
    from: '€2,200',
    gradient: 'from-[#fadcd1] to-[#eae8e6]',
    img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
  },
  {
    slug: 'breast-augmentation',
    title: 'Breast Augmentation',
    category: 'Body',
    tagline: 'Achieve your ideal silhouette with precision placement.',
    desc: 'Full range of implant types, profiles and sizes — guided by 3D imaging so you can preview your results before surgery. Sub-muscular or sub-glandular placement tailored to your anatomy.',
    highlights: ['Silicone & anatomical implants', '3D result preview', 'Sub-muscular placement', 'Lift with augmentation'],
    recovery: '1–2 weeks',
    from: '€3,100',
    gradient: 'from-[#ecddd4] to-[#ffdad2]',
    img: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=600&q=80',
  },
  {
    slug: 'abdominoplasty',
    title: 'Tummy Tuck',
    category: 'Body',
    tagline: 'Restore a flat, toned abdomen after change.',
    desc: 'Full and mini abdominoplasty with muscle repair for post-bariatric and post-pregnancy body contouring, frequently combined with VASER liposuction for comprehensive results.',
    highlights: ['Full abdominoplasty', 'Mini tummy tuck', 'Muscle repair (diastasis)', 'Post-bariatric body lift'],
    recovery: '2–3 weeks',
    from: '€3,400',
    gradient: 'from-[#fadcd1] to-[#ecddd4]',
    img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80',
  },
  {
    slug: 'skin-regeneration',
    title: 'Skin Regeneration',
    category: 'Aesthetic Medicine',
    tagline: 'Advanced technology for transformative skin renewal.',
    desc: 'Stem-cell therapies, fractional CO₂ laser, PRP and medical-grade chemical peels — curated treatment plans for skin rejuvenation, texture correction and scar revision.',
    highlights: ['Fractional CO₂ laser', 'PRP therapy', 'Stem-cell facials', 'Medical-grade peels'],
    recovery: '3–7 days',
    from: '€800',
    gradient: 'from-[#ffdad2] to-[#dcc0ba]',
    img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
  },
  {
    slug: 'corrective-care',
    title: 'Revision & Corrective',
    category: 'Specialist',
    tagline: 'Specialist correction of prior procedures or trauma.',
    desc: 'A dedicated sub-network of revision specialists for secondary rhinoplasty, breast revision, scar correction and post-traumatic reconstruction — managed with the full Nia concierge service.',
    highlights: ['Revision rhinoplasty', 'Breast revision', 'Scar revision', 'Reconstructive surgery'],
    recovery: 'On consultation',
    from: 'On consultation',
    gradient: 'from-[#ecddd4] to-[#fadcd1]',
    img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&q=80',
  },
];

const CATEGORIES = ['All', 'Facial', 'Body', 'Aesthetic Medicine', 'Specialist'];

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

      <main className="pt-16 flex-grow">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="bg-surface-container-low py-24">
          <div className="max-w-container mx-auto px-[64px] grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-5">Our Specialties</span>
              <h1 className="font-display text-display-xl text-on-surface leading-[1.1] mb-6">
                Curated Surgical<br />
                <span className="italic text-primary">Excellence.</span>
              </h1>
              <p className="font-body text-body-lg text-on-surface-variant max-w-md leading-relaxed mb-8">
                Every procedure in our portfolio is performed by hand-selected specialists at JCI-accredited partner clinics — matched to your anatomy, goals and timeline by Nia AI.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setModalOpen(true)}
                  className="bg-primary text-on-primary px-8 py-4 rounded-lg font-body font-semibold text-label-caps uppercase tracking-widest hover:shadow-float transition-all flex items-center gap-3"
                >
                  Start AI Assessment
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '8', sub: 'Procedure categories' },
                { label: '85+', sub: 'Partner clinics' },
                { label: '12', sub: 'Countries' },
                { label: '99.8%', sub: 'Safety success rate' },
              ].map(s => (
                <div key={s.label} className="bg-surface-container-lowest rounded-card2 p-6 border border-outline-variant/20">
                  <p className="font-display text-display-lg text-primary leading-none mb-1">{s.label}</p>
                  <p className="font-body text-body-sm text-on-surface-variant">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Category filter ────────────────────────────────────────────── */}
        <div className="sticky top-16 z-20 bg-surface border-b border-outline-variant/20">
          <div className="max-w-container mx-auto px-[64px] flex gap-8 overflow-x-auto py-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`py-4 font-body text-label-caps uppercase tracking-widest whitespace-nowrap border-b-2 transition-all duration-200 ${
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

        {/* ── Procedure grid ─────────────────────────────────────────────── */}
        <section className="py-16 bg-surface">
          <div className="max-w-container mx-auto px-[64px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {filtered.map(proc => (
              <article
                key={proc.slug}
                onClick={() => setSelected(proc)}
                className="group bg-surface-container-lowest rounded-card2 border border-outline-variant/20 overflow-hidden cursor-pointer hover:shadow-concierge transition-all duration-300 hover:-translate-y-1"
              >
                {/* Visual */}
                <div className="aspect-[4/3] relative overflow-hidden bg-surface-container-low">
                  <img src={proc.img} alt={proc.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-surface/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-3 left-3">
                    <span className="font-body text-[9px] font-bold uppercase tracking-widest bg-surface-container-lowest/80 backdrop-blur-sm text-on-surface px-2.5 py-1 rounded-full">
                      {proc.category}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-display text-display-sm text-on-surface mb-1">{proc.title}</h3>
                  <p className="font-body text-body-sm text-on-surface-variant mb-4 leading-relaxed line-clamp-2">{proc.tagline}</p>

                  <div className="flex items-end justify-between pt-3 border-t border-outline-variant/20">
                    <div>
                      <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider mb-0.5">Starting from</p>
                      <p className="font-display text-display-sm text-primary">{proc.from}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider mb-0.5">Recovery</p>
                      <p className="font-body text-body-sm font-semibold text-on-surface">{proc.recovery}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Process strip ──────────────────────────────────────────────── */}
        <section className="py-20 bg-surface-container-low">
          <div className="max-w-container mx-auto px-[64px]">
            <div className="text-center mb-14">
              <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-4">How It Works</span>
              <h2 className="font-display text-display-lg text-on-surface">From Assessment to Recovery</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
              {[
                { n: '01', title: 'AI Assessment', desc: 'Nia collects your goals, medical history, and photos for a precise clinical profile.' },
                { n: '02', title: 'Surgeon Match', desc: 'Our algorithm matches you with the specialist whose expertise aligns with your anatomy.' },
                { n: '03', title: 'Clinic Offer', desc: 'Receive curated quotes with full inclusions — no hidden fees, no pressure.' },
                { n: '04', title: 'Concierge Journey', desc: 'Flights, transfers, accommodation and 24/7 recovery support — all handled by your Nia coordinator.' },
              ].map(step => (
                <div key={step.n} className="flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-display text-display-sm text-primary">{step.n}</span>
                  </div>
                  <div>
                    <h4 className="font-display text-display-sm text-on-surface mb-2">{step.title}</h4>
                    <p className="font-body text-body-sm text-on-surface-variant leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <section className="py-20 bg-surface">
          <div className="max-w-container mx-auto px-[64px]"><div className="bg-primary rounded-card3 p-14 md:p-20 text-center text-on-primary">
            <span className="font-body text-label-caps uppercase tracking-[0.2em] text-on-primary/60 block mb-4">Ready to Begin?</span>
            <h2 className="font-display text-display-xl mb-6 max-w-xl mx-auto leading-[1.1]">
              Not sure which procedure fits your goals?
            </h2>
            <p className="font-body text-body-lg mb-10 opacity-80 max-w-lg mx-auto">
              Nia will analyse your goals and match you with the ideal procedure and surgeon in minutes.
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

      {/* ── Procedure detail panel ─────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center bg-on-surface/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-surface rounded-card2 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 shrink-0">
              <div>
                <p className="font-body text-[9px] text-primary uppercase tracking-widest font-semibold">{selected.category}</p>
                <h2 className="font-display text-xl text-on-surface">{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
              <div className="aspect-[16/7] rounded-xl overflow-hidden">
                <img src={selected.img} alt={selected.title} className="w-full h-full object-cover" />
              </div>

              <p className="font-body text-body-md text-on-surface-variant leading-relaxed">{selected.desc}</p>

              <div>
                <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold mb-3">Included Procedures</p>
                <div className="grid grid-cols-2 gap-2">
                  {selected.highlights.map(h => (
                    <div key={h} className="flex items-center gap-2 bg-surface-container-low rounded-xl px-3 py-2.5">
                      <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      <span className="font-body text-[11px] text-on-surface">{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low rounded-xl p-4 text-center border border-outline-variant/10">
                  <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider mb-1.5">Starting From</p>
                  <p className="font-display text-display-md text-primary">{selected.from}</p>
                </div>
                <div className="bg-surface-container-low rounded-xl p-4 text-center border border-outline-variant/10">
                  <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider mb-1.5">Recovery</p>
                  <p className="font-display text-display-md text-on-surface">{selected.recovery}</p>
                </div>
              </div>

              <div className="bg-primary-fixed/40 border border-primary/10 rounded-xl px-4 py-3 flex items-start gap-3">
                <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
                <p className="font-body text-[11px] text-on-surface leading-relaxed">Pricing includes surgeon fee, anaesthesia and standard hospital stay. Nia will provide a fully itemised quote matched to your specific procedure plan.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/20 flex gap-3 shrink-0">
              <button onClick={() => setSelected(null)} className="flex-1 border border-outline-variant/40 text-on-surface-variant py-3.5 rounded-xl font-body text-[10px] font-semibold uppercase tracking-wider hover:border-primary hover:text-primary transition-all">
                Back
              </button>
              <button
                onClick={() => { setSelected(null); setModalOpen(true); }}
                className="flex-1 bg-primary text-on-primary py-3.5 rounded-xl font-body text-[10px] font-semibold uppercase tracking-wider hover:opacity-90 transition-all"
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
