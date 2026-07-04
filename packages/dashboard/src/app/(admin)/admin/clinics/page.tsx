'use client';

import { useEffect, useState } from 'react';

const PROCEDURE_GROUPS: { category: string; items: string[] }[] = [
  { category: 'Body Surgery', items: ['Brazilian Butt Lift (BBL)', 'Liposuction', 'Mummy Makeover', 'Tummy Tuck', 'Arm Lift', 'Thigh Lift', 'Laser Liposuction', 'Vaser Liposuction', '360 Liposuction'] },
  { category: 'Breast Surgery', items: ['Breast Enlargement', 'Breast Reduction', 'Breast Lift', 'Natural Breast Enlargement', 'Breast Implant Replacement', 'Breast Reconstruction', 'Nipple Reduction'] },
  { category: 'Facial Surgery', items: ['Rhinoplasty', 'Facelift', 'Mini Facelift', 'Neck Lift', 'Eyelid Surgery', 'Brow Lift', 'Lip Lift', 'Chin Liposuction', 'Otoplasty'] },
  { category: 'Fat Transfer', items: ['Fat Transfer to Face', 'Fat Transfer to Body', 'Fat Transfer to Breasts'] },
  { category: 'Gender Surgery', items: ['Facial Feminisation', 'FTM Top Surgery', 'MTF Top Surgery', 'Non-Binary Surgery'] },
  { category: 'Cosmetic Gynaecology', items: ['Labiaplasty', 'Gynaecological Fat Transfer', 'Hoodectomy', 'Perineum and Pelvic Floor Repair', 'Vaginal Rejuvenation', 'Vaginal Tightening'] },
  { category: 'Post Weight Loss', items: ['Body Contouring', 'Facial Contouring', 'Apronectomy'] },
  { category: 'For Men', items: ['Abdominoplasty for Men', 'Blepharoplasty for Men', 'Face Lift for Men', 'Hair Transplant', 'Liposuction for Men', 'Male Breast Reduction', 'Otoplasty for Men', 'Rhinoplasty for Men', 'Abdominal Etching'] },
  { category: 'Dermatology – General', items: ['Acne Treatments', 'Dermatitis', 'Eczema', 'Hyperhidrosis (Excessive Sweating)', 'Milia Removal', 'Paediatric Dermatology', 'Pigmentation', 'Psoriasis', 'Rosacea'] },
  { category: 'Dermatology – Mole & Skin Cancer', items: ['Cryotherapy', 'Cyst Removal', 'Lipoma Removal', 'Mohs Surgery', 'Mole Check & Mole Mapping', 'Mole Removal', 'Skin Cancers and Melanomas', 'Skin Lumps (Warts, Moles, Skin Tags)'] },
  { category: 'Skin Rejuvenation', items: ['AgeJET Nitrogen Plasma', 'FaceTite', 'Microneedling Dermapen', 'Morpheus8', 'Scar Treatment', 'Skin Boosters', 'Varicose Veins', 'White Scar Treatment'] },
  { category: 'Injectables', items: ['Anti-Wrinkle Injections', 'Cheek Fillers', 'Dermal Fillers', 'Lip Fillers', 'Non-Surgical Rhinoplasty', 'Polynucleotides', 'Profhilo', 'Tear Trough Filler', 'Weight Loss Medication'] },
];

const ACCREDITATION_OPTIONS = ['JCI', 'ISO 9001', 'ISO 14001', 'TEMOS', 'EU Standards', 'JACIE'];

type Clinic = {
  id: string; name: string; city: string; country: string;
  description: string | null; shortDescription: string | null;
  website: string | null; whatsappNumber: string | null; internalNotes: string | null;
  niaScore: number | null; specialties: string[]; accreditations: string[];
  isVerified: boolean; isActive: boolean; createdAt: string;
  totalLeads: number; selectedLeads: number; conversionRate: number; avgOfferEur: number | null;
};

type FormData = {
  name: string; city: string; country: string;
  description: string; shortDescription: string;
  website: string; whatsappNumber: string; internalNotes: string;
  niaScore: string; specialties: string[]; accreditations: string[];
  isVerified: boolean; isActive: boolean;
};

const EMPTY_FORM: FormData = {
  name: '', city: '', country: '', description: '', shortDescription: '',
  website: '', whatsappNumber: '', internalNotes: '',
  niaScore: '', specialties: [], accreditations: [],
  isVerified: false, isActive: true,
};

function ScoreDots({ score }: { score: number | null }) {
  if (!score) return <span className="font-body text-white/20 text-xs">—</span>;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className={`w-2 h-2 rounded-full ${i < score ? 'bg-primary-fixed' : 'bg-white/10'}`} />
      ))}
      <span className="font-body text-[10px] text-white/50 ml-1">{score}/10</span>
    </div>
  );
}

