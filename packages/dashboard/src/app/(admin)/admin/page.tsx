'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Lead = {
  id: string; status: string; aiScore: number | null; aiPriority: string | null;
  patientSelectedAt: string | null; createdAt: string;
  consultation: {
    clinic: { id: string; name: string };
    procedure: { name: string };
    additionalProcedureIds: string[];
    patient: { countryOfResidence: string | null; user: { name: string } };
  };
  offers: { totalPrice: number; currency: string }[];
};

const STATUS_COLOR: Record<string, string> = {
  NEW: 'bg-primary-fixed text-primary',
  CLAIMED: 'bg-secondary-container text-on-secondary-container',
  OFFER_SENT: 'bg-yellow-50 text-yellow-700',
  SELECTED: 'bg-green-50 text-green-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  ESCALATED: 'bg-error-container text-error',
  CLOSED: 'bg-surface-container text-on-surface-variant',
};

const PRIORITY_DOT: Record<string, string> = { High: 'bg-red-500', Medium: 'bg-yellow-400', Low: 'bg-green-500' };

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default function AdminPipelinePage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    fetch('/api/admin/pipeline').then(r => r.ok ? r.json() : []).then(setLeads).finally(() => setLoading(false));
  }, []);

  const statuses = ['ALL', 'NEW', 'CLAIMED', 'OFFER_SENT', 'SELECTED', 'IN_PROGRESS', 'ESCALATED', 'CLOSED'];
  const filtered = filter === 'ALL' ? leads : leads.filter(l => l.status === filter);

  const counts: Record<string, number> = {};
  for (const l of leads) counts[l.status] = (counts[l.status] ?? 0) + 1;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/8 shrink-0">
        <h1 className="font-display text-2xl text-white">Patient Pipeline</h1>
        <p className="font-body text-[11px] text-white/40 mt-0.5">All leads across all clinics · {leads.length} total</p>
      </div>

      {/* Status filters */}
      <div className="px-6 py-3 border-b border-white/8 flex gap-2 flex-wrap shrink-0">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full font-body text-[10px] font-semibold transition-all ${
              filter === s ? 'bg-primary text-on-primary' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            {s}{s !== 'ALL' && counts[s] ? ` · ${counts[s]}` : ''}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <p className="font-body text-white/40">Loading…</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="border-b border-white/8 sticky top-0 bg-[#0f1117]">
              <tr>
                {['Patient', 'Clinic', 'Procedure', 'AI Score', 'Status', 'Offer', 'Created'].map(h => (
                  <th key={h} className="px-4 py-3 font-body text-[9px] text-white/30 uppercase tracking-widest font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} onClick={() => router.push(`/admin/leads/${l.id}`)} className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {l.aiPriority && <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[l.aiPriority] ?? 'bg-white/20'}`} />}
                      <div>
                        <p className="font-body text-sm font-semibold text-white">{l.consultation.patient.user.name}</p>
                        <p className="font-body text-[9px] text-white/40">{l.consultation.patient.countryOfResidence ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/clinics`} className="font-body text-[11px] text-white/60 hover:text-white transition-colors">
                      {l.consultation.clinic.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-body text-[11px] text-white/80">
                      {l.consultation.procedure.name}
                      {l.consultation.additionalProcedureIds.length > 0 && (
                        <span className="text-primary-fixed ml-1">+{l.consultation.additionalProcedureIds.length}</span>
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {l.aiScore !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${l.aiScore}%` }} />
                        </div>
                        <span className="font-display text-sm font-bold text-primary-fixed">{l.aiScore}%</span>
                      </div>
                    ) : <span className="text-white/20">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-body text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${STATUS_COLOR[l.status] ?? 'bg-white/10 text-white/50'}`}>
                      {l.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {l.offers.length > 0 ? (
                      <p className="font-body text-[11px] font-semibold text-green-400">
                        {l.offers[0].currency} {l.offers[0].totalPrice.toLocaleString()}
                        {l.offers.length > 1 && <span className="text-white/40 ml-1">+{l.offers.length - 1}</span>}
                      </p>
                    ) : <span className="text-white/20 text-[11px]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-body text-[10px] text-white/40">{timeAgo(l.createdAt)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="flex items-center justify-center h-48">
            <p className="font-body text-white/40">No leads with status {filter}</p>
          </div>
        )}
      </div>
    </div>
  );
}
