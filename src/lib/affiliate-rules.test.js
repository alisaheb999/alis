import { describe, it, expect } from "bun:test";
import { commissionFor, canWithdraw } from "./affiliate-rules";

describe("referral rules", () => {
  it("commission is 10% of order amount", () => {
    expect(commissionFor(1500)).toBe(150);
    expect(commissionFor(999)).toBe(99);
  });
  it("withdrawal needs at least 200 BDT", () => {
    expect(canWithdraw(500, 199)).toBe(false);
    expect(canWithdraw(500, 200)).toBe(true);
  });
  it("withdrawal cannot exceed balance", () => {
    expect(canWithdraw(250, 300)).toBe(false);
  });
});
