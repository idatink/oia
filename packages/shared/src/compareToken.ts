import crypto from 'crypto';

/* Signed tokens for the Stage-3 patient compare page (/compare/<token>).
   Minted by the dashboard when the team finishes the deep-dive on a patient's
   shortlist; verified by the web app, which then fetches the compare entries
   from the dashboard by message id. Same HMAC pattern as matchToken/inviteToken
   (payload is readable but unforgeable; WHATSAPP_INTAKE_SECRET fallback). */

const SECRET =
  process.env.MATCH_TOKEN_SECRET || process.env.WHATSAPP_INTAKE_SECRET || 'oia-dev-secret';

export interface CompareParams {
  phone: string;   // E.164 — whose comparison this is
  id: string;      // the compare NIAMessage id holding the entries
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
  return b64url(crypto.createHmac('sha256', SECRET).update(payload).digest()).slice(0, 22);
}

export function mintCompareToken(params: CompareParams): string {
  const payload = b64url(Buffer.from(JSON.stringify({
    ph: params.phone,
    i: params.id,
    n: params.name ?? '',
    p: params.procedure ?? '',
  })));
  return `${payload}.${sign(payload)}`;
}

export function verifyCompareToken(token: string): CompareParams | null {
  const [payload, sig] = token.split('.');
  if (!payload || !sig || sign(payload) !== sig) return null;
  try {
    const d = JSON.parse(fromB64url(payload).toString('utf8'));
    if (!d.ph || !d.i) return null;
    return { phone: d.ph, id: d.i, name: d.n || undefined, procedure: d.p || undefined };
  } catch {
    return null;
  }
}
