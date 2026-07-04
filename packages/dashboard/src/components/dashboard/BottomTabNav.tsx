'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  {
    label: 'Discover',
    href: '/',
    icon: (a: boolean) => (
      <svg className={`w-6 h-6 ${a ? 'text-primary' : 'text-on-surface-variant'}`} fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/>
      </svg>
    ),
  },
  {
    label: 'Concierge',
    href: '/concierge',
    icon: (a: boolean) => (
      <svg className={`w-6 h-6 ${a ? 'text-primary' : 'text-on-surface-variant'}`} fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
      </svg>
    ),
  },
  {
    label: 'Bookings',
    href: '/bookings',
    icon: (a: boolean) => (
      <svg className={`w-6 h-6 ${a ? 'text-primary' : 'text-on-surface-variant'}`} fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: (a: boolean) => (
      <svg className={`w-6 h-6 ${a ? 'text-primary' : 'text-on-surface-variant'}`} fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
      </svg>
    ),
  },
];

export default function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest border-t border-outline-variant/30">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map(tab => {
          const active = pathname === tab.href;
          return (
            <Link key={tab.href} href={tab.href} className="flex flex-col items-center gap-1 flex-1 py-2">
              {tab.icon(active)}
              <span className={`font-body text-[10px] font-semibold uppercase tracking-wider ${active ? 'text-primary' : 'text-on-surface-variant'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
