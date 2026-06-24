export const BookingStatus = Object.freeze({
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  CLINIC_APPROVED: "CLINIC_APPROVED",
  CLINIC_REJECTED: "CLINIC_REJECTED",
  AWAITING_DEPOSIT: "AWAITING_DEPOSIT",
  DEPOSIT_PAID: "DEPOSIT_PAID",
  CONFIRMED: "CONFIRMED",
  IN_TREATMENT: "IN_TREATMENT",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const);

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const TransitionMap: Record<string, readonly BookingStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["CLINIC_APPROVED", "CLINIC_REJECTED", "CANCELLED"],
  CLINIC_APPROVED: ["AWAITING_DEPOSIT", "CANCELLED"],
  CLINIC_REJECTED: ["SUBMITTED", "CANCELLED"],
  AWAITING_DEPOSIT: ["DEPOSIT_PAID", "CANCELLED"],
  DEPOSIT_PAID: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_TREATMENT", "CANCELLED"],
  IN_TREATMENT: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
};

export function assertTransition(
  current: BookingStatus,
  attempted: BookingStatus,
): BookingStatus | "INVALID_TRANSITION" {
  const allowed = TransitionMap[current] ?? [];
  return allowed.includes(attempted) ? attempted : "INVALID_TRANSITION";
}
