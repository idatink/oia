import { z } from "zod";

export const PatientStateSchema = z.object({
  hasQualifyingProcedure: z.boolean(),
  hasRequiredDocuments: z.boolean(),
  depositCleared: z.boolean(),
  clinicConfirmed: z.boolean(),
});

export type PatientState = z.infer<typeof PatientStateSchema>;

export const PatientStateApplicabilitySchema = z.object({
  patientId: z.string(),
  applicable: PatientStateSchema,
  sourceBookingId: z.string().optional(),
  evaluatedAt: z.string().datetime(),
});

export type PatientStateApplicability = z.infer<typeof PatientStateApplicabilitySchema>;
