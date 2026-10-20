import { expect, type Locator } from '@playwright/test';
import type { Customer } from '@data/customers';
import { SecurePage } from './SecurePage';

/** Checkout step one: shipping information form. */
export class CheckoutInformationPage extends SecurePage {
  protected readonly path = '/checkout-step-one.html';
  protected readonly titleText = 'Checkout: Your Information';

  readonly firstNameInput: Locator = this.page.getByTestId('firstName');
  readonly lastNameInput: Locator = this.page.getByTestId('lastName');
  readonly postalCodeInput: Locator = this.page.getByTestId('postalCode');
  readonly continueButton: Locator = this.page.getByTestId('continue');
  readonly cancelButton: Locator = this.page.getByTestId('cancel');
  readonly errorMessage: Locator = this.page.getByTestId('error');

  async fill(customer: Partial<Customer>): Promise<void> {
    if (customer.firstName !== undefined) await this.firstNameInput.fill(customer.firstName);
    if (customer.lastName !== undefined) await this.lastNameInput.fill(customer.lastName);
    if (customer.postalCode !== undefined) await this.postalCodeInput.fill(customer.postalCode);
  }

  async submit(customer: Partial<Customer>): Promise<void> {
    await this.fill(customer);
    await this.continueButton.click();
  }

  async expectError(message: string | RegExp): Promise<void> {
    await expect(this.errorMessage).toHaveText(message);
  }
}
