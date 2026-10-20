import { expect, test } from '@fixtures';
import { STORAGE_STATE } from '@data/users';

test.describe('Accessibility: public pages', () => {
  test(
    'login page has no WCAG 2.1 AA violations',
    { tag: '@regression' },
    async ({ loginPage, a11y }) => {
      await loginPage.goto();

      expect(await a11y.scan()).toHaveNoViolations();
    },
  );

  test(
    'login page introduces no new axe best-practice issues',
    { tag: '@regression' },
    async ({ loginPage, a11y }) => {
      await loginPage.goto();

      // Known issues are baselined so the test only fails on *new* problems.
      // Remove an id once the app fixes it.
      expect(await a11y.scan({ tags: ['best-practice'] })).toHaveNoViolations({
        allow: ['page-has-heading-one', 'region'],
      });
    },
  );
});

test.describe('Accessibility: authenticated pages', () => {
  test.use({ storageState: STORAGE_STATE.standard });

  test(
    'inventory page has no WCAG 2.1 AA violations',
    { tag: '@regression' },
    async ({ inventoryPage, a11y }) => {
      await inventoryPage.goto();

      expect(await a11y.scan()).toHaveNoViolations();
    },
  );

  test(
    'cart page has no WCAG 2.1 AA violations',
    { tag: '@regression' },
    async ({ cartPage, a11y }) => {
      await cartPage.goto();

      expect(await a11y.scan()).toHaveNoViolations();
    },
  );

  test(
    'checkout form has no WCAG 2.1 AA violations',
    { tag: '@regression' },
    async ({ checkoutInformationPage, a11y }) => {
      await checkoutInformationPage.goto();

      expect(await a11y.scan()).toHaveNoViolations();
    },
  );
});
