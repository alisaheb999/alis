import { describe, it, expect } from "vitest";
import { grossProfit, isPubliclyVisible, suggestGear } from "./gear-rules";

describe("gear rules", () => {
  it("gross profit = sale - procurement - extra", () => {
    expect(grossProfit({ sale_price_bdt: 2600, procurement_cost_bdt: 2100, extra_cost_bdt: 150 })).toBe(350);
    expect(grossProfit({ sale_price_bdt: 2600, procurement_cost_bdt: null, extra_cost_bdt: 0 })).toBeNull();
  });
  it("drafts and unpriced items stay hidden", () => {
    expect(isPubliclyVisible({ status: "draft", sale_price_bdt: 500, procurement_cost_bdt: 300 })).toBe(false);
    expect(isPubliclyVisible({ status: "published", sale_price_bdt: null, procurement_cost_bdt: 300 })).toBe(false);
    expect(isPubliclyVisible({ status: "published", sale_price_bdt: 500, procurement_cost_bdt: null })).toBe(false);
    expect(isPubliclyVisible({ status: "published", sale_price_bdt: 500, procurement_cost_bdt: 300 })).toBe(true);
  });
  it("suggestions never include the current product", () => {
    const a = { slug: "a", category: { slug: "hubs" }, related_slugs: ["a", "b"] };
    const b = { slug: "b", category: { slug: "desk" }, related_slugs: [] };
    const c = { slug: "c", category: { slug: "hubs" }, related_slugs: [] };
    const out = suggestGear([a, b, c], a);
    expect(out.map((p) => p.slug)).toEqual(["b", "c"]);
  });
});
