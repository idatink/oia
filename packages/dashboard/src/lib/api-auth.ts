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

// Auth for admin-scoped views (e.g. the all-conversations sessions viewer).
// Allows ADMIN users as well as coordinators. Returns { id, role, name } or null.
export async function getAdminOrCoordinatorFromRequest(req: Request) {
  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  const token = match?.[1];
  if (!token) return null;

  const session = await verifySession(token);
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, role: true, name: true },
  });
  if (!user || (user.role !== 'ADMIN' && user.role !== 'COORDINATOR')) return null;
  return user;
}
