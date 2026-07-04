import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';
import { head } from '@vercel/blob';

export const dynamic = 'force-dynamic';

// Public endpoint — no auth required — proxies private blob images for site display
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  if (!key || !/^[a-z0-9-]+$/.test(key)) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }

  const row = await db.niaConfig.findFirst({ where: { key: `site.image.${key}` } });
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const blobUrl = row.value as string;

  // If it's already a public URL (Unsplash, etc.) redirect to it
  if (!blobUrl.includes('blob.vercel-storage.com')) {
    return NextResponse.redirect(blobUrl, { status: 302 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ error: 'No blob token' }, { status: 500 });

  // Fetch private blob and stream
  const blobRes = await fetch(blobUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!blobRes.ok) {
    // Try getting blob metadata which generates a temporary download URL
    try {
      const meta = await head(blobUrl, { token });
      const dl = await fetch(meta.downloadUrl);
      const data = await dl.arrayBuffer();
      return new Response(data, {
        headers: {
          'Content-Type': meta.contentType ?? 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch {
      return NextResponse.json({ error: 'Blob unavailable' }, { status: 502 });
    }
  }

  const data = await blobRes.arrayBuffer();
  const contentType = blobRes.headers.get('Content-Type') ?? 'image/jpeg';

  return new Response(data, {
    headers: {
      'Content-Type': contentType,
      // Cache at browser/CDN keyed by the full URL including ?t= timestamp
      // Each new upload gets a fresh URL so old responses expire naturally
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
