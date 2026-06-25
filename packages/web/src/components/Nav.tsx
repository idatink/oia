'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface NavProps {
  onCTAClick: () => void;
}

export default function Nav({ onCTAClick }: NavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`w-full fixed top-0 z-50 transition-all duration-300 border-b border-outline-variant/10 nav-blur bg-surface/80 ${scrolled ? 'shadow-card' : ''}`}>
      <div className="flex justify-between items-center w-full px-[64px] max-w-container mx-auto h-16">
        <Link href="/" className="font-display text-display-sm text-primary tracking-tight">
          Nia Medical Concierge
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {[
            { label: 'Treatments', href: '/treatments' },
            { label: 'The Nia Way', href: '/about' },
            { label: 'Clinics', href: '/clinics' },
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="font-body text-label-caps uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors duration-200"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <button
          onClick={onCTAClick}
          className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-body font-semibold text-label-caps uppercase tracking-widest hover:opacity-90 active:opacity-80 transition-all"
        >
          AI Concierge
        </button>
      </div>
    </nav>
  );
}
