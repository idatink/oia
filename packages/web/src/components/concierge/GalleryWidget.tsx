'use client';

import { useState } from 'react';

// Placeholder gallery data — replace with real clinic photos
const GALLERIES: Record<string, { src: string; caption: string }[]> = {
  rhinoplasty: [
    { src: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=500&fit=crop', caption: 'Tip refinement & bridge reduction' },
    { src: 'https://images.unsplash.com/photo-1595167151695-a9a2e05f33e1?w=400&h=500&fit=crop', caption: 'Natural profile result' },
    { src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop', caption: 'Subtle bridge correction' },
  ],
  liposuction: [
    { src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=500&fit=crop', caption: 'Abdominal contouring' },
    { src: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&h=500&fit=crop', caption: 'Flank & waist definition' },
  ],
  abdominoplasty: [
    { src: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=500&fit=crop', caption: 'Tummy tuck result' },
    { src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=500&fit=crop', caption: 'Post-bariatric contouring' },
  ],
  blepharoplasty: [
    { src: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=500&fit=crop', caption: 'Upper eyelid lift' },
    { src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop', caption: 'Lower eyelid rejuvenation' },
  ],
  facelift: [
    { src: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop', caption: 'Full facelift result' },
  ],
  'breast-augmentation': [
    { src: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=500&fit=crop', caption: 'Natural augmentation' },
  ],
};

const FALLBACK = [
  { src: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=500&fit=crop', caption: 'Partner clinic result' },
  { src: 'https://images.unsplash.com/photo-1595167151695-a9a2e05f33e1?w=400&h=500&fit=crop', caption: 'Partner clinic result' },
];

interface GalleryWidgetProps {
  procedure: string;
}

export default function GalleryWidget({ procedure }: GalleryWidgetProps) {
  const [consented, setConsented] = useState(false);
  const [index, setIndex] = useState(0);

  const photos = GALLERIES[procedure] ?? FALLBACK;
  const current = photos[index];

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center justify-between">
        <div>
          <p className="font-body text-xs font-semibold text-on-surface capitalize">
            Before / After Results
          </p>
          <p className="font-body text-[10px] text-on-surface-variant mt-0.5 capitalize">
            {procedure.replace(/-/g, ' ')}
          </p>
        </div>
        <span className="font-body text-[10px] text-on-surface-variant">
          {index + 1} / {photos.length}
        </span>
      </div>

      {/* Image */}
      <div className="relative w-full" style={{ aspectRatio: '4/5', maxHeight: 320 }}>
        <img
          src={current.src}
          alt={current.caption}
          className="w-full h-full object-cover"
          style={{ filter: consented ? 'none' : 'blur(18px)', transition: 'filter 0.3s' }}
        />

        {!consented && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center bg-black/20">
            <p className="font-body text-xs text-white/90 leading-relaxed">
              These photos contain medical imagery. Please confirm to view.
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

      {/* Caption + nav */}
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
        Individual results may vary. Photos shown with patient consent.
      </p>
    </div>
  );
}
