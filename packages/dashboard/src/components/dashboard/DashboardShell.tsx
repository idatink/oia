'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import NotificationDrawer from './NotificationDrawer';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
};

const NAV_ITEMS = [
  {
    label: 'Overview',
    href: '/',
    badgeKey: null as null,
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-primary' : 'text-on-surface-variant'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    label: 'Conversations',
    href: '/conversations',
    badgeKey: 'conversations' as const,
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-primary' : 'text-on-surface-variant'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    label: 'Requests',
    href: '/concierge',
    badgeKey: 'newLeads' as const,
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-primary' : 'text-on-surface-variant'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    label: 'Bookings',
    href: '/bookings',
    badgeKey: null as null,
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-primary' : 'text-on-surface-variant'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [coordinatorName, setCoordinatorName] = useState('Coordinator');
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [conversationsCount, setConversationsCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    const res = await fetch('/api/notifications');
    if (res.ok) setNotifications(await res.json());
  }, []);

  const markAllRead = useCallback(async () => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(d => { if (d?.name) setCoordinatorName(d.name); });
    fetch('/api/stats').then(r => r.ok ? r.json() : null).then(d => {
      if (d) {
        setNewLeadsCount(d.newLeadsCount ?? 0);
        setConversationsCount(d.conversationsCount ?? 0);
      }
    });
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const pageTitle =
    pathname === '/' ? 'Overview' :
    pathname.startsWith('/conversations') ? 'Conversations' :
    pathname.startsWith('/concierge') ? 'Requests' :
    pathname.startsWith('/bookings') ? 'Bookings' :
    pathname.startsWith('/settings') ? 'Settings' : 'Dashboard';

  const displayName = coordinatorName;
  const nameInitial = displayName.trim()[0]?.toUpperCase() ?? 'C';

  return (
    <div className="lg:flex lg:h-screen lg:overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[220px] shrink-0 bg-surface-container-lowest border-r border-outline-variant/20">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-outline-variant/10">
          <div className="font-display text-lg text-primary italic tracking-tight">Nia AI</div>
          <div className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest mt-0.5">Coordinator Portal</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const badge = item.badgeKey === 'newLeads' ? newLeadsCount : item.badgeKey === 'conversations' ? conversationsCount : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${active ? 'bg-primary-fixed' : 'hover:bg-surface-container-low'}`}
              >
                {item.icon(active)}
                <span className={`font-body text-sm font-semibold flex-1 ${active ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`}>
                  {item.label}
                </span>
                {badge > 0 && (
                  <span className="bg-error text-on-error font-body text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-3 mt-3 border-t border-outline-variant/20">
            <Link
              href="/settings"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${pathname.startsWith('/settings') ? 'bg-primary-fixed' : 'hover:bg-surface-container-low'}`}
            >
              <svg className={`w-5 h-5 ${pathname.startsWith('/settings') ? 'text-primary' : 'text-on-surface-variant'}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className={`font-body text-sm font-semibold ${pathname.startsWith('/settings') ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`}>Settings</span>
            </Link>
          </div>
        </nav>

        {/* Profile footer */}
        <div className="px-4 py-4 border-t border-outline-variant/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
            <span className="font-display text-sm text-on-secondary-container font-semibold">{nameInitial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-body text-sm font-semibold text-on-surface truncate">{displayName}</div>
            <div className="font-body text-[10px] text-on-surface-variant">Coordinator</div>
          </div>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            title="Sign out"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container transition-all shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Desktop main area */}
      <div className="hidden lg:flex lg:flex-col lg:flex-1 lg:overflow-hidden">
        {/* Topbar */}
        <header className="h-14 shrink-0 bg-surface-container-lowest border-b border-outline-variant/20 flex items-center justify-between px-6">
          <div>
            <div className="font-body text-[10px] text-primary uppercase tracking-widest font-semibold">
              Welcome back, {displayName}
            </div>
            <div className="font-display text-base text-on-surface font-semibold leading-tight">
              {pageTitle}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/30 rounded-full px-3 py-1.5">
              <span className="font-display text-sm text-primary font-semibold">12m</span>
              <span className="font-body text-[10px] text-on-surface-variant uppercase tracking-wider">Response Time</span>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/30 rounded-full px-3 py-1.5">
              <span className="font-display text-sm text-primary font-semibold">24%</span>
              <span className="font-body text-[10px] text-on-surface-variant uppercase tracking-wider">Conversion</span>
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-primary transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full border border-surface-container-lowest" />
              )}
            </button>
          </div>
        </header>

        {/* Page content — desktop */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>

      {/* Mobile: full-width content (sidebar hidden, children render normally) */}
      <div className="lg:hidden w-full">
        {children}
      </div>

      <NotificationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        notifications={notifications}
        onMarkAllRead={markAllRead}
      />
    </div>
  );
}
