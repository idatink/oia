'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

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

const TYPE_ICON: Record<string, { bg: string; icon: React.ReactNode }> = {
  'lead.new': {
    bg: 'bg-primary-fixed',
    icon: (
      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
      </svg>
    ),
  },
  'insight.alert': {
    bg: 'bg-on-surface',
    icon: (
      <svg className="w-4 h-4 text-primary-fixed" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
};

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function linkForNotification(n: Notification): string | null {
  if (n.entityType === 'Lead' && n.entityId) return `/concierge/${n.entityId}`;
  return null;
}

export default function NotificationDrawer({
  open,
  onClose,
  notifications,
  onMarkAllRead,
}: {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAllRead: () => void;
}) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-on-surface/20 transition-opacity duration-200 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-[340px] max-w-full z-50 bg-surface-container-lowest border-l border-outline-variant/20 shadow-2xl flex flex-col transition-transform duration-250 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-display text-display-sm text-on-surface">Notifications</h2>
            {unreadCount > 0 && (
              <p className="font-body text-[11px] text-on-surface-variant mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="font-body text-[11px] text-primary font-semibold hover:opacity-70 transition-opacity"
              >
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <svg className="w-8 h-8 text-outline-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <p className="font-body text-body-sm text-on-surface-variant">All clear</p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/10">
              {notifications.map(n => {
                const iconDef = TYPE_ICON[n.type] ?? TYPE_ICON['lead.new'];
                const href = linkForNotification(n);
                const inner = (
                  <div className={`flex items-start gap-3 px-5 py-4 transition-colors hover:bg-surface-container-low ${!n.isRead ? 'bg-primary-fixed/20' : ''}`}>
                    <div className={`w-8 h-8 rounded-full ${iconDef.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      {iconDef.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-body text-sm leading-snug ${!n.isRead ? 'font-semibold text-on-surface' : 'text-on-surface'}`}>
                          {n.title}
                        </p>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                      </div>
                      {n.body && (
                        <p className="font-body text-[11px] text-on-surface-variant mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                      )}
                      <p className="font-body text-[10px] text-on-surface-variant/60 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                );

                return href ? (
                  <Link key={n.id} href={href} onClick={onClose}>
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
