export const COOKIE = 'nia_session';
const ALG = { name: 'HMAC', hash: 'SHA-256' };

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

async function getKey(): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(process.env.AUTH_SECRET ?? 'fallback-dev-secret-change-me');
  return crypto.subtle.importKey('raw', raw, ALG, false, ['sign', 'verify']);
}

function b64url(buf: ArrayBuffer): string {
  return Buffer.from(buf).toString('base64url');
}

export async function createSession(user: SessionUser): Promise<string> {
  const payload = Buffer.from(
    JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 })
  ).toString('base64url');
  const key = await getKey();
  const sig = b64url(await crypto.subtle.sign(ALG, key, new TextEncoder().encode(payload)));
  return `${payload}.${sig}`;
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const dot = token.lastIndexOf('.');
    if (dot === -1) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const key = await getKey();
    const valid = await crypto.subtle.verify(
      ALG,
      key,
      Buffer.from(sig, 'base64url'),
      new TextEncoder().encode(payload)
    );
    if (!valid) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return data as SessionUser;
  } catch {
    return null;
  }
}
