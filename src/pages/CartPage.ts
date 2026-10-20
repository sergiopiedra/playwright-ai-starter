import type { Locator } from '@playwright/test';
import { SecurePage } from './SecurePage';

export class CartPage extends SecurePage {
  protected readonly path = '/cart.html';
  protected readonly titleText = 'Your Cart';

  readonly items: Locator = this.page.getByTestId('inventory-item');
  readonly itemNames: Locator = this.page.getByTestId('inventory-item-name');
  readonly checkoutButton: Locator = this.page.getByTestId('checkout');
  readonly continueShoppingButton: Locator = this.page.getByTestId('continue-shopping');

  item(name: string): Locator {
    return this.items.filter({
      has: this.page.getByTestId('inventory-item-name').getByText(name, { exact: true }),
    });
  }

  async remove(name: string): Promise<void> {
    await this.item(name).getByRole('button', { name: 'Remove' }).click();
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }
}
