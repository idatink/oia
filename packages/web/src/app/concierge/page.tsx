import { Suspense } from 'react';
import ConciergeShell from '@/components/concierge/ConciergeShell';

export default function ConciergePage() {
  return (
    <Suspense>
      <ConciergeShell />
    </Suspense>
  );
}
