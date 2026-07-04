'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BottomTabNav from '@/components/dashboard/BottomTabNav';

type MedicalScreening = Record<string, boolean>;

type Lead = {
  id: string;
  status: string;
  source: string;
  patientLocation: string | null;
  aiScore: number | null;
  aiPriority: string | null;
  photoUrls: string[];
  medicalScreening: MedicalScreening | null;
  claimedAt: string | null;
  patientSelectedAt: string | null;
  createdAt: string;
  consultation: {
    additionalProcedureIds: string[];
    procedure: { name: string };
    patient: {
      countryOfResidence: string | null;
      preferredLanguage: string | null;
      dateOfBirth: string | null;
      whatsappNumber: string | null;
      user: { name: string; email: string; phone: string | null };
    };
  };
};

type LeadDetail = Lead & {
  aiRationale: string | null;
  intent: string | null;
  scope: string[];
  coordinator: { user: { name: string } } | null;
  additionalProcedures: { id: string; name: string }[];
  consultation: Lead['consultation'] & {
    id: string;
    preferredDoctorName: string | null;
  };
};

const MEDICAL_LABELS: [string, string][] = [
  ['diabetes','Diabetes'],['cancerTreatment','Cancer treatment'],['organTransplant','Organ transplant'],
  ['dvt','DVT'],['pacemaker','Pacemaker'],['hypertension','Hypertension'],
  ['bloodClotting','Blood clotting'],['heartDisease','Heart disease'],['thyroidDisorder','Thyroid disorder'],
  ['immuneDisorder','Immune disorder'],['pregnancy','Pregnancy'],['allergies','Allergies'],
];

