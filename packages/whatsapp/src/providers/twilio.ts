import crypto from 'node:crypto';
import type { MessagingProvider, WebhookValidator } from '../lib/messaging.js';

export class TwilioMessagingProvider implements MessagingProvider {
  private accountSid: string;
  private authToken: string;
  private from: string;

  constructor() {
    this.accountSid = process.env.WA_ACCOUNT_SID ?? '';
    this.authToken = process.env.WA_AUTH_TOKEN ?? '';
    this.from = process.env.WA_FROM_NUMBER ?? '';

    if (!this.accountSid || !this.authToken || !this.from) {
      throw new Error('Twilio credentials not configured (WA_ACCOUNT_SID, WA_AUTH_TOKEN, WA_FROM_NUMBER)');
    }
  }

  async send(to: string, body: string): Promise<void> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const params = new URLSearchParams({ To: to, From: this.from, Body: body });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Twilio send failed ${res.status}: ${text}`);
    }
  }
}

export class TwilioWebhookValidator implements WebhookValidator {
  private authToken: string;

  constructor() {
    this.authToken = process.env.WA_AUTH_TOKEN ?? '';
  }

  validate(signature: string | undefined, url: string, params: Record<string, string>): boolean {
    if (!this.authToken || !signature) return false;

    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => acc + key + params[key], url);

    const expected = crypto
      .createHmac('sha1', this.authToken)
      .update(sortedParams)
      .digest('base64');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }
}
