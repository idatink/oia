import { notFound } from 'next/navigation';
import { verifyMatchToken } from '@/lib/matchToken';
import MatchRoomClient from '@/components/concierge/MatchRoomClient';

export const dynamic = 'force-dynamic';

// Patient match room at /matches/<token>. The signed token is verified server-side;
// an invalid or forged token 404s. Valid tokens carry the procedure/country/name
// the room renders (via the SmartMatch-backed /api/clinics).
export default function MatchTokenPage({ params }: { params: { token: string } }) {
  const room = verifyMatchToken(params.token);
  if (!room) notFound();
  return (
    <MatchRoomClient
      procedure={room.procedure}
      country={room.country}
      name={room.name}
      locationPreference={room.locationPreference}
      token={params.token}
      canShortlist={!!room.phone}
    />
  );
}
