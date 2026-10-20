import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { z } from 'zod';
import {
  AuthTokenSchema,
  CreatedBookingSchema,
  type Booking,
  type CreatedBooking,
} from './schemas';

export interface BookingFilter {
  firstname?: string;
  lastname?: string;
  checkin?: string;
  checkout?: string;
}

/**
 * Thin client for https://restful-booker.herokuapp.com.
 *
 * Endpoint methods return the raw `APIResponse` so tests can assert status codes and
 * headers. `*OrThrow` helpers are for setup/teardown where only the happy path matters.
 */
export class BookingClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly token?: string,
  ) {}

  /** Returns a copy of this client that sends the given auth token. */
  withToken(token: string): BookingClient {
    return new BookingClient(this.request, token);
  }

  ping(): Promise<APIResponse> {
    return this.request.get('/ping');
  }

  createToken(username: string, password: string): Promise<APIResponse> {
    return this.request.post('/auth', { data: { username, password } });
  }

  listBookings(filter: BookingFilter = {}): Promise<APIResponse> {
    return this.request.get('/booking', { params: { ...filter } });
  }

  getBooking(id: number): Promise<APIResponse> {
    return this.request.get(`/booking/${id}`);
  }

  createBooking(booking: Booking): Promise<APIResponse> {
    return this.request.post('/booking', { data: booking });
  }

  updateBooking(id: number, booking: Booking): Promise<APIResponse> {
    return this.request.put(`/booking/${id}`, { data: booking, headers: this.authHeaders() });
  }

  patchBooking(id: number, changes: Partial<Booking>): Promise<APIResponse> {
    return this.request.patch(`/booking/${id}`, { data: changes, headers: this.authHeaders() });
  }

  deleteBooking(id: number): Promise<APIResponse> {
    return this.request.delete(`/booking/${id}`, { headers: this.authHeaders() });
  }

  async createTokenOrThrow(username: string, password: string): Promise<string> {
    const response = await this.createToken(username, password);
    return (await parseBody(response, AuthTokenSchema)).token;
  }

  async createBookingOrThrow(booking: Booking): Promise<CreatedBooking> {
    return parseBody(await this.createBooking(booking), CreatedBookingSchema);
  }

  private authHeaders(): Record<string, string> {
    return this.token ? { Cookie: `token=${this.token}` } : {};
  }
}

/** Asserts a 2xx status and validates the JSON body against a schema. */
export async function parseBody<T extends z.ZodType>(
  response: APIResponse,
  schema: T,
): Promise<z.infer<T>> {
  if (!response.ok()) {
    throw new Error(
      `${response.url()} -> ${response.status()} ${response.statusText()}\n${await response.text()}`,
    );
  }
  return schema.parse(await response.json());
}
