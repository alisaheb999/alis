import { expect, test } from 'bun:test';
import { selectRelatedProducts } from './related-products';
const paid = ['text', 'capcut-pro', 'gemini-ai-pro', 'canva-pro'].map(slug => ({ slug, kind: 'digital', title: slug, image: null }));
const free = ['free-one', 'free-two'].map(slug => ({ slug, kind: 'free', title: slug, image: null }));
test('current product is excluded', () => { expect(selectRelatedProducts('text', paid, free).map(p => p.slug)).not.toContain('text'); });
test('free and paid alternatives appear together', () => {
 const rows = selectRelatedProducts('other', paid, free);
 expect(rows.filter(p => p.kind === 'free').map(p => p.slug)).toEqual(['free-one', 'free-two']);
 expect(rows.filter(p => p.kind !== 'free').map(p => p.slug)).toEqual(['text', 'capcut-pro', 'gemini-ai-pro', 'canva-pro']);
});
test('no duplicate products', () => { expect(selectRelatedProducts('other', paid, [...free, free[0]]).filter(p => p.slug === 'free-one')).toHaveLength(1); });
