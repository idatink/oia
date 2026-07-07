import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getAdminOrCoordinatorFromRequest } from '@/lib/api-auth';
import { head } from '@vercel/blob';

export const dynamic = 'force-dynamic';

// Serve a patient's treatment-area photo. Private blobs are never exposed directly:
// we stream the bytes through this authed proxy (using a signed download URL) —
// nothing is publicly reachable. Admins can view any lead's photo; coordinators
// are scoped to leads belonging to their own clinic.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const actor = await getAdminOrCoordinatorFromRequest(req);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const i = parseInt(searchParams.get('i') ?? '', 10);

  // Coordinators only see their own clinic's leads; admins see all.
  let clinicScope: string | null = null;
  if (actor.role !== 'ADMIN') {
    const coordinator = await db.coordinator.findUnique({
      where: { userId: actor.id },
      select: { clinicId: true },
    });
    if (!coordinator) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    clinicScope = coordinator.clinicId;
  }

  const lead = await db.lead.findFirst({
    where: clinicScope
      ? { id: params.id, consultation: { clinicId: clinicScope } }
      : { id: params.id },
    select: { photoUrls: true },
  });
  if (!lead || Number.isNaN(i) || i < 0 || i >= lead.photoUrls.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const blobUrl = lead.photoUrls[i];
  // External (non-blob) URLs — just redirect.
  if (!blobUrl.includes('blob.vercel-storage.com')) {
    return NextResponse.redirect(blobUrl, { status: 302 });
  }

  // OIDC-connected store: the SDK auto-detects the credential when no token is
  // passed. Pass a token only if one is explicitly configured.
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  const respond = (data: ArrayBuffer, contentType: string) =>
    new Response(data, {
      headers: {
        'Content-Type': contentType,
        // Private — cache only in the coordinator's browser, briefly.
        'Cache-Control': 'private, max-age=3600',
      },
    });

  // Preferred: a short-lived signed download URL from head().
  try {
    const meta = await head(blobUrl, token ? { token } : undefined);
    const dl = await fetch(meta.downloadUrl);
    if (dl.ok) return respond(await dl.arrayBuffer(), meta.contentType ?? 'image/jpeg');
  } catch { /* fall through */ }

  // Fallback: authenticated direct fetch (only possible with an explicit token).
  if (token) {
    try {
      const r = await fetch(blobUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) return respond(await r.arrayBuffer(), r.headers.get('Content-Type') ?? 'image/jpeg');
    } catch { /* fall through */ }
  }

  return NextResponse.json({ error: 'Blob unavailable' }, { status: 502 });
}
