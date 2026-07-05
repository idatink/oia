import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

// Resume a web chat: return the saved messages for a web session so the client
// can rehydrate the conversation after a refresh or an accidental tab close.
// The sessionId is an unguessable per-browser token (like the chat route), so
// this is intentionally public — no account needed.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return Response.json({ messages: [] });

  try {
    const session = await db.nIASession.findUnique({
      where: { surface_identifier: { surface: 'web', identifier: sessionId } },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session) return Response.json({ messages: [] });

    const messages = session.messages
      // Skip the structured intake-complete summary row — it isn't chat text.
      .filter(m => !(m.content.startsWith('Intake completed:') && m.metadata))
      .map(m => {
        const meta = (m.metadata ?? null) as { photoUrls?: string[]; intakeComplete?: boolean } | null;
        return {
          role: m.role, // 'PATIENT' | 'NIA'
          content: m.content,
          photoUrls: meta?.photoUrls ?? [],
          intakeComplete: meta?.intakeComplete ?? false,
        };
      });

    return Response.json({ messages });
  } catch (err) {
    console.error('[chat:history]', err);
    return Response.json({ messages: [] });
  }
}
