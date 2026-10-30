import { createServerFn } from '@tanstack/react-start';
import { DIGITAL_PRODUCTS, FIXED_PRICES_BDT } from './digital-products';

export type DigitalPrice = { priceBdt: number | null; inStock: boolean };

// Legacy/manual information never authorizes automatic purchasing or inferred stock.
export const getDigitalPrices = createServerFn({ method: 'GET' }).handler(async (): Promise<Record<string, DigitalPrice>> =>
  Object.fromEntries(DIGITAL_PRODUCTS.map(p => [p.slug, { priceBdt: FIXED_PRICES_BDT[p.slug] ?? null, inStock: false }])));
