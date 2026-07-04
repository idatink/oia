'use client';

import { useEffect, useState } from 'react';

type Analytics = {
  totalLeads: number; totalClinics: number; totalPatients: number;
  selectedLeads: number; conversionRate: number;
  avgOfferPrice: number; totalOffersSent: number; totalRevenue: number;
  leadsByStatus: { status: string; count: number }[];
  byDay: { date: string; leads: number; selected: number }[];
};

const STATUS_COLOR: Record<string, string> = {
  NEW: '#7C9AF5', CLAIMED: '#A78BFA', OFFER_SENT: '#FCD34D',
  SELECTED: '#34D399', IN_PROGRESS: '#60A5FA', ESCALATED: '#F87171', CLOSED: '#6B7280',
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics').then(r => r.ok ? r.json() : null).then(setData);
  }, []);

  if (!data) return (
    <div className="h-full flex items-center justify-center">
      <p className="font-body text-white/40">Loading analytics…</p>
    </div>
  );

  const maxLeads = Math.max(...data.byDay.map(d => d.leads), 1);

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-5 border-b border-white/8">
        <h1 className="font-display text-2xl text-white">Analytics</h1>
        <p className="font-body text-[11px] text-white/40 mt-0.5">Platform-wide metrics</p>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Leads', value: data.totalLeads, sub: 'all time' },
            { label: 'Active Clinics', value: data.totalClinics, sub: 'registered' },
            { label: 'Conversion Rate', value: `${data.conversionRate}%`, sub: 'lead → selected' },
            { label: 'Avg Offer Price', value: data.avgOfferPrice ? `€${data.avgOfferPrice.toLocaleString()}` : '—', sub: 'per lead' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-white/5 border border-white/8 rounded-2xl p-5">
              <p className="font-body text-[9px] text-white/30 uppercase tracking-widest">{label}</p>
              <p className="font-display text-3xl text-white mt-1">{value}</p>
              <p className="font-body text-[10px] text-white/30 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Lead volume chart */}
          <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
            <p className="font-body text-[9px] text-white/30 uppercase tracking-widest font-semibold mb-4">Lead Volume · Last 30 Days</p>
            {data.byDay.length === 0 ? (
              <p className="font-body text-white/20 text-sm text-center py-8">No data yet</p>
            ) : (
              <div className="flex items-end gap-1 h-32">
                {data.byDay.map(d => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                    <div
                      className="w-full bg-primary/30 rounded-t-sm relative overflow-hidden"
                      style={{ height: `${(d.leads / maxLeads) * 100}%`, minHeight: '2px' }}
                    >
                      {d.selected > 0 && (
                        <div
                          className="absolute bottom-0 w-full bg-green-400/60 rounded-t-sm"
                          style={{ height: `${(d.selected / d.leads) * 100}%` }}
                        />
                      )}
                    </div>
                    <div className="absolute bottom-full mb-1 bg-on-surface text-inverse-on-surface px-2 py-1 rounded font-body text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                      {d.date}: {d.leads} leads, {d.selected} selected
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5"><div className="w-3 h-2 bg-primary/30 rounded-sm"/><span className="font-body text-[9px] text-white/40">Leads</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-2 bg-green-400/60 rounded-sm"/><span className="font-body text-[9px] text-white/40">Selected</span></div>
            </div>
          </div>

          {/* Status breakdown */}
          <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
            <p className="font-body text-[9px] text-white/30 uppercase tracking-widest font-semibold mb-4">Leads by Status</p>
            <div className="space-y-3">
              {data.leadsByStatus.sort((a,b) => b.count - a.count).map(({ status, count }) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="font-body text-[9px] font-semibold w-24 shrink-0" style={{ color: STATUS_COLOR[status] ?? '#fff' }}>
                    {status.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(count / data.totalLeads) * 100}%`, backgroundColor: STATUS_COLOR[status] ?? '#fff' }} />
                  </div>
                  <span className="font-display text-sm text-white w-6 text-right shrink-0">{count}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-white/8 grid grid-cols-2 gap-4">
              <div>
                <p className="font-body text-[9px] text-white/30 uppercase tracking-wider">Offers Sent</p>
                <p className="font-display text-2xl text-white">{data.totalOffersSent}</p>
              </div>
              <div>
                <p className="font-body text-[9px] text-white/30 uppercase tracking-wider">Total Patients</p>
                <p className="font-display text-2xl text-white">{data.totalPatients}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
