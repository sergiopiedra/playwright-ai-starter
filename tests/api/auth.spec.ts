import { expect, test } from '@fixtures';
import { AuthFailureSchema, AuthTokenSchema } from '@api/schemas';
import { env } from '@config/env';

test.describe('API: authentication', () => {
  test('health check responds', { tag: ['@smoke', '@regression'] }, async ({ bookingApi }) => {
    const response = await bookingApi.ping();

    // Restful Booker answers /ping with 201 Created.
    expect(response.status()).toBe(201);
  });

  test(
    'valid credentials return a token',
    { tag: ['@smoke', '@regression'] },
    async ({ bookingApi }) => {
      const response = await bookingApi.createToken(env.api.username, env.api.password);

      await expect(response).toBeOK();
      expect(AuthTokenSchema.parse(await response.json()).token).toMatch(/^\w+$/);
    },
  );

  test('invalid credentials are rejected', { tag: '@regression' }, async ({ bookingApi }) => {
    const response = await bookingApi.createToken(env.api.username, 'wrong-password');

    // Known API quirk: failures are reported in the body with HTTP 200.
    expect(response.status()).toBe(200);
    expect(AuthFailureSchema.safeParse(await response.json()).success).toBe(true);
  });
});
