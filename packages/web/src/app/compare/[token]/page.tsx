import { notFound } from 'next/navigation';
import { verifyCompareToken } from '@nia/shared/src/compareToken';
import CompareClient, { type CompareEntry } from '@/components/concierge/CompareClient';

export const dynamic = 'force-dynamic';

// Stage-3 compare page at /compare/<token> (see INTAKE_REDESIGN.md funnel):
// after the team's deep-dive on the patient's shortlist, Oia delivers this
// side-by-side view. Token is verified server-side; entries are fetched from
// the dashboard (which owns the record) with the shared secret.
export default async function ComparePage({ params }: { params: { token: string } }) {
  const room = verifyCompareToken(params.token);
  if (!room) notFound();

  const dashboardUrl = process.env.DASHBOARD_URL ?? 'https://oia-dashboard-beryl.vercel.app';
  const secret = process.env.WHATSAPP_INTAKE_SECRET;
  if (!secret) notFound();

  let data: { procedure?: string | null; name?: string | null; entries?: CompareEntry[] } | null = null;
  try {
    const res = await fetch(`${dashboardUrl}/api/intake/compare-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ id: room.id, phone: room.phone }),
      cache: 'no-store',
    });
    if (res.ok) data = await res.json();
  } catch { /* fall through to 404 */ }
  if (!data || !data.entries || data.entries.length === 0) notFound();

  return (
    <CompareClient
      name={data.name ?? room.name}
      procedure={data.procedure ?? room.procedure ?? 'your procedure'}
      entries={data.entries}
    />
  );
}
