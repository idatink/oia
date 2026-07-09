'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface NavProps {
  onCTAClick: () => void;
  /** Homepage: keep the nav invisible on the first fold, fade it in on scroll */
  hideUntilScroll?: boolean;
}

const NAV_LINKS = [
  { label: 'Why Oia', href: '/why-oia' },
  { label: 'Careers', href: '/careers' },
  { label: 'FAQ', href: '/faq' },
  { label: 'News', href: '/news' },
];

export default function Nav({ onCTAClick, hideUntilScroll = false }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [pastFold, setPastFold] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 20);
      setPastFold(window.scrollY > window.innerHeight * 0.55);
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    // rAF fallback — some environments move scrollY without firing scroll events;
    // React bails out when state is unchanged, so this is effectively free.
    let raf = 0;
    const loop = () => { handler(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener('scroll', handler); cancelAnimationFrame(raf); };
  }, []);

  const navHidden = hideUntilScroll && !pastFold;

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  return (
    <>
      <nav className={`w-full fixed top-0 z-50 transition-all duration-500 border-b border-outline-variant/10 nav-blur bg-surface/80 ${scrolled ? 'shadow-card' : ''} ${navHidden ? 'opacity-0 -translate-y-3 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
        <div className="flex justify-between items-center w-full px-6 md:px-[64px] max-w-container mx-auto h-16">

          {/* Logo */}
          <Link href="/" className="text-primary select-none" style={{ fontFamily: 'var(--font-cinzel), serif', fontSize: '1.25rem', fontWeight: 600, letterSpacing: '0.22em' }}>
            OIA
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map(item => (
              <Link
                key={item.label}
                href={item.href}
                className="font-body text-label-caps uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <button
            onClick={onCTAClick}
            className="hidden md:block bg-primary text-on-primary px-6 py-2.5 rounded-lg font-body font-semibold text-label-caps uppercase tracking-widest hover:opacity-90 active:opacity-80 transition-all"
          >
            Ask Oia
          </button>

          {/* Mobile: Ask Oia + burger */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={onCTAClick}
              className="bg-primary text-on-primary px-4 py-2 rounded-lg font-body font-semibold text-[10px] uppercase tracking-widest"
            >
              Ask Oia
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="w-9 h-9 flex flex-col items-center justify-center gap-[5px]"
            >
              <span className="w-5 h-px bg-on-surface block" />
              <span className="w-5 h-px bg-on-surface block" />
              <span className="w-3.5 h-px bg-on-surface block self-start" />
            </button>
          </div>
        </div>
      </nav>

      {/* Slide-in drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Scrim */}
          <div
            className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer panel */}
          <div className="absolute top-0 left-0 h-full w-[72vw] max-w-[300px] bg-surface-container-lowest shadow-float flex flex-col pt-20 pb-10 px-8 animate-[drawerSlide_0.25s_ease-out]">
            {/* Close */}
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-on-surface-variant"
              aria-label="Close menu"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M1 1l16 16M17 1L1 17" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Logo inside drawer */}
            <span className="text-primary mb-10 select-none" style={{ fontFamily: 'var(--font-cinzel), serif', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.22em' }}>
              OIA
            </span>

            <nav className="flex flex-col gap-7">
              {NAV_LINKS.map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className="font-body text-label-caps uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors text-sm"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto">
              <button
                onClick={() => { setDrawerOpen(false); onCTAClick(); }}
                className="w-full bg-primary text-on-primary py-3 rounded-lg font-body font-semibold text-label-caps uppercase tracking-widest"
              >
                Ask Oia
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes drawerSlide {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;600&display=swap');
      ` }} />
    </>
  );
}
