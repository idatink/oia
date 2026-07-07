'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomTabNav from '@/components/dashboard/BottomTabNav';

type MedicalScreening = {
  diabetes: boolean; cancerTreatment: boolean; organTransplant: boolean; dvt: boolean;
  pacemaker: boolean; hypertension: boolean; bloodClotting: boolean; heartDisease: boolean;
  thyroidDisorder: boolean; immuneDisorder: boolean; pregnancy: boolean; allergies: boolean;
};

type Offer = {
  id: string; totalPrice: number; currency: string; inclusions: string[];
  notes: string | null; validDays: number; status: string; sentAt: string;
};

type Proposal = {
  timeline: string; preOpInstructions: string; hospitalStay: string;
  recoveryPlan: string; followUpSchedule: string; notes?: string;
  sentAt: string; sentBy: string;
};

type LeadDetail = {
  id: string; status: string; source: string; patientLocation: string | null;
  aiScore: number | null; aiRationale: string | null; aiPriority: string | null;
  intent: string | null; scope: string[];
  medicalScreening: MedicalScreening | null; photoUrls: string[];
  claimedAt: string | null; patientSelectedAt: string | null; createdAt: string;
  closedAt: string | null; closureOutcome: string | null; closureNotes: string | null;
  departureDate: string | null; followUpDays: number[];
  coordinator: { user: { name: string } } | null;
  additionalProcedures: { id: string; name: string }[];
  consultation: {
    id: string; status: string;
    preferredDoctorName: string | null;
    additionalProcedureIds: string[];
    procedure: { name: string };
    patient: {
      dateOfBirth: string | null; countryOfResidence: string | null;
      preferredLanguage: string | null; whatsappNumber: string | null;
      user: { name: string; email: string; phone: string | null };
    };
  };
};

type Booking = {
  id: string; type: string; scheduledAt: string; durationMins: number;
  status: string; room: string | null; joinLink: string | null; notes: string | null;
};

const MEDICAL_LABELS: [keyof MedicalScreening, string][] = [
  ['diabetes', 'Diabetes'], ['cancerTreatment', 'Cancer treatment'],
  ['organTransplant', 'Organ transplant'], ['dvt', 'DVT'],
  ['pacemaker', 'Pacemaker'], ['hypertension', 'Hypertension'],
  ['bloodClotting', 'Blood clotting'], ['heartDisease', 'Heart disease'],
  ['thyroidDisorder', 'Thyroid disorder'], ['immuneDisorder', 'Immune disorder'],
  ['pregnancy', 'Pregnancy'], ['allergies', 'Allergies'],
];

const INCLUSIONS_OPTIONS = [
  'Surgeon Fee', 'Anaesthesia', 'Hospital Stay (2 nights)', 'Hospital Stay (3 nights)',
  'Pre-op Blood Tests', 'Post-op Care (1 week)', 'Airport Transfers', 'Accommodation',
  'Translation / Interpreter', 'Compression Garments', 'Follow-up Consultation',
];

const CURRENCIES = ['EUR', 'USD', 'GBP', 'TRY'];
const VALIDITY_OPTIONS = [7, 14, 30, 60];

function calcAge(dob: string | null) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}
function formatDatetime(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' · ' +
    new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}
function refNumber(id: string, createdAt: string) {
  const year = new Date(createdAt).getFullYear();
  const suffix = id.slice(-4).toUpperCase();
  return `REF-${year}-${suffix}`;
}

function checkCompleteness(detail: LeadDetail) {
  const p = detail.consultation.patient;
  const checks: { label: string; ok: boolean }[] = [
    { label: 'Phone', ok: !!(p.user.phone || p.whatsappNumber) },
    { label: 'Email', ok: !!p.user.email },
    { label: 'Date of birth', ok: !!p.dateOfBirth },
    { label: 'Country', ok: !!p.countryOfResidence },
    { label: 'Language', ok: !!p.preferredLanguage },
    { label: 'Procedure selected', ok: !!detail.consultation.procedure.name },
    { label: 'Medical screening', ok: !!detail.medicalScreening },
    { label: 'Photos submitted', ok: detail.photoUrls.length > 0 },
    { label: 'AI analysis', ok: detail.aiScore !== null },
  ];
  return checks;
}

// ── Send Offer Modal ───────────────────────────────────────────────────────────

