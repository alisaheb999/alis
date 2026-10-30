import { SUPPORT_NUMBER, UPDATE_GROUP_URL } from './site-contact';

/** Called only inside the assistant server handler; prices share checkout logic. */
export async function currentSiteFacts() {
  const { getBestPublicOffer } = await import('./coupon.server');
  const { textPriceSchedule } = await import('./text-price-schedule');
  let currentPrice: number | null = null;
  try {
    const { readPlanPrice } = await import('./pricing.server');
    const price = await readPlanPrice('text_lifetime', 'monthly');
    const offer = await getBestPublicOffer('text_lifetime', price);
    currentPrice = (offer?.amount ?? price) + (textPriceSchedule('text_lifetime')?.increase ?? 0);
  } catch { /* Do not guess a price when the offer cannot be read. */ }
  return `GHOSTAE, ghostae.com. Public website information:
Ghostae Text V2 is available. Ghostae Caption is under maintenance; do not suggest buying it. Cache Light is coming soon. Other ecosystem panels are in development; no release date promises.
Text page currently showcases 110+ premium animations, 120+ stylish animations and 200+ premium emoji previews. It has text styles, FFX and expressions; counts vary by release, avoid quoting older catalog counts.
Text supports After Effects and Premiere Pro 2023+, Windows 10/11 and modern macOS. Mac setup has a separate dialog with manual installer guidance. Do not promise unsupported versions.
Text free download is a limited trial package; Lifetime unlocks the purchased features. Current lifetime checkout price: ${currentPrice === null ? 'unavailable; direct users to the product page' : `BDT ${currentPrice}`}. Owner-managed public discounts only; valid coupons can give another applicable discount. A price countdown may be shown; never invent a fixed discount percentage.
Payment is via bKash, Nagad, Rocket or Upay following the checkout recipient shown. Transaction submission is pending until verification. Auto Payment Verification via Android relay is planned, not connected yet. Never say sending a transaction ID guarantees activation.
After verified payment, users can Create a password using their purchase email, confirm email ownership, then Login to see their own products/licence keys. Find your account sends a private recovery link for email accounts; phone-only customers contact support for ownership verification. Details shows payment history and a PDF invoice for paid orders.
Support is optional after purchase: WhatsApp ${SUPPORT_NUMBER}, support@ghostae.com. Update group: ${UPDATE_GROUP_URL}.
Paste the activation key in the extension and Activate; device limits depend on the purchased plan. Never ask for passwords or full licence keys in chat. Refund/payment terms are at /refund and /terms; do not invent policy conditions.
Home /, Login /auth, product /products/text, products /products, docs /docs, security /security, own products /dashboard. Unknown facts: refer to support.`;
}