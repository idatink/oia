export const PROCEDURE_CATEGORIES = {
  DENTAL: "dental",
  COSMETIC: "cosmetic",
  ORTHOPEDIC: "orthopedic",
  CARDIO: "cardio",
  FERTILITY: "fertility",
  OPHTHALMOLOGY: "ophthalmology",
  WELLNESS: "wellness",
  GENERAL: "general",
} as const;

export type ProcedureCategory = (typeof PROCEDURE_CATEGORIES)[keyof typeof PROCEDURE_CATEGORIES];

export const PROCEDURE_INTENSITY = {
  MINOR: "minor",
  MODERATE: "moderate",
  MAJOR: "major",
} as const;

export type ProcedureIntensity = (typeof PROCEDURE_INTENSITY)[keyof typeof PROCEDURE_INTENSITY];

export const BOOKING_CHANNELS = {
  PATIENT_PORTAL: "patient_portal",
  CLINIC_DASHBOARD: "clinic_dashboard",
  API: "api",
  WHATSAPP: "whatsapp",
} as const;

export type BookingChannel = (typeof BOOKING_CHANNELS)[keyof typeof BOOKING_CHANNELS];
