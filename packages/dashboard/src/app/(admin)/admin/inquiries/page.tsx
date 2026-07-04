'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type IntakeMeta = {
  procedure?: string;
  intent?: string;
  dateOfBirth?: string | null;
  medicalScreening?: Record<string, boolean>;
  photoDescriptions?: string[];
  photosDeclined?: boolean;
  aiScore?: number | null;
  aiPriority?: string | null;
  aiRationale?: string | null;
};

const REQUIRED_SCREENING_KEYS = ['diabetes', 'cancerTreatment', 'organTransplant', 'dvt', 'pacemaker',
  'hypertension', 'heartDisease', 'thyroidDisorder', 'immuneDisorder', 'pregnancy', 'allergies'];

function getMissingFields(meta: IntakeMeta | null): string[] {
  if (!meta) return ['Intake not started'];
  const missing: string[] = [];
  if (!meta.dateOfBirth) missing.push('Date of birth');
  const screening = meta.medicalScreening ?? {};
  const missingScreening = REQUIRED_SCREENING_KEYS.filter(k => !(k in screening));
  if (missingScreening.length > 0) missing.push(`${missingScreening.length} medical screening questions`);
  if (!meta.photosDeclined && (!meta.photoDescriptions || meta.photoDescriptions.length === 0)) {
    missing.push('Treatment area photos');
  }
  return missing;
}

type Inquiry = {
  id: string;
  identifier: string;
  lastActiveAt: string;
  createdAt: string;
  patient: {
    id: string;
    dateOfBirth: string | null;
    countryOfResidence: string | null;
    preferredLanguage: string | null;
    user: { name: string | null; phone: string | null };
  };
  messages: {
    id: string;
    role: string;
    content: string;
    metadata: IntakeMeta | null;
    createdAt: string;
  }[];
};

const PRIORITY_STYLE: Record<string, string> = {
  High: 'bg-red-500/20 text-red-400 border-red-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Low: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const SCREENING_LABELS: Record<string, string> = {
  diabetes: 'Diabetes', cancerTreatment: 'Cancer Tx', cancer: 'Cancer', organTransplant: 'Organ Transplant',
  dvt: 'DVT', pacemaker: 'Pacemaker', hypertension: 'Hypertension', bloodClotting: 'Blood Clotting',
  heartDisease: 'Heart Disease', thyroidDisorder: 'Thyroid', immuneDisorder: 'Immune', pregnancy: 'Pregnancy', allergies: 'Allergies',
};

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function calcAge(dob: string | null) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

