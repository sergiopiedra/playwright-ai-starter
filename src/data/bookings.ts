import { faker } from '@faker-js/faker';
import type { Booking } from '@api/schemas';

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

/** Builds a valid, unique booking so parallel tests never collide on data. */
export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  const checkin = faker.date.soon({ days: 30 });
  const checkout = faker.date.soon({ days: 14, refDate: checkin });

  return {
    firstname: faker.person.firstName(),
    lastname: `${faker.person.lastName()}-${faker.string.alphanumeric(6)}`,
    totalprice: faker.number.int({ min: 50, max: 2000 }),
    depositpaid: faker.datatype.boolean(),
    bookingdates: { checkin: isoDate(checkin), checkout: isoDate(checkout) },
    additionalneeds: faker.helpers.arrayElement(['Breakfast', 'Late checkout', 'Parking']),
    ...overrides,
  };
}
