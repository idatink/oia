'use client';

import { useEffect, useState } from 'react';

type ConfigItem = {
  key: string; value: unknown; label: string; category: string;
  updatedAt: string | null; updatedBy: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  persona: 'Persona & Tone',
  suitability: 'Surgery Suitability Rules',
  intake: 'Intake Flow',
  matching: 'Clinic Matching',
};

export default function NiaConfigPage() {
  const [config, setConfig] = useState<ConfigItem[]>([]);
  const [edits, setEdits] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/nia-config').then(r => r.ok ? r.json() : []).then(setConfig);
  }, []);

  const setValue = (key: string, value: unknown) => {
    setEdits(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = Object.entries(edits).map(([key, value]) => ({ key, value }));
    const res = await fetch('/api/admin/nia-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      setEdits({});
      setSaved(true);
      fetch('/api/admin/nia-config').then(r => r.ok ? r.json() : []).then(setConfig);
    }
    setSaving(false);
  };

  const categories = [...new Set(config.map(c => c.category))];
  const hasEdits = Object.keys(edits).length > 0;

  const renderInput = (item: ConfigItem) => {
    const val = edits[item.key] !== undefined ? edits[item.key] : item.value;
    if (typeof item.value === 'boolean') {
      return (
        <button
          onClick={() => setValue(item.key, !val)}
          className={`relative w-10 h-5.5 rounded-full transition-all shrink-0 ${val ? 'bg-primary' : 'bg-white/10'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${val ? 'right-0.5' : 'left-0.5'}`} />
        </button>
      );
    }
    if (typeof item.value === 'number') {
      return (
        <input
          type="number"
          value={val as number}
          onChange={e => setValue(item.key, Number(e.target.value))}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-body text-sm text-white w-24 text-right focus:outline-none focus:border-primary"
        />
      );
    }
    // string / select
    const toneOptions = item.key === 'persona.tone' ? ['warm', 'professional', 'friendly', 'clinical'] : null;
    if (toneOptions) {
      return (
        <select
          value={val as string}
          onChange={e => setValue(item.key, e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-body text-sm text-white focus:outline-none focus:border-primary"
        >
          {toneOptions.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    return (
      <input
        type="text"
        value={val as string}
        onChange={e => setValue(item.key, e.target.value)}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-body text-sm text-white flex-1 max-w-sm focus:outline-none focus:border-primary"
      />
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 py-5 border-b border-white/8 flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-display text-2xl text-white">Nia AI Config</h1>
          <p className="font-body text-[11px] text-white/40 mt-0.5">Platform-level settings that control how Nia behaves with patients</p>
        </div>
        {hasEdits && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-on-primary px-4 py-2 rounded-xl font-body text-[10px] font-semibold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        )}
        {saved && !hasEdits && (
          <span className="font-body text-[10px] text-green-400 font-semibold">✓ Saved</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {categories.map(cat => (
          <div key={cat}>
            <p className="font-body text-[9px] text-white/30 uppercase tracking-widest font-semibold mb-4">{CATEGORY_LABELS[cat] ?? cat}</p>
            <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden divide-y divide-white/8">
              {config.filter(c => c.category === cat).map(item => (
                <div key={item.key} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-white">{item.label}</p>
                    <p className="font-body text-[9px] text-white/30 mt-0.5 font-mono">{item.key}</p>
                  </div>
                  {renderInput(item)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
