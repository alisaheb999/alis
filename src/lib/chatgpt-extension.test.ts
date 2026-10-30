import { describe, expect, it } from 'vitest';
import { CHATGPT_EXTENSION } from './chatgpt-extension';
describe('Owner-defined ChatGPT extension rules', () => {
  it('charges 199 BDT', () => expect(CHATGPT_EXTENSION.priceBdt).toBe(199));
  it('has a 30-day warranty', () => expect(CHATGPT_EXTENSION.warrantyDays).toBe(30));
  it('sells one month', () => expect(CHATGPT_EXTENSION.durationMonths).toBe(1));
  it('shares with at most five users', () => expect(CHATGPT_EXTENSION.maxSharedUsers).toBe(5));
});