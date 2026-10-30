import { describe, expect, test } from 'bun:test';
import { DIGITAL_PRODUCTS, DIGITAL_SHOWCASE, canPurchaseDigitalProduct } from './digital-products';

test('showcase keeps all seven candidates available to the shared grid', () => {
  expect(DIGITAL_SHOWCASE).toHaveLength(7);
  expect(DIGITAL_PRODUCTS).toHaveLength(7);
  expect(DIGITAL_SHOWCASE.map(product => product.slug)).toEqual(DIGITAL_PRODUCTS.map(product => product.slug));
});

describe('Digital products pending verification', () => {
  test('all seven initial candidates have no invented retail price or purchase access', () => {
    expect(DIGITAL_PRODUCTS).toHaveLength(7);
    for (const product of DIGITAL_PRODUCTS) {
      expect(product.priceBdt).toBeNull();
      expect(product.termsVerified).toBe(false);
      expect(canPurchaseDigitalProduct(product)).toBe(false);
    }
  });
  test('a price alone cannot authorize a purchase without verified terms', () => {
    expect(canPurchaseDigitalProduct({ ...DIGITAL_PRODUCTS[0], priceBdt: 299 })).toBe(false);
  });
});
import { retailPriceBdt } from './digital-products';
test('price = cost + max(60, 20%), clean 49/99 ending', () => {
  expect(retailPriceBdt(0.25)).toBe(99);
  expect(retailPriceBdt(0.45)).toBe(149);
  expect(retailPriceBdt(0.75)).toBe(199);
  expect(retailPriceBdt(5.3)).toBe(799);
  expect(retailPriceBdt(0)).toBeNull();
});
