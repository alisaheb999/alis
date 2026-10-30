import { expect, test } from 'bun:test';
import { FIXED_PRICES_BDT } from './digital-products';
test('Gemini AI Pro 18 months costs 250 taka', () => { expect(FIXED_PRICES_BDT['gemini-ai-pro']).toBe(250); });
test('ChatGPT Plus is priced from $17 → 2210 taka', () => { expect(FIXED_PRICES_BDT['chatgpt-plus']).toBe(2210); });
test('Canva Pro is priced from ~$3 → 460 taka', () => { expect(FIXED_PRICES_BDT['canva-pro']).toBe(460); });
