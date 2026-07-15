// Curated before/after examples for the concierge gallery.
//
// PURPOSE: shown ONLY to help a patient set realistic expectations for a procedure —
// never as an endorsement of, or link to, any specific clinic or surgeon.
//
// HARD RULES (honesty + UK CAP/ASA):
//  1. Real, consent-signed images only. NEVER stock photos presented as results.
//  2. Anonymised — the caption is the procedure + a neutral note (e.g. "6 months
//     post-op"). NEVER a clinic name, surgeon name, or anything identifying.
//  3. Keys are the procedure slugs used by <GALLERY procedure="..."/> (rhinoplasty,
//     abdominoplasty, breast-augmentation, facelift, blepharoplasty, liposuction,
//     brazilian-butt-lift).
//
// Empty = the widget honestly says curated examples are coming and offers to request
// real before/afters from the patient's matched clinics after their consultation.
// TODO(Ida): add suitable, consent-signed images (place files in /public/gallery/…).

export interface GalleryImage {
  src: string;     // e.g. "/gallery/rhinoplasty-1.jpg"
  caption: string; // procedure + neutral note, NO names — e.g. "Rhinoplasty — 6 months post-op"
}

export const GALLERIES: Record<string, GalleryImage[]> = {
  // rhinoplasty: [
  //   { src: '/gallery/rhinoplasty-1.jpg', caption: 'Rhinoplasty — 6 months post-op' },
  // ],
  // abdominoplasty: [ ... ],
};
