import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { IntentPipeline } from '@nia/agent';
import type { MessagingProvider, WebhookValidator } from '../lib/messaging.js';

const InboundSchema = z.object({
  From: z.string(),
  To: z.string(),
  Body: z.string().optional().default(''),
  NumMedia: z.string().optional(),
  MediaUrl0: z.string().url().optional(),
  MediaContentType0: z.string().optional(),
});

const pipeline = new IntentPipeline();

export interface InboundRouteOptions {
  sender: MessagingProvider;
  validator: WebhookValidator;
}

export async function inboundRoute(
  fastify: FastifyInstance,
  { sender, validator }: InboundRouteOptions,
) {
  fastify.post('/inbound', async (req, reply) => {
    const sig = req.headers['x-twilio-signature'] as string | undefined;
    const url = `${req.protocol}://${req.hostname}${req.url}`;

    if (!validator.validate(sig, url, req.body as Record<string, string>)) {
      return reply.code(403).send({ error: 'Invalid webhook signature' });
    }

    const parsed = InboundSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Malformed payload' });
    }

    const { From, Body, MediaUrl0 } = parsed.data;

    fastify.log.info({ from: From, body: Body, mediaUrl: MediaUrl0 }, 'inbound WA message');

    try {
      const result = await pipeline.run({ from: From, body: Body, mediaUrl: MediaUrl0 });

      fastify.log.info({ intent: result.intent, escalate: result.escalate }, 'pipeline result');

      await sender.send(From, result.replyText);

      // TODO: if result.escalate — persist escalation + notify coordinator via Pusher
    } catch (err) {
      fastify.log.error(err, 'pipeline error');
      await sender
        .send(From, "I'm having a moment — please try again in a few seconds. 🤍")
        .catch(() => {});
    }

    reply.code(204).send();
  });
}