function SendOfferModal({
  leadId, existingOffer, onClose, onSent,
}: {
  leadId: string; existingOffer: Offer | null;
  onClose: () => void; onSent: (offer: Offer) => void;
}) {
  const [price, setPrice] = useState(existingOffer ? String(existingOffer.totalPrice) : '');
  const [currency, setCurrency] = useState(existingOffer?.currency ?? 'EUR');
  const [inclusions, setInclusions] = useState<string[]>(existingOffer?.inclusions ?? []);
  const [notes, setNotes] = useState(existingOffer?.notes ?? '');
  const [validDays, setValidDays] = useState(existingOffer?.validDays ?? 30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggle = (item: string) =>
    setInclusions(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);

  const handleSubmit = async () => {
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError('Please enter a valid price.');
      return;
    }
    setSubmitting(true);
    setError('');
    const res = await fetch(`/api/leads/${leadId}/offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalPrice: Number(price), currency, inclusions, notes: notes || null, validDays }),
    });
    if (res.ok) {
      onSent(await res.json());
    } else {
      setError('Failed to send offer. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-on-surface/40 backdrop-blur-sm px-4 pb-4 lg:pb-0">
      <div className="w-full max-w-lg bg-surface rounded-card2 shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
          <div>
            <h2 className="font-display text-xl text-on-surface">Send Offer to Nia</h2>
            <p className="font-body text-[10px] text-on-surface-variant mt-0.5">Your quote will be submitted to Nia alongside other clinic offers</p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Price */}
          <div>
            <label className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold block mb-1.5">Total Price</label>
            <div className="flex gap-2">
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2.5 font-body text-sm text-on-surface"
              >
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <input
                type="number"
                placeholder="e.g. 4500"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="flex-1 bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Inclusions */}
          <div>
            <label className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold block mb-2">What&apos;s Included</label>
            <div className="grid grid-cols-2 gap-1.5">
              {INCLUSIONS_OPTIONS.map(item => (
                <button
                  key={item}
                  onClick={() => toggle(item)}
                  className={`text-left px-3 py-2 rounded-lg border font-body text-[11px] transition-all ${
                    inclusions.includes(item)
                      ? 'border-primary bg-primary-fixed/50 text-primary font-semibold'
                      : 'border-outline-variant/20 bg-surface-container-lowest text-on-surface-variant hover:border-outline-variant'
                  }`}
                >
                  {inclusions.includes(item) ? '✓ ' : ''}{item}
                </button>
              ))}
            </div>
          </div>

          {/* Validity */}
          <div>
            <label className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold block mb-1.5">Offer Valid For</label>
            <div className="flex gap-2">
              {VALIDITY_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setValidDays(d)}
                  className={`flex-1 py-2 rounded-lg border font-body text-[11px] font-semibold transition-all ${
                    validDays === d ? 'border-primary bg-primary-fixed/50 text-primary' : 'border-outline-variant/20 text-on-surface-variant hover:border-outline-variant'
                  }`}
                >
                  {d} days
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold block mb-1.5">Additional Notes <span className="normal-case font-normal">(optional)</span></label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Price includes revision consultation at 6 months…"
              className="w-full bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {error && <p className="font-body text-[11px] text-error">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-outline-variant/20 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-outline-variant text-on-surface py-3 rounded-xl font-body text-label-caps uppercase tracking-wider font-semibold hover:border-primary hover:text-primary transition-all text-[10px]">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-primary text-on-primary py-3 rounded-xl font-body text-label-caps uppercase tracking-wider font-semibold hover:opacity-90 transition-all disabled:opacity-50 text-[10px]"
          >
            {submitting ? 'Sending…' : existingOffer ? 'Update Offer →' : 'Send Offer →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Send Proposal Modal ───────────────────────────────────────────────────────

function SendProposalModal({
  leadId, existing, onClose, onSent,
}: {
  leadId: string; existing: Proposal | null;
  onClose: () => void; onSent: (p: Proposal) => void;
}) {
  const [timeline, setTimeline] = useState(existing?.timeline ?? '');
  const [preOp, setPreOp] = useState(existing?.preOpInstructions ?? '');
  const [hospital, setHospital] = useState(existing?.hospitalStay ?? '');
  const [recovery, setRecovery] = useState(existing?.recoveryPlan ?? '');
  const [followUp, setFollowUp] = useState(existing?.followUpSchedule ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!timeline || !preOp || !hospital || !recovery || !followUp) {
      setError('Please fill in all required fields.'); return;
    }
    setSubmitting(true); setError('');
    const res = await fetch(`/api/leads/${leadId}/proposal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeline, preOpInstructions: preOp, hospitalStay: hospital, recoveryPlan: recovery, followUpSchedule: followUp, notes: notes || undefined }),
    });
    if (res.ok) { onSent(await res.json()); }
    else { const e = await res.json(); setError(e.error ?? 'Failed to send proposal.'); }
    setSubmitting(false);
  };

  const Field = ({ label, value, onChange, rows = 2 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) => (
    <div>
      <label className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold block mb-1.5">{label} *</label>
      <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary resize-none" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-on-surface/40 backdrop-blur-sm px-4 pb-4 lg:pb-0">
      <div className="w-full max-w-lg bg-surface rounded-card2 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
          <div>
            <h2 className="font-display text-xl text-on-surface">Treatment Proposal</h2>
            <p className="font-body text-[10px] text-on-surface-variant mt-0.5">Nia will share this with the patient on your behalf</p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="px-5 py-4 space-y-3 max-h-[65vh] overflow-y-auto">
          <Field label="Proposed treatment timeline" value={timeline} onChange={setTimeline} rows={2} />
          <Field label="Pre-op instructions" value={preOp} onChange={setPreOp} rows={3} />
          <Field label="Hospital stay & accommodation" value={hospital} onChange={setHospital} rows={2} />
          <Field label="Recovery plan" value={recovery} onChange={setRecovery} rows={3} />
          <Field label="Post-op follow-up schedule" value={followUp} onChange={setFollowUp} rows={2} />
          <div>
            <label className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold block mb-1.5">Additional notes <span className="normal-case font-normal">(optional)</span></label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary resize-none" />
          </div>
          {error && <p className="font-body text-[11px] text-error">{error}</p>}
        </div>
        <div className="px-5 py-4 border-t border-outline-variant/20 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-outline-variant text-on-surface py-3 rounded-xl font-body text-[10px] font-semibold uppercase tracking-wider hover:border-primary hover:text-primary transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 bg-primary text-on-primary py-3 rounded-xl font-body text-[10px] font-semibold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50">
            {submitting ? 'Sending…' : existing ? 'Update Proposal →' : 'Send Proposal →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Close Case Modal ──────────────────────────────────────────────────────────

const OUTCOMES = [
  { value: 'successful', label: 'Successful', desc: 'Procedure completed, patient discharged well' },
  { value: 'cancelled', label: 'Cancelled', desc: 'Patient cancelled before procedure' },
  { value: 'complication', label: 'Complication', desc: 'Procedure had a medical complication' },
  { value: 'no_show', label: 'No show', desc: 'Patient did not arrive' },
];
const FOLLOWUP_OPTIONS = [3, 7, 14, 30, 90];

function CloseCaseModal({
  leadId, patientName, onClose, onClosed,
}: {
  leadId: string; patientName: string;
  onClose: () => void; onClosed: () => void;
}) {
  const [outcome, setOutcome] = useState('successful');
  const [notes, setNotes] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [followUpDays, setFollowUpDays] = useState<number[]>([3, 7, 30]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleFollowUp = (d: number) =>
    setFollowUpDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a, b) => a - b));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'CLOSED',
        closureOutcome: outcome,
        closureNotes: notes || null,
        departureDate: departureDate || null,
        followUpDays,
      }),
    });
    if (res.ok) {
      onClosed();
    } else {
      const err = await res.json();
      setError(err.error ?? 'Failed to close case.');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-on-surface/40 backdrop-blur-sm px-4 pb-4 lg:pb-0">
      <div className="w-full max-w-lg bg-surface rounded-card2 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
          <div>
            <h2 className="font-display text-xl text-on-surface">Close Case</h2>
            <p className="font-body text-[10px] text-on-surface-variant mt-0.5">{patientName} · Complete this case and schedule post-op follow-ups</p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Outcome */}
          <div>
            <label className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold block mb-2">Outcome</label>
            <div className="space-y-2">
              {OUTCOMES.map(o => (
                <button
                  key={o.value}
                  onClick={() => setOutcome(o.value)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all ${
                    outcome === o.value
                      ? 'border-primary bg-primary-fixed/40'
                      : 'border-outline-variant/20 bg-surface-container-lowest hover:border-outline-variant'
                  }`}
                >
                  <p className={`font-body text-[11px] font-semibold ${outcome === o.value ? 'text-primary' : 'text-on-surface'}`}>{o.label}</p>
                  <p className="font-body text-[10px] text-on-surface-variant mt-0.5">{o.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Departure date */}
          <div>
            <label className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold block mb-1.5">Patient departure date</label>
            <input
              type="date"
              value={departureDate}
              onChange={e => setDepartureDate(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2.5 font-body text-sm text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          {/* Follow-up schedule */}
          <div>
            <label className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold block mb-1">Post-op follow-up reminders</label>
            <p className="font-body text-[10px] text-on-surface-variant mb-2">Select which days to be reminded to check in with the patient</p>
            <div className="flex gap-2 flex-wrap">
              {FOLLOWUP_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => toggleFollowUp(d)}
                  className={`px-3.5 py-2 rounded-lg border font-body text-[11px] font-semibold transition-all ${
                    followUpDays.includes(d)
                      ? 'border-primary bg-primary-fixed/40 text-primary'
                      : 'border-outline-variant/20 text-on-surface-variant hover:border-outline-variant'
                  }`}
                >
                  Day {d}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold block mb-1.5">Coordinator notes <span className="normal-case font-normal">(optional)</span></label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Patient recovering well, revision follow-up booked for 6 months…"
              className="w-full bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {error && <p className="font-body text-[11px] text-error">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-outline-variant/20 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-outline-variant text-on-surface py-3 rounded-xl font-body text-[10px] font-semibold uppercase tracking-wider hover:border-primary hover:text-primary transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-on-surface text-inverse-on-surface py-3 rounded-xl font-body text-[10px] font-semibold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50"
          >
            {submitting ? 'Closing…' : 'Close Case →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface ClinicQuoteData {
  clinicName: string | null;
  clinicPhone: string;
  procedure: string;
  currency: string | null;
  headlinePrice: number | null;
  inclusions: string[];
  exclusions: string[];
  validUntil: string | null;
  negotiationStatus: string;
  notes: string | null;
  patientName: string | null;
  linked: boolean;
}
interface ClinicQuote {
  sessionId: string;
  lastActiveAt: string;
  quote: ClinicQuoteData | null;
  transcript: { role: string; content: string; createdAt: string }[];
}
interface MatchItem {
  id: string; rank: number; score: number; reasons: string[]; negotiationStatus: string;
  provider: {
    id: string; surgeonName: string; clinicName: string | null; city: string | null; country: string;
    accreditations: string[]; reviewRating: number | null; reviewCount: number | null;
    website: string | null; instagram: string | null; whatsapp: string | null; verified: boolean;
  };
}
interface ProviderMatch { id: string; treatmentName: string; cluster: string | null; createdAt: string; items: MatchItem[]; }

export default function FullCasePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [clinicQuotes, setClinicQuotes] = useState<ClinicQuote[]>([]);
  const [matches, setMatches] = useState<ProviderMatch[]>([]);
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOffer, setShowOffer] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [medOpen, setMedOpen] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [detailRes, bookingsRes, offerRes, proposalRes, clinicQuotesRes, matchesRes] = await Promise.all([
      fetch(`/api/leads/${id}`),
      fetch(`/api/leads/${id}/bookings`),
      fetch(`/api/leads/${id}/offer`),
      fetch(`/api/leads/${id}/proposal`),
      fetch(`/api/leads/${id}/clinic-quotes`),
      fetch(`/api/leads/${id}/matches`),
    ]);
    if (detailRes.ok) setDetail(await detailRes.json());
    if (bookingsRes.ok) setBookings(await bookingsRes.json());
    if (offerRes.ok) {
      const offers: Offer[] = await offerRes.json();
      setOffer(offers[0] ?? null);
    }
    if (clinicQuotesRes.ok) setClinicQuotes(await clinicQuotesRes.json());
    if (matchesRes.ok) setMatches((await matchesRes.json()).matches ?? []);
    if (proposalRes.ok) {
      const p = await proposalRes.json();
      setProposal(p);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center lg:h-full">
      <p className="font-body text-body-sm text-on-surface-variant">Loading case…</p>
    </div>
  );

  if (!detail) return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 lg:h-full">
      <p className="font-body text-body-sm text-on-surface-variant">Case not found</p>
      <button onClick={() => router.back()} className="font-body text-label-caps text-primary uppercase tracking-wider font-semibold">← Back</button>
    </div>
  );

  const patient = detail.consultation.patient;
  // Personal data is only revealed once the patient has chosen this clinic
  const isRevealed = !!detail.patientSelectedAt;
  const age = calcAge(patient.dateOfBirth);
  const allProcedures = [detail.consultation.procedure.name, ...detail.additionalProcedures.map(p => p.name)];
  const screening = detail.medicalScreening;
  const ref = refNumber(detail.id, detail.createdAt);
  const completeness = checkCompleteness(detail);
  const missing = completeness.filter(c => !c.ok);
  const isComplete = missing.length === 0;
  const priorityColor = detail.aiPriority === 'High'
    ? 'text-error bg-error-container'
    : detail.aiPriority === 'Medium'
    ? 'text-yellow-700 bg-yellow-50'
    : 'text-green-700 bg-green-50';

  return (
    <div className="min-h-screen bg-[#F5F4F0] pb-24 lg:pb-0 lg:h-full lg:overflow-y-auto">

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-black/8 px-5 py-3.5 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors text-[11px] font-body font-semibold shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
          </svg>
          Back
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-display text-sm font-bold text-primary tracking-tight">{ref}</span>
          <span className={`font-body text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
            detail.status === 'NEW' ? 'bg-primary-fixed text-primary' :
            detail.status === 'CLAIMED' ? 'bg-secondary-container text-on-secondary-container' :
            'bg-surface-container text-on-surface-variant'
          }`}>{detail.status}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {detail.patientSelectedAt ? (
            <Link href={`/concierge/${detail.id}/conversation`} className="border border-primary text-primary px-3.5 py-2 rounded-lg font-body text-[10px] font-semibold hover:bg-primary-fixed/30 transition-all whitespace-nowrap flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>
              </svg>
              View Conversation
            </Link>
          ) : (
            <div className="relative group">
              <button disabled className="border border-outline-variant/40 text-on-surface-variant/40 px-3.5 py-2 rounded-lg font-body text-[10px] font-semibold whitespace-nowrap flex items-center gap-1.5 cursor-not-allowed">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
                </svg>
                View Conversation
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-on-surface text-inverse-on-surface px-3 py-2 rounded-lg font-body text-[10px] text-center leading-relaxed opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                Unlocks when patient selects your clinic
              </div>
            </div>
          )}
          {detail.patientSelectedAt && detail.status !== 'CLOSED' && (
            <button
              onClick={() => setShowProposal(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-body text-[10px] font-semibold border transition-all whitespace-nowrap ${
                proposal ? 'border-primary text-primary bg-primary-fixed/30' : 'border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary'
              }`}
            >
              {proposal ? '✓ Proposal Sent' : 'Send Proposal'}
            </button>
          )}
          {detail.status !== 'CLOSED' && (
            <button
              onClick={() => setShowOffer(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-body text-[10px] font-semibold transition-all whitespace-nowrap ${
                offer ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-primary text-on-primary hover:opacity-90'
              }`}
            >
              {offer ? `Offer Sent · ${offer.currency} ${offer.totalPrice.toLocaleString()}` : 'Send Offer →'}
            </button>
          )}
          {['IN_PROGRESS', 'SELECTED', 'ESCALATED'].includes(detail.status) && (
            <button
              onClick={() => setShowClose(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-body text-[10px] font-semibold border border-outline-variant/40 text-on-surface-variant hover:border-on-surface hover:text-on-surface transition-all whitespace-nowrap"
            >
              Close Case
            </button>
          )}
        </div>
      </header>

      {/* ── Data access banner ───────────────────────────────────────────── */}
      {!isRevealed && (
        <div className="bg-on-surface border-b border-black/20 px-5 py-2.5 flex items-center gap-3">
          <svg className="w-4 h-4 text-primary-fixed shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
          </svg>
          <p className="font-body text-[10px] text-inverse-on-surface">
            <span className="font-semibold text-primary-fixed">Patient identity is protected.</span> Full name, contact details and photos are revealed only after the patient selects your clinic. You can still review their procedures, AI analysis and medical clearance, and send an offer.
          </p>
        </div>
      )}
      {isRevealed && (
        <div className="bg-green-50 border-b border-green-200 px-5 py-2.5 flex items-center gap-3">
          <svg className="w-4 h-4 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
          </svg>
          <p className="font-body text-[10px] text-green-800 font-semibold">Patient selected your clinic — full profile and conversation are now accessible.</p>
        </div>
      )}

      {/* ── Completeness banner ───────────────────────────────────────────── */}
      {!isComplete && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-5 py-2.5 flex items-center gap-3">
          <svg className="w-4 h-4 text-yellow-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/>
          </svg>
          <p className="font-body text-[10px] text-yellow-800">
            <span className="font-semibold">Profile incomplete</span> — Nia cannot share this lead until all info is collected.
            Missing: {missing.map(m => m.label).join(', ')}.
          </p>
        </div>
      )}
      {isComplete && (
        <div className="bg-green-50 border-b border-green-200 px-5 py-2.5 flex items-center gap-3">
          <svg className="w-4 h-4 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
          </svg>
          <p className="font-body text-[10px] text-green-800 font-semibold">Profile complete — Nia can share this lead with clinics and collect offers.</p>
        </div>
      )}

      {/* ── Two-column body ───────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-6 lg:grid lg:grid-cols-[1fr_300px] lg:gap-5 lg:items-start space-y-4 lg:space-y-0">

        {/* LEFT: patient brief ───────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Patient Information */}
          <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-black/6">
              <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold">Patient Information</p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-black/6">
              <div className="p-5 space-y-4">
                <div>
                  <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider">Full Name</p>
                  {isRevealed
                    ? <p className="font-body text-sm font-bold text-on-surface mt-0.5">{patient.user.name}</p>
                    : <p className="font-body text-sm font-bold text-on-surface-variant/30 mt-0.5 select-none tracking-widest">••••••••••</p>}
                </div>
                <div>
                  <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider">Email</p>
                  {isRevealed
                    ? <p className="font-body text-sm font-semibold text-on-surface mt-0.5">{patient.user.email}</p>
                    : <p className="font-body text-sm font-semibold text-on-surface-variant/30 mt-0.5 select-none tracking-widest">••••••••••••</p>}
                </div>
                <div>
                  <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider">Country</p>
                  <p className="font-body text-sm font-semibold text-on-surface mt-0.5">{patient.countryOfResidence ?? <span className="text-on-surface-variant/40">—</span>}</p>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider">Phone</p>
                  {isRevealed
                    ? <p className="font-body text-sm font-semibold text-on-surface mt-0.5">{patient.user.phone ?? patient.whatsappNumber ?? <span className="text-on-surface-variant/40">—</span>}</p>
                    : <p className="font-body text-sm font-semibold text-on-surface-variant/30 mt-0.5 select-none tracking-widest">••••••••••••</p>}
                </div>
                <div>
                  <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider">Age</p>
                  <p className="font-body text-sm font-semibold text-on-surface mt-0.5">{age ? `${age}` : <span className="text-on-surface-variant/40">—</span>}</p>
                </div>
                <div>
                  <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider">Language</p>
                  <p className="font-body text-sm font-semibold text-on-surface mt-0.5">{patient.preferredLanguage ?? <span className="text-on-surface-variant/40">—</span>}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Procedures */}
          <div className="bg-white rounded-2xl border border-black/8 px-5 py-4">
            <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold mb-3">Selected Procedures</p>
            <div className="flex flex-wrap gap-2">
              {allProcedures.map((name, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 border border-primary/40 text-primary bg-primary-fixed/20 px-3 py-1.5 rounded-full font-body text-[11px] font-semibold">
                  {name}
                </span>
              ))}
            </div>
            {detail.consultation.preferredDoctorName && (
              <div className="mt-3 pt-3 border-t border-black/6 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-on-surface-variant shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                </svg>
                <span className="font-body text-[11px] text-on-surface-variant">Preferred: </span>
                <span className="font-body text-[11px] font-semibold text-on-surface">{detail.consultation.preferredDoctorName}</span>
              </div>
            )}
          </div>

          {/* Medical History */}
          {screening && (
            <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-surface-container-lowest/50 transition-colors"
                onClick={() => setMedOpen(o => !o)}
              >
                <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold">
                  Medical History <span className="text-on-surface-variant/50">(12 questions)</span>
                </p>
                <div className="flex items-center gap-2">
                  {Object.values(screening).some(Boolean)
                    ? <span className="font-body text-[8px] font-bold text-error bg-error-container px-2 py-0.5 rounded-full">⚠ Flag</span>
                    : <span className="font-body text-[8px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">✓ All Clear</span>
                  }
                  <svg className={`w-4 h-4 text-on-surface-variant transition-transform ${medOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                  </svg>
                </div>
              </button>
              {medOpen && (
                <div className="border-t border-black/6 grid grid-cols-2 divide-x divide-black/6">
                  {MEDICAL_LABELS.map(([key, label], i) => {
                    const val = screening[key];
                    return (
                      <div key={key} className={`flex items-center justify-between px-5 py-2.5 ${i < MEDICAL_LABELS.length - 2 ? 'border-b border-black/6' : ''}`}>
                        <div className="flex items-center gap-2">
                          <svg className={`w-3.5 h-3.5 shrink-0 ${val ? 'text-error' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                            {val
                              ? <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                              : <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            }
                          </svg>
                          <span className="font-body text-[11px] text-on-surface-variant">{label}</span>
                        </div>
                        <span className={`font-body text-[10px] font-bold ${val ? 'text-error' : 'text-on-surface-variant/40'}`}>
                          {val ? 'YES' : 'No'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Submitted Photos — visible after claim */}
          {detail.photoUrls.length > 0 && (
            <div className="bg-white rounded-2xl border border-black/8 px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold">Patient Treatment Area Photos</p>
                <span className="font-body text-[9px] text-on-surface-variant">
                  {detail.claimedAt ? 'Submitted by patient · clinical use only' : `${detail.photoUrls.length} photo${detail.photoUrls.length !== 1 ? 's' : ''} · visible after claiming`}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {detail.photoUrls.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl border border-black/8 overflow-hidden bg-surface-container-low/40">
                    {detail.claimedAt ? (
                      // Private blob — served only through the coordinator-authed proxy.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/leads/${id}/photo?i=${i}`} alt={`Treatment area ${i + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-surface-container/70 backdrop-blur-md flex flex-col items-center justify-center gap-1.5 z-10">
                          <svg className="w-5 h-5 text-on-surface-variant/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                          <span className="font-body text-[8px] text-on-surface-variant/60">Claim to view</span>
                        </div>
                        <div className="w-full h-full bg-surface-container-low" />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appointments */}
          {bookings.length > 0 && (
            <div className="bg-white rounded-2xl border border-black/8 px-5 py-4">
              <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold mb-3">Appointments</p>
              <div className="space-y-2">
                {bookings.map(b => (
                  <div key={b.id} className="flex items-center gap-4 p-3 bg-surface-container-lowest rounded-xl border border-black/6">
                    <div className="text-center shrink-0">
                      <p className="font-body text-sm font-bold text-on-surface">
                        {new Date(b.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="font-body text-[9px] text-on-surface-variant">
                        {new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="w-px self-stretch bg-black/8 shrink-0" />
                    <div className="flex-1">
                      <p className="font-body text-[11px] font-semibold text-on-surface">{b.type} · {b.durationMins} min</p>
                      {b.notes && <p className="font-body text-[10px] text-on-surface-variant mt-0.5 italic">{b.notes}</p>}
                    </div>
                    <span className="font-body text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-surface-container text-on-surface-variant shrink-0">
                      {b.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offer sent confirmation */}
          {offer && (
            <div className="bg-green-50 rounded-2xl border border-green-200 px-5 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-body text-[9px] text-green-700 uppercase tracking-widest font-semibold">Offer Submitted</p>
                  <p className="font-display text-2xl font-bold text-green-800 mt-1">
                    {offer.currency} {offer.totalPrice.toLocaleString()}
                  </p>
                  <p className="font-body text-[11px] text-green-700 mt-0.5">Valid for {offer.validDays} days · Sent {timeAgo(offer.sentAt)}</p>
                </div>
                <button
                  onClick={() => setShowOffer(true)}
                  className="font-body text-[10px] text-green-700 border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-all font-semibold"
                >
                  Edit
                </button>
              </div>
              {offer.inclusions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-green-200 flex flex-wrap gap-1.5">
                  {offer.inclusions.map(item => (
                    <span key={item} className="font-body text-[9px] text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-semibold">{item}</span>
                  ))}
                </div>
              )}
              {offer.notes && <p className="mt-2 font-body text-[11px] text-green-700 italic">{offer.notes}</p>}
            </div>
          )}

          {/* SmartMatch — the shortlist Oia sent the patient */}
          {matches.length > 0 && (
            <div className="bg-white rounded-2xl border border-black/8 px-5 py-4">
              <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold mb-3">Matched Surgeons (SmartMatch)</p>
              {matches.map(m => (
                <div key={m.id} className="mb-4 last:mb-0">
                  <p className="font-body text-[11px] text-on-surface-variant mb-2">{m.treatmentName}{m.cluster ? ` · ${m.cluster}` : ''}</p>
                  <div className="space-y-2">
                    {m.items.map(it => (
                      <div key={it.id} className="border border-black/8 rounded-xl px-3 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-body text-[13px] font-semibold text-on-surface truncate">#{it.rank} {it.provider.surgeonName}</p>
                            <p className="font-body text-[11px] text-on-surface-variant truncate">{it.provider.clinicName ?? '—'} · {it.provider.city ?? '—'}</p>
                          </div>
                          <div className="text-right shrink-0">
                            {it.provider.reviewRating != null && <p className="font-body text-[11px] text-on-surface-variant">{it.provider.reviewRating}★ ({it.provider.reviewCount})</p>}
                            <span className="inline-block font-body text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-black/5 text-on-surface-variant mt-0.5">{it.negotiationStatus}</span>
                          </div>
                        </div>
                        <p className="font-body text-[11px] text-on-surface-variant mt-1.5">{it.provider.accreditations.slice(0, 3).join(' · ')}</p>
                        {it.reasons.length > 0 && <p className="font-body text-[11px] text-on-surface-variant/80 mt-1">{it.reasons[0]}</p>}
                        <div className="flex items-center gap-3 mt-2">
                          {it.provider.whatsapp && <a href={`https://wa.me/${it.provider.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener" className="font-body text-[11px] text-[#25D366] font-semibold">WhatsApp ↗</a>}
                          {it.provider.website && <a href={`https://${it.provider.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener" className="font-body text-[11px] text-on-surface-variant">Website ↗</a>}
                          {!it.provider.verified && <span className="font-body text-[10px] italic text-on-surface-variant">unverified</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Clinic negotiations — Oia ↔ clinic quotes */}
          {clinicQuotes.length > 0 && (
            <div className="bg-white rounded-2xl border border-black/8 px-5 py-4">
              <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold mb-3">Clinic Negotiations (Oia)</p>
              <div className="space-y-3">
                {clinicQuotes.map(cq => {
                  const q = cq.quote;
                  const open = expandedQuote === cq.sessionId;
                  const status = q?.negotiationStatus ?? 'in_progress';
                  return (
                    <div key={cq.sessionId} className="border border-outline-variant/30 rounded-xl px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-body text-sm font-semibold text-on-surface">{q?.clinicName || q?.clinicPhone || 'Clinic'}</p>
                          <p className="font-body text-[11px] text-on-surface-variant mt-0.5">{q?.procedure}{q?.validUntil ? ` · valid ${q.validUntil}` : ''}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {q?.headlinePrice != null && (
                            <p className="font-display text-xl font-bold text-on-surface">{q.currency ? `${q.currency} ` : ''}{q.headlinePrice.toLocaleString()}</p>
                          )}
                          <span className={`font-body text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${status === 'agreed' ? 'bg-green-100 text-green-700' : status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{status.replace('_', ' ')}</span>
                        </div>
                      </div>
                      {q?.inclusions && q.inclusions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {q.inclusions.map(item => (
                            <span key={item} className="font-body text-[9px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{item}</span>
                          ))}
                        </div>
                      )}
                      {q?.exclusions && q.exclusions.length > 0 && (
                        <p className="mt-2 font-body text-[10px] text-on-surface-variant">Excludes: {q.exclusions.join(', ')}</p>
                      )}
                      {q?.notes && <p className="mt-2 font-body text-[11px] text-on-surface-variant italic">{q.notes}</p>}
                      {!q?.linked && <p className="mt-2 font-body text-[10px] text-amber-700">⚠ Not auto-linked to this patient — matched manually.</p>}
                      {cq.transcript.length > 0 && (
                        <>
                          <button onClick={() => setExpandedQuote(open ? null : cq.sessionId)} className="mt-2 font-body text-[10px] text-primary font-semibold hover:underline">
                            {open ? 'Hide' : 'View'} negotiation ({cq.transcript.length} messages)
                          </button>
                          {open && (
                            <div className="mt-2 space-y-2 border-t border-outline-variant/20 pt-2">
                              {cq.transcript.map((m, i) => (
                                <div key={i} className={m.role === 'NIA' ? 'text-right' : 'text-left'}>
                                  <span className="font-body text-[9px] uppercase tracking-wider text-on-surface-variant">{m.role === 'NIA' ? 'Oia' : 'Clinic'}</span>
                                  <p className={`font-body text-[12px] inline-block px-3 py-1.5 rounded-xl ${m.role === 'NIA' ? 'bg-primary/10 text-on-surface' : 'bg-surface-container text-on-surface'}`}>{m.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: sidebar ─────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* AI Analysis */}
          {(detail.aiScore !== null || detail.aiRationale) && (
            <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-black/6">
                <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold">AI Analysis</p>
              </div>
              <div className="px-5 py-5">
                {detail.aiScore !== null && (
                  <>
                    <p className="font-display text-5xl font-bold text-primary leading-none">{detail.aiScore}%</p>
                    <div className="h-1.5 bg-surface-container rounded-full overflow-hidden mt-3 mb-3">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${detail.aiScore}%` }} />
                    </div>
                  </>
                )}
                {detail.aiPriority && (
                  <span className={`inline-block font-body text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3 ${priorityColor}`}>
                    Priority: {detail.aiPriority}
                  </span>
                )}
                {detail.aiRationale && (
                  <p className="font-body text-[11px] text-on-surface-variant leading-relaxed border-l-2 border-primary/30 pl-3">{detail.aiRationale}</p>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-black/8 px-5 py-4">
            <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold mb-4">Timeline</p>
            <div className="space-y-0">
              {[
                { label: 'Submitted', sub: `Lead created via ${detail.source}`, time: detail.createdAt, dot: 'bg-primary' },
                { label: 'AI Analysis', sub: `Score: ${detail.aiScore ?? '—'}%`, time: detail.createdAt, dot: 'bg-primary' },
                ...(detail.claimedAt ? [{ label: 'Claimed', sub: detail.coordinator?.user.name ?? 'Coordinator', time: detail.claimedAt, dot: 'bg-secondary' }] : []),
                ...(offer ? [{ label: 'Offer Sent', sub: `${offer.currency} ${offer.totalPrice.toLocaleString()}`, time: offer.sentAt, dot: 'bg-green-500' }] : []),
                ...(detail.patientSelectedAt ? [{ label: 'Patient Selected Your Clinic', sub: 'Conversation now accessible', time: detail.patientSelectedAt, dot: 'bg-primary' }] : []),
                ...(proposal ? [{ label: 'Treatment Proposal Sent', sub: `By ${proposal.sentBy}`, time: proposal.sentAt, dot: 'bg-secondary' }] : []),
                ...(detail.closedAt ? [{ label: 'Case Closed', sub: detail.closureOutcome ? detail.closureOutcome.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Completed', time: detail.closedAt, dot: 'bg-on-surface' }] : []),
              ].map((item, i, arr) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${item.dot}`} />
                    {i < arr.length - 1 && <div className="w-px flex-1 bg-black/10 my-1" />}
                  </div>
                  <div className="pb-3 min-w-0">
                    <p className="font-body text-[11px] font-semibold text-on-surface">{item.label}</p>
                    <p className="font-body text-[10px] text-on-surface-variant">{item.sub}</p>
                    <p className="font-body text-[9px] text-on-surface-variant/60 mt-0.5">{formatDatetime(item.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coordinator + source */}
          <div className="bg-white rounded-2xl border border-black/8 px-5 py-4 space-y-3">
            <div>
              <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider">Assigned Coordinator</p>
              <p className="font-body text-sm font-semibold text-on-surface mt-0.5">{detail.coordinator?.user.name ?? 'Unassigned'}</p>
            </div>
            <div>
              <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider">Source</p>
              <p className="font-body text-sm font-semibold text-on-surface mt-0.5 capitalize">{detail.source}</p>
            </div>
            {detail.patientLocation && (
              <div>
                <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider">Patient Location</p>
                <p className="font-body text-sm font-semibold text-on-surface mt-0.5">{detail.patientLocation}</p>
              </div>
            )}
          </div>

          {/* Closure summary */}
          {detail.status === 'CLOSED' && detail.closedAt && (
            <div className="bg-white rounded-2xl border border-black/8 px-5 py-4 space-y-3">
              <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold">Case Closed</p>
              <div>
                <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider">Outcome</p>
                <p className="font-body text-sm font-semibold text-on-surface mt-0.5 capitalize">{(detail.closureOutcome ?? 'successful').replace(/_/g, ' ')}</p>
              </div>
              {detail.departureDate && (
                <div>
                  <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider">Departure</p>
                  <p className="font-body text-sm font-semibold text-on-surface mt-0.5">{new Date(detail.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              )}
              {detail.followUpDays.length > 0 && (
                <div>
                  <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider">Follow-up days</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {detail.followUpDays.map(d => (
                      <span key={d} className="font-body text-[9px] font-semibold px-2 py-0.5 rounded-full bg-primary-fixed/50 text-primary">Day {d}</span>
                    ))}
                  </div>
                </div>
              )}
              {detail.closureNotes && (
                <div>
                  <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-wider">Notes</p>
                  <p className="font-body text-[11px] text-on-surface mt-0.5 leading-relaxed">{detail.closureNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* WhatsApp action */}
          <button
            onClick={() => {
              if (!isRevealed) return;
              const number = patient.whatsappNumber ?? patient.user.phone;
              if (number) window.open(`https://web.whatsapp.com/send?phone=${number.replace(/\D/g, '')}`, '_blank');
            }}
            disabled={!isRevealed}
            title={!isRevealed ? 'Contact details revealed after patient selects your clinic' : undefined}
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-xl font-body text-[10px] uppercase tracking-wider font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
            </svg>
            Contact on WhatsApp
          </button>
        </div>
      </div>

      {/* Send Offer Modal */}
      {showOffer && (
        <SendOfferModal
          leadId={detail.id}
          existingOffer={offer}
          onClose={() => setShowOffer(false)}
          onSent={(o) => { setOffer(o); setShowOffer(false); }}
        />
      )}

      {/* Close Case Modal */}
      {showClose && (
        <CloseCaseModal
          leadId={detail.id}
          patientName={isRevealed ? patient.user.name : 'Patient'}
          onClose={() => setShowClose(false)}
          onClosed={() => { setShowClose(false); load(); }}
        />
      )}

      {/* Send Proposal Modal */}
      {showProposal && (
        <SendProposalModal
          leadId={detail.id}
          existing={proposal}
          onClose={() => setShowProposal(false)}
          onSent={(p) => { setShowProposal(false); setProposal(p); }}
        />
      )}

      <BottomTabNav />
    </div>
  );
}
