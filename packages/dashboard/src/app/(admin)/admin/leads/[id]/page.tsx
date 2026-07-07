'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type MedicalScreening = {
  diabetes: boolean; cancerTreatment: boolean; organTransplant: boolean; dvt: boolean;
  pacemaker: boolean; hypertension: boolean; bloodClotting: boolean; heartDisease: boolean;
  thyroidDisorder: boolean; immuneDisorder: boolean; pregnancy: boolean; allergies: boolean;
};

type Offer = {
  id: string; totalPrice: number; currency: string; inclusions: string[];
  notes: string | null; validDays: number; status: string; sentAt: string;
  coordinator: { user: { name: string } };
};

type CompetingLead = {
  id: string; status: string; aiScore: number | null; patientSelectedAt: string | null;
  offers: { totalPrice: number; currency: string; status: string; inclusions: string[] }[];
  consultation: {
    clinic: { id: string; name: string; city: string; country: string };
    procedure: { name: string };
  };
};

type AdminLead = {
  id: string; status: string; source: string; patientLocation: string | null;
  aiScore: number | null; aiRationale: string | null; aiPriority: string | null;
  intent: string | null; scope: string[];
  medicalScreening: MedicalScreening | null; photoUrls: string[];
  claimedAt: string | null; patientSelectedAt: string | null;
  closedAt: string | null; closureOutcome: string | null; departureDate: string | null;
  createdAt: string;
  coordinator: { user: { name: string; email: string } } | null;
  offers: Offer[];
  competingLeads: CompetingLead[];
  consultation: {
    id: string; status: string; preferredDoctorName: string | null;
    procedure: { id: string; name: string; category: string };
    clinic: { id: string; name: string; city: string; country: string };
    patient: {
      id: string; dateOfBirth: string | null; countryOfResidence: string | null;
      preferredLanguage: string | null; whatsappNumber: string | null; nationality: string | null;
      user: { id: string; name: string; email: string; phone: string | null };
    };
  };
};

const MEDICAL_LABELS: [keyof MedicalScreening, string][] = [
  ['diabetes', 'Diabetes'], ['cancerTreatment', 'Cancer Tx'],
  ['organTransplant', 'Organ Transplant'], ['dvt', 'DVT'],
  ['pacemaker', 'Pacemaker'], ['hypertension', 'Hypertension'],
  ['bloodClotting', 'Blood Clotting'], ['heartDisease', 'Heart Disease'],
  ['thyroidDisorder', 'Thyroid'], ['immuneDisorder', 'Immune Disorder'],
  ['pregnancy', 'Pregnancy'], ['allergies', 'Allergies'],
];

const STATUS_OPTIONS = ['NEW', 'CLAIMED', 'OFFER_SENT', 'SELECTED', 'IN_PROGRESS', 'ESCALATED', 'CLOSED'];
const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];
const PRIORITY_COLOR: Record<string, string> = {
  High: 'bg-red-500/20 text-red-400 border-red-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Low: 'bg-green-500/20 text-green-400 border-green-500/30',
};

