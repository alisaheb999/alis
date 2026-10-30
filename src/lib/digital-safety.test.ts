import { describe, expect, it } from 'vitest';
import { canUseSupplierProduct, deliveryPriceMatches, canReviewPurchase } from './digital-safety';
describe('Live supplier checks', () => {
  const p = { in_stock: true, stock_count: 1, min_qty: 1, max_qty: 1, unit_price: 0.96 };
  it('rejects zero stock when Buy Now checks supplier data', () => { expect(canUseSupplierProduct(p)).toBe(true); expect(canUseSupplierProduct({ ...p, stock_count: 0 })).toBe(false); });
  it('rejects price changes between order and delivery', () => { expect(deliveryPriceMatches(199, 199)).toBe(true); expect(deliveryPriceMatches(249, 199)).toBe(false); });
  it('does not purchase unsupported quantities or invalid prices', () => { expect(canUseSupplierProduct(p, 2)).toBe(false); expect(canUseSupplierProduct({ ...p, unit_price: NaN })).toBe(false); expect(canUseSupplierProduct({ ...p, max_qty: 0 })).toBe(false); });
  it('only matching completed purchases can review', () => { const o = { product_slug: 'chatgpt-plus-renew', status: 'delivered', delivery_status: 'delivered' }; expect(canReviewPurchase(o, 'chatgpt-plus-renew')).toBe(true); expect(canReviewPurchase(o, 'live-1')).toBe(false); expect(canReviewPurchase({ ...o, status: 'pending' }, o.product_slug)).toBe(false); });
});