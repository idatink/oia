import { z } from 'zod';
import { assertTransition, BookingStatus } from './types/core.js';

export const BookingTransitionSchema = z.object({
  current: z.nativeEnum(BookingStatus),
  attempted: z.nativeEnum(BookingStatus),
});

export type BookingTransition = z.infer<typeof BookingTransitionSchema>;

export function validateTransition(input: BookingTransition) {
  const result = assertTransition(input.current, input.attempted);
  if (result === 'INVALID_TRANSITION') {
    return { ok: false as const, code: 'INVALID_TRANSITION' as const, context: input };
  }
  return { ok: true as const, attempted: result };
}
