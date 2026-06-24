import Fastify from 'fastify';
import formbody from '@fastify/formbody';
import { inboundRoute } from './routes/inbound.js';
import { TwilioMessagingProvider, TwilioWebhookValidator } from './providers/twilio.js';

const server = Fastify({ logger: true });

server.register(formbody);

// Swap TwilioMessagingProvider / TwilioWebhookValidator for any other provider here.
const sender = new TwilioMessagingProvider();
const validator = new TwilioWebhookValidator();

server.register(
  async (app) => inboundRoute(app, { sender, validator }),
  { prefix: '/webhooks/wa' },
);

server.get('/health', async () => ({ ok: true }));

const port = Number(process.env.PORT ?? 3003);
server.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});
