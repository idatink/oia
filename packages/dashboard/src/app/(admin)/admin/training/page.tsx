'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

type Files = {
  'SOUL.md': string;
  'IDENTITY.md': string;
  'AGENTS.md': string;
  'TOOLS.md': string;
  'USER.md': string;
};

type Tab = 'soul' | 'identity' | 'agents' | 'tools' | 'user' | 'test';

const TAB_META: { key: Tab; label: string; file?: keyof Files; description: string }[] = [
  { key: 'soul', label: 'Voice & Style', file: 'SOUL.md', description: 'How Nia writes — tone, pacing, WhatsApp formatting rules' },
  { key: 'identity', label: 'Identity', file: 'IDENTITY.md', description: 'Who Nia is, what the platform does, how she refers to things' },
  { key: 'agents', label: 'Intake Rules', file: 'AGENTS.md', description: 'Mandatory checklist, scoring logic, conversation flow, escalation' },
  { key: 'tools', label: 'Tools', file: 'TOOLS.md', description: 'Skills Nia can call (create inquiry, upload photo)' },
  { key: 'user', label: 'Business', file: 'USER.md', description: 'Owner, escalation contact, product details' },
  { key: 'test', label: '⚡ Test Chat', description: 'Simulate a patient conversation with the current (unsaved) prompts' },
];

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default function TrainingLabPage() {
  const [files, setFiles] = useState<Files | null>(null);
  const [draft, setDraft] = useState<Files | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('soul');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatStreaming, setChatStreaming] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/admin/training')
      .then(r => r.json())
      .then((data: Files) => {
        setFiles(data);
        setDraft(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const isDirty = useCallback(() => {
    if (!files || !draft) return false;
    return (Object.keys(files) as (keyof Files)[]).some(k => files[k] !== draft[k]);
  }, [files, draft]);

  function updateDraft(file: keyof Files, content: string) {
    setDraft(prev => prev ? { ...prev, [file]: content } : prev);
    setSaved(false);
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const { saved: savedFiles } = await res.json();
      if (savedFiles?.length > 0) {
        setFiles(draft);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  function buildSystemPrompt(): string {
    if (!draft) return '';
    return [
      draft['SOUL.md'],
      draft['IDENTITY.md'],
      draft['AGENTS.md'],
      draft['TOOLS.md'],
      draft['USER.md'],
    ].filter(Boolean).join('\n\n---\n\n');
  }

  async function sendTestMessage() {
    const text = chatInput.trim();
    if (!text || chatStreaming) return;
    setChatInput('');
    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: text }];
    setChatMessages(newMessages);
    setChatStreaming(true);

    let assistantText = '';
    setChatMessages([...newMessages, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/admin/training/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, systemPrompt: buildSystemPrompt() }),
      });

      if (!res.body) throw new Error('No stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setChatMessages([...newMessages, { role: 'assistant', content: assistantText }]);
      }
    } catch (err) {
      assistantText = `[Error: ${err instanceof Error ? err.message : 'Failed'}]`;
      setChatMessages([...newMessages, { role: 'assistant', content: assistantText }]);
    } finally {
      setChatStreaming(false);
    }
  }

  const activeTabMeta = TAB_META.find(t => t.key === activeTab)!;
  const activeFile = activeTabMeta.file;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0f1117]">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-white/8 flex items-center justify-between bg-[#0f1117]">
        <div>
          <h1 className="font-display text-lg text-white font-semibold leading-none">Training Lab</h1>
          <p className="font-body text-xs text-white/40 mt-1">
            {loading ? 'Loading workspace…' : "Edit Oia's behavioral config and test changes live"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDirty() && !saved && (
            <span className="text-xs text-amber-400 font-medium">Unsaved changes</span>
          )}
          {saved && (
            <span className="text-xs text-emerald-400 font-medium">Saved ✓</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !isDirty() || loading}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {saving ? 'Saving…' : 'Save to disk'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex gap-1 px-6 py-3 border-b border-white/8 bg-[#0f1117] overflow-x-auto">
        {TAB_META.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === t.key
                ? 'bg-primary/20 text-primary-fixed'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex bg-[#0f1117]">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-white/40 text-sm">Loading workspace files…</div>
        ) : activeTab === 'test' ? (
          /* ── Test Chat ── */
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0f1117]">
            <div className="shrink-0 px-6 py-3 border-b border-white/8 flex items-center justify-between">
              <p className="text-xs text-white/50">
                Simulating Oia with{' '}
                <span className="text-white/80">{isDirty() ? 'unsaved draft' : 'saved config'}</span>
                {isDirty() && <span className="ml-2 text-amber-400">(using unsaved changes)</span>}
              </p>
              <button
                onClick={() => setChatMessages([])}
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Reset conversation
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>
                  </svg>
                  <p className="text-sm">Start a patient conversation to test Oia&apos;s behavior</p>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {[
                      "Hi, I'm interested in a nose job abroad",
                      "How much does rhinoplasty cost in Turkey?",
                      "I'm nervous about surgery — is it safe?",
                    ].map(s => (
                      <button
                        key={s}
                        onClick={() => setChatInput(s)}
                        className="px-3 py-1.5 rounded-xl border border-white/10 text-xs text-white/50 hover:text-white/80 hover:border-white/25 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'assistant' ? '' : 'flex-row-reverse'}`}>
                    <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                      msg.role === 'assistant' ? 'bg-primary text-on-primary' : 'bg-white/15 text-white'
                    }`}>
                      {msg.role === 'assistant' ? 'O' : 'P'}
                    </div>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                      msg.role === 'assistant'
                        ? 'bg-white/10 text-white rounded-tl-sm'
                        : 'bg-primary/25 text-white rounded-tr-sm'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content || (chatStreaming && i === chatMessages.length - 1 ? '…' : '')}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatBottomRef} />
            </div>

            <div className="shrink-0 px-6 py-4 border-t border-white/8">
              <div className="flex gap-3">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTestMessage(); } }}
                  placeholder="Type as a patient…"
                  disabled={chatStreaming}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/8 border border-white/12 text-white text-sm placeholder:text-white/30 outline-none focus:border-primary/60 disabled:opacity-50"
                />
                <button
                  onClick={sendTestMessage}
                  disabled={chatStreaming || !chatInput.trim()}
                  className="px-5 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  Send
                </button>
              </div>
              <p className="text-[10px] text-white/25 mt-2">
                Skills (create_nia_inquiry, upload_patient_photo) are not executed in test mode.
              </p>
            </div>
          </div>
        ) : (
          /* ── File Editor ── */
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0f1117]">
            <div className="shrink-0 px-6 py-3 border-b border-white/8">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-emerald-400/80 bg-white/6 px-2 py-1 rounded">{activeFile}</span>
                <p className="text-xs text-white/45">{activeTabMeta.description}</p>
              </div>
            </div>

            <div className="flex-1 overflow-hidden p-6">
              <textarea
                value={draft && activeFile ? draft[activeFile] : ''}
                onChange={e => activeFile && updateDraft(activeFile, e.target.value)}
                spellCheck={false}
                className="w-full h-full resize-none bg-[#161921] border border-white/10 rounded-2xl p-5 font-mono text-sm text-white leading-relaxed outline-none focus:border-primary/40 placeholder:text-white/25"
                placeholder={`Loading ${activeFile}…`}
              />
            </div>

            <div className="shrink-0 px-6 py-3 border-t border-white/8 flex items-center gap-6">
              <p className="text-[10px] text-white/30">
                Changes saved here take effect on Oia&apos;s next WhatsApp message.
              </p>
              {activeFile && files && draft && files[activeFile] !== draft[activeFile] && (
                <button
                  onClick={() => activeFile && setDraft(prev => prev ? { ...prev, [activeFile]: files[activeFile] } : prev)}
                  className="text-[10px] text-white/35 hover:text-white/70 whitespace-nowrap transition-colors"
                >
                  Revert this file
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
