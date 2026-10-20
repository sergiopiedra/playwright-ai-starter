import { expect, test } from '@fixtures';
import { credentialsFor, USERS } from '@data/users';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test(
    'standard user can log in and reach the inventory',
    { tag: ['@smoke', '@regression'] },
    async ({ loginPage, inventoryPage }) => {
      await loginPage.login(credentialsFor(USERS.standard));

      await inventoryPage.expectLoaded();
      await expect(inventoryPage.items).toHaveCount(6);
    },
  );

  test('locked out user sees an error', { tag: '@regression' }, async ({ loginPage }) => {
    await loginPage.login(credentialsFor(USERS.lockedOut));

    await loginPage.expectError('Epic sadface: Sorry, this user has been locked out.');
    await loginPage.expectOnPage();
  });

  const invalidLogins = [
    {
      scenario: 'wrong password',
      credentials: { username: USERS.standard, password: 'not-the-password' },
      error: 'Epic sadface: Username and password do not match any user in this service',
    },
    {
      scenario: 'missing username',
      credentials: { username: '', password: 'any' },
      error: 'Epic sadface: Username is required',
    },
    {
      scenario: 'missing password',
      credentials: { username: USERS.standard, password: '' },
      error: 'Epic sadface: Password is required',
    },
  ];

  for (const { scenario, credentials, error } of invalidLogins) {
    test(`rejects login with ${scenario}`, { tag: '@regression' }, async ({ loginPage }) => {
      await loginPage.login(credentials);

      await loginPage.expectError(error);
    });
  }

  test('user can log out', { tag: '@regression' }, async ({ loginPage, inventoryPage }) => {
    await loginPage.login(credentialsFor(USERS.standard));
    await inventoryPage.expectLoaded();

    await inventoryPage.header.logout();

    await loginPage.expectLoaded();
    await loginPage.expectOnPage();
  });

  test(
    'protected pages redirect anonymous users to login',
    { tag: '@regression' },
    async ({ page, loginPage }) => {
      await page.goto('/inventory.html');

      await loginPage.expectError(/You can only access '\/inventory\.html' when you are logged in/);
    },
  );
});
