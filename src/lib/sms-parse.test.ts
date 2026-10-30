import { describe, expect, it } from "vitest";
import { parseSms } from "./sms-parse";

describe("parseSms", () => {
  it("parses bKash received SMS", () => {
    expect(parseSms("bKash", "You have received Tk 250.00 from 01712345678. Fee Tk 0.00. Balance Tk 1,250.00. TrxID CJS4ABC12X at 28/10/2026 10:00"))
      .toEqual({ provider: "bkash", trx_id: "CJS4ABC12X", amount: 250, sender: "01712345678" });
  });
  it("parses Nagad received SMS", () => {
    const r = parseSms("NAGAD", "Money Received.\nAmount: Tk 1,500.00\nSender: 01812345678\nRef: x\nTxnID: 7ABCD1234\nBalance: Tk 2000.00");
    expect(r).toMatchObject({ provider: "nagad", trx_id: "7ABCD1234", amount: 1500 });
  });
  it("ignores sent money and OTP", () => {
    expect(parseSms("bKash", "Send Money Tk 100.00 to 017. TrxID AAA111BBB")).toBeNull();
    expect(parseSms("bKash", "Your bKash verification code is 123456")).toBeNull();
  });
  it("ignores unknown senders", () => {
    expect(parseSms("+8801700000000", "You have received Tk 250.00 TrxID FAKE12345")).toBeNull();
  });
});
