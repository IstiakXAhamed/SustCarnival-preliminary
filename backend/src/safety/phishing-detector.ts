import { containsAny, normalizeText } from "../reasoning/text";

const PHISHING_KEYWORDS = [
  "otp",
  "pin",
  "password",
  "account will be blocked",
  "blocked if",
  "verify your account",
  "share it",
  "from bkash",
  "from bKash",
  "ওটিপি",
  "পিন",
  "পাসওয়ার্ড",
  "ব্লক"
] as const;

export const isPhishingComplaint = (complaint: string): boolean =>
  containsAny(normalizeText(complaint), PHISHING_KEYWORDS);
