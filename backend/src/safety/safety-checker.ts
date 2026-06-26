const UNSAFE_PROMISE_PATTERNS = [
  /\bwe will refund\b/i,
  /\bwill reverse\b/i,
  /\baccount will be unblocked\b/i,
  /\bguaranteed\b/i
] as const;

const UNSAFE_REQUEST_PATTERNS = [
  /(?<!do not\s+|never\s+|don't\s+)\b(share|send|provide) your (pin|otp|password)\b/i,
  /\bfull card number\b/i
] as const;

export const ensureSafeText = (text: string): string => {
  const asksForSecret = UNSAFE_REQUEST_PATTERNS.some((pattern) => pattern.test(text));
  const promisesAction = UNSAFE_PROMISE_PATTERNS.some((pattern) => pattern.test(text));
  if (!asksForSecret && !promisesAction) {
    return text;
  }
  return "We have received your concern and will review it through official support channels. Please do not share your PIN or OTP with anyone.";
};
