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
  /\bটাকা ফেরত দিব\b/i,
  /\bরিফান্ড করে দেওয়া হবে\b/i
] as const;

const UNSAFE_REQUEST_PATTERNS = [
  // Blocks credential requests (PIN, OTP, password, card details) while allowing negative lookbehinds for safety warnings
  /(?<!do not\s+|never\s+|don't\s+|কখনো\s+|কখনোই\s+|শেয়ার\s+করবেন\s+)\b(share|send|provide|give|tell|enter|input|write|verify|confirm) your (pin|otp|password|credential|credentials|secret)\b/i,
  /\bfull card number\b/i,
  // Bangla credential requests (e.g. "আপনার পিন দিন", "ওটিপি বলুন" vs "পিন শেয়ার করবেন না")
  /(?<!শেয়ার\s+করবেন\s+|শেয়ার\s+করবেন\s+|দেবেন\s+|দিবেন\s+)\b(ওটিপি|পিন|পাসওয়ার্ড|পাসওয়ার্ড)\b.*\b(দিন|বলুন|পাঠান|জানান|লিখুন|শেয়ার\s+করুন|শেয়ার\s+করুন)\b/i,
  /\b(দিন|বলুন|পাঠান|জানান|লিখুন|শেয়ার\s+করুন|শেয়ার\s+করুন)\b.*\b(ওটিপি|পিন|পাসওয়ার্ড|পাসওয়ার্ড)\b/i
] as const;

export const ensureSafeText = (text: string): string => {
  const asksForSecret = UNSAFE_REQUEST_PATTERNS.some((pattern) => pattern.test(text));
  const promisesAction = UNSAFE_PROMISE_PATTERNS.some((pattern) => pattern.test(text));
  if (!asksForSecret && !promisesAction) {
    return text;
  }
  return "We have received your concern and will review it through official support channels. Please do not share your PIN or OTP with anyone.";
};