export default function InquiriesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState('');

  useEffect(() => {
    fetch('/api/admin/inquiries')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setItems(data); if (data[0]) setSelected(data[0]); })
      .finally(() => setLoading(false));
  }, []);

  const intakeMeta = (inq: Inquiry): IntakeMeta | null =>
    inq.messages.find(m => m.role === 'NIA' && m.metadata)?.metadata ?? null;

  const convertToLead = async (inq: Inquiry) => {
    setConverting(true);
    setConvertError('');
    try {
      const res = await fetch(`/api/admin/sessions/${inq.id}/convert`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        router.push(`/admin/leads/${data.leadId}`);
      } else if (res.status === 422 && data.missingFields?.length) {
        setConvertError(`Cannot convert — missing: ${data.missingFields.join('; ')}`);
      } else {
        setConvertError(data.error ?? `Error ${res.status}`);
      }
    } catch {
      setConvertError('Network error — please try again');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* List panel */}
      <div className="w-[280px] shrink-0 border-r border-white/8 flex flex-col overflow-hidden">
        <div className="px-5 py-5 border-b border-white/8">
          <h1 className="font-display text-xl text-white">WhatsApp Inquiries</h1>
          <p className="font-body text-[10px] text-white/40 mt-0.5">
            {items.length} pending review
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && <p className="px-5 py-8 font-body text-white/30 text-sm">Loading…</p>}
          {!loading && items.length === 0 && (
            <div className="px-5 py-12 text-center">
              <svg className="w-8 h-8 text-white/10 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <p className="font-body text-[11px] text-white/20">No inquiries yet</p>
            </div>
          )}
          {items.map(inq => {
            const meta = intakeMeta(inq);
            const isActive = selected?.id === inq.id;
            return (
              <button
                key={inq.id}
                onClick={() => { setSelected(inq); setConvertError(''); }}
                className={`w-full text-left px-5 py-4 border-b border-white/5 transition-colors ${isActive ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-white/3'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-white truncate">
                      {inq.patient.user.name ?? inq.identifier}
                    </p>
                    {meta?.procedure && (
                      <p className="font-body text-[10px] text-primary-fixed mt-0.5 truncate">{meta.procedure}</p>
                    )}
                    <p className="font-body text-[9px] text-white/30 mt-0.5">{timeAgo(inq.lastActiveAt)}</p>
                  </div>
                  {meta?.aiScore != null && (
                    <div className={`shrink-0 text-center px-2 py-1 rounded-lg border text-[10px] font-bold font-display ${
                      meta.aiScore >= 70 ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                      meta.aiScore >= 40 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                      'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      {meta.aiScore}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="h-full flex items-center justify-center">
            <p className="font-body text-white/20 text-sm">Select an inquiry to review</p>
          </div>
        ) : (
          <InquiryDetail
            inquiry={selected}
            meta={intakeMeta(selected)}
            missingFields={getMissingFields(intakeMeta(selected))}
            converting={converting}
            convertError={convertError}
            onConvert={() => convertToLead(selected)}
          />
        )}
      </div>
    </div>
  );
}

function InquiryDetail({
  inquiry, meta, missingFields, converting, convertError, onConvert
}: {
  inquiry: Inquiry;
  meta: IntakeMeta | null;
  missingFields: string[];
  converting: boolean;
  convertError: string;
  onConvert: () => void;
}) {
  const age = calcAge(inquiry.patient.dateOfBirth);
  const flags = Object.entries(meta?.medicalScreening ?? {}).filter(([, v]) => v).map(([k]) => k);
  const transcript = inquiry.messages.find(m => m.role === 'PATIENT')?.content;

  return (
    <div className="max-w-3xl mx-auto px-8 py-6">
      {/* Header with convert button */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display text-2xl text-white">
              {inquiry.patient.user.name ?? inquiry.identifier}
            </h2>
            {meta?.aiPriority && (
              <span className={`font-body text-[9px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-full ${PRIORITY_STYLE[meta.aiPriority] ?? ''}`}>
                {meta.aiPriority}
              </span>
            )}
          </div>
          <p className="font-body text-[11px] text-white/40 mt-1">
            {inquiry.identifier} · via WhatsApp · {new Date(inquiry.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={onConvert}
            disabled={converting || !meta?.procedure || missingFields.length > 0}
            className="px-5 py-2.5 bg-primary text-on-primary font-body text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {converting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Converting…
              </>
            ) : 'Convert to Lead'}
          </button>
          {convertError && (
            <p className="font-body text-[10px] text-error text-right max-w-[220px]">{convertError}</p>
          )}
        </div>
      </div>

      {/* Incomplete intake warning */}
      {missingFields.length > 0 && (
        <div className="mb-5 bg-amber-500/8 border border-amber-500/25 rounded-2xl px-5 py-4">
          <div className="flex items-start gap-3">
            <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
            </svg>
            <div>
              <p className="font-body text-[11px] font-semibold text-amber-400 mb-1">Intake incomplete — cannot convert yet</p>
              <ul className="space-y-0.5">
                {missingFields.map(f => (
                  <li key={f} className="font-body text-[10px] text-amber-400/70 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-amber-400/50 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Patient info */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-4 space-y-3">
          <p className="font-body text-[9px] text-white/30 uppercase tracking-widest font-semibold">Patient</p>
          {[
            { label: 'Phone', value: inquiry.identifier },
            { label: 'Age', value: age ? `${age} years old` : inquiry.patient.dateOfBirth ? new Date(inquiry.patient.dateOfBirth).toLocaleDateString() : '—' },
            { label: 'Country', value: inquiry.patient.countryOfResidence ?? '—' },
            { label: 'Language', value: inquiry.patient.preferredLanguage ?? '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="font-body text-[8px] text-white/30 uppercase tracking-wider">{label}</p>
              <p className="font-body text-sm text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Nia's assessment */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
          <p className="font-body text-[9px] text-white/30 uppercase tracking-widest font-semibold mb-3">Nia's Assessment</p>
          {meta?.aiScore != null ? (
            <>
              <div className="flex items-end gap-3 mb-3">
                <span className={`font-display text-4xl font-bold ${
                  meta.aiScore >= 70 ? 'text-green-400' : meta.aiScore >= 40 ? 'text-yellow-400' : 'text-red-400'
                }`}>{meta.aiScore}</span>
                <div className="mb-1">
                  <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${meta.aiScore}%` }} />
                  </div>
                  <p className="font-body text-[8px] text-white/30 mt-0.5">suitability score</p>
                </div>
              </div>
              {meta.aiRationale && (
                <p className="font-body text-[11px] text-white/60 leading-relaxed">{meta.aiRationale}</p>
              )}
            </>
          ) : (
            <p className="font-body text-sm text-white/30">No assessment yet — intake may be incomplete</p>
          )}
        </div>
      </div>

      {/* Procedure & intent */}
      {meta?.procedure && (
        <div className="bg-primary/8 border border-primary/20 rounded-2xl px-5 py-4 mb-4">
          <p className="font-body text-[9px] text-primary-fixed/50 uppercase tracking-wider mb-1">Procedure Interest</p>
          <p className="font-body text-base font-semibold text-white">{meta.procedure}</p>
          {meta.intent && <p className="font-body text-sm text-white/60 mt-1 leading-relaxed">{meta.intent}</p>}
        </div>
      )}

      {/* Medical flags */}
      {flags.length > 0 && (
        <div className="bg-error/5 border border-error/20 rounded-2xl px-5 py-4 mb-4">
          <p className="font-body text-[9px] text-error uppercase tracking-wider mb-2">Medical Flags</p>
          <div className="flex flex-wrap gap-2">
            {flags.map(flag => (
              <span key={flag} className="font-body text-[10px] font-semibold bg-error/15 text-error px-2.5 py-1 rounded-full border border-error/20">
                {SCREENING_LABELS[flag] ?? flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Conversation transcript */}
      {transcript && (
        <div>
          <p className="font-body text-[9px] text-white/30 uppercase tracking-widest font-semibold mb-3">Conversation with Nia</p>
          <div className="bg-white/3 border border-white/8 rounded-2xl px-5 py-4">
            <pre className="font-body text-[11px] text-white/60 whitespace-pre-wrap leading-relaxed">{transcript}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
