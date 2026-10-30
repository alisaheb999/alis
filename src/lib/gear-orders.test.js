import { describe, it, expect } from "vitest";
import { orderTotals } from "./gear-rules";

describe("gear order totals", () => {
  it("inside Dhaka adds ৳60", () => {
    expect(orderTotals([{ price_bdt: 4500, cost_bdt: 3500, qty: 1 }], "inside_dhaka").total).toBe(4560);
  });
  it("outside Dhaka adds ৳130 and profit excludes delivery", () => {
    const t = orderTotals([{ price_bdt: 1000, cost_bdt: 700, qty: 2 }], "outside_dhaka", 100);
    expect(t.total).toBe(2030);
    expect(t.profit).toBe(500);
  });
});
