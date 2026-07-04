import { NextResponse } from 'next/server';
import { getCoordinatorFromRequest } from '@/lib/api-auth';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type Message = { role: 'user' | 'assistant'; content: string };

export async function POST(req: Request) {
  const coordinator = await getCoordinatorFromRequest(req);
  if (!coordinator) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { messages, systemPrompt } = await req.json() as {
    messages: Message[];
    systemPrompt: string;
  };

  if (!messages?.length) {
    return NextResponse.json({ error: 'Missing messages' }, { status: 400 });
  }
  const effectiveSystem = systemPrompt?.trim() ||
    'You are Nia, a warm and professional medical tourism concierge. Help patients explore surgery options abroad.';

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: effectiveSystem,
          messages,
          stream: true,
        });

        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`\n[Error: ${err instanceof Error ? err.message : 'Unknown'}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
  });
}
