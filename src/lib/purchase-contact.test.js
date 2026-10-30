import { expect, test } from 'bun:test';
import { purchaseContactSchema } from './purchase-contact';

test('empty email/mobile cannot continue', () => {
  expect(purchaseContactSchema.safeParse('').success).toBe(false);
});
test('malformed email cannot continue', () => {
  expect(purchaseContactSchema.safeParse('buyer@').success).toBe(false);
  expect(purchaseContactSchema.safeParse('buyer@example.com').success).toBe(true);
});
test('mobile must contain a valid number, not arbitrary text', () => {
  expect(purchaseContactSchema.safeParse('01912345678').success).toBe(true);
  expect(purchaseContactSchema.safeParse('+880 1912-345678').success).toBe(true);
  expect(purchaseContactSchema.safeParse('call me 01912345678').success).toBe(false);
  expect(purchaseContactSchema.safeParse('01912').success).toBe(false);
});