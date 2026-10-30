export function canUseSupplierProduct(p: { in_stock: boolean; stock_count: number; min_qty: number; max_qty: number; unit_price: number }, quantity = 1) {
  return quantity === 1 && p.in_stock && Number.isFinite(p.stock_count) && p.stock_count >= 1 && p.min_qty <= 1 && p.max_qty >= 1 && Number.isFinite(p.unit_price) && p.unit_price > 0;
}
export function deliveryPriceMatches(quoted: number, charged: number) {
  return Number.isFinite(quoted) && quoted > 0 && quoted === charged;
}
export function canReviewPurchase(order: { product_slug: string; status: string; delivery_status: string }, slug: string) {
  return order.product_slug === slug && order.status === 'delivered' && order.delivery_status === 'delivered';
}