function Tag({ label, color = 'default' }: { label: string; color?: 'green' | 'blue' | 'default' }) {
  const cls = {
    green: 'text-green-400 bg-green-400/10 border-green-400/20',
    blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    default: 'text-white/50 bg-white/5 border-white/10',
  }[color];
  return <span className={`font-body text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>;
}

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Clinic | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/admin/clinics').then(r => r.ok ? r.json() : []).then(setClinics).finally(() => setLoading(false));
  }, []);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  }

  function openEdit(c: Clinic) {
    setEditing(c);
    setForm({
      name: c.name, city: c.city, country: c.country,
      description: c.description ?? '', shortDescription: c.shortDescription ?? '',
      website: c.website ?? '', whatsappNumber: c.whatsappNumber ?? '',
      internalNotes: c.internalNotes ?? '',
      niaScore: c.niaScore?.toString() ?? '',
      specialties: c.specialties, accreditations: c.accreditations,
      isVerified: c.isVerified, isActive: c.isActive,
    });
    setDrawerOpen(true);
  }

  function toggleTag(field: 'specialties' | 'accreditations', value: string) {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter(v => v !== value)
        : [...f[field], value],
    }));
  }

  function toggleCategory(category: string) {
    setOpenCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  }

  function toggleAllInCategory(items: string[], allSelected: boolean) {
    setForm(f => ({
      ...f,
      specialties: allSelected
        ? f.specialties.filter(s => !items.includes(s))
        : [...f.specialties, ...items.filter(i => !f.specialties.includes(i))],
    }));
  }

  async function save() {
    if (!form.name || !form.city || !form.country) return;
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch('/api/admin/clinics', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, ...form, niaScore: form.niaScore || null }),
        });
        if (res.ok) {
          const updated = await res.json();
          setClinics(prev => prev.map(c => c.id === editing.id ? { ...c, ...updated } : c));
        }
      } else {
        const res = await fetch('/api/admin/clinics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, niaScore: form.niaScore || null }),
        });
        if (res.ok) {
          const created = await res.json();
          setClinics(prev => [{ ...created, totalLeads: 0, selectedLeads: 0, conversionRate: 0, avgOfferEur: null }, ...prev]);
        }
      }
      setDrawerOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function toggleField(id: string, field: 'isVerified' | 'isActive', current: boolean) {
    const res = await fetch('/api/admin/clinics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field]: !current }),
    });
    if (res.ok) setClinics(prev => prev.map(c => c.id === id ? { ...c, [field]: !current } : c));
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/8 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">Clinics</h1>
          <p className="font-body text-[11px] text-white/40 mt-0.5">{clinics.length} clinics in network</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-body text-sm font-semibold hover:opacity-90 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Add Clinic
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {loading && <p className="font-body text-white/40 text-center py-12">Loading…</p>}
        {!loading && clinics.length === 0 && (
          <div className="text-center py-20">
            <p className="font-display text-white/30 text-xl mb-2">No clinics yet</p>
            <p className="font-body text-white/20 text-sm">Add your first clinic to start sending patient leads.</p>
          </div>
        )}

        {clinics.map(c => {
          const expanded = expandedId === c.id;
          return (
            <div key={c.id} className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
              {/* Main row */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-lg text-white">{c.name}</h2>
                      {c.isVerified && <Tag label="Verified" color="green" />}
                      {!c.isActive && <Tag label="Inactive" />}
                      {c.accreditations.map(a => <Tag key={a} label={a} color="blue" />)}
                    </div>
                    <p className="font-body text-[11px] text-white/40 mt-0.5">{c.city}, {c.country}</p>
                    <div className="mt-2">
                      <ScoreDots score={c.niaScore} />
                    </div>
                    {c.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.specialties.map(s => (
                          <span key={s} className="font-body text-[9px] text-white/40 bg-white/5 px-2 py-0.5 rounded-md">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(c)}
                      className="px-3 py-1.5 rounded-lg font-body text-[10px] font-semibold border border-white/10 text-white/50 hover:border-white/30 hover:text-white transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleField(c.id, 'isVerified', c.isVerified)}
                      className={`px-3 py-1.5 rounded-lg font-body text-[10px] font-semibold border transition-all ${c.isVerified ? 'border-green-400/30 text-green-400 hover:bg-green-400/10' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'}`}
                    >
                      {c.isVerified ? '✓ Verified' : 'Verify'}
                    </button>
                    <button
                      onClick={() => setExpandedId(expanded ? null : c.id)}
                      className="px-3 py-1.5 rounded-lg font-body text-[10px] font-semibold border border-white/10 text-white/40 hover:border-white/20 hover:text-white/60 transition-all"
                    >
                      {expanded ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/8">
                  {[
                    { label: 'Total Leads', value: c.totalLeads },
                    { label: 'Selected', value: c.selectedLeads },
                    { label: 'Conversion', value: `${c.conversionRate}%` },
                    { label: 'Avg Offer', value: c.avgOfferEur ? `€${c.avgOfferEur.toLocaleString()}` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="font-body text-[9px] text-white/30 uppercase tracking-wider">{label}</p>
                      <p className="font-display text-xl text-white mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expanded detail */}
              {expanded && (
                <div className="px-5 pb-5 border-t border-white/8 pt-4 grid grid-cols-2 gap-4">
                  {c.description && (
                    <div className="col-span-2">
                      <p className="font-body text-[9px] text-white/30 uppercase tracking-wider mb-1">Description</p>
                      <p className="font-body text-sm text-white/60">{c.description}</p>
                    </div>
                  )}
                  {c.website && (
                    <div>
                      <p className="font-body text-[9px] text-white/30 uppercase tracking-wider mb-1">Website</p>
                      <a href={c.website} target="_blank" rel="noopener" className="font-body text-sm text-primary-fixed hover:underline">{c.website}</a>
                    </div>
                  )}
                  {c.whatsappNumber && (
                    <div>
                      <p className="font-body text-[9px] text-white/30 uppercase tracking-wider mb-1">WhatsApp</p>
                      <p className="font-body text-sm text-white/60">{c.whatsappNumber}</p>
                    </div>
                  )}
                  {c.internalNotes && (
                    <div className="col-span-2">
                      <p className="font-body text-[9px] text-white/30 uppercase tracking-wider mb-1">Internal Notes</p>
                      <p className="font-body text-sm text-white/40 italic">{c.internalNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="relative ml-auto w-full max-w-lg bg-[#0f1117] border-l border-white/8 flex flex-col h-full overflow-hidden">
            {/* Drawer header */}
            <div className="px-6 py-5 border-b border-white/8 flex items-center justify-between shrink-0">
              <h2 className="font-display text-xl text-white">{editing ? 'Edit Clinic' : 'Add Clinic'}</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {/* Basic info */}
              <section className="space-y-4">
                <p className="font-body text-[9px] text-white/30 uppercase tracking-widest">Basic Info</p>
                <Field label="Clinic Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Istanbul Aesthetic Centre" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City *" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} placeholder="Istanbul" />
                  <Field label="Country *" value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} placeholder="Turkey" />
                </div>
                <Field label="Short Description" value={form.shortDescription} onChange={v => setForm(f => ({ ...f, shortDescription: v }))} placeholder="One-line shown to patients" />
                <TextArea label="Full Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Detailed clinic overview" />
              </section>

              {/* Contact */}
              <section className="space-y-4 pt-2 border-t border-white/8">
                <p className="font-body text-[9px] text-white/30 uppercase tracking-widest">Contact</p>
                <Field label="Website" value={form.website} onChange={v => setForm(f => ({ ...f, website: v }))} placeholder="https://clinic.com" />
                <Field label="WhatsApp Number" value={form.whatsappNumber} onChange={v => setForm(f => ({ ...f, whatsappNumber: v }))} placeholder="+90 5551234567" />
              </section>

              {/* NIA Score */}
              <section className="space-y-4 pt-2 border-t border-white/8">
                <p className="font-body text-[9px] text-white/30 uppercase tracking-widest">Nia Score (1–10)</p>
                <div className="flex items-center gap-3">
                  {Array.from({ length: 10 }, (_, i) => {
                    const val = (i + 1).toString();
                    const selected = form.niaScore === val;
                    return (
                      <button
                        key={i}
                        onClick={() => setForm(f => ({ ...f, niaScore: selected ? '' : val }))}
                        className={`w-8 h-8 rounded-lg font-body text-sm font-semibold border transition-all ${selected ? 'bg-primary text-on-primary border-primary' : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white/70'}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Specialties */}
              <section className="space-y-2 pt-2 border-t border-white/8">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-body text-[9px] text-white/30 uppercase tracking-widest">Specialties</p>
                  {form.specialties.length > 0 && (
                    <span className="font-body text-[9px] text-primary-fixed">{form.specialties.length} selected</span>
                  )}
                </div>
                <div className="space-y-1">
                  {PROCEDURE_GROUPS.map(({ category, items }) => {
                    const isOpen = openCategories.includes(category);
                    const selectedInGroup = items.filter(i => form.specialties.includes(i));
                    const allSelected = selectedInGroup.length === items.length;
                    return (
                      <div key={category} className="border border-white/8 rounded-xl overflow-hidden">
                        {/* Category header */}
                        <div className="flex items-center gap-3 px-3 py-2.5 bg-white/3">
                          <button
                            onClick={() => toggleAllInCategory(items, allSelected)}
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${allSelected ? 'bg-primary border-primary' : selectedInGroup.length > 0 ? 'bg-primary/40 border-primary/40' : 'border-white/20 hover:border-white/40'}`}
                          >
                            {allSelected && (
                              <svg className="w-2.5 h-2.5 text-on-primary" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                              </svg>
                            )}
                            {!allSelected && selectedInGroup.length > 0 && (
                              <div className="w-2 h-0.5 bg-white rounded" />
                            )}
                          </button>
                          <button
                            onClick={() => toggleCategory(category)}
                            className="flex-1 flex items-center justify-between text-left"
                          >
                            <span className="font-body text-sm text-white/70 font-semibold">{category}</span>
                            <div className="flex items-center gap-2">
                              {selectedInGroup.length > 0 && (
                                <span className="font-body text-[9px] text-primary-fixed bg-primary/10 px-1.5 py-0.5 rounded-full">{selectedInGroup.length}/{items.length}</span>
                              )}
                              <svg className={`w-3.5 h-3.5 text-white/30 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                              </svg>
                            </div>
                          </button>
                        </div>
                        {/* Items */}
                        {isOpen && (
                          <div className="px-3 py-2 grid grid-cols-1 gap-1 border-t border-white/8 bg-white/[0.02]">
                            {items.map(item => {
                              const checked = form.specialties.includes(item);
                              return (
                                <button
                                  key={item}
                                  onClick={() => toggleTag('specialties', item)}
                                  className="flex items-center gap-2.5 py-1.5 text-left group"
                                >
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${checked ? 'bg-primary border-primary' : 'border-white/20 group-hover:border-white/40'}`}>
                                    {checked && (
                                      <svg className="w-2.5 h-2.5 text-on-primary" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                                      </svg>
                                    )}
                                  </div>
                                  <span className={`font-body text-sm transition-colors ${checked ? 'text-white' : 'text-white/50 group-hover:text-white/70'}`}>{item}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Accreditations */}
              <section className="space-y-3 pt-2 border-t border-white/8">
                <p className="font-body text-[9px] text-white/30 uppercase tracking-widest">Accreditations</p>
                <div className="flex flex-wrap gap-2">
                  {ACCREDITATION_OPTIONS.map(a => {
                    const active = form.accreditations.includes(a);
                    return (
                      <button
                        key={a}
                        onClick={() => toggleTag('accreditations', a)}
                        className={`px-3 py-1.5 rounded-lg font-body text-[10px] font-semibold border transition-all ${active ? 'bg-blue-400/10 border-blue-400/30 text-blue-400' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'}`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Internal notes */}
              <section className="space-y-3 pt-2 border-t border-white/8">
                <p className="font-body text-[9px] text-white/30 uppercase tracking-widest">Internal Notes (private)</p>
                <TextArea label="" value={form.internalNotes} onChange={v => setForm(f => ({ ...f, internalNotes: v }))} placeholder="Notes only visible to the Nia team…" rows={3} />
              </section>

              {/* Flags */}
              <section className="space-y-3 pt-2 border-t border-white/8">
                <p className="font-body text-[9px] text-white/30 uppercase tracking-widest">Status</p>
                <div className="flex gap-4">
                  <Toggle label="Verified" value={form.isVerified} onChange={v => setForm(f => ({ ...f, isVerified: v }))} />
                  <Toggle label="Active" value={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} />
                </div>
              </section>
            </div>

            {/* Drawer footer */}
            <div className="px-6 py-4 border-t border-white/8 shrink-0 flex gap-3">
              <button onClick={() => setDrawerOpen(false)} className="flex-1 py-3 rounded-xl border border-white/10 font-body text-sm text-white/50 hover:text-white hover:border-white/30 transition-all">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !form.name || !form.city || !form.country}
                className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-body text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
              >
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Clinic'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      {label && <label className="block font-body text-[9px] text-white/30 uppercase tracking-wider mb-1.5">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 font-body text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all"
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      {label && <label className="block font-body text-[9px] text-white/30 uppercase tracking-wider mb-1.5">{label}</label>}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 font-body text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all resize-none"
      />
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="flex items-center gap-2.5">
      <div className={`w-9 h-5 rounded-full transition-all relative ${value ? 'bg-primary' : 'bg-white/10'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? 'left-4' : 'left-0.5'}`} />
      </div>
      <span className="font-body text-sm text-white/60">{label}</span>
    </button>
  );
}
