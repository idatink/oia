'use client';

import { useState } from 'react';
import { GALLERIES } from './galleryData';

interface GalleryWidgetProps {
  procedure: string;
}

export default function GalleryWidget({ procedure }: GalleryWidgetProps) {
  const [consented, setConsented] = useState(false);
  const [index, setIndex] = useState(0);

  const photos = GALLERIES[procedure] ?? [];
  const label = procedure.replace(/-/g, ' ');

  // Honest empty state — until real, consent-signed examples are added, we never show
  // stand-in images. Oia offers to fetch real before/afters from the matched clinics.
  if (photos.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant/10">
          <p className="font-body text-xs font-semibold text-on-surface">Before / after examples</p>
          <p className="font-body text-[10px] text-on-surface-variant mt-0.5 capitalize">{label}</p>
        </div>
        <div className="px-5 py-6 text-center">
          <p className="font-body text-body-sm text-on-surface leading-relaxed mb-2">
            I&apos;m still curating consent-signed before-and-after examples for {label} — I won&apos;t show
            stand-in images and pretend they&apos;re results.
          </p>
          <p className="font-body text-xs text-on-surface-variant leading-relaxed">
            Once we&apos;ve completed your intake, I can request real before/after photos directly from your
            matched clinics — anonymised, and shown only to help you picture realistic outcomes.
          </p>
        </div>
      </div>
    );
  }

  const current = photos[index];
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center justify-between">
        <div>
          <p className="font-body text-xs font-semibold text-on-surface">Before / after examples</p>
          <p className="font-body text-[10px] text-on-surface-variant mt-0.5 capitalize">{label}</p>
        </div>
        <span className="font-body text-[10px] text-on-surface-variant">{index + 1} / {photos.length}</span>
      </div>

      <div className="relative w-full" style={{ aspectRatio: '4/5', maxHeight: 320 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.src}
          alt={current.caption}
          className="w-full h-full object-cover"
          style={{ filter: consented ? 'none' : 'blur(18px)', transition: 'filter 0.3s' }}
        />
        {!consented && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center bg-black/20">
            <p className="font-body text-xs text-white/90 leading-relaxed">
              These are medical images. Please confirm to view.
            </p>
            <button
              onClick={() => setConsented(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/90 text-on-surface font-body text-xs font-semibold rounded-xl hover:bg-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
              </svg>
              I understand and want to view
            </button>
          </div>
        )}
      </div>

      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <button
          onClick={() => setIndex(i => Math.max(0, i - 1))}
          disabled={index === 0}
          className="p-1.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-30"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <p className="font-body text-[11px] text-on-surface-variant text-center flex-1">{current.caption}</p>
        <button
          onClick={() => setIndex(i => Math.min(photos.length - 1, i + 1))}
          disabled={index === photos.length - 1}
          className="p-1.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-30"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      <p className="px-4 pb-3 font-body text-[9px] text-on-surface-variant/50 text-center">
        Examples only, shown to set expectations — not tied to any clinic. Individual results vary. Shown with patient consent.
      </p>
    </div>
  );
}
