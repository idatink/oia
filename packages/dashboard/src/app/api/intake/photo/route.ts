import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const dynamic = 'force-dynamic';

// Patient photo upload for the WhatsApp concierge (Oia's upload_patient_photo skill).
// The dashboard owns the private Blob store, so uploads are centralised here rather
// than in the OpenClaw box: the photo lands in the PRIVATE store and is only ever
// served back through the coordinator-authed proxy (GET /api/leads/[id]/photo).
export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  const secret = process.env.WHATSAPP_INTAKE_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN not configured', url: null }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = (searchParams.get('sessionId') || 'anon').replace(/[^a-zA-Z0-9_-]/g, '') || 'anon';
  const ext = (searchParams.get('ext') || 'jpg').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5) || 'jpg';
  const contentType = req.headers.get('content-type') || 'image/jpeg';

  const bytes = await req.arrayBuffer();
  if (!bytes || bytes.byteLength === 0) {
    return NextResponse.json({ error: 'empty body', url: null }, { status: 400 });
  }

  try {
    const blob = await put(`patient-photos/${sessionId}/${Date.now()}.${ext}`, bytes, {
      access: 'private',
      contentType,
      token,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error('[intake/photo]', err);
    return NextResponse.json({ error: String(err), url: null }, { status: 500 });
  }
}
