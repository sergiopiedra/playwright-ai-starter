import { expect, test } from '@fixtures';
import { BookingIdsSchema, BookingSchema, CreatedBookingSchema } from '@api/schemas';
import { env } from '@config/env';
import { buildBooking } from '@data/bookings';

test.describe('API: bookings (read-only)', () => {
  test('lists booking ids', { tag: ['@smoke', '@regression'] }, async ({ bookingApi }) => {
    const response = await bookingApi.listBookings();

    await expect(response).toBeOK();
    expect(BookingIdsSchema.parse(await response.json()).length).toBeGreaterThan(0);
  });

  test('unknown booking returns 404', { tag: '@regression' }, async ({ bookingApi }) => {
    const response = await bookingApi.getBooking(999_999_999);

    expect(response.status()).toBe(404);
  });
});

test.describe('API: bookings (mutating)', () => {
  test.skip(!env.allowDataMutation, `Data mutation is disabled for TEST_ENV=${env.name}`);

  test(
    'creates a booking and echoes the payload',
    { tag: ['@smoke', '@regression'] },
    async ({ authedBookingApi }) => {
      const booking = buildBooking();

      const response = await authedBookingApi.createBooking(booking);

      await expect(response).toBeOK();
      const created = CreatedBookingSchema.parse(await response.json());
      expect(created.booking).toEqual(booking);

      await authedBookingApi.deleteBooking(created.bookingid);
    },
  );

  test(
    'retrieves a booking by id',
    { tag: '@regression' },
    async ({ bookingApi, createdBooking }) => {
      const response = await bookingApi.getBooking(createdBooking.bookingid);

      await expect(response).toBeOK();
      expect(BookingSchema.parse(await response.json())).toEqual(createdBooking.booking);
    },
  );

  test(
    'filters bookings by guest name',
    { tag: '@regression' },
    async ({ bookingApi, createdBooking }) => {
      const { firstname, lastname } = createdBooking.booking;

      const response = await bookingApi.listBookings({ firstname, lastname });

      await expect(response).toBeOK();
      const ids = BookingIdsSchema.parse(await response.json()).map((entry) => entry.bookingid);
      expect(ids).toContain(createdBooking.bookingid);
    },
  );

  test(
    'fully updates a booking',
    { tag: '@regression' },
    async ({ authedBookingApi, createdBooking }) => {
      const updated = buildBooking();

      const response = await authedBookingApi.updateBooking(createdBooking.bookingid, updated);

      await expect(response).toBeOK();
      expect(BookingSchema.parse(await response.json())).toEqual(updated);
    },
  );

  test(
    'partially updates a booking',
    { tag: '@regression' },
    async ({ authedBookingApi, createdBooking }) => {
      const changes = { firstname: 'Patched', totalprice: 123 };

      const response = await authedBookingApi.patchBooking(createdBooking.bookingid, changes);

      await expect(response).toBeOK();
      expect(BookingSchema.parse(await response.json())).toEqual({
        ...createdBooking.booking,
        ...changes,
      });
    },
  );

  test(
    'rejects updates without a token',
    { tag: '@regression' },
    async ({ bookingApi, createdBooking }) => {
      const response = await bookingApi.updateBooking(createdBooking.bookingid, buildBooking());

      expect(response.status()).toBe(403);
    },
  );

  test(
    'deletes a booking',
    { tag: '@regression' },
    async ({ authedBookingApi, bookingApi, createdBooking }) => {
      const response = await authedBookingApi.deleteBooking(createdBooking.bookingid);

      // Known API quirk: DELETE answers 201 Created.
      expect(response.status()).toBe(201);
      expect((await bookingApi.getBooking(createdBooking.bookingid)).status()).toBe(404);
    },
  );
});
