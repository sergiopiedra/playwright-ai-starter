import type { Locator } from '@playwright/test';
import { parseMoney } from '@utils/money';
import { SecurePage } from './SecurePage';

/** Values of the product sort `<select>`. */
export const SORT_OPTIONS = {
  nameAsc: 'az',
  nameDesc: 'za',
  priceAsc: 'lohi',
  priceDesc: 'hilo',
} as const;

export type SortOption = (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS];

export class InventoryPage extends SecurePage {
  protected readonly path = '/inventory.html';
  protected readonly titleText = 'Products';

  readonly items: Locator = this.page.getByTestId('inventory-item');
  readonly itemNames: Locator = this.page.getByTestId('inventory-item-name');
  readonly itemPrices: Locator = this.page.getByTestId('inventory-item-price');
  readonly sortSelect: Locator = this.page.getByTestId('product-sort-container');

  /** A single product card, matched by its exact name. */
  item(name: string): Locator {
    return this.items.filter({
      has: this.page.getByTestId('inventory-item-name').getByText(name, { exact: true }),
    });
  }

  async addToCart(...names: string[]): Promise<void> {
    for (const name of names) {
      await this.item(name).getByRole('button', { name: 'Add to cart' }).click();
    }
  }

  async removeFromCart(name: string): Promise<void> {
    await this.item(name).getByRole('button', { name: 'Remove' }).click();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortSelect.selectOption(option);
  }

  async getItemNames(): Promise<string[]> {
    return this.itemNames.allTextContents();
  }

  async getItemPrices(): Promise<number[]> {
    return (await this.itemPrices.allTextContents()).map(parseMoney);
  }
}