function calcAge(dob: string | null) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function timeAgo(d: string | null) {
  if (!d) return '—';
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function isMedicalClear(s: MedicalScreening | null) {
  if (!s) return null;
  return Object.values(s).every(v => !v);
}

const PRIORITY_STYLE: Record<string, string> = {
  High: 'bg-error-container text-error',
  Medium: 'bg-yellow-50 text-yellow-700',
  Low: 'bg-green-50 text-green-700',
};

// ── List card ──────────────────────────────────────────────────────────────

function LeadCard({ lead, selected, onClick }: { lead: Lead; selected: boolean; onClick: () => void }) {
  const totalProcs = 1 + lead.consultation.additionalProcedureIds.length;
  const cleared = isMedicalClear(lead.medicalScreening);
  const isNew = lead.status === 'NEW';
  const isRevealed = !!lead.patientSelectedAt;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border px-4 py-3.5 transition-all space-y-2.5 ${
        selected ? 'border-primary bg-primary-fixed/50' : 'border-outline-variant/20 bg-surface-container-lowest hover:border-primary/30 hover:bg-surface-container-low/50'
      }`}
    >
      {/* Row 1: name + priority/status */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-body font-semibold text-on-surface text-sm leading-tight">
          {isRevealed ? lead.consultation.patient.user.name : <span className="tracking-widest text-on-surface-variant/40 select-none">••••••••</span>}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          {lead.aiPriority && (
            <span className={`font-body text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${PRIORITY_STYLE[lead.aiPriority] ?? 'bg-surface-container text-on-surface-variant'}`}>
              {lead.aiPriority}
            </span>
          )}
          {isNew && (
            <span className="bg-primary-fixed text-primary px-1.5 py-0.5 rounded font-body text-[8px] font-semibold uppercase tracking-wider">New</span>
          )}
        </div>
      </div>

      {/* Row 2: procedure + location */}
      <p className="font-body text-[11px] text-on-surface-variant leading-snug">
        {lead.consultation.procedure.name}
        {totalProcs > 1 && <span className="text-primary font-semibold"> +{totalProcs - 1} more</span>}
        {lead.patientLocation && <> · {lead.patientLocation}</>}
      </p>

      {/* Row 3: AI score bar + badges */}
      <div className="space-y-1.5">
        {lead.aiScore !== null && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-outline-variant/30 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${lead.aiScore}%` }} />
            </div>
            <span className="font-display text-sm font-bold text-primary shrink-0">{lead.aiScore}%</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          {cleared === true && (
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-body text-[8px] font-semibold">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              Medically cleared
            </span>
          )}
          {cleared === false && (
            <span className="inline-flex items-center gap-1 bg-error-container text-error px-1.5 py-0.5 rounded font-body text-[8px] font-semibold">⚠ Medical flag</span>
          )}
          {lead.photoUrls.length > 0 && (
            <span className="inline-flex items-center gap-1 bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded font-body text-[8px] font-semibold">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>
              {lead.photoUrls.length} photos
            </span>
          )}
          {!isNew && (
            <span className="font-body text-[8px] text-on-surface-variant ml-auto">{timeAgo(lead.claimedAt)}</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Detail panel ───────────────────────────────────────────────────────────

function DetailPanel({ detail, loading, onWhatsApp }: {
  detail: LeadDetail | null;
  loading: boolean;
  onWhatsApp: (n: string | null) => void;
}) {
  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <p className="font-body text-body-sm text-on-surface-variant">Loading…</p>
    </div>
  );
  if (!detail) return (
    <div className="flex items-center justify-center h-48">
      <p className="font-body text-body-sm text-on-surface-variant">Select a lead to view details</p>
    </div>
  );

  const patient = detail.consultation.patient;
  const isRevealed = !!detail.patientSelectedAt;
  const age = calcAge(patient.dateOfBirth);
  const allProcedures = [detail.consultation.procedure.name, ...(detail.additionalProcedures ?? []).map((p: { name: string }) => p.name)];
  const cleared = isMedicalClear(detail.medicalScreening);
  const screening = detail.medicalScreening;

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Header card */}
      <div className="bg-surface-container-lowest rounded-card2 border border-outline-variant/20 shadow-card overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-secondary-container via-tertiary-fixed to-primary-fixed relative">
          {detail.claimedAt && (
            <div className="absolute top-3 right-3 bg-on-surface/50 text-inverse-on-surface px-2.5 py-1 rounded-full font-body text-[9px] font-semibold">
              Claimed {timeAgo(detail.claimedAt)}
            </div>
          )}
          {detail.aiPriority && (
            <div className={`absolute bottom-3 left-4 font-body text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${PRIORITY_STYLE[detail.aiPriority] ?? ''}`}>
              Priority: {detail.aiPriority}
            </div>
          )}
        </div>
        <div className="px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl text-on-surface">
                {isRevealed ? patient.user.name : <span className="tracking-widest text-on-surface/30 select-none">••••••••••</span>}
              </h2>
              {detail.intent && <p className="font-body text-body-sm text-on-surface-variant mt-1 leading-relaxed">{detail.intent}</p>}
            </div>
            <span className="font-body text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant shrink-0">
              {detail.status}
            </span>
          </div>

          {/* Patient info grid */}
          <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-outline-variant/10">
            {[
              { label: 'Phone', value: isRevealed ? (patient.user.phone ?? patient.whatsappNumber ?? '—') : '••••••••••••', redacted: !isRevealed },
              { label: 'Age', value: age ? `${age} yrs` : '—', redacted: false },
              { label: 'Country', value: patient.countryOfResidence ?? '—', redacted: false },
              { label: 'Language', value: patient.preferredLanguage ?? '—', redacted: false },
              { label: 'Source', value: detail.source, redacted: false },
              { label: 'Assigned', value: detail.coordinator?.user.name ?? 'Unassigned', redacted: false },
            ].map(({ label, value, redacted }) => (
              <div key={label}>
                <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider">{label}</p>
                <p className={`font-body text-sm font-semibold mt-0.5 truncate ${redacted ? 'text-on-surface/25 tracking-widest select-none' : 'text-on-surface'}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Procedures + AI score */}
      <div className="grid grid-cols-2 gap-4">
        {/* Procedures */}
        <div className="bg-surface-container-lowest rounded-card2 border border-outline-variant/20 p-4">
          <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold mb-3">Selected Procedures</p>
          <div className="space-y-2">
            {allProcedures.map((name, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                  <span className="font-body text-[8px] font-bold text-primary">{i + 1}</span>
                </div>
                <span className="font-body text-[11px] font-semibold text-on-surface leading-snug">{name}</span>
              </div>
            ))}
          </div>
          {detail.consultation.preferredDoctorName && (
            <div className="mt-3 pt-3 border-t border-outline-variant/10">
              <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider">Preferred Doctor</p>
              <p className="font-body text-[11px] font-semibold text-on-surface mt-0.5">{detail.consultation.preferredDoctorName}</p>
            </div>
          )}
        </div>

        {/* AI Score */}
        {detail.aiScore !== null && (
          <div className="bg-on-surface rounded-card2 p-4 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-3.5 h-3.5 text-primary-fixed" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
              </svg>
              <span className="font-body text-[9px] text-primary-fixed uppercase tracking-widest font-semibold">Nia Analysis</span>
            </div>
            <div className="flex items-end justify-between mb-1.5">
              <span className="font-body text-[11px] text-inverse-on-surface/70">Booking intent</span>
              <span className="font-display text-3xl font-bold text-primary-fixed">{detail.aiScore}%</span>
            </div>
            <div className="h-1.5 bg-on-surface-variant/20 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-primary-fixed rounded-full" style={{ width: `${detail.aiScore}%` }} />
            </div>
            {detail.aiRationale && (
              <p className="font-body text-[10px] text-inverse-on-surface/70 italic leading-relaxed line-clamp-4">{detail.aiRationale}</p>
            )}
          </div>
        )}
      </div>

      {/* Medical Screening */}
      {screening && (
        <div className="bg-surface-container-lowest rounded-card2 border border-outline-variant/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold">Medical Screening</p>
            {cleared !== null && (
              <span className={`font-body text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cleared ? 'bg-green-50 text-green-700' : 'bg-error-container text-error'}`}>
                {cleared ? '✓ All clear' : '⚠ Flag present'}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-0">
            {MEDICAL_LABELS.map(([key, label]) => (
              <div key={key} className="flex items-center justify-between py-1.5 border-b border-outline-variant/10">
                <span className="font-body text-[10px] text-on-surface-variant">{label}</span>
                <span className={`font-body text-[10px] font-bold ${(screening[key]) ? 'text-error' : 'text-on-surface-variant/40'}`}>
                  {(screening[key]) ? 'YES' : 'No'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photos + Scope */}
      <div className="grid grid-cols-2 gap-4">
        {/* Photos */}
        {detail.photoUrls.length > 0 && (
          <div className="bg-surface-container-lowest rounded-card2 border border-outline-variant/20 p-4">
            <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold mb-3">Submitted Photos</p>
            <div className="grid grid-cols-3 gap-2">
              {detail.photoUrls.map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-surface-container-low border border-outline-variant/20 flex flex-col items-center justify-center gap-1">
                  <svg className="w-4 h-4 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"/>
                  </svg>
                  <span className="font-body text-[8px] text-on-surface-variant">{i + 1}</span>
                </div>
              ))}
            </div>
            <p className="font-body text-[9px] text-on-surface-variant/60 mt-2">Via WhatsApp · AI-reviewed</p>
          </div>
        )}

        {/* Scope */}
        {detail.scope && detail.scope.length > 0 && (
          <div className="bg-surface-container-lowest rounded-card2 border border-outline-variant/20 p-4">
            <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold mb-3">AI Scope Tags</p>
            <div className="space-y-1.5">
              {detail.scope.map(item => (
                <div key={item} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span className="font-body text-[11px] text-on-surface leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pb-2">
        <button
          onClick={() => isRevealed && onWhatsApp(patient.whatsappNumber)}
          disabled={!isRevealed || !patient.whatsappNumber}
          title={!isRevealed ? 'Contact details revealed after patient selects your clinic' : undefined}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary py-3 rounded-xl font-body text-label-caps uppercase tracking-wider font-semibold hover:opacity-90 transition-all disabled:opacity-40 text-[10px]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
          </svg>
          Contact via WhatsApp
        </button>
        <Link href={`/concierge/${detail.id}`} className="flex-1">
          <button className="w-full border border-outline-variant text-on-surface py-3 rounded-xl font-body text-label-caps uppercase tracking-wider font-semibold hover:border-primary hover:text-primary transition-all text-[10px]">
            Full Case →
          </button>
        </Link>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

function ConciergeInner() {
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('id'));
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchLeads = useCallback(async () => {
    const res = await fetch('/api/leads');
    if (res.ok) {
      const data: Lead[] = await res.json();
      setLeads(data);
      if (!selectedId) {
        const first = data.find(l => l.status === 'CLAIMED') ?? data[0];
        if (first) setSelectedId(first.id);
      }
    }
  }, [selectedId]);

  const fetchDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    const res = await fetch(`/api/leads/${id}`);
    if (res.ok) setDetail(await res.json());
    setLoadingDetail(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { if (selectedId) fetchDetail(selectedId); }, [selectedId, fetchDetail]);

  const openWhatsApp = (number: string | null) => {
    if (!number) return;
    window.open(`https://web.whatsapp.com/send?phone=${number.replace(/\D/g, '')}`, '_blank');
  };

  const newLeads = leads.filter(l => l.status === 'NEW');
  const activeCases = leads.filter(l => l.status !== 'NEW');

  const now = new Date();
  const clock = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

  return (
    <div className="min-h-screen bg-surface pb-20 lg:pb-0 lg:min-h-0 lg:h-full lg:flex lg:overflow-hidden">

      {/* Mobile header */}
      <header className="bg-surface-container-lowest border-b border-outline-variant/20 px-5 py-4 flex items-center justify-between sticky top-0 z-30 lg:hidden">
        <h1 className="font-display text-display-sm text-on-surface">Concierge</h1>
        <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center">
          <span className="font-display text-display-sm text-on-secondary-container">A</span>
        </div>
      </header>

      {/* Mobile: lead list + tapped detail */}
      <div className="lg:hidden px-4 pt-5 space-y-4">
        {newLeads.length > 0 && (
          <div>
            <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold px-1 mb-2">New Requests</p>
            <div className="space-y-2">
              {newLeads.map(l => <LeadCard key={l.id} lead={l} selected={selectedId === l.id} onClick={() => setSelectedId(l.id)} />)}
            </div>
          </div>
        )}
        {activeCases.length > 0 && (
          <div>
            <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold px-1 mb-2">Active Cases</p>
            <div className="space-y-2">
              {activeCases.map(l => <LeadCard key={l.id} lead={l} selected={selectedId === l.id} onClick={() => setSelectedId(l.id)} />)}
            </div>
          </div>
        )}
        {selectedId && detail && selectedId === detail.id && (
          <div className="mt-2">
            <DetailPanel detail={detail} loading={loadingDetail} onWhatsApp={openWhatsApp} />
          </div>
        )}
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden lg:flex lg:flex-1 lg:overflow-hidden">
        {/* Left panel — lead list */}
        <div className="w-[296px] shrink-0 border-r border-outline-variant/20 flex flex-col overflow-hidden">
          <div className="px-4 py-3.5 border-b border-outline-variant/10 flex items-center justify-between">
            <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">All Leads · {leads.length}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="font-body text-[10px] font-semibold text-on-surface">{clock}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {newLeads.length > 0 && (
              <div>
                <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold px-1 mb-2">New Requests</p>
                <div className="space-y-2">
                  {newLeads.map(l => <LeadCard key={l.id} lead={l} selected={selectedId === l.id} onClick={() => setSelectedId(l.id)} />)}
                </div>
              </div>
            )}
            {activeCases.length > 0 && (
              <div>
                <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold px-1 mb-2">Active Cases</p>
                <div className="space-y-2">
                  {activeCases.map(l => <LeadCard key={l.id} lead={l} selected={selectedId === l.id} onClick={() => setSelectedId(l.id)} />)}
                </div>
              </div>
            )}
            {leads.length === 0 && (
              <div className="py-12 text-center">
                <p className="font-body text-body-sm text-on-surface-variant">No leads yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — detail */}
        <div className="flex-1 overflow-y-auto p-5">
          <DetailPanel detail={detail} loading={loadingDetail} onWhatsApp={openWhatsApp} />
        </div>
      </div>

      <BottomTabNav />
    </div>
  );
}

export default function ConciergePage() {
  return <Suspense><ConciergeInner /></Suspense>;
}
