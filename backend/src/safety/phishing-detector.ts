import { PHISHING_KEYWORDS } from "../reasoning/constants";
import { containsAny, normalizeText } from "../reasoning/text";

export const isPhishingComplaint = (complaint: string): boolean =>
  containsAny(normalizeText(complaint), PHISHING_KEYWORDS);
