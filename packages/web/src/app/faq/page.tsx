'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import LeadCaptureModal from '@/components/LeadCaptureModal';

const FAQS: { section: string; items: { q: string; a: string }[] }[] = [
  {
    section: 'The basics',
    items: [
      {
        q: 'What is Oia?',
        a: 'Oia is your personal AI consultant for cosmetic surgery — a discreet, knowledgeable companion for one of the most personal decisions of your life. You tell her what you long for in a normal conversation; she finds the vetted surgeon whose real results match your goals — at home or abroad — secures the best price and package on your behalf, and stays beside you from first curiosity to full recovery.',
      },
      {
        q: 'Does talking to Oia cost anything?',
        a: 'No. Talking to Oia is free, and there is no commitment at any point. Oia is paid by partner clinics when a journey goes ahead — never by marking up your price, and never by steering you toward a particular surgeon.',
      },
      {
        q: 'How does the matching actually work?',
        a: 'Every surgeon in our network is scored on accreditation (board and international certifications), specialism fit for your exact procedure, and verified patient reviews. The ranking is deterministic — the same profile always produces the same shortlist — and every match comes with the reasons it was chosen, in plain language.',
      },
      {
        q: 'Where can I have surgery?',
        a: 'At home or abroad — both are always on the table. Our vetted network currently spans the UK, Germany, Lithuania, Spain, Greece, Turkey and Lebanon — and a new destination joins only when it clears our vetting bar. We are launching deliberately: limited countries, limited patients, full attention on each one.',
      },
    ],
  },
  {
    section: 'Safety & trust',
    items: [
      {
        q: 'How are surgeons vetted?',
        a: 'We check board certification and international accreditation (EBOPRAS, ISAPS, FACS, JCI-accredited hospitals), procedure-specific experience, and verified patient outcomes before a surgeon enters the network. Accreditation is the largest single factor in every match we make.',
      },
      {
        q: 'Will I see real before & after results?',
        a: 'Yes — with consent at the centre. Facial results appear only where the patient has signed consent for them to be shown. Body-contouring results are shared privately in your consultation, never in public galleries.',
      },
      {
        q: 'What if something goes wrong after surgery?',
        a: 'Your plan includes structured aftercare: daily post-op check-ins through the same chat, symptom tracking, and direct escalation to your surgical team. Complication management protocols are agreed with the clinic before you ever book.',
      },
    ],
  },
  {
    section: 'Privacy',
    items: [
      {
        q: 'Who sees my photos?',
        a: 'Only your care team. Photos travel through a private, encrypted pipeline, are never used for marketing, and are stored on EU (London) infrastructure under GDPR.',
      },
      {
        q: 'Can I start without giving any personal details?',
        a: 'Yes. You can have your entire first conversation with Oia anonymously — no name, no number, no forms. You share your contact details only at the end, if you choose to go further.',
      },
    ],
  },
  {
    section: 'Money & travel',
    items: [
      {
        q: 'What does the price include?',
        a: 'Your estimate is all-inclusive: surgeon and theatre fees, hospital nights, hotel, airport and clinic transfers, and aftercare with private nursing. It sits next to what the same procedure costs at home, so you can see exactly what you save. £0 hidden fees.',
      },
      {
        q: 'How do payments work?',
        a: 'You pay the clinic directly — Oia never takes your money in the middle. Deposits and payment schedules are agreed in writing before you confirm, and nothing is due until you have your written plan.',
      },
      {
        q: 'How long will I be away?',
        a: 'It depends on the procedure — typically 7–14 days including pre-op, surgery and initial recovery, with medical clearance before you fly home. Your itinerary lays out every day in advance.',
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-outline-variant/20">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-6 py-5 text-left group">
        <span className="font-body text-body-md font-semibold text-on-surface group-hover:text-primary transition-colors">{q}</span>
        <span className={`shrink-0 text-primary transition-transform duration-200 ${open ? 'rotate-45' : ''}`} aria-hidden>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M8 1v14M1 8h14" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {open && (
        <p className="font-body text-body-md text-on-surface-variant leading-relaxed pb-6 max-w-2xl">{a}</p>
      )}
    </div>
  );
}

export default function FaqPage() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="bg-surface-container-lowest min-h-screen">
      <Nav onCTAClick={() => setModalOpen(true)} />

      <main className="pt-16">
        <section className="py-20 md:py-28 px-6 text-center">
          <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-4">FAQ</span>
          <h1 className="font-display text-4xl md:text-6xl text-on-surface max-w-2xl mx-auto leading-tight">
            Every question, <span className="italic text-primary">answered honestly.</span>
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-xl mx-auto mt-6">
            And anything we haven&apos;t covered — just ask Oia. That&apos;s what she&apos;s for.
          </p>
        </section>

        <section className="pb-20 md:pb-28 px-6">
          <div className="max-w-3xl mx-auto space-y-14">
            {FAQS.map(s => (
              <div key={s.section}>
                <h2 className="font-body text-label-caps text-primary uppercase tracking-[0.2em] mb-2">{s.section}</h2>
                {s.items.map(item => <FaqItem key={item.q} {...item} />)}
              </div>
            ))}
          </div>
        </section>

        <section className="py-20 bg-surface-container-low px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl text-on-surface mb-6">Still wondering about something?</h2>
          <button onClick={() => setModalOpen(true)}
            className="bg-primary text-on-primary px-8 py-4 rounded-lg font-body font-semibold text-label-caps uppercase tracking-widest hover:opacity-90 active:opacity-80 transition-all">
            Ask Oia
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
