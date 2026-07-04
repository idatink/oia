export const IMAGE_SLOTS = [
  // ── Homepage ──────────────────────────────────────────────────────────────
  { key: 'hero', label: 'Hero Portrait', page: 'Homepage', defaultUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80', aspect: '4/5' },
  { key: 'recovery-suite', label: 'Recovery Suite', page: 'Homepage', defaultUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=700&q=80', aspect: '4/3' },
  { key: 'facial-sculpting', label: 'Facial Sculpting', page: 'Homepage', defaultUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80', aspect: '1/1' },
  { key: 'body-contouring', label: 'Body Contouring', page: 'Homepage', defaultUrl: 'https://images.unsplash.com/photo-1609557927087-f9cf8e88de18?w=600&q=80', aspect: '1/1' },
  { key: 'skin-regeneration', label: 'Skin Regeneration', page: 'Homepage', defaultUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=80', aspect: '1/1' },
  { key: 'corrective-care', label: 'Corrective Care', page: 'Homepage', defaultUrl: 'https://images.unsplash.com/photo-1595272568891-123402d0fb3b?w=600&q=80', aspect: '1/1' },
  { key: 'concierge-about', label: 'Concierge Portrait', page: 'Homepage', defaultUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=700&q=80', aspect: '4/5' },

  // ── Treatments page ───────────────────────────────────────────────────────
  { key: 'tx-rhinoplasty', label: 'Rhinoplasty', page: 'Treatments', defaultUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80', aspect: '4/3' },
  { key: 'tx-blepharoplasty', label: 'Blepharoplasty', page: 'Treatments', defaultUrl: 'https://images.unsplash.com/photo-1595272568891-123402d0fb3b?w=600&q=80', aspect: '4/3' },
  { key: 'tx-facelift', label: 'Facelift', page: 'Treatments', defaultUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&q=80', aspect: '4/3' },
  { key: 'tx-body-contouring', label: 'Body Contouring', page: 'Treatments', defaultUrl: 'https://images.unsplash.com/photo-1609557927087-f9cf8e88de18?w=600&q=80', aspect: '4/3' },
  { key: 'tx-breast-aug', label: 'Breast Augmentation', page: 'Treatments', defaultUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=80', aspect: '4/3' },
  { key: 'tx-tummy-tuck', label: 'Tummy Tuck', page: 'Treatments', defaultUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80', aspect: '4/3' },
  { key: 'tx-skin-regen', label: 'Skin Regeneration', page: 'Treatments', defaultUrl: 'https://images.unsplash.com/photo-1526758097130-bab247274f58?w=600&q=80', aspect: '4/3' },
  { key: 'tx-corrective', label: 'Revision & Corrective', page: 'Treatments', defaultUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80', aspect: '4/3' },

  // ── About / Nia Way page ──────────────────────────────────────────────────
  { key: 'about-hero-video', label: 'Hero Video Thumbnail', page: 'About', defaultUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=900&q=80', aspect: '16/9' },
  { key: 'about-qa-1', label: 'Q&A Video 1 Thumbnail', page: 'About', defaultUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80', aspect: '9/16' },
  { key: 'about-qa-2', label: 'Q&A Video 2 Thumbnail', page: 'About', defaultUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80', aspect: '9/16' },
  { key: 'about-qa-3', label: 'Q&A Video 3 Thumbnail', page: 'About', defaultUrl: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80', aspect: '9/16' },
  { key: 'about-qa-4', label: 'Q&A Video 4 Thumbnail', page: 'About', defaultUrl: 'https://images.unsplash.com/photo-1614859324967-bdf413c35b5a?w=400&q=80', aspect: '9/16' },

  // ── Results Gallery page ──────────────────────────────────────────────────
  { key: 'result-1', label: 'Result 1 — Rhinoplasty', page: 'Results Gallery', defaultUrl: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=600&q=80', aspect: '3/4' },
  { key: 'result-2', label: 'Result 2 — Body Contouring', page: 'Results Gallery', defaultUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80', aspect: '1/1' },
  { key: 'result-3', label: 'Result 3 — Facelift', page: 'Results Gallery', defaultUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80', aspect: '3/4' },
  { key: 'result-4', label: 'Result 4 — Skin Regen', page: 'Results Gallery', defaultUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80', aspect: '1/1' },
  { key: 'result-5', label: 'Result 5 — Jaw Contouring', page: 'Results Gallery', defaultUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80', aspect: '4/3' },
  { key: 'result-6', label: 'Result 6 — Revision', page: 'Results Gallery', defaultUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80', aspect: '3/4' },
  { key: 'result-7', label: 'Result 7 — HD Lipo', page: 'Results Gallery', defaultUrl: 'https://images.unsplash.com/photo-1583500178690-594ce74b4618?w=600&q=80', aspect: '1/1' },
  { key: 'result-8', label: 'Result 8 — Full Facial', page: 'Results Gallery', defaultUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80', aspect: '3/4' },
  { key: 'result-9', label: 'Result 9 — Stem Cell', page: 'Results Gallery', defaultUrl: 'https://images.unsplash.com/photo-1614859324967-bdf413c35b5a?w=600&q=80', aspect: '1/1' },
] as const;

export type ImageSlotKey = typeof IMAGE_SLOTS[number]['key'];
export const IMAGE_PAGES = ['All', 'Homepage', 'Treatments', 'About', 'Results Gallery'] as const;
