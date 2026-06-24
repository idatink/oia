import { z } from "zod";
import { BookingStatus } from "@nia/shared/src/types/core.js";

export const BookingSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  clinicId: z.string(),
  procedure: z.string(),
  status: z.nativeEnum(BookingStatus),
  amount: z.number().nonnegative(),
  currency: z.string().min(3).max(3).default("USD"),
});

export type BookingRecord = z.infer<typeof BookingSchema>;
