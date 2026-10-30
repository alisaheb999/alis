import { expect, test } from 'bun:test';
import { validGiveawayVisitor } from './giveaway-identity';
test('returning browser retains identity', () => { const id='347e82aa-31f7-4eda-81c1-872aec57bba9'; expect(validGiveawayVisitor(id)).toBe(id); });
test('missing identity cannot authorize entry', () => expect(validGiveawayVisitor(undefined)).toBeNull());
test('malformed identity is rejected', () => expect(validGiveawayVisitor('arbitrary-device')).toBeNull());
