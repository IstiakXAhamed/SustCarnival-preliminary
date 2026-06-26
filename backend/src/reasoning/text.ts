const BANGLA_DIGITS: Readonly<Record<string, string>> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9"
};

export const normalizeText = (value: string): string =>
  value
    .replace(/[০-৯]/g, (digit) => BANGLA_DIGITS[digit] ?? digit)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export const containsAny = (
  normalizedText: string,
  keywords: readonly string[]
): boolean => keywords.some((keyword) => normalizedText.includes(keyword));

export const extractAmounts = (normalizedText: string): readonly number[] => {
  const matches = normalizedText.match(/\b\d+(?:\.\d+)?\b/g) ?? [];
  const amounts = matches
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 10);
  return [...new Set(amounts)];
};

export const sameCounterpartyCount = (
  transactions: readonly { readonly counterparty: string }[],
  counterparty: string
): number =>
  transactions.filter((transaction) => transaction.counterparty === counterparty)
    .length;
