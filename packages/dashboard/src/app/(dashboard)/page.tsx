'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import BottomTabNav from '@/components/dashboard/BottomTabNav';
import NotificationDrawer from '@/components/dashboard/NotificationDrawer';

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

type Lead = {
  id: string;
  status: string;
  source: string;
  patientLocation: string | null;
  aiScore: number | null;
  aiPriority: string | null;
  claimedAt: string | null;
  consultation: {
    procedure: { name: string };
    patient: {
      dateOfBirth: string | null;
      user: { name: string; email: string };
    };
  };
};

function calcAge(dob: string | null) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

type PipelineLead = {
  id: string;
  consultation: {
    procedure: { name: string };
    patient: { user: { name: string } };
  };
};

type Pipeline = Record<string, PipelineLead[]>;

type Stats = {
  totalLeads: number; selectedLeads: number; conversionRate: number;
  avgResponseMins: number | null; newLeadsCount: number; conversationsCount: number;
};

const PIPELINE_COLS: { key: string; label: string }[] = [
  { key: 'ENQUIRY', label: 'Enquiry' },
  { key: 'CONSULTATION', label: 'Consultation' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PRE_OP', label: 'Pre-Op' },
  { key: 'POST_OP', label: 'Post-Op' },
];

type TodayBooking = {
  id: string;
  scheduledAt: string;
  status: string;
  consultation: {
    lead: { id: string } | null;
    procedure: { name: string };
    patient: { user: { name: string } };
  };
};

const STATUS_STYLE_ARRIVAL: Record<string, string> = {
  CONFIRMED: 'bg-blue-50 text-blue-700',
  CLEARED: 'bg-green-50 text-green-700',
  ACTION_REQUIRED: 'bg-primary-fixed text-primary',
  REMINDED: 'bg-surface-container text-on-surface-variant',
  RESCHEDULED: 'bg-yellow-50 text-yellow-700',
  CANCELLED: 'bg-error-container text-on-error-container',
};

export default function DiscoverPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipeline, setPipeline] = useState<Pipeline>({});
  const [claiming, setClaiming] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [todayBookings, setTodayBookings] = useState<TodayBooking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const fetchLeads = useCallback(async () => {
    const [leadsRes, pipelineRes] = await Promise.all([
      fetch('/api/leads'),
      fetch('/api/pipeline'),
    ]);
    if (leadsRes.ok) setLeads(await leadsRes.json());
    if (pipelineRes.ok) setPipeline(await pipelineRes.json());
  }, []);

  const fetchNotifications = useCallback(async () => {
    const res = await fetch('/api/notifications');
    if (res.ok) setNotifications(await res.json());
  }, []);

  const markAllRead = useCallback(async () => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchNotifications();
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    fetch(`/api/bookings?date=${dateKey}`).then(r => r.ok ? r.json() : []).then(setTodayBookings);
    fetch('/api/stats').then(r => r.ok ? r.json() : null).then(setStats);
  }, [fetchLeads, fetchNotifications]);

  const claimLead = async (id: string) => {
    setClaiming(id);
    try {
      const res = await fetch(`/api/leads/${id}/claim`, { method: 'POST' });
      if (res.ok) await fetchLeads();
      else console.error('claimLead error', res.status, await res.text());
    } catch (e) {
      console.error('claimLead failed', e);
    } finally {
      setClaiming(null);
    }
  };

  const newLeads = leads.filter(l => l.status === 'NEW');
  const totalPipelineCount = Object.values(pipeline).reduce((s, col) => s + col.length, 0);

  return (
    <div className="min-h-screen bg-surface pb-20 lg:pb-0 lg:min-h-0 lg:h-full lg:flex lg:overflow-hidden">

      {/* ── Mobile header ── */}
      <header className="bg-surface-container-lowest border-b border-outline-variant/20 px-5 py-4 flex items-center justify-between sticky top-0 z-30 lg:hidden">
        <div className="flex items-center gap-3">
          <button className="text-on-surface-variant">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="font-display text-display-sm text-primary tracking-tight">Nia AI</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setDrawerOpen(true)} className="relative text-on-surface-variant">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-on-error text-[9px] font-bold rounded-full flex items-center justify-center">
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </button>
          <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center">
            <span className="font-display text-display-sm text-on-secondary-container">A</span>
          </div>
        </div>
      </header>

      {/* ── Mobile content ── */}
      <div className="lg:hidden px-5 pt-6 space-y-6">
        <div>
          <p className="font-body text-label-caps text-primary uppercase tracking-widest font-semibold">Welcome back, Dr. Aldrich</p>
          <h1 className="font-display text-display-md text-on-surface mt-1">Coordinator Dashboard</h1>
        </div>

        {newLeads.length > 0 && (
          <div className="bg-surface-container-lowest rounded-card2 border border-outline-variant/20 shadow-card p-5">
            <p className="font-body text-label-caps text-primary uppercase tracking-widest font-semibold mb-3">Nia Intelligence Alerts</p>
            <div className="border-l-2 border-primary pl-4 mb-4">
              <p className="font-body text-body-md text-on-surface leading-relaxed">
                New <span className="text-primary font-semibold">{newLeads[0].consultation.procedure.name}</span> enquiry is high priority.
                {newLeads[0].aiScore && ` AI analysis suggests ${newLeads[0].aiScore}% booking intent.`}
              </p>
            </div>
            <Link href="/concierge">
              <button className="w-full bg-primary text-on-primary py-3 rounded-lg font-body text-label-caps uppercase tracking-widest font-semibold hover:opacity-90 transition-all">
                View Actionable Leads
              </button>
            </Link>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-display-sm text-on-surface">Task Queue</h2>
            {newLeads.length > 0 && (
              <span className="bg-primary-fixed text-primary px-3 py-1 rounded-full font-body text-[10px] font-semibold uppercase tracking-wider">
                {newLeads.length} New Lead{newLeads.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {newLeads.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-card2 border-2 border-dashed border-outline-variant/30 p-8 text-center">
              <p className="font-body text-body-sm text-on-surface-variant">No new leads right now</p>
            </div>
          ) : (
            <div className="space-y-3">
              {newLeads.map(lead => (
                <div key={lead.id} className="bg-surface-container-lowest rounded-card2 border border-outline-variant/20 shadow-card p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="font-body font-semibold text-on-surface">{lead.consultation.procedure.name}</p>
                      <p className="font-body text-body-sm text-on-surface-variant">
                        {lead.patientLocation}
                        {lead.consultation.patient.dateOfBirth && ` · Age ${calcAge(lead.consultation.patient.dateOfBirth)}`}
                      </p>
                    </div>
                    <span className="bg-primary-fixed text-primary px-2 py-0.5 rounded font-body text-[10px] font-semibold uppercase tracking-wider">New</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => claimLead(lead.id)}
                      disabled={claiming === lead.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-lg font-body text-label-caps uppercase tracking-wider font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {claiming === lead.id ? 'Claiming…' : 'Claim Lead'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pipeline */}
        {totalPipelineCount > 0 && (
          <div>
            <h2 className="font-display text-display-sm text-on-surface mb-4">Patient Pipeline</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {PIPELINE_COLS.map(({ key, label }) => {
                const patients = pipeline[key] ?? [];
                return (
                  <div key={key} className="bg-surface-container-low rounded-card2 p-4 min-w-[200px] shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-body text-label-caps text-on-surface-variant uppercase tracking-widest font-semibold">{label}</span>
                      <div className={`w-2 h-2 rounded-full ${patients.length > 0 ? 'bg-primary' : 'bg-outline-variant'}`} />
                    </div>
                    {patients.length === 0 ? (
                      <div className="h-12 rounded-lg border-2 border-dashed border-outline-variant/30 flex items-center justify-center">
                        <span className="font-body text-[10px] text-on-surface-variant/40">Empty</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {patients.map(p => (
                          <Link key={p.id} href={`/concierge/${p.id}`}>
                            <div className="bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/20 cursor-pointer hover:border-primary/30 transition-all">
                              <p className="font-body font-semibold text-on-surface text-body-sm">{p.consultation.patient.user.name}</p>
                              <p className="font-body text-[11px] text-on-surface-variant">{p.consultation.procedure.name}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-low rounded-card2 p-5 border border-outline-variant/10">
            <p className="font-body text-label-caps text-on-surface-variant uppercase tracking-widest font-semibold">Response Time</p>
            <p className="font-display text-display-md text-on-surface mt-1">{stats?.avgResponseMins != null ? `${stats.avgResponseMins}m` : '—'}</p>
            <p className="font-body text-[11px] text-on-surface-variant mt-0.5">avg to claim</p>
          </div>
          <div className="bg-surface-container-low rounded-card2 p-5 border border-outline-variant/10">
            <p className="font-body text-label-caps text-on-surface-variant uppercase tracking-widest font-semibold">Conversion</p>
            <p className="font-display text-display-md text-on-surface mt-1">{stats != null ? `${stats.conversionRate}%` : '—'}</p>
            <p className="font-body text-[11px] text-on-surface-variant mt-0.5">lead → selected</p>
          </div>
        </div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden lg:flex lg:flex-1 lg:overflow-hidden">
        {/* Main column */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Task Queue */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-display-sm text-on-surface">Task Queue</h2>
              {newLeads.length > 0 && (
                <span className="bg-primary-fixed text-primary px-3 py-1 rounded-full font-body text-[10px] font-semibold uppercase tracking-wider">
                  {newLeads.length} New Lead{newLeads.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {newLeads.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-card2 border-2 border-dashed border-outline-variant/30 p-10 text-center">
                <p className="font-body text-body-sm text-on-surface-variant">No new leads — all clear</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {newLeads.map(lead => (
                  <div key={lead.id} className="bg-surface-container-lowest rounded-card2 border border-outline-variant/20 shadow-card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-body font-semibold text-on-surface">{lead.consultation.procedure.name}</p>
                        <p className="font-body text-body-sm text-on-surface-variant">{lead.patientLocation}</p>
                        {lead.consultation.patient.dateOfBirth && (
                          <p className="font-body text-[11px] text-on-surface-variant">Age {calcAge(lead.consultation.patient.dateOfBirth)}</p>
                        )}
                      </div>
                      <span className="bg-primary-fixed text-primary px-2 py-0.5 rounded font-body text-[10px] font-semibold uppercase tracking-wider">New</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => claimLead(lead.id)}
                        disabled={claiming === lead.id}
                        className="flex-1 bg-primary text-on-primary py-2 rounded-lg font-body text-label-caps uppercase tracking-wider font-semibold hover:opacity-90 transition-all text-[10px] disabled:opacity-50"
                      >
                        {claiming === lead.id ? 'Claiming…' : 'Claim Lead'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Patient Pipeline */}
          <div>
            <h2 className="font-display text-display-sm text-on-surface mb-3">Patient Pipeline</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {PIPELINE_COLS.map(({ key, label }) => {
                const patients = pipeline[key] ?? [];
                return (
                  <div key={key} className="bg-surface-container-low rounded-card2 p-4 min-w-[180px] shrink-0">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold">{label}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${patients.length > 0 ? 'bg-primary' : 'bg-outline-variant'}`} />
                    </div>
                    {patients.length === 0 ? (
                      <div className="h-12 rounded-lg border-2 border-dashed border-outline-variant/30 flex items-center justify-center">
                        <span className="font-body text-[10px] text-on-surface-variant/40">Empty</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {patients.map(p => (
                          <Link key={p.id} href={`/concierge/${p.id}`}>
                            <div className="bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/20 cursor-pointer hover:border-primary/30 transition-all">
                              <p className="font-body font-semibold text-on-surface text-body-sm">{p.consultation.patient.user.name}</p>
                              <p className="font-body text-[11px] text-on-surface-variant">{p.consultation.procedure.name}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <aside className="w-[280px] shrink-0 border-l border-outline-variant/20 bg-surface-container-lowest overflow-y-auto p-5 space-y-4">
          {/* Desktop bell */}
          <button onClick={() => setDrawerOpen(true)} className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-surface-container-low transition-colors">
            <span className="font-body text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Notifications</span>
            <div className="relative">
              <svg className="w-5 h-5 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-error text-on-error text-[8px] font-bold rounded-full flex items-center justify-center">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </div>
          </button>
          {/* NIA Alert */}
          {newLeads.length > 0 && (
            <div className="bg-surface rounded-card2 border border-outline-variant/20 p-4">
              <p className="font-body text-[9px] text-primary uppercase tracking-widest font-semibold mb-3">⚡ Nia Intelligence</p>
              <div className="border-l-2 border-primary pl-3 mb-3">
                <p className="font-body text-body-sm text-on-surface leading-relaxed">
                  New <span className="text-primary font-semibold">{newLeads[0].consultation.procedure.name}</span> enquiry is{' '}
                  <span className="text-primary font-semibold">high priority</span>.
                  {newLeads[0].aiScore && ` AI analysis suggests ${newLeads[0].aiScore}% booking intent.`}
                </p>
              </div>
              <Link href="/concierge">
                <button className="w-full bg-primary text-on-primary py-2.5 rounded-lg font-body text-[10px] uppercase tracking-widest font-semibold hover:opacity-90 transition-all">
                  View Actionable Leads
                </button>
              </Link>
            </div>
          )}

          {/* Today's Arrivals */}
          <div className="bg-surface rounded-card2 border border-outline-variant/20 p-4">
            <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider font-semibold mb-3">
              Today&apos;s Arrivals {todayBookings.length > 0 && <span className="text-primary">· {todayBookings.length}</span>}
            </p>
            {todayBookings.length === 0 ? (
              <p className="font-body text-[11px] text-on-surface-variant/60 italic">No bookings today</p>
            ) : (
              <div className="space-y-3">
                {todayBookings.map(b => {
                  const name = b.consultation.patient.user.name;
                  const initial = name.trim()[0]?.toUpperCase() ?? '?';
                  const time = new Date(b.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  const statusStyle = STATUS_STYLE_ARRIVAL[b.status] ?? 'bg-surface-container text-on-surface-variant';
                  const leadId = b.consultation.lead?.id;
                  const inner = (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                        <span className="font-body text-xs font-semibold text-on-secondary-container">{initial}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-semibold text-on-surface truncate">{name}</p>
                        <p className="font-body text-[10px] text-on-surface-variant">{time} · {b.consultation.procedure.name}</p>
                      </div>
                      <span className={`font-body text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full whitespace-nowrap ${statusStyle}`}>
                        {b.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  );
                  return leadId ? (
                    <Link key={b.id} href={`/concierge/${leadId}`} className="block hover:opacity-70 transition-opacity">
                      {inner}
                    </Link>
                  ) : (
                    <div key={b.id}>{inner}</div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/10">
              <p className="font-body text-[8px] text-on-surface-variant uppercase tracking-widest font-semibold">Response Time</p>
              <p className="font-display text-xl text-on-surface mt-1">{stats?.avgResponseMins != null ? `${stats.avgResponseMins}m` : '—'}</p>
              <p className="font-body text-[9px] text-on-surface-variant">avg to claim</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/10">
              <p className="font-body text-[8px] text-on-surface-variant uppercase tracking-widest font-semibold">Conversion</p>
              <p className="font-display text-xl text-on-surface mt-1">{stats != null ? `${stats.conversionRate}%` : '—'}</p>
              <p className="font-body text-[9px] text-on-surface-variant">lead → selected</p>
            </div>
          </div>
        </aside>
      </div>

      <BottomTabNav />

      <NotificationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        notifications={notifications}
        onMarkAllRead={markAllRead}
      />
    </div>
  );
}
