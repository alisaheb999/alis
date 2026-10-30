export type RelatedItem = { slug: string; title: string; image: string | null; kind: 'extension' | 'digital' | 'free' };
export function selectRelatedProducts(currentSlug: string, paid: RelatedItem[], free: RelatedItem[], limit = 6): RelatedItem[] {
  const seen = new Set([currentSlug]);
  const result: RelatedItem[] = [];
  const candidates = [paid[0], free[0], ...paid.slice(1, 3), free[1], ...paid.slice(3), ...free.slice(2)];
  for (const item of candidates) {
    if (!item || seen.has(item.slug)) continue;
    seen.add(item.slug); result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}
