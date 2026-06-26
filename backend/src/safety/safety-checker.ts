const UNSAFE_PROMISE_PATTERNS = [
  /\bwe will refund\b/i,
  /\bwill reverse\b/i,
  /\baccount will be unblocked\b/i,
  /\bguaranteed\b/i,
  /\bpromise to refund\b/i,
  /\bwill get a refund\b/i,
  /\bwill return your money\b/i,
  /\brefund has been confirmed\b/i,
  /\brefunded immediately\b/i,
  /\bwill send the refund\b/i,
  /\brefund is approved\b/i,
  /\bwe promise to return\b/i,
  /\bsend your money back\b/i,
  /\bmoney will be returned to you\b/i,
  /\baccount will be reactivated\b/i,
  /\breversal is confirmed\b/i,
  // Bangla promise patterns — no \b (word boundaries don't work with Bangla Unicode)
  /টাকা ফেরত দিব/i,
  /রিফান্ড করে দেওয়া হবে/i,
  /টাকা ফিরিয়ে দেওয়া হবে/i,
  /আপনাকে ফেরত দেওয়া হবে/i,
  /রিফান্ড নিশ্চিত/i,
  /টাকা ফেরত পাবেন/i,
  /ফেরত দেওয়া হয়েছে/i
] as const;

const UNSAFE_REQUEST_PATTERNS = [
  // English credential requests — negative lookbehind allows safety warnings ("do not share your PIN")
  /(?<!do not\s+|never\s+|don't\s+|কখনো\s+|কখনোই\s+|শেয়ার\s+করবেন\s+)\b(share|send|provide|give|tell|enter|input|write|verify|confirm|ask for) your (pin|otp|password|credential|credentials|secret|card number)\b/i,
  /\bfull card number\b/i,
  /\bask for your (pin|otp|password)\b/i,
  // \b word boundaries don't work with Bangla Unicode — use direct substring matching instead.
  // Two patterns catch both orders: credential→verb ("পিন বলুন") and verb→credential ("বলুন পিন").
  // Includes both direct imperative (করুন) and polite imperative (করবেন) forms.
  // Negative lookahead (?!\s*না) excludes negated commands ("শেয়ার করবেন না" = "don't share") which are safety warnings.
  /(?<!শেয়ার\s+করবেন\s+|দেবেন\s+|দিবেন\s+)(পিন|ওটিপি|পাসওয়ার্ড|পাসওয়ার্ড|পিন\s+নম্বর|পিন\s+নাম্বার).*(?!(?:দিন|দিবেন|বলুন|বলবেন|পাঠান|পাঠাবেন|জানান|জানাবেন|লিখুন|লিখবেন|শেয়ার\s+করুন|শেয়ার\s+করবেন)\s+না)(দিন|দিবেন|বলুন|বলবেন|পাঠান|পাঠাবেন|জানান|জানাবেন|লিখুন|লিখবেন|শেয়ার\s+করুন|শেয়ার\s+করবেন)/i,
  /(দিন|দিবেন|বলুন|বলবেন|পাঠান|পাঠাবেন|জানান|জানাবেন|লিখুন|লিখবেন|শেয়ার\s+করুন|শেয়ার\s+করবেন)(?!\s*না).*(পিন|ওটিপি|পাসওয়ার্ড|পাসওয়ার্ড|পিন\s+নম্বর|পিন\s+নাম্বার)/i
] as const;

export const ensureSafeText = (text: string): string => {
  const asksForSecret = UNSAFE_REQUEST_PATTERNS.some((pattern) => pattern.test(text));
  const promisesAction = UNSAFE_PROMISE_PATTERNS.some((pattern) => pattern.test(text));
  if (!asksForSecret && !promisesAction) {
    return text;
  }
  return "We have received your concern and will review it through official support channels. Please do not share your PIN or OTP with anyone.";
};
