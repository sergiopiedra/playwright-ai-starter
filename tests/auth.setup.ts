import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test as setup } from '@fixtures';
import { credentialsFor, STORAGE_STATE, USERS } from '@data/users';

setup('authenticate as standard_user', async ({ page, loginPage, inventoryPage }) => {
  await loginPage.goto();
  await loginPage.login(credentialsFor(USERS.standard));
  await inventoryPage.expectLoaded();

  // Sauce Demo issues a 10-minute session cookie. Persist it as a session cookie
  // (expires: -1) so long cross-browser runs don't get logged out halfway through.
  const state = await page.context().storageState();
  const cookies = state.cookies.map((cookie) => ({ ...cookie, expires: -1 }));
  expect(cookies.map((cookie) => cookie.name)).toContain('session-username');

  await fs.mkdir(path.dirname(STORAGE_STATE.standard), { recursive: true });
  await fs.writeFile(STORAGE_STATE.standard, JSON.stringify({ ...state, cookies }, null, 2));
});
