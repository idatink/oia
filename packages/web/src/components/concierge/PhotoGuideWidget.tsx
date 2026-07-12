'use client';

import { useRef, useState } from 'react';
import { anglesFor, type PhotoAngle } from '@/lib/photoAngles';

export interface CapturedPhoto {
  key: string;
  label: string;
  file: File;
}

interface PhotoGuideWidgetProps {
  procedure?: string | null;
  onComplete: (captured: CapturedPhoto[]) => void;
}

// Deterministic photo-angle guide (mirrors TriageWidget). Oia can't see images
// yet, so the required angles for the procedure are enforced here — one labelled
// slot each — rather than left to the model to track. Each captured file carries
// its angle `key`, so the surgeon receives angle-labelled photos.
export default function PhotoGuideWidget({ procedure, onComplete }: PhotoGuideWidgetProps) {
  const angles = anglesFor(procedure);
  const [captured, setCaptured] = useState<Record<string, { file: File; previewUrl: string }>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const activeKey = useRef<string | null>(null);

  const pick = (key: string) => {
    activeKey.current = key;
    fileRef.current?.click();
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const key = activeKey.current;
    e.target.value = ''; // allow re-picking the same file
    if (!file || !key) return;
    setCaptured(prev => {
      const old = prev[key];
      if (old) URL.revokeObjectURL(old.previewUrl);
      return { ...prev, [key]: { file, previewUrl: URL.createObjectURL(file) } };
    });
  };

  const filledCount = angles.filter(a => captured[a.key]).length;
  const allFilled = filledCount === angles.length;

  const submit = () =>
    onComplete(
      angles
        .filter(a => captured[a.key])
        .map(a => ({ key: a.key, label: a.label, file: captured[a.key].file })),
    );

  const procLabel = (procedure || 'procedure').replace(/-/g, ' ');

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      <div className="px-5 py-4 border-b border-outline-variant/10 flex items-start justify-between gap-3">
        <div>
          <p className="font-body text-sm font-semibold text-on-surface">Photos for your {procLabel}</p>
          <p className="font-body text-xs text-on-surface-variant mt-0.5 leading-relaxed">
            Your surgeon needs these {angles.length} angles to assess accurately. Take them in good light against a plain background.
          </p>
        </div>
        <span className="shrink-0 font-body text-xs font-semibold text-primary bg-primary/10 rounded-full px-2.5 py-1 whitespace-nowrap">
          {filledCount} of {angles.length}
        </span>
      </div>

      <div className="divide-y divide-outline-variant/10">
        {angles.map((a: PhotoAngle) => {
          const shot = captured[a.key];
          return (
            <div key={a.key} className="flex items-center gap-3 px-5 py-3">
              <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-surface-container border border-outline-variant/20">
                {shot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shot.previewUrl} alt={a.label} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-5 h-5 text-on-surface-variant/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-medium text-on-surface">{a.label}</p>
                <p className="font-body text-xs text-on-surface-variant mt-0.5 leading-snug">{a.instruction}</p>
              </div>
              <button
                onClick={() => pick(a.key)}
                className={`shrink-0 font-body text-xs font-semibold rounded-lg px-3 py-1.5 border transition-colors ${
                  shot
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : 'bg-surface-container text-on-surface border-outline-variant/30 hover:border-outline-variant/50'
                }`}
              >
                {shot ? 'Retake' : 'Add'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-4 flex flex-col gap-2 border-t border-outline-variant/10">
        <button
          onClick={submit}
          disabled={filledCount === 0}
          className="w-full py-2.5 bg-primary text-on-primary font-body text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {allFilled ? 'Submit photos' : filledCount === 0 ? 'Add at least one photo' : `Submit ${filledCount} photo${filledCount > 1 ? 's' : ''} (${angles.length - filledCount} to go)`}
        </button>
        <button
          onClick={() => onComplete([])}
          className="w-full py-2 rounded-xl font-body text-xs text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          I can&apos;t share photos right now
        </button>
      </div>
    </div>
  );
}
