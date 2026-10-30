export const GIVEAWAY_COOKIE = 'ghostae-community-visitor';
export function validGiveawayVisitor(value: string | undefined): string | null {
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}
