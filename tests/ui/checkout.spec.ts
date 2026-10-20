import { expect, test } from '@fixtures';
import { buildCustomer } from '@data/customers';
import { PRODUCTS, TAX_RATE } from '@data/products';
import { STORAGE_STATE } from '@data/users';
import { roundCents } from '@utils/money';

test.use({ storageState: STORAGE_STATE.standard });

test.describe('Checkout', () => {
  const order = [PRODUCTS.backpack, PRODUCTS.bikeLight];

  test.beforeEach(async ({ inventoryPage, cartPage }) => {
    await inventoryPage.goto();
    await inventoryPage.addToCart(...order.map((product) => product.name));
    await inventoryPage.header.openCart();
    await cartPage.checkout();
  });

  test(
    'customer can complete a purchase',
    { tag: ['@smoke', '@regression'] },
    async ({ checkoutInformationPage, checkoutOverviewPage, checkoutCompletePage }) => {
      await checkoutInformationPage.submit(buildCustomer());

      await checkoutOverviewPage.expectLoaded();
      await checkoutOverviewPage.finish();

      await checkoutCompletePage.expectLoaded();
      await checkoutCompletePage.header.expectCartCount(0);
    },
  );

  test(
    'order overview shows correct subtotal, tax and total',
    { tag: '@regression' },
    async ({ checkoutInformationPage, checkoutOverviewPage }) => {
      await checkoutInformationPage.submit(buildCustomer());
      await checkoutOverviewPage.expectLoaded();

      const expectedSubtotal = roundCents(order.reduce((sum, product) => sum + product.price, 0));
      const expectedTax = roundCents(expectedSubtotal * TAX_RATE);

      await expect(checkoutOverviewPage.itemNames).toHaveText(order.map((product) => product.name));
      expect(await checkoutOverviewPage.getSummary()).toEqual({
        subtotal: expectedSubtotal,
        tax: expectedTax,
        total: roundCents(expectedSubtotal + expectedTax),
      });
    },
  );

  const requiredFields = [
    { field: 'firstName', error: 'Error: First Name is required' },
    { field: 'lastName', error: 'Error: Last Name is required' },
    { field: 'postalCode', error: 'Error: Postal Code is required' },
  ] as const;

  for (const { field, error } of requiredFields) {
    test(`${field} is required`, { tag: '@regression' }, async ({ checkoutInformationPage }) => {
      await checkoutInformationPage.submit(buildCustomer({ [field]: '' }));

      await checkoutInformationPage.expectError(error);
      await checkoutInformationPage.expectOnPage();
    });
  }

  test(
    'cancelling checkout returns to the cart with items intact',
    { tag: '@regression' },
    async ({ checkoutInformationPage, cartPage }) => {
      await checkoutInformationPage.cancelButton.click();

      await cartPage.expectLoaded();
      await expect(cartPage.items).toHaveCount(order.length);
    },
  );
});
