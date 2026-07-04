'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Procedure = { id: string; name: string; category: string };
type Clinic = { id: string; name: string; city: string };

const MEDICAL_FIELDS: [string, string][] = [
  ['diabetes', 'Diabetes'], ['cancerTreatment', 'Cancer / treatment'],
  ['organTransplant', 'Organ transplant'], ['dvt', 'DVT / blood clots'],
  ['pacemaker', 'Pacemaker'], ['hypertension', 'Hypertension'],
  ['bloodClotting', 'Blood clotting disorder'], ['heartDisease', 'Heart disease'],
  ['thyroidDisorder', 'Thyroid disorder'], ['immuneDisorder', 'Immune disorder'],
  ['pregnancy', 'Pregnant / trying'], ['allergies', 'Drug allergies'],
];

const LANGUAGES = ['English', 'Arabic', 'French', 'German', 'Spanish', 'Turkish', 'Russian', 'Italian', 'Portuguese'];
const SOURCES = ['whatsapp', 'web', 'instagram', 'referral', 'google', 'tiktok'];

export default function AdminIntakePageWrapper() {
  return <Suspense><AdminIntakePage /></Suspense>;
}

function AdminIntakePage() {
  const router = useRouter();
  const params = useSearchParams();
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null);

  // Form state — prefill from query params (passed by "Convert to Lead" button on inquiries page)
  const [name, setName] = useState(params.get('name') ?? '');
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [phone, setPhone] = useState(params.get('phone') ?? '');
  const [dob, setDob] = useState(params.get('dob') ?? '');
  const [country, setCountry] = useState(params.get('country') ?? '');
  const [language, setLanguage] = useState(params.get('language') ?? 'English');
  const [location, setLocation] = useState('');
  const [source, setSource] = useState('whatsapp');
  const [procedureId, setProcedureId] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [aiScore, setAiScore] = useState(70);
  const [aiPriority, setAiPriority] = useState('Medium');
  const [aiRationale, setAiRationale] = useState('');
  const [intent, setIntent] = useState(params.get('intent') ?? '');
  const [medicalScreening, setMedicalScreening] = useState<Record<string, boolean>>(
    Object.fromEntries(MEDICAL_FIELDS.map(([k]) => [k, false]))
  );

  useEffect(() => {
    fetch('/api/admin/intake').then(r => r.ok ? r.json() : { procedures: [], clinics: [] }).then(d => {
      setProcedures(d.procedures);
      setClinics(d.clinics);
      if (d.clinics[0]) setClinicId(d.clinics[0].id);
      // Match procedure by name if passed in query params
      const procName = params.get('procedure')?.toLowerCase();
      const matched = procName ? d.procedures.find((p: Procedure) => p.name.toLowerCase().includes(procName)) : null;
      setProcedureId(matched?.id ?? d.procedures[0]?.id ?? '');
    });
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, phone, dateOfBirth: dob,
          countryOfResidence: country, preferredLanguage: language,
          patientLocation: location || country,
          source, procedureId, clinicId,
          aiScore, aiPriority, aiRationale: aiRationale || null,
          intent: intent || null, medicalScreening,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedLeadId(data.leadId);
        setStep(4);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? `Server error ${res.status}`);
      }
    } catch (e) {
      setError('Network error — please try again');
      console.error('handleSubmit failed', e);
    } finally {
      setSubmitting(false);
    }
  };

  const priorityColor = aiPriority === 'High' ? 'text-red-400' : aiPriority === 'Medium' ? 'text-yellow-400' : 'text-green-400';

  if (step === 4 && createdLeadId) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 p-8">
        <div className="w-16 h-16 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
          </svg>
        </div>
        <div className="text-center">
          <h2 className="font-display text-2xl text-white">Lead created</h2>
          <p className="font-body text-[13px] text-white/40 mt-1">Patient intake processed successfully. The lead is now visible to the assigned clinic.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setStep(1); setCreatedLeadId(null); setName(''); setEmail(''); setPhone(''); setDob(''); setCountry(''); setLocation(''); setIntent(''); setAiRationale(''); }}
            className="px-5 py-2.5 border border-white/10 text-white/60 rounded-xl font-body text-[11px] font-semibold hover:border-white/20 hover:text-white/80 transition-all">
            New intake
          </button>
          <button onClick={() => router.push('/admin')} className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-body text-[11px] font-semibold hover:opacity-90 transition-all">
            View pipeline →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 py-5 border-b border-white/8 shrink-0">
        <h1 className="font-display text-2xl text-white">Patient Intake</h1>
        <p className="font-body text-[11px] text-white/40 mt-0.5">Process a new patient enquiry and create a qualified lead</p>
      </div>

      {/* Step indicator */}
      <div className="px-6 py-3 border-b border-white/8 flex items-center gap-2 shrink-0">
        {['Patient info', 'Procedure & clinic', 'AI analysis', 'Submit'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 cursor-pointer`} onClick={() => i < step - 1 && setStep(i + 1)}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all ${
                step === i + 1 ? 'border-primary bg-primary text-on-primary' :
                step > i + 1 ? 'border-green-400 bg-green-400/10 text-green-400' :
                'border-white/20 text-white/30'
              }`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`font-body text-[10px] font-semibold ${step === i + 1 ? 'text-white' : step > i + 1 ? 'text-green-400' : 'text-white/30'}`}>{label}</span>
            </div>
            {i < 3 && <div className="w-6 h-px bg-white/10 mx-1" />}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Step 1: Patient info */}
        {step === 1 && (
          <div className="max-w-2xl space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-body text-[9px] text-white/40 uppercase tracking-widest block mb-1.5">Full name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Sarah Mitchell"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-body text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="font-body text-[9px] text-white/40 uppercase tracking-widest block mb-1.5">Email <span className="text-white/20">(optional for WhatsApp patients)</span></label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@email.com — leave blank to auto-generate"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-body text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="font-body text-[9px] text-white/40 uppercase tracking-widest block mb-1.5">WhatsApp / Phone *</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44 7700 900000"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-body text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="font-body text-[9px] text-white/40 uppercase tracking-widest block mb-1.5">Date of birth *</label>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-body text-sm text-white focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="font-body text-[9px] text-white/40 uppercase tracking-widest block mb-1.5">Country of residence *</label>
                <input value={country} onChange={e => setCountry(e.target.value)} placeholder="United Kingdom"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-body text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="font-body text-[9px] text-white/40 uppercase tracking-widest block mb-1.5">Preferred language *</label>
                <select value={language} onChange={e => setLanguage(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-body text-sm text-white focus:outline-none focus:border-primary">
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="font-body text-[9px] text-white/40 uppercase tracking-widest block mb-1.5">Location (city)</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="London, UK"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-body text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="font-body text-[9px] text-white/40 uppercase tracking-widest block mb-1.5">Source</label>
                <select value={source} onChange={e => setSource(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-body text-sm text-white focus:outline-none focus:border-primary">
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <p className="font-body text-[9px] text-white/40 uppercase tracking-widest mb-3">Medical screening</p>
              <div className="grid grid-cols-2 gap-2">
                {MEDICAL_FIELDS.map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2.5 px-3 py-2.5 bg-white/5 border border-white/8 rounded-xl cursor-pointer hover:border-white/20 transition-all">
                    <input type="checkbox" checked={medicalScreening[key]} onChange={e => setMedicalScreening(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="accent-primary" />
                    <span className="font-body text-[11px] text-white/70">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Procedure & clinic */}
        {step === 2 && (
          <div className="max-w-2xl space-y-6">
            <div>
              <label className="font-body text-[9px] text-white/40 uppercase tracking-widest block mb-3">Procedure *</label>
              <div className="grid grid-cols-2 gap-2">
                {procedures.map(p => (
                  <button key={p.id} onClick={() => setProcedureId(p.id)}
                    className={`text-left px-4 py-3 rounded-xl border transition-all ${
                      procedureId === p.id ? 'border-primary bg-primary/10 text-white' : 'border-white/10 text-white/60 hover:border-white/20'
                    }`}>
                    <p className="font-body text-[12px] font-semibold">{p.name}</p>
                    <p className="font-body text-[9px] capitalize" style={{ color: procedureId === p.id ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)' }}>{p.category}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-body text-[9px] text-white/40 uppercase tracking-widest block mb-3">Assign to clinic *</label>
              <div className="space-y-2">
                {clinics.map(c => (
                  <button key={c.id} onClick={() => setClinicId(c.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between ${
                      clinicId === c.id ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20'
                    }`}>
                    <div>
                      <p className={`font-body text-[13px] font-semibold ${clinicId === c.id ? 'text-white' : 'text-white/60'}`}>{c.name}</p>
                      <p className="font-body text-[10px] text-white/30">{c.city}</p>
                    </div>
                    {clinicId === c.id && <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center"><span className="text-[8px] text-white font-bold">✓</span></div>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-body text-[9px] text-white/40 uppercase tracking-widest block mb-1.5">Patient intent (summary)</label>
              <textarea rows={3} value={intent} onChange={e => setIntent(e.target.value)}
                placeholder="e.g. Patient wants a natural-looking rhinoplasty to refine the nasal tip. Has done research on Turkish clinics."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-body text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary resize-none" />
            </div>
          </div>
        )}

        {/* Step 3: AI analysis */}
        {step === 3 && (
          <div className="max-w-2xl space-y-6">
            <div>
              <label className="font-body text-[9px] text-white/40 uppercase tracking-widest block mb-2">AI suitability score: <span className="text-white font-semibold text-[13px]">{aiScore}</span></label>
              <input type="range" min={0} max={100} step={1} value={aiScore} onChange={e => setAiScore(Number(e.target.value))}
                className="w-full" />
              <div className="flex justify-between font-body text-[9px] text-white/30 mt-1"><span>0 — low</span><span>100 — high</span></div>
            </div>

            <div>
              <label className="font-body text-[9px] text-white/40 uppercase tracking-widest block mb-2">Priority</label>
              <div className="flex gap-3">
                {['High', 'Medium', 'Low'].map(p => (
                  <button key={p} onClick={() => setAiPriority(p)}
                    className={`flex-1 py-2.5 rounded-xl border font-body text-[11px] font-semibold transition-all ${
                      aiPriority === p ? `border-current ${p === 'High' ? 'border-red-400 bg-red-400/10 text-red-400' : p === 'Medium' ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-green-400 bg-green-400/10 text-green-400'}` :
                      'border-white/10 text-white/40 hover:border-white/20'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-body text-[9px] text-white/40 uppercase tracking-widest block mb-1.5">AI rationale</label>
              <textarea rows={4} value={aiRationale} onChange={e => setAiRationale(e.target.value)}
                placeholder="e.g. Patient has researched procedures extensively, asked detailed pre-op questions, and indicated a 3-month travel window. Medical history is clear with no contraindications."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-body text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary resize-none" />
            </div>

            {/* Preview card */}
            <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
              <p className="font-body text-[9px] text-white/30 uppercase tracking-widest mb-3">Lead preview</p>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-body text-[13px] font-semibold text-white">{name || '—'}</p>
                  <p className="font-body text-[10px] text-white/40">{procedures.find(p => p.id === procedureId)?.name ?? '—'} · {country || '—'}</p>
                </div>
                <span className={`font-body text-[10px] font-semibold ${priorityColor}`}>{aiPriority}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${aiScore}%` }} />
                </div>
                <span className="font-body text-[11px] text-white font-semibold">{aiScore}</span>
              </div>
            </div>
          </div>
        )}

        {error && <p className="font-body text-[12px] text-red-400 mt-4">{error}</p>}
      </div>

      {/* Footer nav */}
      <div className="px-6 py-4 border-t border-white/8 flex justify-between shrink-0">
        <button onClick={() => step > 1 && setStep(s => s - 1)}
          disabled={step === 1}
          className="px-5 py-2.5 border border-white/10 text-white/50 rounded-xl font-body text-[11px] font-semibold disabled:opacity-30 hover:border-white/20 hover:text-white/70 transition-all">
          ← Back
        </button>
        {step < 3 ? (
          <button onClick={() => setStep(s => s + 1)}
            className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-body text-[11px] font-semibold hover:opacity-90 transition-all">
            Continue →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting}
            className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-body text-[11px] font-semibold hover:opacity-90 transition-all disabled:opacity-50">
            {submitting ? 'Creating lead…' : 'Create lead →'}
          </button>
        )}
      </div>
    </div>
  );
}
