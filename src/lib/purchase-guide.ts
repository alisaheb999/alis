type Purchase = { orderId?: string; email?: string; product?: string };
type Order = { id: string; plan: string; status: string; license_key: string | null };
type License = { license_key: string; status: string; expires_at?: string | null };
export function resolvePurchaseGuide(account: { email: string | null; orders: Order[]; licenses: License[] }, purchase: Purchase, now = Date.now()) {
  if (!account.email || purchase.email?.toLowerCase() !== account.email.toLowerCase()) return null;
  const order = account.orders.find(row => row.id === purchase.orderId);
  if (!order || !(order.plan.toLowerCase().includes('text') || order.plan === 'lifetime')) return null;
  const pending = ['pending', 'processing', 'review', 'submitted'].includes(order.status);
  const license = order.status === 'paid' && order.license_key
    ? account.licenses.find(row => row.license_key === order.license_key && row.status === 'active' && (!row.expires_at || new Date(row.expires_at).getTime() > now))
    : null;
  if (!pending && !license) return null;
  return { orderId: order.id, licenseKey: license?.license_key ?? null };
}