function calcAge(dob: string | null) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminLeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<AdminLead | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable AI fields
  const [aiScore, setAiScore] = useState(0);
  const [aiPriority, setAiPriority] = useState('Medium');
  const [aiRationale, setAiRationale] = useState('');
  const [aiDirty, setAiDirty] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);

  const [selecting, setSelecting] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/leads/${id}`);
    if (!res.ok) { router.push('/admin'); return; }
    const data: AdminLead = await res.json();
    setLead(data);
    setAiScore(data.aiScore ?? 0);
    setAiPriority(data.aiPriority ?? 'Medium');
    setAiRationale(data.aiRationale ?? '');
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const saveAI = async () => {
    setAiSaving(true);
    try {
      await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiScore, aiPriority, aiRationale }),
      });
      setAiDirty(false);
      load();
    } catch (e) {
      console.error('saveAI failed', e);
    } finally {
      setAiSaving(false);
    }
  };

  const selectClinic = async (leadId: string) => {
    setSelecting(leadId);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectClinic: true }),
      });
      if (!res.ok) console.error('selectClinic error', res.status, await res.text());
      load();
    } catch (e) {
      console.error('selectClinic failed', e);
    } finally {
      setSelecting(null);
    }
  };

  const changeStatus = async (status: string) => {
    setStatusSaving(true);
    try {
      await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      load();
    } catch (e) {
      console.error('changeStatus failed', e);
    } finally {
      setStatusSaving(false);
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <p className="font-body text-white/40">Loading lead…</p>
    </div>
  );

  if (!lead) return null;

  const patient = lead.consultation.patient;
  const age = calcAge(patient.dateOfBirth);
  const isComplete = Boolean(
    patient.dateOfBirth && patient.countryOfResidence && patient.preferredLanguage &&
    lead.aiScore !== null && lead.medicalScreening !== null
  );

  const thisClinicOffer = lead.offers[0] ?? null;
  const allClinics = [
    {
      leadId: lead.id,
      clinic: lead.consultation.clinic,
      offer: thisClinicOffer,
      aiScore: lead.aiScore,
      status: lead.status,
      isSelected: !!lead.patientSelectedAt,
      isCurrent: true,
    },
    ...lead.competingLeads.map(cl => ({
      leadId: cl.id,
      clinic: cl.consultation.clinic,
      offer: cl.offers[0] ?? null,
      aiScore: cl.aiScore,
      status: cl.status,
      isSelected: !!cl.patientSelectedAt,
      isCurrent: false,
    })),
  ];

  const selectedClinic = allClinics.find(c => c.isSelected);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/8 shrink-0 flex items-center gap-4">
        <Link href="/admin" className="text-white/30 hover:text-white/60 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-xl text-white">{patient.user.name}</h1>
            <span className="font-body text-[9px] font-bold text-white/40 uppercase tracking-wider border border-white/10 px-2 py-0.5 rounded-full">
              {lead.consultation.procedure.name}
            </span>
            {lead.aiPriority && (
              <span className={`font-body text-[9px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-full ${PRIORITY_COLOR[lead.aiPriority] ?? ''}`}>
                {lead.aiPriority}
              </span>
            )}
            {selectedClinic && (
              <span className="font-body text-[9px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                ✓ {selectedClinic.clinic.name} Selected
              </span>
            )}
            {!isComplete && (
              <span className="font-body text-[9px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Profile Incomplete
              </span>
            )}
          </div>
          <p className="font-body text-[10px] text-white/30 mt-0.5">
            Lead {lead.id.slice(-8).toUpperCase()} · {lead.source} · created {formatDate(lead.createdAt)}
          </p>
        </div>

        {/* Status control */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={lead.status}
            disabled={statusSaving}
            onChange={e => changeStatus(e.target.value)}
            className="bg-white/5 border border-white/10 text-white text-[10px] font-body font-semibold rounded-lg px-3 py-2 focus:outline-none focus:border-primary disabled:opacity-40"
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">

          {/* LEFT — Patient profile + medical */}
          <div className="lg:col-span-2 space-y-5">

            {/* Patient profile */}
            <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
              <p className="font-body text-[9px] text-white/30 uppercase tracking-widest font-semibold mb-4">Patient Profile</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  { label: 'Full Name', value: patient.user.name },
                  { label: 'Email', value: patient.user.email },
                  { label: 'Phone', value: patient.user.phone ?? '—' },
                  { label: 'WhatsApp', value: patient.whatsappNumber ?? '—' },
                  { label: 'Date of Birth', value: patient.dateOfBirth ? `${formatDate(patient.dateOfBirth)}${age ? ` (age ${age})` : ''}` : <span className="text-yellow-400/80">Missing</span> },
                  { label: 'Country', value: patient.countryOfResidence ?? <span className="text-yellow-400/80">Missing</span> },
                  { label: 'Language', value: patient.preferredLanguage ?? <span className="text-yellow-400/80">Missing</span> },
                  { label: 'Nationality', value: patient.nationality ?? '—' },
                  { label: 'Location', value: lead.patientLocation ?? '—' },
                  { label: 'Source', value: lead.source },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="font-body text-[9px] text-white/30 uppercase tracking-wider">{label}</p>
                    <p className="font-body text-sm text-white mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {lead.intent && (
                <div className="mt-4 pt-4 border-t border-white/8">
                  <p className="font-body text-[9px] text-white/30 uppercase tracking-wider mb-1">Intent</p>
                  <p className="font-body text-sm text-white/80 italic">"{lead.intent}"</p>
                </div>
              )}

              {lead.scope.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {lead.scope.map((s, i) => (
                    <span key={i} className="font-body text-[9px] text-white/50 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Medical Screening */}
            <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="font-body text-[9px] text-white/30 uppercase tracking-widest font-semibold">Medical Screening</p>
                {!lead.medicalScreening && (
                  <span className="font-body text-[9px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">Not submitted</span>
                )}
              </div>
              {lead.medicalScreening ? (
                <div className="grid grid-cols-3 gap-2">
                  {MEDICAL_LABELS.map(([key, label]) => {
                    const flagged = lead.medicalScreening![key];
                    return (
                      <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${flagged ? 'bg-red-400/10 border-red-400/20' : 'bg-white/3 border-white/5'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${flagged ? 'bg-red-400' : 'bg-white/20'}`} />
                        <span className={`font-body text-[9px] ${flagged ? 'text-red-300 font-semibold' : 'text-white/40'}`}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="font-body text-sm text-white/30 text-center py-4">No screening data submitted yet</p>
              )}
            </div>

            {/* Patient Photos */}
            {lead.photoUrls.length > 0 && (
              <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-body text-[9px] text-white/30 uppercase tracking-widest font-semibold">Treatment Area Photos</p>
                  <span className="font-body text-[9px] text-white/30">{lead.photoUrls.length} photo{lead.photoUrls.length !== 1 ? 's' : ''} · clinical use only</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {lead.photoUrls.map((_url, i) => (
                    <a key={i} href={`/api/leads/${lead.id}/photo?i=${i}`} target="_blank" rel="noopener" className="block relative aspect-square rounded-xl overflow-hidden border border-white/8 hover:border-white/20 transition-all group">
                      <img src={`/api/leads/${lead.id}/photo?i=${i}`} alt={`Treatment area ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <svg className="w-5 h-5 text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis — editable */}
            <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="font-body text-[9px] text-white/30 uppercase tracking-widest font-semibold">AI Suitability Score</p>
                {aiDirty && (
                  <button
                    onClick={saveAI}
                    disabled={aiSaving}
                    className="px-3 py-1 bg-primary text-on-primary font-body text-[9px] font-bold uppercase tracking-wider rounded-lg hover:opacity-90 transition-all disabled:opacity-40"
                  >
                    {aiSaving ? 'Saving…' : 'Save'}
                  </button>
                )}
              </div>

              {/* Score slider */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-body text-[10px] text-white/40">Score</span>
                  <span className={`font-display text-2xl font-bold ${aiScore >= 70 ? 'text-green-400' : aiScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{aiScore}%</span>
                </div>
                <input
                  type="range" min={0} max={100} value={aiScore}
                  onChange={e => { setAiScore(Number(e.target.value)); setAiDirty(true); }}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between font-body text-[8px] text-white/20 mt-1">
                  <span>Low intent</span><span>High intent</span>
                </div>
              </div>

              {/* Priority */}
              <div className="mb-5">
                <p className="font-body text-[9px] text-white/30 uppercase tracking-wider mb-2">Priority</p>
                <div className="flex gap-2">
                  {PRIORITY_OPTIONS.map(p => (
                    <button
                      key={p}
                      onClick={() => { setAiPriority(p); setAiDirty(true); }}
                      className={`flex-1 py-2 rounded-xl font-body text-[10px] font-bold border transition-all ${aiPriority === p ? PRIORITY_COLOR[p] : 'border-white/10 text-white/30 hover:border-white/20 hover:text-white/60'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rationale */}
              <div>
                <p className="font-body text-[9px] text-white/30 uppercase tracking-wider mb-2">Rationale / Notes</p>
                <textarea
                  rows={4}
                  value={aiRationale}
                  onChange={e => { setAiRationale(e.target.value); setAiDirty(true); }}
                  placeholder="Add AI analysis notes, suitability reasoning, risk flags…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-body text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

          </div>

          {/* RIGHT — Clinic selection + offers */}
          <div className="space-y-5">

            {/* Clinic selection panel */}
            <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/8">
                <p className="font-body text-[9px] text-white/30 uppercase tracking-widest font-semibold">Clinic Selection</p>
                <p className="font-body text-[10px] text-white/40 mt-0.5">
                  {selectedClinic ? `Clinic selected · ${selectedClinic.clinic.name}` : `${allClinics.length} clinic${allClinics.length !== 1 ? 's' : ''} competing`}
                </p>
              </div>

              <div className="divide-y divide-white/5">
                {allClinics.map(c => (
                  <div key={c.leadId} className={`p-4 ${c.isSelected ? 'bg-green-400/5' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {c.isSelected && <span className="text-green-400 text-[10px]">✓</span>}
                          <p className="font-body text-sm font-semibold text-white truncate">{c.clinic.name}</p>
                          {c.isCurrent && <span className="font-body text-[8px] text-white/30 border border-white/10 px-1.5 py-0.5 rounded-full">This lead</span>}
                        </div>
                        <p className="font-body text-[9px] text-white/40">{c.clinic.city}, {c.clinic.country}</p>
                        {c.offer ? (
                          <p className="font-body text-sm font-semibold text-green-400 mt-1">
                            {c.offer.currency} {c.offer.totalPrice.toLocaleString()}
                          </p>
                        ) : (
                          <p className="font-body text-[9px] text-white/30 mt-1">No offer submitted</p>
                        )}
                        {c.offer && c.offer.inclusions.length > 0 && (
                          <p className="font-body text-[9px] text-white/30 mt-0.5 truncate">{c.offer.inclusions.slice(0, 2).join(', ')}{c.offer.inclusions.length > 2 ? ` +${c.offer.inclusions.length - 2}` : ''}</p>
                        )}
                        {c.status !== 'NEW' && (
                          <span className="inline-block font-body text-[8px] font-bold text-white/30 border border-white/8 px-1.5 py-0.5 rounded-full mt-1">
                            {c.status.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => selectClinic(c.leadId)}
                        disabled={c.isSelected || selecting !== null}
                        className={`shrink-0 px-3 py-1.5 rounded-lg font-body text-[9px] font-bold border transition-all ${
                          c.isSelected
                            ? 'border-green-400/30 text-green-400 cursor-default'
                            : 'border-white/10 text-white/40 hover:border-primary hover:text-primary disabled:opacity-40'
                        }`}
                      >
                        {selecting === c.leadId ? '…' : c.isSelected ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Offer detail for current clinic */}
            {lead.offers.length > 0 && (
              <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
                <p className="font-body text-[9px] text-white/30 uppercase tracking-widest font-semibold mb-4">
                  {lead.consultation.clinic.name} · Offers ({lead.offers.length})
                </p>
                <div className="space-y-4">
                  {lead.offers.map((offer, i) => (
                    <div key={offer.id} className={`${i > 0 ? 'pt-4 border-t border-white/8' : ''}`}>
                      <div className="flex items-start justify-between">
                        <p className="font-display text-xl text-white">
                          {offer.currency} {offer.totalPrice.toLocaleString()}
                        </p>
                        <span className={`font-body text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          offer.status === 'ACCEPTED' ? 'text-green-400 border-green-400/30' :
                          offer.status === 'REJECTED' ? 'text-red-400 border-red-400/30' :
                          'text-white/30 border-white/10'
                        }`}>{offer.status}</span>
                      </div>
                      <p className="font-body text-[9px] text-white/30 mt-0.5">By {offer.coordinator.user.name} · Valid {offer.validDays}d</p>
                      {offer.inclusions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {offer.inclusions.map(inc => (
                            <span key={inc} className="font-body text-[8px] text-white/40 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">{inc}</span>
                          ))}
                        </div>
                      )}
                      {offer.notes && (
                        <p className="font-body text-[10px] text-white/40 mt-2 italic">"{offer.notes}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completeness check */}
            <div className={`border rounded-2xl p-4 ${isComplete ? 'bg-green-400/5 border-green-400/20' : 'bg-yellow-400/5 border-yellow-400/20'}`}>
              <p className={`font-body text-[9px] font-bold uppercase tracking-wider ${isComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                {isComplete ? '✓ Patient data complete' : '⚠ Incomplete — clinics cannot see this lead'}
              </p>
              <div className="mt-2 space-y-1">
                {[
                  { label: 'Date of Birth', ok: !!patient.dateOfBirth },
                  { label: 'Country', ok: !!patient.countryOfResidence },
                  { label: 'Language', ok: !!patient.preferredLanguage },
                  { label: 'AI Score', ok: lead.aiScore !== null },
                  { label: 'Medical Screening', ok: !!lead.medicalScreening },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    <span className={`font-body text-[9px] ${ok ? 'text-white/40' : 'text-yellow-300/70'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coordinator info */}
            <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <p className="font-body text-[9px] text-white/30 uppercase tracking-widest font-semibold mb-2">Assigned Coordinator</p>
              {lead.coordinator ? (
                <div>
                  <p className="font-body text-sm font-semibold text-white">{lead.coordinator.user.name}</p>
                  <p className="font-body text-[10px] text-white/40">{lead.coordinator.user.email}</p>
                  {lead.claimedAt && <p className="font-body text-[9px] text-white/30 mt-1">Claimed {formatDate(lead.claimedAt)}</p>}
                </div>
              ) : (
                <p className="font-body text-sm text-white/30">Not yet claimed</p>
              )}
            </div>

            {/* Closure info */}
            {lead.closedAt && (
              <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
                <p className="font-body text-[9px] text-white/30 uppercase tracking-widest font-semibold mb-2">Case Closure</p>
                <p className="font-body text-sm text-white">{lead.closureOutcome?.replace(/_/g,' ') ?? 'Closed'}</p>
                <p className="font-body text-[10px] text-white/40">{formatDate(lead.closedAt)}</p>
                {lead.departureDate && <p className="font-body text-[9px] text-white/30 mt-1">Departure: {formatDate(lead.departureDate)}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
