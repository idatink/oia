'use client';

import { useEffect, useRef, useState } from 'react';
import { IMAGE_PAGES } from '@/lib/site-slots';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ImageSlot {
  key: string;
  label: string;
  page: string;
  defaultUrl: string;
  aspect: string;
  currentUrl: string;
  isCustom: boolean;
}

type ComponentType = 'announcement-banner' | 'referral-campaign' | 'promo-strip';

interface SiteComponent {
  id: string;
  type: ComponentType;
  label: string;
  isLive: boolean;
  order: number;
  config: Record<string, unknown>;
  updatedAt: string;
}

// ─── Component type definitions ──────────────────────────────────────────────

const COMPONENT_TYPES: { type: ComponentType; label: string; description: string; icon: string }[] = [
  { type: 'promo-strip', label: 'Promo Strip', description: 'Thin ribbon under the nav bar — short text, optional link.', icon: '▬' },
  { type: 'announcement-banner', label: 'Announcement Banner', description: 'Full-width dismissible banner — title, message, optional CTA button.', icon: '📢' },
  { type: 'referral-campaign', label: 'Referral Campaign', description: 'Dedicated referral section on the homepage with referral code, reward, and CTA.', icon: '🔗' },
];

const DEFAULT_CONFIGS: Record<ComponentType, Record<string, unknown>> = {
  'promo-strip': { message: '✨ Limited availability — book your consultation now', bgColor: '#99402b', textColor: '#ffffff', link: '' },
  'announcement-banner': { title: 'New Clinics Added', message: 'We now have partner surgeons in 3 new cities.', ctaText: 'View Clinics', ctaUrl: '/clinics', bgColor: '#1b1c1b', textColor: '#ffffff' },
  'referral-campaign': { heading: 'Refer a Friend, Change a Life', subheading: 'Referral Programme', body: 'Know someone considering surgery abroad? Share your unique code and earn a reward when they complete their consultation.', referralCode: 'NIA-FRIEND', reward: '£200 credit towards your next procedure', ctaText: 'Share Your Code', ctaUrl: '/referral', bgColor: '#f6f1ee' },
};

// ─── Field specs per component type ─────────────────────────────────────────

const FIELDS: Record<ComponentType, { key: string; label: string; type: 'text' | 'textarea' | 'color' | 'url' }[]> = {
  'promo-strip': [
    { key: 'message', label: 'Message', type: 'text' },
    { key: 'link', label: 'Link URL (optional)', type: 'url' },
    { key: 'bgColor', label: 'Background colour', type: 'color' },
    { key: 'textColor', label: 'Text colour', type: 'color' },
  ],
  'announcement-banner': [
    { key: 'title', label: 'Title (bold)', type: 'text' },
    { key: 'message', label: 'Message', type: 'text' },
    { key: 'ctaText', label: 'CTA button text', type: 'text' },
    { key: 'ctaUrl', label: 'CTA button URL', type: 'url' },
    { key: 'bgColor', label: 'Background colour', type: 'color' },
    { key: 'textColor', label: 'Text colour', type: 'color' },
  ],
  'referral-campaign': [
    { key: 'subheading', label: 'Subheading (small caps)', type: 'text' },
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'body', label: 'Body copy', type: 'textarea' },
    { key: 'referralCode', label: 'Referral code', type: 'text' },
    { key: 'reward', label: 'Reward description', type: 'text' },
    { key: 'ctaText', label: 'CTA button text', type: 'text' },
    { key: 'ctaUrl', label: 'CTA button URL', type: 'url' },
    { key: 'bgColor', label: 'Section background', type: 'color' },
  ],
};

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'images' | 'components';

