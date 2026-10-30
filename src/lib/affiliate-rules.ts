/** Browser-safe referral rules shared by UI, server and tests. */
export const AFFILIATE_MIN_WITHDRAW_BDT = 200;
export const DEFAULT_COMMISSION_PERCENT = 10;

/** Mirrors the SQL trigger: floor(amount * percent / 100). */
export function commissionFor(amountBdt: number, percent = DEFAULT_COMMISSION_PERCENT) {
  return Math.floor((amountBdt * percent) / 100);
}

export function canWithdraw(balance: number, amount: number) {
  return amount >= AFFILIATE_MIN_WITHDRAW_BDT && amount <= balance;
}

export function withdrawalErrorBn(msg: string) {
  if (msg.includes("min_200")) return `সর্বনিম্ন ${AFFILIATE_MIN_WITHDRAW_BDT} ট উইথড্র করা যায়।`;
  if (msg.includes("insufficient")) return "ব্যালেন্স যথেষ্ট নয়।";
  if (msg.includes("pending_exists")) return "আগের একটি রিকোয়েস্ট এখনও অপেক্ষমাণ।";
  if (msg.includes("bad_account")) return "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।";
  if (msg.includes("suspended")) return "আপনার পার্টনার অ্যাকাউন্ট স্থগিত।";
  if (msg.includes("not_affiliate")) return "আপনি টিম মেম্বার হিসেবে যুক্ত নন।";
  return "রিকোয়েস্ট পাঠানো যায়নি।";
}
