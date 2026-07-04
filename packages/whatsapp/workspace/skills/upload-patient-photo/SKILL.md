---
name: upload-patient-photo
description: >
  Upload a patient's treatment-area photo to secure storage and return a URL.
  Call this for each photo the patient shares before calling create_nia_inquiry.
  The returned URL goes into the photoUrls array in the inquiry payload.
metadata:
  openclaw:
    requires:
      env:
        - BLOB_READ_WRITE_TOKEN
      bins:
        - curl
---

# upload_patient_photo

Upload one photo file to Nia's secure storage (Vercel Blob).

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| filePath | string | yes | Absolute local path to the downloaded media file |
| sessionId | string | no | Patient session identifier (used to organise storage) |
| mediaType | string | no | MIME type e.g. image/jpeg (default: image/jpeg) |

## Returns

JSON with a `url` field — the secure URL to include in `photoUrls` when calling `create_nia_inquiry`.

```json
{ "url": "https://..." }
```

## Example

```json
{
  "filePath": "/tmp/openclaw-media/photo_123.jpg",
  "sessionId": "+447911234567",
  "mediaType": "image/jpeg"
}
```

## Rules

- Call once per photo the patient shares.
- Collect all returned URLs into the `photoUrls` array for `create_nia_inquiry`.
- If upload fails, note the failure and set `photosDeclined: false` with an empty `photoUrls` array — do not block intake.
