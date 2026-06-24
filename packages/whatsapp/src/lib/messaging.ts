export interface MessagingProvider {
  send(to: string, body: string): Promise<void>;
}

export interface InboundMessage {
  from: string;
  body: string;
  mediaUrl?: string;
  mediaContentType?: string;
  providerMessageId?: string;
  raw: Record<string, string>;
}

export interface WebhookValidator {
  validate(signature: string | undefined, url: string, params: Record<string, string>): boolean;
}
