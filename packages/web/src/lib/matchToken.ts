import crypto from 'crypto';

/* Signed, opaque tokens for patient match-room links (/matches/<token>).
   The token carries the room's parameters (procedure, country, patient name)
   plus an HMAC signature, so a link can't be forged or enumerated — only a
   token minted server-side with the secret is accepted. No DB row needed. */

const SECRET =
  process.env.MATCH_TOKEN_SECRET || process.env.WHATSAPP_INTAKE_SECRET || 'oia-dev-secret';

export interface MatchRoomParams {
  procedure: string;
  country?: string;
  name?: string;
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}
function sign(payload: string): string {
  return b64url(crypto.createHmac('sha256', SECRET).update(payload).digest()).slice(0, 22);
}

export function mintMatchToken(params: MatchRoomParams): string {
  const payload = b64url(Buffer.from(JSON.stringify({
    p: params.procedure,
    c: params.country ?? '',
    n: params.name ?? '',
  })));
  return `${payload}.${sign(payload)}`;
}

export function verifyMatchToken(token: string): MatchRoomParams | null {
  const [payload, sig] = token.split('.');
  if (!payload || !sig || sign(payload) !== sig) return null;
  try {
    const d = JSON.parse(fromB64url(payload).toString('utf8'));
    if (!d.p) return null;
    return { procedure: d.p, country: d.c || undefined, name: d.n || undefined };
  } catch {
    return null;
  }
}
