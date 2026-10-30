/** Pure parser for incoming mobile-banking SMS forwarded by SmsForwarder. Only "money received" messages are accepted. */
export type ParsedSms = { provider: "bkash" | "nagad" | "rocket" | "upay"; trx_id: string; amount: number; sender: string | null };

export function detectProvider(from: string, content: string): ParsedSms["provider"] | null {
  const f = from.toLowerCase();
  if (f.includes("bkash")) return "bkash";
  if (f.includes("nagad")) return "nagad";
  if (f.includes("16216") || f.includes("rocket")) return "rocket";
  if (f.includes("upay")) return "upay";
  // Never trust message text for the provider: anyone can text "bKash ... received" from a normal number.
  void content;
  return null;
}

export function parseSms(from: string, content: string): ParsedSms | null {
  const text = content.replace(/\s+/g, " ").trim();
  if (!/received/i.test(text)) return null; // ignore sent/cash-out/OTP messages
  const provider = detectProvider(from, text);
  if (!provider) return null;
  const amt = text.match(/(?:Tk|BDT|৳)\s*:?\s*([\d,]+(?:\.\d{1,2})?)/i);
  const trx = text.match(/\b(?:TrxID|TxnID|TxnId|Trx ID|Txn ID|TransID)\s*[:.]?\s*([A-Z0-9]{6,20})\b/i);
  if (!amt || !trx) return null;
  const amount = Number(amt[1].replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const s = text.match(/(?:from|Sender:?)\s*(?:A\/C:?\s*)?(\+?\d[\d*]{9,14})/i);
  return { provider, trx_id: trx[1].toUpperCase(), amount, sender: s?.[1] ?? null };
}