export default function SiteManagementPage() {
  const [tab, setTab] = useState<Tab>('images');
  const [slots, setSlots] = useState<ImageSlot[]>([]);
  const [components, setComponents] = useState<SiteComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<string>('All');

  // Component builder state
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<SiteComponent | null>(null);
  const [builderType, setBuilderType] = useState<ComponentType>('announcement-banner');
  const [builderLabel, setBuilderLabel] = useState('');
  const [builderConfig, setBuilderConfig] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [pendingUploadSlot, setPendingUploadSlot] = useState<string | null>(null);
  const [urlInputSlot, setUrlInputSlot] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function toast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/site/assets').then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }),
      fetch('/api/admin/site/components').then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }),
    ]).then(([s, c]) => {
      setSlots(Array.isArray(s) ? s : []);
      setComponents(Array.isArray(c) ? c : []);
      setLoading(false);
    }).catch(() => {
      setLoadError(true);
      setLoading(false);
    });
  }, []);

  function triggerUpload(slotKey: string) {
    setPendingUploadSlot(slotKey);
    fileInputRef.current?.click();
  }

  // ── Image upload ─────────────────────────────────────────────────────────

  async function uploadImage(slotKey: string, file: File) {
    setUploading(slotKey);
    const fd = new FormData();
    fd.append('slotKey', slotKey);
    fd.append('file', file);
    try {
      const res = await fetch('/api/admin/site/assets', { method: 'POST', body: fd });
      const { url } = await res.json();
      setSlots(prev => prev.map(s => s.key === slotKey ? { ...s, currentUrl: url, isCustom: true } : s));
      toast('Image updated — live on the website immediately');
    } catch {
      toast('Upload failed');
    } finally {
      setUploading(null);
    }
  }

  async function submitUrlImage(slotKey: string, url: string) {
    if (!url.startsWith('http')) return;
    setUploading(slotKey);
    const fd = new FormData();
    fd.append('slotKey', slotKey);
    fd.append('url', url);
    try {
      const res = await fetch('/api/admin/site/assets', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'failed');
      setSlots(prev => prev.map(s => s.key === slotKey ? { ...s, currentUrl: url, isCustom: true } : s));
      toast('Image updated — live on the website immediately');
    } catch {
      toast('Could not save URL');
    } finally {
      setUploading(null);
      setUrlInputSlot(null);
    }
  }

  async function resetImage(slotKey: string) {
    await fetch('/api/admin/site/assets', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slotKey }) });
    const slot = slots.find(s => s.key === slotKey)!;
    setSlots(prev => prev.map(s => s.key === slotKey ? { ...s, currentUrl: slot.defaultUrl, isCustom: false } : s));
    toast('Reverted to default');
  }

  // ── Component builder ────────────────────────────────────────────────────

  function openNew(type: ComponentType) {
    setEditingComponent(null);
    setBuilderType(type);
    setBuilderLabel(COMPONENT_TYPES.find(c => c.type === type)?.label ?? '');
    setBuilderConfig({ ...DEFAULT_CONFIGS[type] });
    setBuilderOpen(true);
  }

  function openEdit(c: SiteComponent) {
    setEditingComponent(c);
    setBuilderType(c.type);
    setBuilderLabel(c.label);
    setBuilderConfig({ ...c.config });
    setBuilderOpen(true);
  }

  async function saveComponent() {
    setSaving(true);
    try {
      if (editingComponent) {
        await fetch(`/api/admin/site/components/${editingComponent.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: builderLabel, config: builderConfig }),
        });
        setComponents(prev => prev.map(c => c.id === editingComponent.id ? { ...c, label: builderLabel, config: builderConfig } : c));
        toast('Saved');
      } else {
        const res = await fetch('/api/admin/site/components', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: builderType, label: builderLabel, config: builderConfig }),
        });
        const created = await res.json();
        setComponents(prev => [{ id: created.id, type: builderType, label: builderLabel, isLive: false, order: 0, config: builderConfig, updatedAt: new Date().toISOString() }, ...prev]);
        toast('Campaign created — toggle it live when ready');
      }
      setBuilderOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function toggleLive(c: SiteComponent) {
    const isLive = !c.isLive;
    await fetch(`/api/admin/site/components/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isLive }),
    });
    setComponents(prev => prev.map(x => x.id === c.id ? { ...x, isLive } : x));
    toast(isLive ? '🟢 Live on the website' : 'Taken offline');
  }

  async function deleteComponent(id: string) {
    await fetch(`/api/admin/site/components/${id}`, { method: 'DELETE' });
    setComponents(prev => prev.filter(c => c.id !== id));
    toast('Deleted');
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0f1117]">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1e2129] text-white text-sm px-5 py-3 rounded-2xl shadow-xl border border-white/10 font-body">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-white/8 flex items-center justify-between bg-[#0f1117]">
        <div>
          <h1 className="font-display text-lg text-white font-semibold leading-none">Site Management</h1>
          <p className="font-body text-xs text-white/40 mt-1">Edit website images and manage live campaigns</p>
        </div>
        {tab === 'components' && (
          <div className="flex gap-2">
            {COMPONENT_TYPES.map(ct => (
              <button
                key={ct.type}
                onClick={() => openNew(ct.type)}
                className="px-3 py-2 rounded-xl bg-white/6 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition-all border border-white/8"
              >
                + {ct.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex gap-1 px-6 py-3 border-b border-white/8 bg-[#0f1117]">
        {(['images', 'components'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-primary/20 text-primary-fixed' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            {t === 'images' ? '🖼 Images' : '⚡ Campaigns & Components'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#0f1117]">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-white/30 text-sm">Loading…</div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center h-60 gap-3 text-white/40">
            <p className="text-sm">Could not load site config. Your session may have expired.</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-white/6 hover:bg-white/10 text-white/60 text-sm transition-colors">Reload</button>
          </div>
        ) : tab === 'images' ? (
          <>
            {/* Page filter */}
            <div className="px-6 py-3 border-b border-white/8 flex gap-1.5 overflow-x-auto scrollbar-none bg-[#0f1117]">
              {IMAGE_PAGES.map(p => (
                <button
                  key={p}
                  onClick={() => setActivePage(p)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    activePage === p
                      ? 'bg-white/12 text-white'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/6'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <ImageGrid
              slots={slots.filter(s => activePage === 'All' || s.page === activePage)}
              uploading={uploading}
              urlInputSlot={urlInputSlot}
              onTriggerUpload={triggerUpload}
              onReset={resetImage}
              onShowUrlInput={setUrlInputSlot}
              onSubmitUrl={submitUrlImage}
            />
          </>
        ) : (
          <ComponentList
            components={components}
            onEdit={openEdit}
            onToggleLive={toggleLive}
            onDelete={deleteComponent}
            onNew={openNew}
          />
        )}
      </div>

      {/* Shared hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file && pendingUploadSlot) uploadImage(pendingUploadSlot, file);
          e.target.value = '';
          setPendingUploadSlot(null);
        }}
      />

      {/* Builder panel */}
      {builderOpen && (
        <BuilderPanel
          type={builderType}
          label={builderLabel}
          config={builderConfig}
          isEditing={!!editingComponent}
          saving={saving}
          onLabelChange={setBuilderLabel}
          onConfigChange={(key, val) => setBuilderConfig(prev => ({ ...prev, [key]: val }))}
          onSave={saveComponent}
          onClose={() => setBuilderOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Image Grid ───────────────────────────────────────────────────────────────

function ImageGrid({ slots, uploading, urlInputSlot, onTriggerUpload, onReset, onShowUrlInput, onSubmitUrl }: {
  slots: ImageSlot[];
  uploading: string | null;
  urlInputSlot: string | null;
  onTriggerUpload: (key: string) => void;
  onReset: (key: string) => void;
  onShowUrlInput: (key: string | null) => void;
  onSubmitUrl: (key: string, url: string) => void;
}) {
  const [urlDraft, setUrlDraft] = useState('');

  function openUrl(key: string) {
    setUrlDraft('');
    onShowUrlInput(key);
  }

  return (
    <div className="p-6 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {slots.map(slot => (
        <div key={slot.key} className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden flex flex-col">
          {/* Image preview */}
          <div className="relative aspect-[4/3] bg-white/4 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slot.currentUrl}
              alt={slot.label}
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x300/1a1d24/ffffff?text=${encodeURIComponent(slot.label)}`; }}
            />
            {slot.isCustom && (
              <div className="absolute top-2 left-2 bg-emerald-500/90 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                Custom
              </div>
            )}
            {uploading === slot.key && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-white text-xs animate-pulse">Uploading…</div>
              </div>
            )}
          </div>

          {/* Info + actions */}
          <div className="p-3 flex flex-col gap-2 flex-1">
            <div>
              <p className="text-white text-sm font-semibold leading-tight">{slot.label}</p>
              <p className="text-white/35 text-[10px] mt-0.5">{slot.page}</p>
            </div>

            {urlInputSlot === slot.key ? (
              <div className="flex flex-col gap-1.5 mt-auto">
                <input
                  type="url"
                  autoFocus
                  placeholder="https://…"
                  value={urlDraft}
                  onChange={e => setUrlDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') onSubmitUrl(slot.key, urlDraft);
                    if (e.key === 'Escape') onShowUrlInput(null);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#161921] text-white text-[11px] border border-white/20 focus:border-white/50 outline-none placeholder:text-white/30"
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onSubmitUrl(slot.key, urlDraft)}
                    disabled={!urlDraft.startsWith('http')}
                    className="flex-1 py-1.5 rounded-lg bg-primary/80 hover:bg-primary text-white text-[11px] font-semibold disabled:opacity-30 transition-colors"
                  >Save URL</button>
                  <button
                    onClick={() => onShowUrlInput(null)}
                    className="py-1.5 px-2.5 rounded-lg bg-white/6 hover:bg-white/10 text-white/50 hover:text-white text-[11px] font-semibold transition-colors"
                  >✕</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 mt-auto">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onTriggerUpload(slot.key)}
                    disabled={!!uploading}
                    className="flex-1 py-1.5 rounded-lg bg-primary/80 hover:bg-primary text-white text-[11px] font-semibold disabled:opacity-40 transition-colors"
                  >
                    {uploading === slot.key ? 'Uploading…' : 'Upload file'}
                  </button>
                  {slot.isCustom && (
                    <button
                      onClick={() => onReset(slot.key)}
                      className="py-1.5 px-2.5 rounded-lg bg-white/6 hover:bg-white/10 text-white/50 hover:text-white text-[11px] font-semibold transition-colors"
                      title="Revert to default"
                    >↺</button>
                  )}
                </div>
                <button
                  onClick={() => openUrl(slot.key)}
                  className="w-full py-1 rounded-lg text-white/40 hover:text-white/70 text-[10px] font-medium transition-colors hover:bg-white/4"
                >
                  Paste image URL instead
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Component list ───────────────────────────────────────────────────────────

function ComponentList({ components, onEdit, onToggleLive, onDelete, onNew }: {
  components: SiteComponent[];
  onEdit: (c: SiteComponent) => void;
  onToggleLive: (c: SiteComponent) => void;
  onDelete: (id: string) => void;
  onNew: (type: ComponentType) => void;
}) {
  const TYPE_LABELS: Record<ComponentType, string> = {
    'promo-strip': 'Promo Strip',
    'announcement-banner': 'Banner',
    'referral-campaign': 'Referral Campaign',
  };

  if (components.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-4 text-white/30">
        <p className="text-sm">No campaigns yet</p>
        <div className="flex gap-2">
          {COMPONENT_TYPES.map(ct => (
            <button
              key={ct.type}
              onClick={() => onNew(ct.type)}
              className="px-4 py-2 rounded-xl bg-white/6 hover:bg-white/10 text-white/60 hover:text-white text-xs font-semibold transition-all border border-white/8"
            >
              + {ct.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-3 max-w-3xl">
      {components.map(c => (
        <div key={c.id} className="bg-white/4 border border-white/8 rounded-2xl p-4 flex items-start gap-4">
          {/* Live toggle */}
          <button
            onClick={() => onToggleLive(c)}
            className={`mt-0.5 w-11 h-6 rounded-full transition-all shrink-0 relative ${c.isLive ? 'bg-emerald-500' : 'bg-white/10'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${c.isLive ? 'right-0.5' : 'left-0.5'}`} />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-semibold text-sm truncate">{c.label}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/8 text-white/50 shrink-0">
                {TYPE_LABELS[c.type]}
              </span>
              {c.isLive && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                  LIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/35">
              {c.type === 'promo-strip' && (c.config.message as string)}
              {c.type === 'announcement-banner' && `${c.config.title ?? ''} — ${c.config.message ?? ''}`}
              {c.type === 'referral-campaign' && `Code: ${c.config.referralCode ?? '—'} · ${c.config.reward ?? ''}`}
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onEdit(c)}
              className="px-3 py-1.5 rounded-lg bg-white/6 hover:bg-white/10 text-white/60 hover:text-white text-[11px] font-semibold transition-all"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(c.id)}
              className="px-3 py-1.5 rounded-lg bg-white/4 hover:bg-red-500/20 text-white/30 hover:text-red-400 text-[11px] font-semibold transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Builder panel (slide-in) ─────────────────────────────────────────────────

function BuilderPanel({ type, label, config, isEditing, saving, onLabelChange, onConfigChange, onSave, onClose }: {
  type: ComponentType;
  label: string;
  config: Record<string, unknown>;
  isEditing: boolean;
  saving: boolean;
  onLabelChange: (v: string) => void;
  onConfigChange: (key: string, val: unknown) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const fields = FIELDS[type];
  const meta = COMPONENT_TYPES.find(c => c.type === type)!;

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50" onClick={onClose} />
      {/* Panel */}
      <div className="w-[480px] bg-[#13161e] border-l border-white/8 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/8 flex items-start justify-between">
          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-1">{isEditing ? 'Edit' : 'New'} · {meta.label}</p>
            <p className="text-white/55 text-xs">{meta.description}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white text-xl mt-0.5">×</button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Internal label */}
          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5 font-semibold">Campaign name (internal)</label>
            <input
              value={label}
              onChange={e => onLabelChange(e.target.value)}
              placeholder="e.g. Summer Referral 2026"
              className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 outline-none focus:border-primary/50"
            />
          </div>

          <div className="border-t border-white/6 pt-4">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3 font-semibold">Content</p>
            <div className="space-y-3">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="block text-[11px] text-white/50 mb-1.5">{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea
                      value={(config[f.key] as string) ?? ''}
                      onChange={e => onConfigChange(f.key, e.target.value)}
                      rows={3}
                      className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 outline-none focus:border-primary/50 resize-none"
                    />
                  ) : f.type === 'color' ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={(config[f.key] as string) ?? '#000000'}
                        onChange={e => onConfigChange(f.key, e.target.value)}
                        className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={(config[f.key] as string) ?? ''}
                        onChange={e => onConfigChange(f.key, e.target.value)}
                        className="flex-1 bg-white/6 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-mono outline-none focus:border-primary/50"
                      />
                    </div>
                  ) : (
                    <input
                      type={f.type}
                      value={(config[f.key] as string) ?? ''}
                      onChange={e => onConfigChange(f.key, e.target.value)}
                      className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 outline-none focus:border-primary/50"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="border-t border-white/6 pt-4">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3 font-semibold">Preview</p>
            <ComponentPreview type={type} config={config} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/8 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/6 text-white/60 text-sm font-semibold hover:bg-white/10 transition-colors">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !label.trim()}
            className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline preview ───────────────────────────────────────────────────────────

function ComponentPreview({ type, config }: { type: ComponentType; config: Record<string, unknown> }) {
  const cfg = config as Record<string, string>;

  if (type === 'promo-strip') {
    return (
      <div
        style={{ background: cfg.bgColor ?? '#99402b', color: cfg.textColor ?? '#fff' }}
        className="w-full text-center text-[11px] font-semibold py-2 px-4 rounded-lg"
      >
        {cfg.message || 'Your promo strip message'}
      </div>
    );
  }

  if (type === 'announcement-banner') {
    return (
      <div
        style={{ background: cfg.bgColor ?? '#1b1c1b', color: cfg.textColor ?? '#fff' }}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 rounded-lg text-sm"
      >
        <p className="truncate">
          {cfg.title && <strong className="mr-2">{cfg.title}</strong>}
          {cfg.message || 'Your announcement message'}
        </p>
        {cfg.ctaText && (
          <span className="px-3 py-1 rounded-full border border-current opacity-80 text-[11px] font-semibold uppercase tracking-wider shrink-0">{cfg.ctaText}</span>
        )}
      </div>
    );
  }

  if (type === 'referral-campaign') {
    return (
      <div style={{ background: cfg.bgColor ?? '#f6f1ee' }} className="rounded-xl p-4 text-[#1b1c1b]">
        {cfg.subheading && <p className="text-[9px] font-bold uppercase tracking-widest text-[#99402b] mb-1">{cfg.subheading}</p>}
        <p className="font-serif text-base font-semibold mb-1">{cfg.heading || 'Referral heading'}</p>
        <p className="text-xs text-[#5c5f5c] mb-3 line-clamp-2">{cfg.body}</p>
        {cfg.referralCode && (
          <div className="bg-white rounded-lg px-3 py-2 font-mono text-sm font-bold text-[#99402b] tracking-widest inline-block">
            {cfg.referralCode}
          </div>
        )}
      </div>
    );
  }

  return null;
}
