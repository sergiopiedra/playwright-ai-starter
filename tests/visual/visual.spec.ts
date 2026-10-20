import { expect, test } from '@fixtures';
import { PRODUCTS } from '@data/products';
import { credentialsFor, STORAGE_STATE, USERS } from '@data/users';

test.describe('Visual regression: public pages', () => {
  test('login page', { tag: '@regression' }, async ({ page, loginPage }) => {
    await loginPage.goto();

    await expect(page).toHaveScreenshot('login.png', { fullPage: true });
  });

  test('login error state', { tag: '@regression' }, async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login(credentialsFor(USERS.lockedOut));
    await expect(loginPage.errorMessage).toBeVisible();

    await expect(page).toHaveScreenshot('login-error.png');
  });
});

test.describe('Visual regression: authenticated pages', () => {
  test.use({ storageState: STORAGE_STATE.standard });

  test('inventory page', { tag: ['@smoke', '@regression'] }, async ({ page, inventoryPage }) => {
    await inventoryPage.goto();

    await expect(page).toHaveScreenshot('inventory.png', {
      fullPage: true,
      // The footer shows the current year; mask it so baselines don't expire.
      mask: [page.getByTestId('footer-copy')],
    });
  });

  test('product card', { tag: '@regression' }, async ({ inventoryPage }) => {
    await inventoryPage.goto();

    await expect(inventoryPage.item(PRODUCTS.backpack.name)).toHaveScreenshot('product-card.png');
  });

  test('cart with items', { tag: '@regression' }, async ({ page, inventoryPage, cartPage }) => {
    await inventoryPage.goto();
    await inventoryPage.addToCart(PRODUCTS.backpack.name, PRODUCTS.bikeLight.name);
    await inventoryPage.header.openCart();
    await cartPage.expectLoaded();

    await expect(page).toHaveScreenshot('cart.png', {
      fullPage: true,
      mask: [page.getByTestId('footer-copy')],
    });
  });
});
