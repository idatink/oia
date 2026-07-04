---
name: get-clinic-recommendations
description: >
  Fetch real clinic recommendations from the Nia database for a given procedure.
  Call this immediately after create_nia_inquiry succeeds, before presenting results to the patient.
metadata:
  openclaw:
    requires:
      env:
        - NIA_WEB_URL
      bins:
        - curl
        - jq
---

# get_clinic_recommendations

Retrieve matched clinics from the Nia platform for the patient's procedure.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| procedure | string | yes | The patient's procedure of interest (e.g. "rhinoplasty", "breast augmentation") |

## Returns

JSON array of clinic objects with: `name`, `city`, `country`, `description`, `niaScore`, `accreditations`, `specialties`, `website`.

Returns an empty array if no clinics match.

## Example

Input:
```json
{ "procedure": "rhinoplasty" }
```

Output:
```json
[
  {
    "id": "clx...",
    "name": "Çağrı Sade Clinic",
    "city": "Istanbul",
    "country": "TR",
    "description": "Boutique surgical practice led by Dr. Çağrı Sade...",
    "niaScore": 9,
    "accreditations": ["JCI"],
    "specialties": ["rhinoplasty", "facial-surgery"],
    "website": "https://cagrisade.com"
  }
]
```
