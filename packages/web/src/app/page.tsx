'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import LeadCaptureModal from '@/components/LeadCaptureModal';
import { IcPlane, IcSuite, IcClinic, IcProcedure, IcRecovery, IcHome, IcVest, IcLeggings, IcCapsule, IcSerum, IcPillow, IcSnowflake, IcChevronLeft, IcChevronRight, IcLock } from '@/components/OiaIcons';

function NiaStar({ size = 10, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M50 0C50 0 56 44 100 50C56 56 50 100 50 100C50 100 44 56 0 50C44 44 50 0 50 0Z" fill={color} />
    </svg>
  );
}

/* Typing dots that appear then vanish — duration = gap until next message */
function TypingDots({ delay = 0, duration = 0.8, from = 'nia' }: { delay?: number; duration?: number; from?: 'nia' | 'patient' }) {
  const dots = [0, 1, 2].map(i => (
    <span key={i} className={`w-1.5 h-1.5 rounded-full inline-block ${from === 'nia' ? 'bg-on-surface-variant/35' : 'bg-on-primary/60'}`}
      style={{ animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
  ));

  if (from === 'patient') {
    return (
      <div className="flex justify-end" style={{ animation: `typingBubble ${duration}s ease-in-out ${delay}s both` }}>
        <div className="bg-primary/20 rounded-2xl rounded-br-sm px-3 py-2.5 flex gap-1 items-center">{dots}</div>
      </div>
    );
  }
  return (
    <div className="flex gap-1.5 items-end" style={{ animation: `typingBubble ${duration}s ease-in-out ${delay}s both` }}>
      <div className="w-5 h-5 rounded-full bg-primary shrink-0 flex items-center justify-center mb-0.5">
        <NiaStar size={8} />
      </div>
      <div className="bg-surface-container rounded-2xl rounded-bl-sm px-3 py-2.5 flex gap-1 items-center">{dots}</div>
    </div>
  );
}

function PhoneFrame({ children, size = 'md' }: { children: React.ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? { w: 300, h: 600 } : size === 'sm' ? { w: 210, h: 420 } : { w: 255, h: 510 };
  const r = dims.w / 300; // scale ratio
  return (
    <div className="relative mx-auto shrink-0" style={{ width: dims.w, height: dims.h }}>
      {/* Screen content — sits behind the PNG frame overlay */}
      <div className="absolute bg-surface flex flex-col overflow-hidden"
        style={{
          top: Math.round(16 * r), left: Math.round(11 * r),
          right: Math.round(11 * r), bottom: Math.round(10 * r),
          borderRadius: Math.round(40 * r),
        }}>
        {/* Status bar */}
        <div className="flex justify-between items-center bg-surface shrink-0 relative"
          style={{ padding: `${Math.round(10 * r)}px ${Math.round(20 * r)}px ${Math.round(4 * r)}px` }}>
          <span className="font-body font-semibold text-on-surface" style={{ fontSize: Math.round(10 * r) }}>9:41</span>
          <div className="flex gap-1 items-center">
            <svg style={{ width: Math.round(12 * r), height: Math.round(12 * r) }} className="fill-on-surface" viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
            <svg style={{ width: Math.round(14 * r), height: Math.round(12 * r) }} className="fill-on-surface" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
          </div>
        </div>
        {children}
      </div>

      {/* Realistic iPhone frame — white screen area disappears via multiply blend mode */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/phone-frame.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        style={{
          mixBlendMode: 'multiply',
          filter: 'drop-shadow(0 24px 56px rgba(0,0,0,0.5))',
        }}
      />
    </div>
  );
}

function ChatHeader() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-outline-variant/20 bg-surface shrink-0">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm">
        <NiaStar size={13} />
      </div>
      <div className="flex-1">
        <p className="font-body text-[11px] font-semibold text-on-surface">Oia</p>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          <p className="font-body text-[9px] text-on-surface-variant">Online now</p>
        </div>
      </div>
    </div>
  );
}

function NiaMsg({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div className="flex gap-1.5 items-end" style={{ animation: `msgIn 0.4s ease-out ${delay}s both` }}>
      <div className="w-5 h-5 rounded-full bg-primary shrink-0 flex items-center justify-center mb-0.5">
        <NiaStar size={8} />
      </div>
      <div className="bg-surface-container px-3 py-2 rounded-2xl rounded-bl-sm max-w-[84%]">
        <p className="font-body text-[11px] text-on-surface leading-snug">{children}</p>
      </div>
    </div>
  );
}

function PatientMsg({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div className="flex justify-end" style={{ animation: `msgIn 0.4s ease-out ${delay}s both` }}>
      <div className="bg-primary px-3 py-2 rounded-2xl rounded-br-sm max-w-[84%]">
        <p className="font-body text-[11px] text-on-primary leading-snug">{children}</p>
      </div>
    </div>
  );
}

/* ── Before/After card that appears in chat ── */
function BeforeAfterCard({ delay = 0 }: { delay?: number }) {
  return (
    <div className="ml-7" style={{ animation: `msgIn 0.4s ease-out ${delay}s both` }}>
      <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="flex h-28">
          {/* One real before/after asset — each pane shows its half, shifted up to crop the baked-in labels */}
          <div className="flex-1 relative overflow-hidden">
            <img src="/screens/beforeafter-nose.jpg" alt="Before" className="absolute left-0 max-w-none object-cover"
              style={{ width: '100%', height: '118%', top: '-18%', objectPosition: 'left center' }} />
            <div className="absolute bottom-1 left-1 bg-black/50 rounded px-1.5 py-0.5">
              <p className="font-body text-[8px] text-white uppercase tracking-widest">Before</p>
            </div>
          </div>
          <div className="w-px bg-surface" />
          <div className="flex-1 relative overflow-hidden">
            <img src="/screens/beforeafter-nose.jpg" alt="After" className="absolute left-0 max-w-none object-cover"
              style={{ width: '100%', height: '118%', top: '-18%', objectPosition: 'right center' }} />
            <div className="absolute bottom-1 left-1 bg-primary/70 rounded px-1.5 py-0.5">
              <p className="font-body text-[8px] text-white uppercase tracking-widest">After</p>
            </div>
          </div>
        </div>
        <div className="px-2.5 py-2 flex items-center justify-between">
          <div>
            <p className="font-body text-[10px] font-semibold text-on-surface">Rhinoplasty · Istanbul</p>
            <p className="font-body text-[9px] text-on-surface-variant">Dr. Demir · 12 weeks post-op</p>
          </div>
          <div className="flex">
            {[...Array(5)].map((_, i) => <svg key={i} className="w-2.5 h-2.5 text-primary fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Clinic card in chat ── */
function ClinicCard({ delay = 0 }: { delay?: number }) {
  return (
    <div className="ml-7" style={{ animation: `msgIn 0.4s ease-out ${delay}s both` }}>
      <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="h-20 relative overflow-hidden">
          <img src="/screens/clinic.webp" alt="Clinic" className="w-full h-full object-cover" style={{ objectPosition: 'center 62%' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-2 left-2.5">
            <p className="font-body text-[10px] text-white font-semibold">Estetik International</p>
            <p className="font-body text-[9px] text-white/80">Istanbul · JCI Accredited</p>
          </div>
          <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">
            <p className="font-body text-[9px] text-white font-semibold">★ 4.9</p>
          </div>
        </div>
        <div className="px-2.5 py-2">
          <div className="flex justify-between items-center mb-1.5">
            <p className="font-body text-[9px] text-on-surface-variant">Body contouring package from</p>
            <p className="font-body text-[11px] font-semibold text-primary">£6,800</p>
          </div>
          <div className="flex gap-1">
            {['Jun 22', 'Jun 29', 'Jul 6'].map(d => (
              <div key={d} className={`flex-1 text-center rounded py-0.5 ${d === 'Jun 22' ? 'bg-primary' : 'bg-primary/10'}`}>
                <p className={`font-body text-[8px] font-semibold ${d === 'Jun 22' ? 'text-on-primary' : 'text-primary'}`}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Itinerary screen ── */
function ItineraryScreen() {
  const items = [
    { day: 'Jun 22', Icon: IcPlane, title: 'Fly to Madrid', sub: 'LHR 07:45 → MAD 11:20 · transfer included', status: 'Confirmed', sc: 'text-green-700 bg-green-50' },
    { day: 'Jun 22', Icon: IcSuite, title: 'Villa Magna · Suite 412', sub: 'Check-in 3pm · nurse on call overnight', status: 'Booked', sc: 'text-primary bg-primary/8' },
    { day: 'Jun 23', Icon: IcClinic, title: 'Pre-op · Dr. Navarro', sub: 'Clínica Aurora · 9:00am', status: 'Confirmed', sc: 'text-green-700 bg-green-50' },
    { day: 'Jun 24', Icon: IcProcedure, title: 'Surgery day', sub: 'Tummy tuck + breast lift · 4 hrs', status: 'Scheduled', sc: 'text-amber-700 bg-amber-50' },
    { day: 'Jun 25–29', Icon: IcRecovery, title: 'Recovery & daily check-ins', sub: 'Private nursing · Oia monitoring', status: 'Planned', sc: 'text-on-surface-variant bg-surface-container' },
    { day: 'Jul 2', Icon: IcHome, title: 'Fly home', sub: 'MAD → LHR · medical clearance issued', status: 'Planned', sc: 'text-on-surface-variant bg-surface-container' },
  ];
  return (
    <>
      <div className="px-4 py-3 bg-surface border-b border-outline-variant/20 shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-body text-[12px] font-semibold text-on-surface">Madrid Journey</p>
            <p className="font-body text-[9px] text-primary">Jun 22 – Jul 2 · 10 nights</p>
          </div>
          <div className="bg-primary/8 rounded-lg px-2 py-1 text-center">
            <p className="font-body text-[9px] text-primary font-semibold">6 steps</p>
            <p className="font-body text-[7px] text-on-surface-variant">3 confirmed</p>
          </div>
        </div>
      </div>
      <div className="px-3 py-2 flex gap-2 border-b border-outline-variant/10 shrink-0">
        {[{ Icon: IcPlane, label: 'Flights', val: 'Confirmed' }, { Icon: IcSuite, label: 'Hotel', val: 'Booked' }, { Icon: IcProcedure, label: 'Surgery', val: 'Jun 24' }].map(c => (
          <div key={c.label} className="flex-1 bg-surface-container rounded-xl p-1.5 flex flex-col items-center gap-0.5">
            <c.Icon size={15} className="text-primary" />
            <p className="font-body text-[8px] font-semibold text-on-surface">{c.label}</p>
            <p className="font-body text-[7px] text-primary">{c.val}</p>
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-hidden px-3 py-2 space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2.5 items-center p-2 rounded-xl bg-surface border border-outline-variant/20"
            style={{ animation: `msgIn 0.35s ease-out ${0.15 + i * 0.1}s both` }}>
            <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 text-primary"><item.Icon size={16} /></div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-[10px] font-semibold text-on-surface truncate">{item.title}</p>
              <p className="font-body text-[8px] text-on-surface-variant truncate">{item.sub}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-body text-[7px] font-semibold rounded px-1.5 py-0.5 ${item.sc}`}>{item.status}</p>
              <p className="font-body text-[7px] text-on-surface-variant mt-0.5">{item.day}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Post-op recovery snapshot (Jetty-style grid) ── */
function PostOpScreen() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  // scores[i] = severity 0–3 (0=none,1=mild,2=moderate,3=high), null=future
  const symptoms: { name: string; scores: (number | null)[] }[] = [
    { name: 'Pain',     scores: [3, 3, 2, 2, 1, null, null] },
    { name: 'Swelling', scores: [3, 3, 2, 2, 2, null, null] },
    { name: 'Energy',   scores: [1, 1, 2, 2, 3, null, null] },
    { name: 'Mobility', scores: [1, 1, 2, 2, 3, null, null] },
  ];
  /* One cohesive, earthy scale: terracotta = discomfort, sage = vitality. Intensity = level. */
  const sevBg = (s: number | null, name: string) => {
    if (s === null || s === 0) return '#efeae7';
    const good = name === 'Energy' || name === 'Mobility';
    const a = s === 3 ? 0.85 : s === 2 ? 0.5 : 0.24;
    return good ? `rgba(107,138,99,${a})` : `rgba(153,64,43,${a})`;
  };
  return (
    <>
      <div className="px-4 py-3 bg-surface border-b border-outline-variant/20 shrink-0 flex justify-between items-center">
        <div>
          <p className="font-body text-[12px] font-semibold text-on-surface">Recovery Snapshot</p>
          <p className="font-body text-[9px] text-on-surface-variant">Your progress at a glance</p>
        </div>
        <div className="flex items-center gap-1 bg-green-50 rounded-full px-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          <p className="font-body text-[9px] text-green-700 font-semibold">Day 5</p>
        </div>
      </div>

      {/* Week nav */}
      <div className="px-4 pt-3 pb-1 shrink-0 flex items-center justify-between text-on-surface-variant">
        <IcChevronLeft size={13} />
        <p className="font-body text-[10px] font-semibold text-on-surface">This week</p>
        <IcChevronRight size={13} />
      </div>

      {/* Grid */}
      <div className="px-3 shrink-0">
        {/* Day headers */}
        <div className="grid mb-1" style={{ gridTemplateColumns: '52px repeat(7, 1fr)', gap: '3px' }}>
          <div />
          {days.map((d, i) => (
            <p key={i} className={`font-body text-[8px] text-center pb-0.5 ${i === 4 ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>{d}</p>
          ))}
        </div>
        {symptoms.map((s, si) => (
          <div key={si} className="grid mb-1.5 items-center" style={{ gridTemplateColumns: '52px repeat(7, 1fr)', gap: '3px', animation: `msgIn 0.3s ease-out ${0.1 + si * 0.08}s both` }}>
            <p className="font-body text-[9px] text-on-surface-variant">{s.name}</p>
            {s.scores.map((score, di) => (
              <div key={di} className="rounded aspect-square" style={{ minHeight: 14, background: sevBg(score, s.name) }} />
            ))}
          </div>
        ))}
        {/* Legend — two earthy valences */}
        <div className="flex items-center justify-between mt-1.5 mb-2 px-0.5">
          {([['Discomfort', '153,64,43'], ['Vitality', '107,138,99']] as const).map(([label, rgb]) => (
            <div key={label} className="flex items-center gap-1.5">
              <p className="font-body text-[7px] text-on-surface-variant">{label}</p>
              <div className="flex gap-0.5">
                {[0.24, 0.5, 0.85].map(a => (
                  <div key={a} className="w-2 h-2 rounded-sm" style={{ background: `rgba(${rgb},${a})` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insight card */}
      <div className="mx-3 bg-green-50 rounded-xl p-2.5 shrink-0" style={{ animation: 'msgIn 0.4s ease-out 0.5s both' }}>
        <div className="flex items-center gap-1 mb-1">
          <p className="font-body text-[10px] font-semibold text-green-700">Pain ↓</p>
          <p className="font-body text-[10px] font-semibold text-on-surface">Tracking ahead of schedule</p>
        </div>
        <p className="font-body text-[9px] text-on-surface-variant mb-2">Day 5 score 2/10, expected 4. You&apos;re recovering faster than most.</p>
        <div className="flex gap-1.5">
          {[['Severity', '2/10', 'Expected: 4'], ['Trend', '↓ 78%', 'Since day 1']].map(([label, val, sub]) => (
            <div key={label} className="flex-1 bg-white rounded-lg px-2 py-1.5">
              <p className="font-body text-[8px] text-on-surface-variant">{label}</p>
              <p className="font-body text-[12px] font-semibold text-green-700">{val}</p>
              <p className="font-body text-[7px] text-on-surface-variant">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dr note */}
      <div className="mx-3 mt-2 flex items-start gap-2 shrink-0" style={{ animation: 'msgIn 0.4s ease-out 0.7s both' }}>
        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
          <NiaStar size={8} />
        </div>
        <div className="bg-surface-container rounded-xl rounded-tl-sm px-2.5 py-2">
          <p className="font-body text-[9px] text-on-surface leading-snug flex items-start gap-1">
            <IcSnowflake size={11} className="text-primary shrink-0 mt-px" />
            <span>Next check-in tomorrow 9am. Keep the compression garment on and ice 15 min every 2h.</span>
          </p>
        </div>
      </div>
    </>
  );
}

/* ── Surgery Shop screen ── */
function SurgeryShopScreen() {
  const products = [
    { Icon: IcVest, name: 'Medical compression vest', brand: 'Marena Recovery · Post-surgery grade', price: '£49', tag: 'Essential', tagColor: 'text-primary bg-primary/10' },
    { Icon: IcLeggings, name: 'Compression leggings', brand: 'Solidea Medical · 18–21 mmHg', price: '£34', tag: 'Post-op', tagColor: 'text-primary bg-primary/10' },
    { Icon: IcCapsule, name: 'Arnica supplements', brand: '60 capsules · bruising & swelling', price: '£16', tag: null, tagColor: '' },
    { Icon: IcSerum, name: 'Scar treatment serum', brand: 'Mederma Advanced · 2-month supply', price: '£28', tag: 'Recommended', tagColor: 'text-green-700 bg-green-50' },
    { Icon: IcPillow, name: 'Recovery wedge pillow', brand: 'Memory foam · elevation support', price: '£44', tag: null, tagColor: '' },
  ];
  return (
    <>
      <div className="px-4 py-3 bg-surface border-b border-outline-variant/20 shrink-0 flex justify-between items-center">
        <div>
          <p className="font-body text-[12px] font-semibold text-on-surface">Recovery Kit</p>
          <p className="font-body text-[9px] text-primary">Curated by Dr. Navarro · 5 items</p>
        </div>
        <div className="bg-primary/8 rounded-lg px-2 py-1 text-center">
          <p className="font-body text-[9px] font-semibold text-on-surface">£171</p>
          <p className="font-body text-[7px] text-on-surface-variant">bundle</p>
        </div>
      </div>

      {/* Delivery banner */}
      <div className="mx-3 mt-2 bg-primary/6 rounded-xl px-3 py-2 flex items-center gap-2 shrink-0">
        <NiaStar size={9} color="#7d2c19" />
        <p className="font-body text-[9px] text-primary leading-snug">Order by Jun 20 — delivered to your hotel before arrival</p>
      </div>

      {/* Product list */}
      <div className="flex-1 overflow-hidden px-3 py-2 space-y-1.5">
        {products.map((p, i) => (
          <div key={i} className="flex items-center gap-2.5 p-2 bg-surface rounded-xl border border-outline-variant/20"
            style={{ animation: `msgIn 0.3s ease-out ${0.15 + i * 0.09}s both` }}>
            <div className="w-9 h-9 rounded-lg bg-surface-container shrink-0 flex items-center justify-center text-primary">
              <p.Icon size={19} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-[10px] font-semibold text-on-surface truncate">{p.name}</p>
              <p className="font-body text-[8px] text-on-surface-variant truncate">{p.brand}</p>
              {p.tag && (
                <span className={`font-body text-[7px] font-semibold rounded px-1.5 py-0.5 inline-block mt-0.5 ${p.tagColor}`}>{p.tag}</span>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="font-body text-[11px] font-semibold text-on-surface">{p.price}</p>
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-1 ml-auto">
                <span className="text-primary font-bold text-[11px]">+</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-3 pb-3 pt-1 shrink-0">
        <div className="flex justify-between items-center mb-2 px-1">
          <p className="font-body text-[10px] text-on-surface-variant">5 items · bundle saving</p>
          <p className="font-body text-[11px] font-semibold text-on-surface">£171 <span className="line-through text-on-surface-variant text-[9px]">£198</span></p>
        </div>
        <div className="w-full bg-primary rounded-xl py-2.5 text-center">
          <p className="font-body text-[11px] font-semibold text-on-primary">Add all to recovery kit</p>
        </div>
      </div>
    </>
  );
}

/* ── Static chat screens for carousel (always visible, no animation delay) ── */
function ChatScreenStatic() {
  return (
    <>
      <ChatHeader />
      <div className="flex-1 overflow-hidden px-3 py-3 flex flex-col gap-2">
        <PatientMsg>Hey Oia, tell me about best surgeons for rhinoplasty. I&apos;ve never liked my profile, I want this bump gone.</PatientMsg>
        <NiaMsg>Thank you for trusting me with that. The best rhinoplasty keeps your face completely yours — just quieter about the one thing you notice. What would feeling at ease in photos look like?</NiaMsg>
        <div className="flex justify-end">
          <div className="rounded-2xl rounded-br-sm overflow-hidden border border-primary/20 relative" style={{ width: 90, height: 110 }}>
            <img src="/screens/reference-profile.webp" alt="Reference" className="w-full h-full object-cover" style={{ objectPosition: 'center 22%' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <p className="absolute bottom-1 left-1.5 font-body text-[7px] text-white/80">Reference photo</p>
          </div>
        </div>
        <PatientMsg>Something like this. Natural — I don&apos;t want to look &quot;done&quot;.</PatientMsg>
        {/* Oia is composing the reveal — a perpetual, subtle sign of life */}
        <div className="flex gap-1.5 items-end" style={{ animation: 'typingLoop 6.5s ease-in-out 1.2s infinite' }}>
          <div className="w-5 h-5 rounded-full bg-primary shrink-0 flex items-center justify-center mb-0.5">
            <NiaStar size={8} />
          </div>
          <div className="bg-surface-container rounded-2xl rounded-bl-sm px-3 py-2.5 flex gap-1 items-center">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-1.5 h-1.5 rounded-full inline-block bg-on-surface-variant/35"
                style={{ animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function MatchesScreenStatic() {
  const alsoMatched = [
    { name: 'Kalos Aesthetics', where: 'Athens · EU Accredited', rating: '4.8', from: '£7,200' },
    { name: 'Clínica Aurora', where: 'Madrid · EU Accredited', rating: '4.8', from: '£7,900' },
  ];
  return (
    <>
      <ChatHeader />
      <div className="flex-1 overflow-hidden px-3 py-3 flex flex-col gap-2">
        <NiaMsg>I&apos;ve matched you across Istanbul, Athens and Madrid — all within your budget. From June 22nd?</NiaMsg>
        <PatientMsg>Yes! June 22nd is perfect. 🙌</PatientMsg>
        <NiaMsg>Your top match — JCI accredited, 1,200+ body contouring cases:</NiaMsg>
        <div className="ml-7">
          <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">
            <div className="h-14 relative overflow-hidden">
              <img src="/screens/clinic.webp" alt="Clinic" className="w-full h-full object-cover" style={{ objectPosition: 'center 62%' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-1.5 left-2.5">
                <p className="font-body text-[10px] text-white font-semibold">Estetik International</p>
                <p className="font-body text-[8px] text-white/80">Istanbul · JCI Accredited</p>
              </div>
              <div className="absolute top-1.5 right-2 bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">
                <p className="font-body text-[9px] text-white font-semibold">★ 4.9</p>
              </div>
            </div>
            <div className="px-2.5 py-1.5 flex justify-between items-center">
              <p className="font-body text-[9px] text-on-surface-variant">Body contouring package from</p>
              <p className="font-body text-[11px] font-semibold text-primary">£6,800</p>
            </div>
          </div>
        </div>
        <NiaMsg>Also matched for you:</NiaMsg>
        <div className="ml-7 space-y-1.5">
          {alsoMatched.map(c => (
            <div key={c.name} className="bg-surface rounded-xl border border-outline-variant px-2.5 py-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-body text-[10px] font-semibold text-on-surface">{c.name}</p>
                <p className="font-body text-[8px] text-primary font-semibold">★ {c.rating}</p>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="font-body text-[8px] text-on-surface-variant">{c.where}</p>
                <p className="font-body text-[9px] font-semibold text-primary">from {c.from}</p>
              </div>
            </div>
          ))}
        </div>
        <NiaMsg>Prefer to stay closer to home? I can show you excellent local options too — the choice is always yours. Want me to hold Jun 22nd with your coordinator?</NiaMsg>
        <PatientMsg>Please hold it! 🙏</PatientMsg>
      </div>
    </>
  );
}

/* ── Phone Carousel — Jetty style: full sliding track with peek screens ── */
const SLIDE_GAP = 28;

function PhoneCarousel() {
  const [active, setActive] = useState(2);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const screens: { label: string; content: React.ReactNode }[] = [
    { label: 'Your matches',   content: <MatchesScreenStatic /> },
    { label: 'Your itinerary', content: <ItineraryScreen /> },
    { label: 'Meet Oia',       content: <ChatScreenStatic /> },
    { label: 'Recovery kit',   content: <SurgeryShopScreen /> },
    { label: 'Post-op care',   content: <PostOpScreen /> },
  ];
  const n = screens.length;
  const goTo = (i: number) => setActive(Math.max(0, Math.min(i, n - 1)));

  /* Shift track so slide[active] is horizontally centred in the viewport */
  const trackLeft = `calc(50% - ${active * (300 + SLIDE_GAP) + 150}px)`;

  return (
    <div className="flex flex-col items-center w-full">

      {/* ── Sliding track ── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: 640 }}
        onTouchStart={e => setDragStartX(e.touches[0].clientX)}
        onTouchEnd={e => {
          if (dragStartX === null) return;
          const diff = dragStartX - e.changedTouches[0].clientX;
          if (diff > 40) goTo(active + 1);
          else if (diff < -40) goTo(active - 1);
          setDragStartX(null);
        }}
      >
        <div
          className="absolute top-5 flex items-center"
          style={{
            left: trackLeft,
            gap: SLIDE_GAP,
            transition: 'left 0.42s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {screens.map((s, i) => {
            const dist = Math.abs(i - active);
            const isActive = i === active;
            return (
              <div
                key={i}
                onClick={() => !isActive && goTo(i)}
                style={{
                  width: 300,
                  height: 600,
                  flexShrink: 0,
                  position: 'relative',
                  /* Adjacent screens are clear, just scaled down — like Jetty */
                  opacity: dist <= 1 ? 1 : dist === 2 ? 0.6 : 0.3,
                  transform: `scale(${isActive ? 1 : dist === 1 ? 0.84 : 0.72})`,
                  transformOrigin: 'center center',
                  transition: 'opacity 0.42s ease, transform 0.42s ease',
                  cursor: isActive ? 'default' : 'pointer',
                  zIndex: 10 - dist,
                  filter: isActive
                    ? 'drop-shadow(0 24px 60px rgba(0,0,0,0.36))'
                    : 'drop-shadow(0 8px 24px rgba(0,0,0,0.14))',
                }}
              >
                {/* Screen content — inset matches phone bezel on active, fills full rect on peeks */}
                <div
                  className="absolute bg-surface flex flex-col overflow-hidden"
                  style={isActive
                    ? { top: 16, left: 11, right: 11, bottom: 10, borderRadius: 40 }
                    : { inset: 0, borderRadius: 44 }}
                >
                  <div className="flex justify-between items-center bg-surface shrink-0 px-5 pt-3 pb-1">
                    <span className="font-body font-semibold text-on-surface" style={{ fontSize: 10 }}>9:41</span>
                    <div className="flex gap-1 items-center">
                      <svg style={{ width: 12, height: 12 }} className="fill-on-surface" viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
                      <svg style={{ width: 14, height: 12 }} className="fill-on-surface" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
                    </div>
                  </div>
                  {s.content}
                </div>

                {/* PNG phone frame — center slide only */}
                {isActive && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/phone-frame.png"
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full pointer-events-none select-none"
                    style={{ mixBlendMode: 'multiply' }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Edge fades — peeks dissolve into background */}
        <div className="absolute left-0 top-0 bottom-0 w-20 pointer-events-none z-20"
          style={{ background: 'linear-gradient(to right, #ffffff 30%, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none z-20"
          style={{ background: 'linear-gradient(to left, #ffffff 30%, transparent)' }} />
      </div>

      {/* ── Dots + label ── */}
      <div className="flex items-center gap-2 mt-5">
        {screens.map((s, i) => (
          <button key={i} onClick={() => goTo(i)} aria-label={`Go to ${s.label}`}
            className={`rounded-full transition-all duration-300 ${i === active ? 'w-6 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-on-surface/20 hover:bg-primary/40'}`} />
        ))}
      </div>
      <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-[0.18em] mt-2.5">
        {screens[active].label}
      </p>
    </div>
  );
}

/* ── Reference photo bubble ── */
function RefPhoto({ delay = 0 }: { delay?: number }) {
  return (
    <div className="flex justify-end" style={{ animation: `msgIn 0.4s ease-out ${delay}s both` }}>
      <div className="rounded-2xl rounded-br-sm overflow-hidden border border-primary/20" style={{ width: 90, height: 110 }}>
        <img
          src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=200&q=70"
          alt="Reference"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-1 right-1 bg-black/40 rounded px-1 py-0.5">
          <p className="font-body text-[7px] text-white">Reference</p>
        </div>
      </div>
    </div>
  );
}

/* ── Hero animated chat ── */
function HeroChat() {
  return (
    <div className="flex-1 overflow-hidden px-3 py-3 flex flex-col gap-2">
      <NiaMsg delay={0.3}>Hi, I&apos;m Oia, your personal surgery concierge. What&apos;s brought you here today?</NiaMsg>
      <TypingDots from="patient" delay={1.0} duration={0.8} />
      <PatientMsg delay={1.7}>I&apos;m researching body contouring and a tummy tuck — after pregnancy and losing weight, my body has changed a lot.</PatientMsg>
      <TypingDots from="nia" delay={2.5} duration={0.9} />
      <NiaMsg delay={3.3}>Skin and tissue changes are simply beyond what training can reach. What would feeling at home in your body look like for you?</NiaMsg>
      <TypingDots from="patient" delay={4.1} duration={0.7} />
      <div className="flex justify-end relative" style={{ animation: `msgIn 0.4s ease-out 4.7s both` }}>
        <div className="rounded-2xl rounded-br-sm overflow-hidden border border-primary/20 relative" style={{ width: 90, height: 110 }}>
          <img src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=200&q=70" alt="Reference" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <p className="absolute bottom-1 left-1.5 font-body text-[7px] text-white/80">Reference photo</p>
        </div>
      </div>
      <PatientMsg delay={5.1}>Something like this. Natural — I don&apos;t want to look &quot;done&quot;.</PatientMsg>
      <TypingDots from="nia" delay={5.8} duration={0.8} />
      <NiaMsg delay={6.5}>Understood. When are you hoping to have your procedure — and would you be open to travelling for the right surgeon?</NiaMsg>
      <TypingDots from="patient" delay={7.3} duration={0.7} />
      <PatientMsg delay={7.9}>Ideally this year. And yes — I&apos;d travel for someone I really trust.</PatientMsg>
      <TypingDots from="nia" delay={8.6} duration={0.9} />
      <NiaMsg delay={9.4}>Perfect. I&apos;m searching verified before-and-afters across our network — surgeons whose real results match yours…</NiaMsg>
      <TypingDots from="nia" delay={10.3} duration={1.0} />
      <NiaMsg delay={11.2}>Found them. 3 body contouring specialists whose actual patients started where you are. Ready to meet your shortlist?</NiaMsg>
      <BeforeAfterCard delay={11.9} />
    </div>
  );
}

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Nav onCTAClick={() => setModalOpen(true)} hideUntilScroll />

      <main className="flex-grow pt-16 bg-white">

        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center px-6 pt-14 pb-0 bg-white overflow-hidden">
          <h1 className="font-display text-[2.6rem] leading-[1.06] sm:text-6xl md:text-7xl text-on-surface max-w-2xl mx-auto mb-5">
            Your treatment,{' '}
            <span className="text-primary italic">managed by Aesthetic&nbsp;Intelligence.</span>
          </h1>
          <p className="font-body text-body-md text-on-surface-variant max-w-sm mx-auto mb-8 leading-relaxed">
            Tell Oia your goals, timeline, and budget. She matches you to an accredited surgeon — available when you are.
          </p>
          <button onClick={() => setModalOpen(true)}
            className="bg-primary text-on-primary px-8 py-4 rounded-lg font-body font-semibold text-label-caps uppercase tracking-widest hover:opacity-90 active:opacity-80 transition-all mb-14">
            Talk to Oia
          </button>

          {/* Carousel — single phone, swipeable screens */}
          <PhoneCarousel />
        </section>

        {/* ── How Oia works ───────────────────────────────────────── */}
        <section className="py-24 md:py-32 bg-surface-container-low">
          <div className="max-w-3xl mx-auto px-6 text-center mb-16">
            <span className="font-body text-label-caps text-primary uppercase tracking-[0.2em] block mb-4">How it works</span>
            <h2 className="font-display text-3xl md:text-5xl text-on-surface">Simple conversations.<br />Life-changing results.</h2>
          </div>

          <div className="max-w-5xl mx-auto px-6 space-y-28 md:space-y-36">

            {/* Step 1 — Goals + before/after */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
              <div className="md:w-1/2 text-center md:text-left order-2 md:order-1">
                <span className="font-body text-[11px] text-primary uppercase tracking-[0.2em] font-semibold block mb-4">01</span>
                <h3 className="font-display text-3xl md:text-4xl text-on-surface mb-5">Tell Oia your goals</h3>
                <p className="font-body text-body-md text-on-surface-variant leading-relaxed max-w-md">
                  No forms. Just talk — about what you want, your timeline, your budget. Oia pulls before/after cases that match your goals so you can see what&apos;s realistic.
                </p>
              </div>
              <div className="md:w-1/2 flex justify-center order-1 md:order-2">
                <PhoneFrame>
                  <ChatHeader />
                  <div className="flex-1 overflow-hidden px-3 py-3 flex flex-col gap-2">
                    <NiaMsg delay={0.2}>Hi! What are you hoping to achieve?</NiaMsg>
                    <TypingDots from="patient" delay={0.8} duration={0.7} />
                    <PatientMsg delay={1.4}>I&apos;ve had two kids and I feel great! I&apos;d just love a tummy tuck and a bit of contouring. Purely for my own confidence.</PatientMsg>
                    <TypingDots from="nia" delay={2.1} duration={0.7} />
                    <NiaMsg delay={2.7}>And that&apos;s the best reason of all — doing this for you. A tummy tuck with gentle contouring is one of the most rewarding journeys we plan. Here&apos;s what our surgeons achieve:</NiaMsg>
                    {/* Consent-first results card — body imagery stays private, and that IS the product */}
                    <div className="ml-7" style={{ animation: 'msgIn 0.4s ease-out 3.1s both' }}>
                      <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">
                        <div className="px-3 py-2.5 flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 text-primary"><IcLock size={16} /></div>
                          <div className="flex-1">
                            <p className="font-body text-[10px] font-semibold text-on-surface">Body-contouring results</p>
                            <p className="font-body text-[8.5px] text-on-surface-variant leading-snug mt-0.5">Shared privately in your consultation — every photo consent-signed by the patient.</p>
                          </div>
                        </div>
                        <div className="px-3 pb-2.5">
                          <div className="bg-primary rounded-lg py-1.5 text-center">
                            <p className="font-body text-[9px] font-semibold text-on-primary">View in consultation</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <TypingDots from="nia" delay={3.8} duration={0.6} />
                    <NiaMsg delay={4.3}>What&apos;s your rough budget and when could you travel?</NiaMsg>
                    <TypingDots from="patient" delay={5.0} duration={0.6} />
                    <PatientMsg delay={5.5}>Around £8–11k. Summer works — kids will be at their dad&apos;s.</PatientMsg>
                  </div>
                </PhoneFrame>
              </div>
            </div>

            {/* Step 2 — Clinic matching */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
              <div className="md:w-1/2 flex justify-center">
                <PhoneFrame>
                  <ChatHeader />
                  <div className="flex-1 overflow-hidden px-3 py-3 flex flex-col gap-2">
                    <NiaMsg delay={0.2}>Perfect. I&apos;ve matched you across Istanbul, Athens and Madrid — all within your budget. From June 22nd?</NiaMsg>
                    <TypingDots from="patient" delay={0.9} duration={0.6} />
                    <PatientMsg delay={1.4}>Yes! June 22nd is perfect.</PatientMsg>
                    <TypingDots from="nia" delay={2.0} duration={0.7} />
                    <NiaMsg delay={2.6}>Here&apos;s your top match — accredited, 1,200+ body contouring cases:</NiaMsg>
                    <ClinicCard delay={3.0} />
                    <TypingDots from="nia" delay={3.7} duration={0.6} />
                    <NiaMsg delay={4.2}>I can also show you local options with real prices, so you can compare properly. Want your coordinator to hold this date?</NiaMsg>
                    <TypingDots from="patient" delay={4.9} duration={0.6} />
                    <PatientMsg delay={5.4}>Yes — please hold it! 🙏</PatientMsg>
                  </div>
                </PhoneFrame>
              </div>
              <div className="md:w-1/2 text-center md:text-left">
                <span className="font-body text-[11px] text-primary uppercase tracking-[0.2em] font-semibold block mb-4">02</span>
                <h3 className="font-display text-3xl md:text-4xl text-on-surface mb-5">She finds your clinic</h3>
                <p className="font-body text-body-md text-on-surface-variant leading-relaxed max-w-md">
                  Oia filters by accreditation, your budget, real patient reviews, and surgeon availability — then shows you every option side by side, local and global, with real prices for each. Stay close to home or travel for the right surgeon. The choice is always yours.
                </p>
              </div>
            </div>

            {/* Step 3 — Itinerary */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
              <div className="md:w-1/2 text-center md:text-left order-2 md:order-1">
                <span className="font-body text-[11px] text-primary uppercase tracking-[0.2em] font-semibold block mb-4">03</span>
                <h3 className="font-display text-3xl md:text-4xl text-on-surface mb-5">Your trip, planned for you</h3>
                <p className="font-body text-body-md text-on-surface-variant leading-relaxed max-w-md">
                  Your coordinator handles flights, hotel, transfers, pre-op tests, and aftercare — all in one itinerary. You just show up.
                </p>
              </div>
              <div className="md:w-1/2 flex justify-center order-1 md:order-2">
                <PhoneFrame>
                  <ItineraryScreen />
                </PhoneFrame>
              </div>
            </div>

            {/* Step 4 — Surgery Shop */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
              <div className="md:w-1/2 text-center md:text-left order-2 md:order-1">
                <span className="font-body text-[11px] text-primary uppercase tracking-[0.2em] font-semibold block mb-4">04</span>
                <h3 className="font-display text-3xl md:text-4xl text-on-surface mb-5">Your recovery kit, delivered</h3>
                <p className="font-body text-body-md text-on-surface-variant leading-relaxed max-w-md">
                  Oia curates everything you need — compression garments, scar treatment, supplements — selected by your surgeon and shipped to your hotel before you arrive. Nothing to think about.
                </p>
              </div>
              <div className="md:w-1/2 flex justify-center order-1 md:order-2">
                <PhoneFrame>
                  <SurgeryShopScreen />
                </PhoneFrame>
              </div>
            </div>

            {/* Step 5 — Post-op */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
              <div className="md:w-1/2 flex justify-center">
                <PhoneFrame>
                  <PostOpScreen />
                </PhoneFrame>
              </div>
              <div className="md:w-1/2 text-center md:text-left">
                <span className="font-body text-[11px] text-primary uppercase tracking-[0.2em] font-semibold block mb-4">05</span>
                <h3 className="font-display text-3xl md:text-4xl text-on-surface mb-5">Oia stays with you after</h3>
                <p className="font-body text-body-md text-on-surface-variant leading-relaxed max-w-md">
                  Daily post-op check-ins, symptom tracking, and direct access to your surgical team — all through the same chat. Recovery, managed.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ── Social proof ─────────────────────────────────────────── */}
        <section className="py-20 md:py-28 bg-surface px-6">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <h2 className="font-display text-3xl md:text-5xl text-on-surface italic">
              &ldquo;I asked Oia things at 2am I would never have said out loud in a consultation room. By the time I flew, there were no surprises left.&rdquo;
            </h2>
            <p className="font-body text-body-sm text-on-surface-variant mt-6 uppercase tracking-widest">— Amara T., Manchester · Post-pregnancy contouring</p>
          </div>
        </section>

        {/* ── Bottom CTA ───────────────────────────────────────────── */}
        <section className="py-20 md:py-28 bg-surface-container-low px-6 text-center">
          <p className="font-body text-label-caps text-primary uppercase tracking-[0.2em] mb-4">Start your journey</p>
          <h2 className="font-display text-3xl md:text-5xl text-on-surface mb-6 max-w-xl mx-auto">
            We&apos;re inviting a limited number of patients to plan their journey with Oia.
          </h2>
          <p className="font-body text-body-md text-on-surface-variant max-w-md mx-auto mb-8">
            Early patients receive special partner discounts and a dedicated concierge — no commitment, just a conversation. Ask Oia if she is available in your country.
          </p>
          <button onClick={() => setModalOpen(true)}
            className="bg-primary text-on-primary px-8 py-4 rounded-lg font-body font-semibold text-label-caps uppercase tracking-widest hover:opacity-90 active:opacity-80 transition-all">
            Talk to Oia
          </button>
          <p className="font-body text-[11px] text-on-surface-variant mt-4 italic opacity-60">Informed, not overwhelmed.</p>
        </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-surface border-t border-outline-variant/30 px-6 py-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <div className="font-display text-xl text-primary mb-2">OIA</div>
            <p className="font-body text-body-sm text-on-surface-variant max-w-xs">AI-matched surgical journeys for the modern woman.</p>
          </div>
          <div className="flex gap-12">
            {[
              { title: 'Explore', links: [['Why Oia', '/why-oia'], ['Careers', '/careers'], ['FAQ', '/faq'], ['News', '/news']] },
              { title: 'Legal', links: [['Privacy Policy', '#'], ['Terms of Service', '#']] },
            ].map(col => (
              <div key={col.title}>
                <h5 className="font-body text-[10px] text-on-surface uppercase tracking-widest font-bold mb-4">{col.title}</h5>
                <ul className="space-y-3">
                  {col.links.map(([label, href]) => (
                    <li key={label}><a href={href} className="font-body text-body-sm text-on-surface-variant hover:text-primary transition-colors">{label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-10 pt-6 border-t border-outline-variant/20">
          <p className="font-body text-[11px] text-on-surface-variant opacity-50">© 2026 Oia Medical Concierge.</p>
        </div>
      </footer>

      {/* ── Floating Oia orb ─────────────────────────────────────── */}
      <div className="nia-orb-wrap fixed bottom-5 right-5 md:bottom-8 md:right-8 z-50" style={{ width: 60, height: 60 }}>
        <button onClick={() => setModalOpen(true)} aria-label="Chat with Oia" className="nia-orb absolute inset-0 rounded-full overflow-hidden active:scale-95" style={{ transform: 'translateZ(0)' }}>
          <span className="absolute inset-0" style={{ background: 'radial-gradient(circle at 44% 40%, rgba(255,249,247,0.35) 0%, rgba(253,218,208,0.28) 40%, rgba(245,185,168,0.18) 70%, rgba(229,142,122,0.08) 100%)', backdropFilter: 'blur(8px) saturate(1.2)', WebkitBackdropFilter: 'blur(8px) saturate(1.2)' }} />
          <span className="nia-core absolute animate-[niaCore_3.6s_ease-in-out_infinite]" style={{ top: '18%', left: '12%', width: '75%', height: '64%', background: 'radial-gradient(ellipse at 42% 52%, rgba(235,90,50,0.45) 0%, rgba(220,68,80,0.3) 32%, rgba(210,55,90,0.12) 58%, transparent 80%)', filter: 'blur(7px)', borderRadius: '50%' }} />
          <span className="nia-sweep absolute animate-[niaSweep_3.6s_ease-in-out_infinite]" style={{ top: '28%', left: '-12%', width: '124%', height: '44%', background: 'radial-gradient(ellipse at 38% 58%, rgba(215,50,95,0.35) 0%, rgba(228,80,60,0.22) 28%, rgba(240,115,65,0.08) 58%, transparent 78%)', filter: 'blur(5px)', borderRadius: '50%' }} />
          <span className="nia-bloom absolute animate-[niaBloom_3.6s_ease-in-out_0.5s_infinite]" style={{ bottom: '2%', left: '8%', width: '84%', height: '58%', background: 'radial-gradient(ellipse at 50% 18%, rgba(240,120,50,0.3) 0%, rgba(228,88,55,0.15) 40%, transparent 70%)', filter: 'blur(8px)', borderRadius: '50%' }} />
          <span className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 0 0 7px rgba(248,195,178,0.12), inset 0 0 0 16px rgba(242,168,150,0.08), inset 0 0 0 26px rgba(235,140,118,0.05)' }} />
          <span className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 50% 50%, transparent 50%, rgba(175,60,50,0.04) 70%, rgba(140,40,40,0.1) 88%, rgba(105,25,25,0.15) 100%)' }} />
          <span className="absolute animate-[niaGloss_3.6s_ease-in-out_infinite]" style={{ top: '5%', left: '8%', width: '50%', height: '36%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.92) 0%, rgba(255,245,240,0.45) 45%, transparent 78%)', filter: 'blur(2px)', borderRadius: '50%' }} />
          <span className="absolute" style={{ top: '9%', left: '16%', width: '17%', height: '12%', background: 'radial-gradient(ellipse, rgba(255,255,255,1) 0%, transparent 80%)', filter: 'blur(0.5px)', borderRadius: '50%' }} />
          <span className="nia-spark absolute inset-0 flex items-center justify-center select-none" style={{ opacity: 0.5, filter: 'drop-shadow(0 0 3px rgba(110,28,18,0.55))', transition: 'opacity 0.4s ease, filter 0.4s ease', zIndex: 10 }}>
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none"><path d="M50 0 C50 0 56 44 100 50 C56 56 50 100 50 100 C50 100 44 56 0 50 C44 44 50 0 50 0Z" fill="#7d2c19" /></svg>
          </span>
        </button>
      </div>

      <style>{`
        @keyframes msgIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes typingDot { 0%,60%,100% { transform:translateY(0); opacity:0.4; } 30% { transform:translateY(-4px); opacity:1; } }
        /* Perpetual gentle typing loop — visible ~3s, resting ~3s */
        @keyframes typingLoop {
          0%, 10%   { opacity:0; transform:translateY(4px); }
          16%, 60%  { opacity:1; transform:translateY(0); }
          66%, 100% { opacity:0; transform:translateY(4px); }
        }
        /* Appear, hold, then disappear — fill-mode:both leaves it at opacity:0 after */
        @keyframes typingBubble {
          0%   { opacity:0; transform:translateY(6px); }
          15%  { opacity:1; transform:translateY(0); }
          75%  { opacity:1; transform:translateY(0); }
          100% { opacity:0; transform:translateY(-2px); }
        }
        @keyframes panelLeft { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes panelRight { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes niaCore { 0%,100% { opacity:0.42; transform:scale(0.86); filter:blur(7px) brightness(0.78); } 40% { opacity:1; transform:scale(1.14); filter:blur(5px) brightness(1.55); } 56% { opacity:0.9; transform:scale(1.09); filter:blur(5px) brightness(1.38); } }
        @keyframes niaSweep { 0%,100% { opacity:0.38; transform:rotate(-3deg) scaleX(0.88) translateY(5px); filter:blur(5px) brightness(0.82); } 42% { opacity:1; transform:rotate(2.5deg) scaleX(1.12) translateY(-7px); filter:blur(4px) brightness(1.5); } 58% { opacity:0.88; transform:rotate(1deg) scaleX(1.07) translateY(-5px); filter:blur(4px) brightness(1.3); } }
        @keyframes niaBloom { 0%,100% { opacity:0.32; transform:translateY(0) scale(0.9); filter:blur(8px); } 48% { opacity:0.88; transform:translateY(-10px) scale(1.12); filter:blur(6px); } }
        @keyframes niaGloss { 0%,100% { opacity:0.82; transform:translate(0,0); } 50% { opacity:1; transform:translate(2px,-2px); } }
        .nia-orb { animation:niaBreath 3.6s ease-in-out infinite; transition:box-shadow 0.3s ease; }
        @keyframes niaBreath { 0%,100% { box-shadow:0 0 18px 4px rgba(215,80,55,0.22),0 6px 24px rgba(0,0,0,0.08); } 45% { box-shadow:0 0 38px 14px rgba(215,70,55,0.48),0 6px 24px rgba(0,0,0,0.12); } }
        .nia-orb-wrap:hover .nia-orb { box-shadow:0 0 55px 20px rgba(210,70,55,0.58),0 8px 30px rgba(0,0,0,0.14) !important; }
        .nia-orb-wrap:hover .nia-core { opacity:1 !important; filter:blur(4px) brightness(1.9) !important; transform:scale(1.16) !important; }
        .nia-orb-wrap:hover .nia-sweep { opacity:1 !important; }
        .nia-orb-wrap:hover .nia-bloom { opacity:0.95 !important; }
        .nia-orb-wrap:hover .nia-spark { opacity:0.88 !important; filter:drop-shadow(0 0 8px rgba(165,50,25,1)) drop-shadow(0 0 18px rgba(255,170,130,0.7)) !important; }
      `}</style>

      <LeadCaptureModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
