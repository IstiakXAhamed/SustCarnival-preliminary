import { containsAny, normalizeText, sameCounterpartyCount } from "./text";
import type {
  CaseType,
  EvidenceVerdict,
  TransactionEntry,
  TransactionMatch
} from "./types";

const REFUND_NOT_RECEIVED_KEYWORDS = [
  "never received my refund",
  "did not get my refund",
  "didn't get my refund",
  "refund didn't arrive",
  "refund did not arrive",
  "no refund",
  "where is my refund",
  "promised to refund",
  "you promised",
  "said you refunded",
  "see no refund",
  "see nothing",
  "refunded but i",
  "টাকা ফেরত পাইনি",
  "ফেরত পাইনি",
  "রিফান্ড পাইনি"
];

export const evaluateEvidence = (
  caseType: CaseType,
  match: TransactionMatch,
  transactions: readonly TransactionEntry[],
  complaint: string
): EvidenceVerdict => {
  if (caseType === "phishing_or_social_engineering") {
    return "insufficient_data";
  }

  if (caseType === "duplicate_payment") {
    if (match.transaction !== null) {
      return "consistent";
    }
    const hasAnyPayment = transactions.some((t) => t.type === "payment");
    return hasAnyPayment ? "inconsistent" : "insufficient_data";
  }

  if (match.ambiguous || match.transaction === null) {
    return "insufficient_data";
  }

  const transaction = match.transaction;
  switch (caseType) {
    case "wrong_transfer":
      if (transaction.status !== "completed") {
        return "inconsistent";
      }
      return sameCounterpartyCount(transactions, transaction.counterparty) >= 3
        ? "inconsistent"
        : "consistent";
    case "payment_failed":
      return transaction.status === "failed" ? "consistent" : "inconsistent";
    case "refund_request":
      if (containsAny(normalizeText(complaint), REFUND_NOT_RECEIVED_KEYWORDS)) {
        const hasRefundTransaction = transactions.some(
          (t) => t.type === "refund" || t.status === "reversed"
        );
        return hasRefundTransaction ? "consistent" : "insufficient_data";
      }
      return transaction.status === "completed" ? "consistent" : "insufficient_data";
    case "merchant_settlement_delay":
    case "agent_cash_in_issue":
      return transaction.status === "pending" ? "consistent" : "inconsistent";
    case "other":
      return "consistent";
  }
};
