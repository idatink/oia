'use client';

import { useEffect, useState } from 'react';

const AMENITY_OPTIONS = [
  'Pool', 'Airport Transfer', 'Nurse on Call', 'Private Room',
  'Meals Included', 'Gym', 'Spa', 'Wi-Fi', 'Concierge', 'Laundry',
];

type RecoverySuite = {
  id: string; name: string; city: string; country: string;
  description: string | null; photoUrls: string[];
  pricePerNightEur: number | null; amenities: string[];
  websiteUrl: string | null; whatsappNumber: string | null;
  internalNotes: string | null; isActive: boolean; createdAt: string;
};

type FormData = {
  name: string; city: string; country: string; description: string;
  pricePerNightEur: string; amenities: string[];
  websiteUrl: string; whatsappNumber: string; internalNotes: string;
};

const EMPTY_FORM: FormData = {
  name: '', city: '', country: '', description: '',
  pricePerNightEur: '', amenities: [],
  websiteUrl: '', whatsappNumber: '', internalNotes: '',
};

export default function AdminRecoverySuitesPage() {
  const [suites, setSuites] = useState<RecoverySuite[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<RecoverySuite | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/recovery-suites').then(r => r.ok ? r.json() : []).then(setSuites).finally(() => setLoading(false));
  }, []);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  }

  function openEdit(s: RecoverySuite) {
    setEditing(s);
    setForm({
      name: s.name, city: s.city, country: s.country,
      description: s.description ?? '',
      pricePerNightEur: s.pricePerNightEur?.toString() ?? '',
      amenities: s.amenities,
      websiteUrl: s.websiteUrl ?? '',
      whatsappNumber: s.whatsappNumber ?? '',
      internalNotes: s.internalNotes ?? '',
    });
    setDrawerOpen(true);
  }

  function toggleAmenity(value: string) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(value)
        ? f.amenities.filter(a => a !== value)
        : [...f.amenities, value],
    }));
  }

  async function save() {
    if (!form.name || !form.city || !form.country) return;
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch('/api/admin/recovery-suites', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, ...form, pricePerNightEur: form.pricePerNightEur || null }),
        });
        if (res.ok) {
          const updated = await res.json();
          setSuites(prev => prev.map(s => s.id === editing.id ? { ...s, ...updated } : s));
        }
      } else {
        const res = await fetch('/api/admin/recovery-suites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, pricePerNightEur: form.pricePerNightEur || null }),
        });
        if (res.ok) {
          const created = await res.json();
          setSuites(prev => [created, ...prev]);
        }
      }
      setDrawerOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch('/api/admin/recovery-suites', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !current }),
    });
    if (res.ok) setSuites(prev => prev.map(s => s.id === id ? { ...s, isActive: !current } : s));
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 py-5 border-b border-white/8 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">Recovery Suites</h1>
          <p className="font-body text-[11px] text-white/40 mt-0.5">{suites.length} suites in network</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-body text-sm font-semibold hover:opacity-90 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Add Suite
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {loading && <p className="font-body text-white/40 text-center py-12">Loading…</p>}
        {!loading && suites.length === 0 && (
          <div className="text-center py-20">
            <p className="font-display text-white/30 text-xl mb-2">No recovery suites yet</p>
            <p className="font-body text-white/20 text-sm">Add suites to include them in patient proposals.</p>
          </div>
        )}

        {suites.map(s => (
          <div key={s.id} className="bg-white/5 border border-white/8 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-lg text-white">{s.name}</h2>
                  {!s.isActive && (
                    <span className="font-body text-[8px] font-bold text-white/30 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Inactive</span>
                  )}
                  {s.pricePerNightEur && (
                    <span className="font-body text-[8px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider">€{s.pricePerNightEur}/night</span>
                  )}
                </div>
                <p className="font-body text-[11px] text-white/40 mt-0.5">{s.city}, {s.country}</p>
                {s.description && <p className="font-body text-sm text-white/50 mt-2">{s.description}</p>}
                {s.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {s.amenities.map(a => (
                      <span key={a} className="font-body text-[9px] text-white/40 bg-white/5 px-2 py-0.5 rounded-md">{a}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openEdit(s)}
                  className="px-3 py-1.5 rounded-lg font-body text-[10px] font-semibold border border-white/10 text-white/50 hover:border-white/30 hover:text-white transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(s.id, s.isActive)}
                  className={`px-3 py-1.5 rounded-lg font-body text-[10px] font-semibold border transition-all ${s.isActive ? 'border-white/10 text-white/40 hover:border-red-400/30 hover:text-red-400' : 'border-green-400/30 text-green-400 hover:bg-green-400/10'}`}
                >
                  {s.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="relative ml-auto w-full max-w-lg bg-[#0f1117] border-l border-white/8 flex flex-col h-full overflow-hidden">
            <div className="px-6 py-5 border-b border-white/8 flex items-center justify-between shrink-0">
              <h2 className="font-display text-xl text-white">{editing ? 'Edit Suite' : 'Add Recovery Suite'}</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <section className="space-y-4">
                <p className="font-body text-[9px] text-white/30 uppercase tracking-widest">Basic Info</p>
                <SField label="Suite / Hotel Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Ciragan Palace Kempinski" />
                <div className="grid grid-cols-2 gap-3">
                  <SField label="City *" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} placeholder="Istanbul" />
                  <SField label="Country *" value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} placeholder="Turkey" />
                </div>
                <STextArea label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="What makes this recovery suite special" />
                <SField label="Price per Night (EUR)" value={form.pricePerNightEur} onChange={v => setForm(f => ({ ...f, pricePerNightEur: v }))} placeholder="250" />
              </section>

              <section className="space-y-3 pt-2 border-t border-white/8">
                <p className="font-body text-[9px] text-white/30 uppercase tracking-widest">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_OPTIONS.map(a => {
                    const active = form.amenities.includes(a);
                    return (
                      <button
                        key={a}
                        onClick={() => toggleAmenity(a)}
                        className={`px-3 py-1.5 rounded-lg font-body text-[10px] font-semibold border transition-all ${active ? 'bg-primary/20 border-primary/40 text-primary-fixed' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'}`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-4 pt-2 border-t border-white/8">
                <p className="font-body text-[9px] text-white/30 uppercase tracking-widest">Contact</p>
                <SField label="Website" value={form.websiteUrl} onChange={v => setForm(f => ({ ...f, websiteUrl: v }))} placeholder="https://hotel.com" />
                <SField label="WhatsApp" value={form.whatsappNumber} onChange={v => setForm(f => ({ ...f, whatsappNumber: v }))} placeholder="+90 5551234567" />
              </section>

              <section className="space-y-3 pt-2 border-t border-white/8">
                <p className="font-body text-[9px] text-white/30 uppercase tracking-widest">Internal Notes (private)</p>
                <STextArea label="" value={form.internalNotes} onChange={v => setForm(f => ({ ...f, internalNotes: v }))} placeholder="Notes only visible to the Nia team…" rows={3} />
              </section>
            </div>

            <div className="px-6 py-4 border-t border-white/8 shrink-0 flex gap-3">
              <button onClick={() => setDrawerOpen(false)} className="flex-1 py-3 rounded-xl border border-white/10 font-body text-sm text-white/50 hover:text-white hover:border-white/30 transition-all">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !form.name || !form.city || !form.country}
                className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-body text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
              >
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Suite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      {label && <label className="block font-body text-[9px] text-white/30 uppercase tracking-wider mb-1.5">{label}</label>}
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 font-body text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all" />
    </div>
  );
}

function STextArea({ label, value, onChange, placeholder, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      {label && <label className="block font-body text-[9px] text-white/30 uppercase tracking-wider mb-1.5">{label}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 font-body text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all resize-none" />
    </div>
  );
}
