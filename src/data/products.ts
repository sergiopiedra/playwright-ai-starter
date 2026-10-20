export interface Product {
  name: string;
  price: number;
}

/** Catalogue as shipped by Sauce Demo. Prices are used to verify checkout totals. */
export const PRODUCTS = {
  backpack: { name: 'Sauce Labs Backpack', price: 29.99 },
  bikeLight: { name: 'Sauce Labs Bike Light', price: 9.99 },
  boltTShirt: { name: 'Sauce Labs Bolt T-Shirt', price: 15.99 },
  fleeceJacket: { name: 'Sauce Labs Fleece Jacket', price: 49.99 },
  onesie: { name: 'Sauce Labs Onesie', price: 7.99 },
  redTShirt: { name: 'Test.allTheThings() T-Shirt (Red)', price: 15.99 },
} as const satisfies Record<string, Product>;

export const TAX_RATE = 0.08;
