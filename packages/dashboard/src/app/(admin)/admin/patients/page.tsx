'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Lead = {
  id: string; status: string; aiScore: number | null; aiPriority: string | null;
  medicalScreening: unknown; patientSelectedAt: string | null; createdAt: string;
};

type Consultation = {
  id: string; status: string; createdAt: string;
  procedure: { name: string }; clinic: { name: string }; lead: Lead | null;
};

type Patient = {
  id: string; dateOfBirth: string | null; countryOfResidence: string | null;
  preferredLanguage: string | null; whatsappNumber: string | null; createdAt: string;
  user: { name: string; email: string; phone: string | null };
  consultations: Consultation[];
  isComplete: boolean; leadCount: number;
};

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

const PRIORITY_DOT: Record<string, string> = { High: 'bg-red-500', Medium: 'bg-yellow-400', Low: 'bg-green-500' };

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'complete' | 'incomplete'>('all');

  useEffect(() => {
    fetch('/api/admin/patients').then(r => r.ok ? r.json() : []).then(setPatients).finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p => {
    const matchSearch = search === '' ||
      p.user.name.toLowerCase().includes(search.toLowerCase()) ||
      p.user.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.whatsappNumber ?? '').includes(search);
    const matchFilter =
      filter === 'all' ? true :
      filter === 'complete' ? p.isComplete :
      !p.isComplete;
    return matchSearch && matchFilter;
  });

  const complete = patients.filter(p => p.isComplete).length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 py-5 border-b border-white/8 shrink-0">
        <h1 className="font-display text-2xl text-white">Patients</h1>
        <p className="font-body text-[11px] text-white/40 mt-0.5">
          {patients.length} total · {complete} complete · {patients.length - complete} incomplete
        </p>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-white/8 flex items-center gap-3 shrink-0">
        <input
          type="text"
          placeholder="Search name, email or WhatsApp…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 text-white text-[11px] font-body rounded-lg px-3 py-2 placeholder:text-white/20 focus:outline-none focus:border-primary"
        />
        <div className="flex gap-1">
          {(['all', 'complete', 'incomplete'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg font-body text-[9px] font-semibold uppercase tracking-wider transition-all ${
                filter === f ? 'bg-primary text-on-primary' : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
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
                {['Patient', 'Contact', 'Profile', 'Leads', 'Top Lead', 'Joined'].map(h => (
                  <th key={h} className="px-4 py-3 font-body text-[9px] text-white/30 uppercase tracking-widest font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const allLeads = p.consultations.flatMap(c => c.lead ? [{ ...c.lead, procedure: c.procedure.name, clinic: c.clinic.name }] : []);
                const topLead = allLeads[0] ?? null;
                const selectedLead = allLeads.find(l => l.patientSelectedAt);

                return (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.isComplete ? 'bg-green-400' : 'bg-yellow-400'}`} />
                        <div>
                          <p className="font-body text-sm font-semibold text-white">{p.user.name}</p>
                          <p className="font-body text-[9px] text-white/40">{p.countryOfResidence ?? '—'} · {p.preferredLanguage ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-body text-[10px] text-white/60">{p.user.email}</p>
                      {p.whatsappNumber && <p className="font-body text-[9px] text-white/30">{p.whatsappNumber}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {p.isComplete ? (
                        <span className="font-body text-[8px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">Complete</span>
                      ) : (
                        <div>
                          <span className="font-body text-[8px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">Incomplete</span>
                          <p className="font-body text-[8px] text-white/20 mt-1">
                            {[
                              !p.dateOfBirth && 'DOB',
                              !p.countryOfResidence && 'Country',
                              !p.preferredLanguage && 'Language',
                            ].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-body text-sm font-semibold text-white">{p.leadCount}</p>
                      {selectedLead && (
                        <p className="font-body text-[9px] text-green-400 truncate max-w-[100px]">✓ {selectedLead.clinic}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {topLead ? (
                        <Link href={`/admin/leads/${topLead.id}`} className="group">
                          <div className="flex items-center gap-1.5">
                            {topLead.aiPriority && <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[topLead.aiPriority] ?? 'bg-white/20'}`} />}
                            <p className="font-body text-[10px] text-white/60 group-hover:text-white transition-colors">{topLead.procedure}</p>
                          </div>
                          <p className="font-body text-[9px] text-white/30">{topLead.status.replace(/_/g,' ')}{topLead.aiScore !== null ? ` · ${topLead.aiScore}%` : ''}</p>
                        </Link>
                      ) : (
                        <span className="text-white/20 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-body text-[10px] text-white/40">{timeAgo(p.createdAt)}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="flex items-center justify-center h-48">
            <p className="font-body text-white/40">No patients match your filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
