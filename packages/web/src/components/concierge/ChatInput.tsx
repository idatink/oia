'use client';

import { useRef, useState } from 'react';

interface ChatInputProps {
  onSend: (text: string, files?: File[]) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      onSend('', files);
      e.target.value = '';
    }
  }

  return (
    <div className="border-t border-white/40 bg-surface-container-lowest/60 backdrop-blur-md px-4 py-3">
      <div className="flex items-center gap-3 glass-soft rounded-2xl px-4 py-3 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/40 transition-all">
        {/* Attachment */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-on-surface-variant hover:text-primary transition-colors shrink-0"
          aria-label="Attach photo"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/>
          </svg>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Text input */}
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your goals or upload a photo..."
          disabled={disabled}
          className="flex-1 bg-transparent font-body text-body-md text-on-surface placeholder:text-on-surface-variant/50 outline-none disabled:opacity-50"
        />

        {/* Send */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="w-9 h-9 bg-primary text-on-primary rounded-full flex items-center justify-center shrink-0 hover:opacity-90 disabled:opacity-30 transition-all"
          aria-label="Send"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z"/>
          </svg>
        </button>
      </div>

      <p className="font-body text-[11px] text-on-surface-variant text-center mt-2 opacity-60">
        Oia AI provides estimates and planning support. Always consult a licensed surgeon before procedures.
      </p>
    </div>
  );
}
