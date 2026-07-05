'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LeadCaptureModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The old web-vs-WhatsApp choice gate has been removed. There is no longer any
 * interstitial before chatting — pressing any "chat with Oia" CTA drops the
 * visitor straight into the web concierge (`/concierge`), where Oia gathers all
 * details in the conversation itself. (Oia also takes details over WhatsApp for
 * anyone who prefers that channel.)
 *
 * Kept as a component so every existing CTA — which toggles `open` via
 * `setModalOpen(true)` — keeps working without touching each page. It renders
 * nothing and simply routes to the chat when opened.
 */
export default function LeadCaptureModal({ open }: LeadCaptureModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (open) router.push('/concierge');
  }, [open, router]);

  return null;
}
