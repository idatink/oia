---
name: create-nia-inquiry
description: >
  Submit a completed patient intake AND suitability assessment to the Nia platform.
  Call this once you have collected all required patient data AND completed your
  internal suitability assessment. The admin team will receive your full assessment
  and convert it to a lead in one click — no additional data entry required.
metadata:
  openclaw:
    requires:
      env:
        - NIA_API_URL
        - NIA_WHATSAPP_SECRET
      bins:
        - curl
---

# create_nia_inquiry

Submit the complete patient intake and your suitability assessment to the Nia backend.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | yes | Patient's full name |
| phone | string | yes | Patient's WhatsApp number (E.164 format) |
| procedure | string | yes | Procedure they're interested in |
| intent | string | yes | Free-text summary of what the patient wants and why |
| dateOfBirth | string | yes | ISO 8601 date (e.g. "1985-03-14") — required before conversion |
| countryOfResidence | string | no | Country name or ISO code |
| preferredLanguage | string | no | Language name or code |
| medicalScreening | object | no | Map of condition keys to boolean |
| photoDescriptions | array | no | Descriptions of any photos shared |
| conversationTranscript | string | no | Full conversation as plain text |
| photosDeclined | boolean | no | true if patient refused photos twice |
| aiScore | number | yes | Suitability score 0–100 (your assessment) |
| aiPriority | string | yes | "High", "Medium", or "Low" |
| aiRationale | string | yes | 2–3 sentence clinical rationale for admin review |

### medicalScreening keys
diabetes, cancerTreatment, organTransplant, dvt, pacemaker, hypertension, heartDisease,
thyroidDisorder, immuneDisorder, pregnancy, allergies

## Example

```json
{
  "name": "Sarah M",
  "phone": "+447700123456",
  "procedure": "rhinoplasty",
  "intent": "Patient wants subtle tip refinement and bridge reduction. Motivated by upcoming wedding in 8 months. Well-researched, asked detailed pre-op questions.",
  "dateOfBirth": "1990-06-15",
  "countryOfResidence": "United Kingdom",
  "preferredLanguage": "English",
  "medicalScreening": {
    "diabetes": false,
    "hypertension": true,
    "allergies": false
  },
  "photoDescriptions": ["Side profile shared, good lighting"],
  "aiScore": 82,
  "aiPriority": "High",
  "aiRationale": "Strong rhinoplasty candidate with clear aesthetic goals and a specific motivation (wedding). Managed hypertension is a minor flag but not a contraindication. Timeline of 8 months gives good lead time. Score: 82."
}
```
