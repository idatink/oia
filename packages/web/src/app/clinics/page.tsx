'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import LeadCaptureModal from '@/components/LeadCaptureModal';

type Clinic = {
  id: string;
  name: string;
  city: string;
  country: string;
  region: 'Europe' | 'Asia' | 'Middle East' | 'Americas';
  tagline: string;
  desc: string;
  procedures: string[];
  accreditations: string[];
  rating: number;
  reviewCount: number;
  since: string;
  gradient: string;
  img: string;
  featured?: boolean;
};

const CLINICS: Clinic[] = [
  {
    id: 'istanbul-aesthetic',
    name: 'Istanbul Aesthetic Centre',
    city: 'Istanbul',
    country: 'Turkey',
    region: 'Europe',
    tagline: 'Europe\'s most-requested destination for rhinoplasty and facial sculpting.',
    desc: 'Fifteen years of international patient care in a purpose-built facility in Nişantaşı. The centre\'s surgical team has trained in London, Paris and Seoul — and holds a 99.6% patient satisfaction rate across 8,000+ cases.',
    procedures: ['Rhinoplasty', 'Facelift', 'Blepharoplasty', 'Body Contouring'],
    accreditations: ['JCI Accredited', 'ISO 9001', 'Turkish Health Ministry Certified'],
    rating: 4.9,
    reviewCount: 312,
    since: '2009',
    gradient: 'from-[#ffdad2] to-[#fadcd1]',
    img: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=700&q=80',
    featured: true,
  },
  {
    id: 'barcelona-cmed',
    name: 'CMed Clinic Barcelona',
    city: 'Barcelona',
    country: 'Spain',
    region: 'Europe',
    tagline: 'Boutique European excellence for natural results.',
    desc: 'A discreet, private clinic in the Eixample district favoured by European patients seeking subtle, natural outcomes. Their plastic surgery team is ranked in the top 50 in Spain by the Spanish Society of Plastic Surgery.',
    procedures: ['Rhinoplasty', 'Breast Augmentation', 'Abdominoplasty', 'Skin Regeneration'],
    accreditations: ['JCI Accredited', 'ISAPS Member', 'CE Marked Facility'],
    rating: 4.8,
    reviewCount: 198,
    since: '2011',
    gradient: 'from-[#ecddd4] to-[#fadcd1]',
    img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=700&q=80',
    featured: true,
  },
  {
    id: 'bangkok-premium',
    name: 'Bangkok Premium Surgery',
    city: 'Bangkok',
    country: 'Thailand',
    region: 'Asia',
    tagline: 'Award-winning results with full-service recovery packages.',
    desc: 'Thailand\'s premier private surgical centre with over 12,000 international patients treated. Renowned for body contouring, breast surgery and comprehensive wellness recovery retreats adjacent to the clinic.',
    procedures: ['Body Contouring', 'Breast Augmentation', 'Brazilian Butt Lift', 'Tummy Tuck'],
    accreditations: ['JCI Accredited', 'ISO 15189', 'Thailand HAD Certified'],
    rating: 4.9,
    reviewCount: 441,
    since: '2007',
    gradient: 'from-[#fadcd1] to-[#ecddd4]',
    img: 'https://images.unsplash.com/photo-1555834022-bfa6e5bf9ca6?w=700&q=80',
    featured: true,
  },
  {
    id: 'dubai-sculpt',
    name: 'Dubai Sculpt Medical',
    city: 'Dubai',
    country: 'UAE',
    region: 'Middle East',
    tagline: 'Ultra-private care for Gulf and international patients.',
    desc: 'DHA-licensed facility in the DIFC district offering premium cosmetic and reconstructive surgery. Fully private consultation suites, Arabic-speaking surgical teams and direct coordination with UAE residency protocols.',
    procedures: ['Rhinoplasty', 'Liposuction', 'Facelift', 'Revision Surgery'],
    accreditations: ['DHA Licensed', 'JCI Pursuing', 'ESAM Member'],
    rating: 4.7,
    reviewCount: 156,
    since: '2015',
    gradient: 'from-[#ffdad2] to-[#eae8e6]',
    img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=700&q=80',
  },
  {
    id: 'seoul-aesthetics',
    name: 'Seoul Aesthetics Institute',
    city: 'Seoul',
    country: 'South Korea',
    region: 'Asia',
    tagline: 'The global benchmark for facial surgery precision.',
    desc: 'Located in Gangnam\'s medical district, this institute is internationally recognised for its V-line, jaw and facial bone contouring procedures. The surgical team performs over 3,000 facial procedures annually.',
    procedures: ['V-Line Surgery', 'Jaw Reduction', 'Rhinoplasty', 'Blepharoplasty'],
    accreditations: ['KHIDI Certified', 'ISAPS Member', 'KFDA Approved'],
    rating: 4.9,
    reviewCount: 287,
    since: '2006',
    gradient: 'from-[#ecddd4] to-[#ffdad2]',
    img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=700&q=80',
  },
  {
    id: 'milan-clinicaor',
    name: 'Clinica Orsola Milano',
    city: 'Milan',
    country: 'Italy',
    region: 'Europe',
    tagline: 'Understated Italian elegance in cosmetic surgery.',
    desc: 'A historic private clinic near the Brera district, preferred by European fashion and media professionals. Specialises in subtle facial rejuvenation and breast surgery with an emphasis on natural aesthetics.',
    procedures: ['Facelift', 'Breast Augmentation', 'Rhinoplasty', 'Blepharoplasty'],
    accreditations: ['AICPE Member', 'ISO 9001', 'Ministry of Health Certified'],
    rating: 4.8,
    reviewCount: 124,
    since: '2001',
    gradient: 'from-[#fadcd1] to-[#ffdad2]',
    img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=700&q=80',
  },
  {
    id: 'singapore-mhc',
    name: 'Mount Hallum Clinic',
    city: 'Singapore',
    country: 'Singapore',
    region: 'Asia',
    tagline: 'Singapore\'s gold standard for international medical care.',
    desc: 'MOH-licensed private surgical centre in Orchard Road with a dedicated international patient concierge. All surgeons are Singapore Medical Council registered with subspecialty training at London and Harvard-affiliated hospitals.',
    procedures: ['Rhinoplasty', 'Body Contouring', 'Breast Surgery', 'Skin Regeneration'],
    accreditations: ['MOH Licensed', 'JCI Accredited', 'ASAPS Member'],
    rating: 4.9,
    reviewCount: 203,
    since: '2010',
    gradient: 'from-[#ffdad2] to-[#ecddd4]',
    img: 'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=700&q=80',
  },
  {
    id: 'miami-aesthetic',
    name: 'Miami Aesthetic Centre',
    city: 'Miami',
    country: 'USA',
    region: 'Americas',
    tagline: 'ABPS-certified excellence for body transformation.',
    desc: 'Florida\'s leading private aesthetic surgery centre, known for Brazilian butt lifts, tummy tucks and advanced body sculpting. All surgeons are ABPS-certified with a minimum of 10 years in aesthetic practice.',
    procedures: ['Brazilian Butt Lift', 'Tummy Tuck', 'Body Contouring', 'Breast Augmentation'],
    accreditations: ['ABPS Certified', 'AAAASF Accredited', 'Florida DOH Licensed'],
    rating: 4.8,
    reviewCount: 389,
    since: '2003',
    gradient: 'from-[#ecddd4] to-[#eae8e6]',
    img: 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=700&q=80',
  },
];

