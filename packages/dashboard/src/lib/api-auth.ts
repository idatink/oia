import { verifySession, COOKIE } from './session';
import { db } from '@nia/shared/src/db';

export async function getCoordinatorFromRequest(req: Request) {
  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  const token = match?.[1];
  if (!token) return null;

  const session = await verifySession(token);
  if (!session) return null;

  return db.coordinator.findUnique({
    where: { userId: session.id },
    select: { id: true, clinicId: true, user: { select: { id: true, name: true } } },
  });
}
