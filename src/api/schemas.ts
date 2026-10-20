import { z } from 'zod';

/** Contract for Restful Booker resources. Responses are parsed, so drift fails loudly. */
export const BookingSchema = z.object({
  firstname: z.string(),
  lastname: z.string(),
  totalprice: z.number(),
  depositpaid: z.boolean(),
  bookingdates: z.object({
    checkin: z.iso.date(),
    checkout: z.iso.date(),
  }),
  additionalneeds: z.string().optional(),
});
export type Booking = z.infer<typeof BookingSchema>;

export const CreatedBookingSchema = z.object({
  bookingid: z.number().int().positive(),
  booking: BookingSchema,
});
export type CreatedBooking = z.infer<typeof CreatedBookingSchema>;

export const BookingIdsSchema = z.array(z.object({ bookingid: z.number().int() }));

export const AuthTokenSchema = z.object({ token: z.string().min(1) });

/** Restful Booker answers bad credentials with HTTP 200 and this body. */
export const AuthFailureSchema = z.object({ reason: z.literal('Bad credentials') });
