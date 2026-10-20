import type { Locator } from '@playwright/test';
import { parseMoney } from '@utils/money';
import { SecurePage } from './SecurePage';

export interface OrderSummary {
  subtotal: number;
  tax: number;
  total: number;
}

/** Checkout step two: order review with price breakdown. */
export class CheckoutOverviewPage extends SecurePage {
  protected readonly path = '/checkout-step-two.html';
  protected readonly titleText = 'Checkout: Overview';

  readonly itemNames: Locator = this.page.getByTestId('inventory-item-name');
  readonly itemPrices: Locator = this.page.getByTestId('inventory-item-price');
  readonly subtotalLabel: Locator = this.page.getByTestId('subtotal-label');
  readonly taxLabel: Locator = this.page.getByTestId('tax-label');
  readonly totalLabel: Locator = this.page.getByTestId('total-label');
  readonly finishButton: Locator = this.page.getByTestId('finish');
  readonly cancelButton: Locator = this.page.getByTestId('cancel');

  async getItemPrices(): Promise<number[]> {
    return (await this.itemPrices.allTextContents()).map(parseMoney);
  }

  async getSummary(): Promise<OrderSummary> {
    return {
      subtotal: parseMoney(await this.subtotalLabel.innerText()),
      tax: parseMoney(await this.taxLabel.innerText()),
      total: parseMoney(await this.totalLabel.innerText()),
    };
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }
}
