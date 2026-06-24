import { z } from 'zod';
import { BookingStatus, assertTransition } from '../types/core.js';

export const BookingTransitionMap: Record<string, string[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['CLINIC_APPROVED', 'CLINIC_REJECTED'],
  CLINIC_APPROVED: ['AWAITING_DEPOSIT', 'CANCELLED'],
  CLINIC_REJECTED: ['SUBMITTED', 'CANCELLED'],
  AWAITING_DEPOSIT: ['DEPOSIT_PAID', 'CANCELLED'],
  DEPOSIT_PAID: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_TREATMENT', 'CANCELLED'],
  IN_TREATMENT: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: ['REFUNDED'],
  REFUNDED: [],
};

export const BookingConstraintErrorSchema = z.object({
  code: z.enum([
    'INVALID_TRANSITION',
    'CLINIC_CAPACITY_EXHAUSTED',
    'PATIENT_DOCUMENTS_INCOMPLETE',
    'DEPOSIT_WINDOW_EXPIRED',
    'WORKFLOW_VIOLATION',
  ]),
  current: z.nativeEnum(BookingStatus),
  attempted: z.nativeEnum(BookingStatus),
  detail: z.string().optional(),
});

export type BookingConstraintError = z.infer<typeof BookingConstraintErrorSchema>;

export function assertBookingConstraint(
  current: BookingStatus,
  attempted: BookingStatus,
): BookingConstraintError | true {
  const result = assertTransition(current, attempted);
  if (result !== 'INVALID_TRANSITION') return true;
  return {
    code: 'INVALID_TRANSITION',
    current,
    attempted,
    detail: `Invalid transition: ${current} → ${attempted}`,
  };
}