const REGIONS = ['All', 'Europe', 'Asia', 'Middle East', 'Americas'];

export default function ClinicsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeRegion, setActiveRegion] = useState('All');
  const [selected, setSelected] = useState<Clinic | null>(null);

  const filtered = activeRegion === 'All'
    ? CLINICS
    : CLINICS.filter(c => c.region === activeRegion);

  const featured = CLINICS.filter(c => c.featured);

  return (
    <>
      <Nav onCTAClick={() => setModalOpen(true)} />

      <main className="pt-16 flex-grow">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="aurora overflow-hidden bg-surface py-24">
          <div className="max-w-container mx-auto px-[64px]">
            <div className="max-w-2xl">
              <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-5">Our Partner Network</span>
              <h1 className="font-display text-display-xl text-on-surface leading-[1.1] mb-6">
                Global Excellence,<br />
                <span className="italic text-primary">Hand-Selected.</span>
              </h1>
              <p className="font-body text-body-lg text-on-surface-variant leading-relaxed mb-8">
                Every clinic in the Oia network has passed a rigorous vetting process. We assess surgical outcomes, accreditation status, complication rates, facility standards and patient experience — annually.
              </p>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-10 mt-2">
              {[
                { label: '85+', sub: 'Partner clinics' },
                { label: '12', sub: 'Countries' },
                { label: '100%', sub: 'JCI accredited or pursuing' },
                { label: '4.9', sub: 'Average rating' },
              ].map(s => (
                <div key={s.label}>
                  <p className="font-display text-display-lg text-primary leading-none">{s.label}</p>
                  <p className="font-body text-body-sm text-on-surface-variant mt-1">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Featured three ────────────────────────────────────────────── */}
        <section className="py-16 bg-surface-container-low">
          <div className="max-w-container mx-auto px-[64px]">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-2">Editor&apos;s Selection</span>
                <h2 className="font-display text-display-lg text-on-surface">This Season&apos;s Featured Clinics</h2>
              </div>
              <button
                onClick={() => setActiveRegion('All')}
                className="font-body text-label-caps text-primary uppercase tracking-wider border-b border-primary pb-0.5 hover:opacity-70 transition-all hidden md:block"
              >
                View All
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-gutter">
              {featured.map((clinic, i) => (
                <article
                  key={clinic.id}
                  onClick={() => setSelected(clinic)}
                  className="group glass lift-card rounded-card2 overflow-hidden cursor-pointer transition-all duration-300"
                >
                  <div className="h-48 relative overflow-hidden">
                    <img src={clinic.img} alt={clinic.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-on-surface/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {i === 0 && (
                      <div className="absolute top-4 left-4 bg-primary text-on-primary font-body text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                        Most Requested
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4">
                      <p className="font-body text-[9px] font-bold text-white/90 uppercase tracking-wider">{clinic.city}, {clinic.country}</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-display-sm text-on-surface mb-1">{clinic.name}</h3>
                    <p className="font-body text-body-sm text-on-surface-variant leading-relaxed mb-4 line-clamp-2">{clinic.tagline}</p>

                    {/* Procedures */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {clinic.procedures.slice(0, 3).map(p => (
                        <span key={p} className="font-body text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant border border-outline-variant/40 px-2 py-1 rounded-full">{p}</span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-outline-variant/10">
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-primary fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                        <span className="font-body text-body-sm font-bold text-on-surface">{clinic.rating}</span>
                        <span className="font-body text-body-sm text-on-surface-variant">({clinic.reviewCount})</span>
                      </div>
                      <span className="font-body text-[10px] text-on-surface-variant">Est. {clinic.since}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── All clinics with region filter ───────────────────────────── */}
        <section className="py-16 bg-surface">
          <div className="max-w-container mx-auto px-[64px]">
            <div className="flex items-end justify-between mb-8">
              <h2 className="font-display text-display-lg text-on-surface">All Partner Clinics</h2>
            </div>

            {/* Region tabs */}
            <div className="flex gap-3 flex-wrap mb-10">
              {REGIONS.map(region => (
                <button
                  key={region}
                  onClick={() => setActiveRegion(region)}
                  className={`px-5 py-2 rounded-full font-body text-label-caps uppercase tracking-wider transition-all duration-200 ${
                    activeRegion === region
                      ? 'bg-primary text-on-primary shadow-float'
                      : 'border border-outline-variant/40 text-on-surface-variant hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
              {filtered.map(clinic => (
                <article
                  key={clinic.id}
                  onClick={() => setSelected(clinic)}
                  className="group glass-soft lift-card rounded-card2 overflow-hidden cursor-pointer transition-all duration-300"
                >
                  <div className="h-36 relative overflow-hidden">
                    <img src={clinic.img} alt={clinic.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="font-body text-[9px] font-bold uppercase tracking-wider bg-surface-container-lowest/80 backdrop-blur-sm text-on-surface px-2 py-1 rounded-full">
                        {clinic.city}, {clinic.country}
                      </span>
                      <div className="flex items-center gap-1 bg-surface-container-lowest/80 backdrop-blur-sm px-2 py-1 rounded-full">
                        <svg className="w-3 h-3 text-primary fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                        <span className="font-body text-[9px] font-bold text-on-surface">{clinic.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <h4 className="font-display text-display-sm text-on-surface mb-1">{clinic.name}</h4>
                    <p className="font-body text-[11px] text-on-surface-variant leading-relaxed line-clamp-2 mb-3">{clinic.tagline}</p>
                    <div className="flex flex-wrap gap-1">
                      {clinic.procedures.slice(0, 2).map(p => (
                        <span key={p} className="font-body text-[9px] uppercase tracking-wider text-on-surface-variant border border-outline-variant/30 px-2 py-0.5 rounded-full">{p}</span>
                      ))}
                      {clinic.procedures.length > 2 && (
                        <span className="font-body text-[9px] uppercase tracking-wider text-on-surface-variant/60 px-2 py-0.5">+{clinic.procedures.length - 2}</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="font-body text-body-md text-on-surface-variant">No clinics match this filter yet — more coming soon.</p>
              </div>
            )}
          </div>
        </section>

        {/* ── How we vet ───────────────────────────────────────────────── */}
        <section className="py-20 bg-surface-container-low">
          <div className="max-w-container mx-auto px-[64px]">
          <div className="text-center mb-14">
            <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-4">Our Vetting Process</span>
            <h2 className="font-display text-display-lg text-on-surface">How a Clinic Earns a Place in Our Network</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-gutter">
            {[
              { step: '01', label: 'Application & Credential Review', body: 'Surgeon board certifications, facility licensing and accreditation status are verified against primary sources.' },
              { step: '02', label: 'On-Site Audit', body: 'A Oia clinical assessor visits in person. Theatre standards, sterilisation, emergency protocols and patient pathways are inspected.' },
              { step: '03', label: 'Outcome Data Analysis', body: 'We review complication rates, revision rates and patient feedback for a minimum 2-year period before approval.' },
              { step: '04', label: 'Annual Re-Certification', body: 'Approval is never permanent. Clinics are re-audited annually and removed immediately if standards fall below our threshold.' },
            ].map(v => (
              <div key={v.step} className="glass-soft rounded-card2 p-6">
                <span className="font-display text-display-xl text-outline-variant/30 leading-none block mb-4">{v.step}</span>
                <h4 className="font-display text-display-sm text-on-surface mb-2">{v.label}</h4>
                <p className="font-body text-body-sm text-on-surface-variant leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="py-20 bg-surface">
          <div className="max-w-container mx-auto px-[64px]"><div className="bg-primary rounded-card3 p-14 md:p-20 text-center text-on-primary">
            <span className="font-body text-label-caps uppercase tracking-[0.2em] text-on-primary/60 block mb-4">Find Your Match</span>
            <h2 className="font-display text-display-xl mb-6 max-w-xl mx-auto leading-[1.1]">
              The right clinic isn&apos;t the most famous one. It&apos;s the one right for you.
            </h2>
            <p className="font-body text-body-lg mb-10 opacity-80 max-w-lg mx-auto">
              Oia analyses your procedure, anatomy and goals to identify the specific clinic and surgeon in our network whose expertise aligns with what you need.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-surface-container-lowest text-primary px-10 py-5 rounded-xl font-body font-bold text-label-caps uppercase tracking-[0.2em] lift-cta hover:shadow-float transition-all"
            >
              Start AI Assessment →
            </button>
          </div></div>
        </section>
      </main>

      {/* ── Clinic detail panel ───────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center bg-on-surface/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-surface rounded-card2 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 shrink-0">
              <div>
                <p className="font-body text-[9px] text-primary uppercase tracking-widest font-semibold">{selected.city}, {selected.country}</p>
                <h2 className="font-display text-xl text-on-surface">{selected.name}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
              <div className="aspect-[16/7] rounded-xl relative overflow-hidden">
                <img src={selected.img} alt={selected.name} className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-4 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-primary fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                  <span className="font-body text-sm font-bold text-on-surface bg-surface-container-lowest/90 px-2.5 py-1 rounded-full">{selected.rating} · {selected.reviewCount} reviews</span>
                </div>
              </div>

              <p className="font-body text-body-md text-on-surface-variant leading-relaxed">{selected.desc}</p>

              {/* Procedures */}
              <div>
                <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold mb-3">Procedures Available</p>
                <div className="flex flex-wrap gap-2">
                  {selected.procedures.map(p => (
                    <span key={p} className="border border-primary/30 text-primary bg-primary-fixed/30 px-3 py-1.5 rounded-full font-body text-[11px] font-semibold">{p}</span>
                  ))}
                </div>
              </div>

              {/* Accreditations */}
              <div>
                <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold mb-3">Accreditations & Certifications</p>
                <div className="space-y-2">
                  {selected.accreditations.map(a => (
                    <div key={a} className="flex items-center gap-3 glass-soft rounded-xl px-4 py-2.5">
                      <svg className="w-4 h-4 text-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span className="font-body text-[11px] font-semibold text-on-surface">{a}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick facts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-soft rounded-xl p-4 text-center">
                  <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider mb-1.5">Region</p>
                  <p className="font-display text-display-sm text-on-surface">{selected.region}</p>
                </div>
                <div className="glass-soft rounded-xl p-4 text-center">
                  <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider mb-1.5">Established</p>
                  <p className="font-display text-display-sm text-on-surface">{selected.since}</p>
                </div>
              </div>

              <div className="bg-primary-fixed/40 border border-primary/10 rounded-xl px-4 py-3 flex items-start gap-3">
                <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
                <p className="font-body text-[11px] text-on-surface leading-relaxed">Oia only shares your full profile with a clinic after you select them. Prior to your selection, only your procedure and AI score are visible to clinic coordinators.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/20 flex gap-3 shrink-0">
              <button onClick={() => setSelected(null)} className="flex-1 border border-outline-variant/40 text-on-surface-variant py-3.5 rounded-xl font-body text-[10px] font-semibold uppercase tracking-wider hover:border-primary hover:text-primary transition-all">
                Back
              </button>
              <button
                onClick={() => { setSelected(null); setModalOpen(true); }}
                className="flex-1 bg-primary text-on-primary py-3.5 rounded-xl font-body text-[10px] font-semibold uppercase tracking-wider lift-cta hover:opacity-90 transition-all"
              >
                Check My Match →
              </button>
            </div>
          </div>
        </div>
      )}

      <LeadCaptureModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
