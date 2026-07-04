import { NextResponse } from 'next/server';
import { getCoordinatorFromRequest } from '@/lib/api-auth';
import { db } from '@nia/shared/src/db';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const WORKSPACE = process.env.NIA_WORKSPACE_PATH ??
  path.join(process.cwd(), '../../whatsapp/workspace');

const FILES = ['SOUL.md', 'IDENTITY.md', 'AGENTS.md', 'TOOLS.md', 'USER.md'] as const;
type FileKey = (typeof FILES)[number];

function dbKey(name: FileKey) { return `workspace.${name}`; }

async function readFile(name: FileKey): Promise<string> {
  // Try filesystem first (works locally)
  try {
    const content = await fs.readFile(path.join(WORKSPACE, name), 'utf8');
    if (content) return content;
  } catch { /* fall through to DB */ }
  // Fall back to DB (works on Vercel)
  try {
    const row = await db.niaConfig.findUnique({ where: { key: dbKey(name) } });
    return (row?.value as string) ?? '';
  } catch { return ''; }
}

async function saveToDb(name: FileKey, content: string) {
  await db.niaConfig.upsert({
    where: { key: dbKey(name) },
    create: { key: dbKey(name), value: content, label: name, category: 'workspace' },
    update: { value: content },
  });
}

export async function GET(req: Request) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const entries = await Promise.all(FILES.map(async f => [f, await readFile(f)]));
  return NextResponse.json(Object.fromEntries(entries));
}

export async function POST(req: Request) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: Partial<Record<FileKey, string>> = await req.json();
  const saved: string[] = [];
  const dbSaved: string[] = [];

  for (const [key, content] of Object.entries(body)) {
    if (!FILES.includes(key as FileKey) || typeof content !== 'string') continue;
    // Write to filesystem
    try {
      await fs.writeFile(path.join(WORKSPACE, key), content, 'utf8');
      saved.push(key);
    } catch { /* Vercel — no local fs */ }
    // Always save to DB as source of truth
    try {
      await saveToDb(key as FileKey, content);
      dbSaved.push(key);
    } catch (err) {
      console.error('[training:db-save]', key, err);
    }
  }

  return NextResponse.json({ saved: [...new Set([...saved, ...dbSaved])] });
}
