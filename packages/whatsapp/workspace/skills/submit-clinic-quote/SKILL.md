---
name: submit-clinic-quote
description: >
  Log a clinic negotiation and its final quote to the Nia platform, against the
  patient's lead. Call this at the END of a Clinic-mode negotiation (see AGENTS.md),
  once you have the clinic's best all-in offer or the negotiation has ended. The
  team sees the full negotiation transcript and the quote on the dashboard.
metadata:
  openclaw:
    requires:
      env:
        - NIA_API_URL
        - NIA_WHATSAPP_SECRET
      bins:
        - curl
---

# submit_clinic_quote

Submit a completed (or best-so-far) clinic negotiation + quote to the Nia backend.
Clinic mode only — never for a patient conversation.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| patientName | string | yes | Patient this quote is for. INTERNAL — used to link to their lead, never shared with the clinic. |
| patientPhone | string | no | Patient's WhatsApp number (E.164) if known — the most reliable link. INTERNAL. |
| procedure | string | yes | Procedure the quote is for (e.g. "tummy tuck"). |
| clinicName | string | no | Clinic's name, if known. |
| clinicPhone | string | yes | Clinic's WhatsApp number (this thread). |
| currency | string | no | Currency of the price (e.g. "GBP", "EUR"). |
| headlinePrice | number | no | Final/best all-in figure the clinic gave. |
| inclusions | array | no | What the price covers, e.g. ["surgeon fee","hotel 3 nights","transfers"]. |
| exclusions | array | no | Anything notably not included. |
| validUntil | string | no | How long the quote holds, if stated. |
| negotiationStatus | string | no | "agreed", "in_progress", or "rejected". |
| notes | string | no | Anything useful for the team. |
| conversationTranscript | string | no | Full clinic conversation, alternating `Clinic:` / `Oia:` lines, blank line between turns. |

## Example

```json
{
  "patientName": "Paola Atkinson",
  "patientPhone": "+447700900111",
  "procedure": "tummy tuck",
  "clinicName": "Aida Clinic",
  "clinicPhone": "+447834183762",
  "currency": "GBP",
  "headlinePrice": 4000,
  "inclusions": ["surgeon fee", "anaesthesia", "hotel 3 nights", "airport transfers", "aftercare"],
  "exclusions": ["flights"],
  "validUntil": "30 days",
  "negotiationStatus": "agreed",
  "notes": "Started at 4000 for surgery only; after pushing, they folded in 3 hotel nights + transfers + a free companion night at the same price.",
  "conversationTranscript": "Clinic: 4000 pounds 3 night stay free stay for a company\n\nOia: Thanks — to confirm, does that £4,000 cover the surgeon's fee, anaesthesia and aftercare too, or just the surgery and stay?\n\nClinic: surgery, anaesthesia and 3 nights hotel\n\nOia: My patient's comparing a few vetted clinics — any room to include airport transfers and aftercare in that £4,000 all-in?\n\nClinic: yes we can add transfers and aftercare, and a free companion night"
}
```
