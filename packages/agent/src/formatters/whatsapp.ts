import type { ClinicResult } from '../repository/clinic.js';
import type { ParsedIntent } from '../agents/intent.js';

const FLAG: Record<string, string> = {
  TR: '🇹🇷',
  AE: '🇦🇪',
  CZ: '🇨🇿',
  DE: '🇩🇪',
  ES: '🇪🇸',
  GR: '🇬🇷',
  TH: '🇹🇭',
  MX: '🇲🇽',
};

function flag(country: string) {
  return FLAG[country] ?? '🏥';
}

function stars(rating: number) {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
}

export function formatClinicResults(
  intent: ParsedIntent,
  clinics: ClinicResult[],
): string {
  if (clinics.length === 0) {
    return [
      `I wasn't able to find verified clinics matching that search right now.`,
      ``,
      `Could you tell me more about what you're looking for? For example:`,
      `• Which procedure are you considering?`,
      `• Do you have a preferred country or city?`,
      ``,
      `I'm here to help you find the right clinic — no rush. 🤍`,
    ].join('\n');
  }

  const procedureLabel = intent.procedure
    ? `*${intent.procedure}*`
    : 'your procedure';
  const locationLabel = intent.location ? ` in *${intent.location}*` : '';

  const header = `Here are ${clinics.length} verified clinic${clinics.length > 1 ? 's' : ''} for ${procedureLabel}${locationLabel}:\n`;

  const cards = clinics
    .map((c, i) => {
      const lines = [
        `${i + 1}. ${flag(c.country)} *${c.name}*`,
        `   📍 ${c.city}`,
        `   ${stars(c.rating)} ${c.rating}/5 · ${c.reviewCount} reviews`,
        `   ${c.shortDescription}`,
        c.isVerified ? `   ✅ Verified by NIA` : '',
      ].filter(Boolean);
      return lines.join('\n');
    })
    .join('\n\n');

  const footer = [
    ``,
    `Reply with a number (1, 2 or 3) to learn more about a clinic, or ask me anything about these procedures.`,
    ``,
    `You can also share a photo of yourself and I'll match you to real before/after cases from these surgeons. 📸`,
  ].join('\n');

  return header + '\n' + cards + footer;
}

export function formatEscalationMessage(): string {
  return [
    `I want to make sure you get the right support. Let me connect you with one of our concierges — a real person who can walk through this with you.`,
    ``,
    `They'll be in touch within a few minutes. 🤍`,
  ].join('\n');
}

export function formatUnknownIntentMessage(): string {
  return [
    `Hi! I'm NIA, your cosmetic surgery concierge.`,
    ``,
    `I can help you:`,
    `• Find verified clinics for rhinoplasty, facelifts, BBL, liposuction, or breast augmentation`,
    `• Match before/after photos to your anatomy`,
    `• Track your pre-op timeline and compliance`,
    ``,
    `What are you considering? Just tell me in your own words. 😊`,
  ].join('\n');
}
