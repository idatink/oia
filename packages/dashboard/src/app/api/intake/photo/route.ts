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

  // The store is connected via OIDC, which does not set BLOB_READ_WRITE_TOKEN — the
  // SDK auto-detects the OIDC credential when no token is passed. Pass a token only
  // if one is explicitly configured.
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  const { searchParams } = new URL(req.url);
  const sessionId = (searchParams.get('sessionId') || 'anon').replace(/[^a-zA-Z0-9_-]/g, '') || 'anon';
  const ext = (searchParams.get('ext') || 'jpg').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5) || 'jpg';
  // Optional angle label from the Photo Guide (e.g. left_profile) — prefixed onto
  // the filename so the clinical team receives angle-tagged photos.
  const angle = (searchParams.get('angle') || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
  const contentType = req.headers.get('content-type') || 'image/jpeg';

  const bytes = await req.arrayBuffer();
  if (!bytes || bytes.byteLength === 0) {
    return NextResponse.json({ error: 'empty body', url: null }, { status: 400 });
  }

  try {
    const prefix = angle ? `${angle}-` : '';
    const blob = await put(`patient-photos/${sessionId}/${prefix}${Date.now()}.${ext}`, bytes, {
      access: 'private',
      contentType,
      ...(token ? { token } : {}),
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error('[intake/photo]', err);
    return NextResponse.json({ error: String(err), url: null }, { status: 500 });
  }
}
