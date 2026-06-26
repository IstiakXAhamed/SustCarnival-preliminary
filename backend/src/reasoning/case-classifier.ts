import { isPhishingComplaint } from "../safety/phishing-detector";
import { containsAny, normalizeText } from "./text";
import type {
  AnalyzeTicketRequest,
  CaseType,
  Classification,
  TransactionEntry
} from "./types";

const hasDuplicatePayment = (
  transactions: readonly TransactionEntry[]
): boolean => {
  for (const current of transactions) {
    const currentTime = Date.parse(current.timestamp);
    const duplicate = transactions.find((candidate) => {
      if (candidate.transaction_id === current.transaction_id) {
        return false;
      }
      const candidateTime = Date.parse(candidate.timestamp);
      const diffSeconds = Math.abs(currentTime - candidateTime) / 1000;
      return (
        current.type === "payment" &&
        candidate.type === "payment" &&
        current.amount === candidate.amount &&
        current.counterparty === candidate.counterparty &&
        diffSeconds <= 60
      );
    });
    if (duplicate !== undefined) {
      return true;
    }
  }
  return false;
};

export const classifyCase = (input: AnalyzeTicketRequest): Classification => {
  const text = normalizeText(input.complaint);
  const transactions = input.transaction_history ?? [];

  if (isPhishingComplaint(input.complaint)) {
    return {
      case_type: "phishing_or_social_engineering",
      reason_codes: ["phishing", "credential_protection"]
    };
  }
  if (hasDuplicatePayment(transactions) || containsAny(text, ["twice", "duplicate", "deducted twice"])) {
    return { case_type: "duplicate_payment", reason_codes: ["duplicate_payment"] };
  }
  if (
    input.user_type === "merchant" ||
    containsAny(text, ["merchant", "settlement", "sales"])
  ) {
    return {
      case_type: "merchant_settlement_delay",
      reason_codes: ["merchant_settlement"]
    };
  }
  if (containsAny(text, ["cash in", "cash-in", "agent", "ক্যাশ ইন", "এজেন্ট"])) {
    return { case_type: "agent_cash_in_issue", reason_codes: ["agent_cash_in"] };
  }
  if (containsAny(text, ["failed", "balance deducted", "deducted", "recharge"])) {
    return { case_type: "payment_failed", reason_codes: ["payment_failed"] };
  }
  if (containsAny(text, ["wrong", "mistake", "reverse it", "brother", "didn't get"])) {
    return { case_type: "wrong_transfer", reason_codes: ["wrong_transfer_claim"] };
  }
  if (containsAny(text, ["refund", "money back", "changed my mind"])) {
    return { case_type: "refund_request", reason_codes: ["refund_request"] };
  }
  return { case_type: "other", reason_codes: ["vague_or_other"] };
};

export const isKnownTransactionTypeForCase = (
  caseType: CaseType,
  transaction: TransactionEntry
): boolean => {
  switch (caseType) {
    case "wrong_transfer":
      return transaction.type === "transfer";
    case "payment_failed":
    case "duplicate_payment":
    case "refund_request":
      return transaction.type === "payment";
    case "merchant_settlement_delay":
      return transaction.type === "settlement";
    case "agent_cash_in_issue":
      return transaction.type === "cash_in";
    case "phishing_or_social_engineering":
    case "other":
      return true;
  }
};
