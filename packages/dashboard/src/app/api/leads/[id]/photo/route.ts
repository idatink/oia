import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { getCoordinatorFromRequest } from '@/lib/api-auth';
import { head } from '@vercel/blob';

export const dynamic = 'force-dynamic';

// Serve a patient's treatment-area photo. Private blobs are never exposed directly:
// only the lead's own coordinator can view them, and we stream the bytes through
// this authed proxy (using a signed download URL) — nothing is publicly reachable.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const i = parseInt(searchParams.get('i') ?? '', 10);

  const lead = await db.lead.findFirst({
    where: { id: params.id, consultation: { clinicId: coordinator.clinicId } },
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

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ error: 'No blob token' }, { status: 500 });

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
    const meta = await head(blobUrl, { token });
    const dl = await fetch(meta.downloadUrl);
    if (dl.ok) return respond(await dl.arrayBuffer(), meta.contentType ?? 'image/jpeg');
  } catch { /* fall through */ }

  // Fallback: authenticated direct fetch.
  try {
    const r = await fetch(blobUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) return respond(await r.arrayBuffer(), r.headers.get('Content-Type') ?? 'image/jpeg');
  } catch { /* fall through */ }

  return NextResponse.json({ error: 'Blob unavailable' }, { status: 502 });
}
