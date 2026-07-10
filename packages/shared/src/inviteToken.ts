import crypto from 'crypto';

/* Signed, opaque tokens for "invite back to web" links
   (/concierge?invite=<token>). The token carries the waitlisted patient's
   phone + name + intention plus an HMAC signature and an expiry, so a link
   can't be forged or enumerated — only a token minted server-side (dashboard)
   with the shared secret is accepted (verified web-side). No DB row needed.
   Minted by the dashboard when the team marks a waitlister ready; verified by
   the web app to open their full intake (bypassing the capacity gate) prefilled. */

const SECRET = process.env.WHATSAPP_INTAKE_SECRET || process.env.MATCH_TOKEN_SECRET || 'oia-dev-secret';
const DEFAULT_TTL_DAYS = 30;

export interface InviteParams {
  phone: string;
  name?: string;
  procedure?: string;
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}
function sign(payload: string): string {
  return b64url(crypto.createHmac('sha256', SECRET).update(payload).digest()).slice(0, 24);
}

export function mintInviteToken(params: InviteParams, ttlDays = DEFAULT_TTL_DAYS): string {
  const payload = b64url(
    Buffer.from(
      JSON.stringify({
        ph: params.phone,
        n: params.name ?? '',
        p: params.procedure ?? '',
        e: Math.floor(Date.now() / 1000) + ttlDays * 86400,
      }),
    ),
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyInviteToken(token: string): InviteParams | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig || sign(payload) !== sig) return null;
  try {
    const d = JSON.parse(fromB64url(payload).toString('utf8')) as { ph: string; n: string; p: string; e: number };
    if (!d.ph) return null;
    if (d.e && d.e < Math.floor(Date.now() / 1000)) return null; // expired
    return { phone: d.ph, name: d.n || undefined, procedure: d.p || undefined };
  } catch {
    return null;
  }
}
