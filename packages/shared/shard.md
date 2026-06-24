# Shared Shard — Booking Conformance Contract

This document is the authoritative conformance layer shared across all surfaces
(patient web, clinic dashboard, WhatsApp, desk ops). Surface-specific code must
reference this contract; it is **not allowed to re-derive or override these rules elsewhere**.

---

## 1. BookingState Enum

```text
DRAFT            = 0   (touched only by the owning patient)
SUBMITTED        = 1   (forwarded by NIA after patient submits)
CLINIC_APPROVED  = 2   (clinic dashboard action)
CLINIC_REJECTED  = 3   (clinic dashboard action)
AWAITING_DEPOSIT = 4   (NIA after clinic approval)
DEPOSIT_PAID     = 5   (payment + escrow confirmation)
CONFIRMED        = 6   (all preconditions met; travel window starts)
IN_TREATMENT     = 7   (clinic marks start of care)
COMPLETED        = 8   (clinic + patient both confirm)
CANCELLED        = 9   (any side, through validated transition)
REFUNDED         = 10  (post-cancellation flow)
```

`BookingState` is a closed set. Treat the integer values as opaque outside this
module; use named references only.

---

## 2. PatientStateApplicability Schema

When NIA (or any surface) evaluates whether a booking transition is valid,
the patient applicability component is checked against the patient's current
context. This schema is evaluated from the authoritative source of truth
(`patient_profile` table plus current booking fields).

```jsonc
{
  "hasQualifyingProcedure": "boolean — medical necessity pre-screen passed",
  "hasRequiredDocuments":  "boolean — passport, med history, consent",
  "depositCleared":        "boolean — escrow funds confirmed",
  "clinicConfirmed":       "boolean — clinic marked CLINIC_APPROVED or beyond",
  "travelWindowActive":    "boolean — within booked arrival/departure dates",
  "inTreatment":           "boolean — patient checked in / pre-op started"
}
```

Field contract:
- Every read must go through `patientContextService.loadApplicability(patientId)`.
- Fields are **not cached across surfaces longer than 30 seconds**; force reload
  before a transition that unlocks a sensitive path (e.g. DEPOSIT_DUE → CONFIRMED).
- A missing field in the schema is treated as `false` (fail-closed security stance).

---

## 3. Booking Transition Matrix

These transitions are **surface-agnostic** and enforced at the BFF before any
write hits the database.

```text
DRAFT
  └── SUBMITTED
        ├── CLINIC_APPROVED
        │     ├── AWAITING_DEPOSIT
        │     │     ├── DEPOSIT_PAID
        │     │     │     ├── CONFIRMED
        │     │     │     │     ├── IN_TREATMENT
        │     │     │     │     │     ├── COMPLETED
        │     │     │     │     │     └── CANCELLED
        │     │     │     │     └── CANCELLED
        │     │     │     └── CANCELLED
        │     │     └── CANCELLED
        │     └── CLINIC_REJECTED
        │           ├── SUBMITTED   (patient resubmits)
        │           └── CANCELLED
        └── CANCELLED
              └── REFUNDED
```

Concisely encoded:

```text
DRAFT            -> SUBMITTED, CANCELLED
SUBMITTED        -> CLINIC_APPROVED, CLINIC_REJECTED, CANCELLED
CLINIC_APPROVED  -> AWAITING_DEPOSIT, CANCELLED
CLINIC_REJECTED  -> SUBMITTED, CANCELLED
AWAITING_DEPOSIT -> DEPOSIT_PAID, CANCELLED
DEPOSIT_PAID     -> CONFIRMED, CANCELLED
CONFIRMED        -> IN_TREATMENT, CANCELLED
IN_TREATMENT     -> COMPLETED, CANCELLED
COMPLETED        -> (none)
CANCELLED        -> REFUNDED
REFUNDED         -> (none)
```

Supplementary preconditions (applied **after** state transition validation):

| Target State      | Required PatientStateApplicability             |
|-------------------|-----------------------------------------------|
| SUBMITTED         | hasQualifyingProcedure, hasRequiredDocuments  |
| DEPOSIT_PAID      | depositCleared, clinicConfirmed               |
| CONFIRMED         | travelWindowActive                            |
| IN_TREATMENT      | travelWindowActive                            |
| REFUNDED          | CANCELLED first; escrow disbursed             |

---

## 4. Cross-Surface Enforcement Rules

1. **No surface may bypass this contract.** Every write path (web API, dashboard
   mutation, WhatsApp webhook handler) calls thesame transition guard.
2. **Only NIA or the owning party may initiate certain transitions.**
   - Patient-initiated: DRAFT→SUBMITTED, DRAFT→CANCELLED, CANCELLED→REFUNDED
   - Clinic-initiated: (clinic side can only approve/reject after SUBMITTED)
   - System-initiated: SUBMITTED→CLINIC_REJECTED (auto-decline rules, if active)
3. **WhatsApp transitions are limited to read-only guidance** unless the message
   contains a signed one-time token tied to the booking id.
4. **Audit log is append-only.** Any state transition writes exactly one record
   to `booking_state_history` with `{from, to, by: surface, by_user, ts}`.
