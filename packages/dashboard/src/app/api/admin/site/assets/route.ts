import { NextResponse } from 'next/server';
import { getCoordinatorFromRequest } from '@/lib/api-auth';
import { db } from '@nia/shared/src/db';
import { put } from '@vercel/blob';
import { IMAGE_SLOTS } from '@/lib/site-slots';

export const dynamic = 'force-dynamic';

function dbKey(slotKey: string) { return `site.image.${slotKey}`; }

export async function GET(req: Request) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const saved = await db.niaConfig.findMany({ where: { category: 'site-image' } });
  const savedMap = Object.fromEntries(saved.map(r => [r.key, { value: r.value as string, t: r.updatedAt.getTime() }]));

  const slots = IMAGE_SLOTS.map(slot => {
    const stored = savedMap[dbKey(slot.key)];
    const currentUrl = stored
      ? (stored.value.includes('blob.vercel-storage.com')
          ? `https://nia-medtourism-dashboard.vercel.app/api/public/site-image?key=${slot.key}&t=${stored.t}`
          : stored.value)
      : slot.defaultUrl;
    return { ...slot, currentUrl, isCustom: !!stored };
  });

  return NextResponse.json(slots);
}

export async function POST(req: Request) {
  try {
    const coordinator = await getCoordinatorFromRequest(req);
    if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const slotKey = formData.get('slotKey') as string;
    const file = formData.get('file') as File | null;
    const customUrl = formData.get('url') as string | null;

    if (!slotKey || !IMAGE_SLOTS.find(s => s.key === slotKey)) {
      return NextResponse.json({ error: 'Invalid slotKey' }, { status: 400 });
    }

    let url: string;

    if (customUrl) {
      url = customUrl;
    } else if (file && file.size > 0) {
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (!token) return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN not configured' }, { status: 500 });

      const ext = file.name.split('.').pop() ?? 'jpg';
      const arrayBuffer = await file.arrayBuffer();
      const blob = await put(`site-assets/${slotKey}/${Date.now()}.${ext}`, arrayBuffer, {
        access: 'private',
        contentType: file.type || 'image/jpeg',
        token,
      });
      // Store the private blob URL — public display goes through /api/public/site-image proxy
      url = blob.url;
    } else {
      return NextResponse.json({ error: 'Provide file or url', fileSize: file?.size ?? 0 }, { status: 400 });
    }

    await db.niaConfig.upsert({
      where: { key: dbKey(slotKey) },
      create: { key: dbKey(slotKey), value: url, label: IMAGE_SLOTS.find(s => s.key === slotKey)!.label, category: 'site-image' },
      update: { value: url },
    });

    // Return the display URL (proxy for private blobs, raw for external URLs)
    // Include timestamp so re-uploads always bypass CDN cache
    const displayUrl = url.includes('blob.vercel-storage.com')
      ? `https://nia-medtourism-dashboard.vercel.app/api/public/site-image?key=${slotKey}&t=${Date.now()}`
      : url;

    return NextResponse.json({ slotKey, url: displayUrl });
  } catch (err) {
    console.error('[site/assets POST]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slotKey } = await req.json();
  await db.niaConfig.deleteMany({ where: { key: dbKey(slotKey) } });
  return NextResponse.json({ ok: true });
}
