import { expect, test } from '@fixtures';
import { PRODUCTS } from '@data/products';
import { STORAGE_STATE } from '@data/users';
import { SORT_OPTIONS } from '@pages';

test.use({ storageState: STORAGE_STATE.standard });

test.describe('Inventory & cart', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  test('adding products updates the cart badge', { tag: '@smoke' }, async ({ inventoryPage }) => {
    await inventoryPage.addToCart(PRODUCTS.backpack.name, PRODUCTS.bikeLight.name);

    await inventoryPage.header.expectCartCount(2);
  });

  test(
    'removing a product from the inventory updates the badge',
    { tag: '@regression' },
    async ({ inventoryPage }) => {
      await inventoryPage.addToCart(PRODUCTS.backpack.name, PRODUCTS.onesie.name);
      await inventoryPage.removeFromCart(PRODUCTS.backpack.name);

      await inventoryPage.header.expectCartCount(1);
    },
  );

  test(
    'cart lists exactly the products that were added',
    { tag: ['@smoke', '@regression'] },
    async ({ inventoryPage, cartPage }) => {
      await inventoryPage.addToCart(PRODUCTS.fleeceJacket.name, PRODUCTS.redTShirt.name);
      await inventoryPage.header.openCart();

      await cartPage.expectLoaded();
      await expect(cartPage.itemNames).toHaveText([
        PRODUCTS.fleeceJacket.name,
        PRODUCTS.redTShirt.name,
      ]);
    },
  );

  test(
    'removing a product from the cart page',
    { tag: '@regression' },
    async ({ inventoryPage, cartPage }) => {
      await inventoryPage.addToCart(PRODUCTS.backpack.name, PRODUCTS.bikeLight.name);
      await inventoryPage.header.openCart();

      await cartPage.remove(PRODUCTS.backpack.name);

      await expect(cartPage.itemNames).toHaveText([PRODUCTS.bikeLight.name]);
      await cartPage.header.expectCartCount(1);
    },
  );

  test(
    'cart contents persist when continuing shopping',
    { tag: '@regression' },
    async ({ inventoryPage, cartPage }) => {
      await inventoryPage.addToCart(PRODUCTS.boltTShirt.name);
      await inventoryPage.header.openCart();
      await cartPage.continueShopping();

      await inventoryPage.expectLoaded();
      await inventoryPage.header.expectCartCount(1);
    },
  );

  test('products can be sorted by name', { tag: '@regression' }, async ({ inventoryPage }) => {
    await inventoryPage.sortBy(SORT_OPTIONS.nameDesc);

    const names = await inventoryPage.getItemNames();
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
  });

  test('products can be sorted by price', { tag: '@regression' }, async ({ inventoryPage }) => {
    await inventoryPage.sortBy(SORT_OPTIONS.priceAsc);

    const prices = await inventoryPage.getItemPrices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});
