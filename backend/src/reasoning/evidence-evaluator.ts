import { sameCounterpartyCount } from "./text";
import type {
  CaseType,
  EvidenceVerdict,
  TransactionEntry,
  TransactionMatch
} from "./types";

export const evaluateEvidence = (
  caseType: CaseType,
  match: TransactionMatch,
  transactions: readonly TransactionEntry[]
): EvidenceVerdict => {
  if (caseType === "phishing_or_social_engineering") {
    return "insufficient_data";
  }
  if (match.ambiguous || match.transaction === null) {
    return "insufficient_data";
  }

  const transaction = match.transaction;
  switch (caseType) {
    case "wrong_transfer":
      return sameCounterpartyCount(transactions, transaction.counterparty) >= 3
        ? "inconsistent"
        : "consistent";
    case "payment_failed":
      return transaction.status === "failed" ? "consistent" : "inconsistent";
    case "refund_request":
      return transaction.status === "completed" ? "consistent" : "insufficient_data";
    case "duplicate_payment":
      return "consistent";
    case "merchant_settlement_delay":
    case "agent_cash_in_issue":
      return transaction.status === "pending" ? "consistent" : "inconsistent";
    case "other":
      return "insufficient_data";
  }
};
