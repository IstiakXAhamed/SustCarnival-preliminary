import type { CaseType, EvidenceVerdict, Routing, TransactionEntry } from "./types";

export const routeCase = (
  caseType: CaseType,
  verdict: EvidenceVerdict,
  transaction: TransactionEntry | null,
  ambiguous: boolean
): Routing => {
  const highValue = transaction !== null && transaction.amount > 10000;
  switch (caseType) {
    case "wrong_transfer":
      return {
        department: "dispute_resolution",
        severity: verdict === "inconsistent" ? "medium" : "high",
        human_review_required: true
      };
    case "payment_failed":
      return {
        department: "payments_ops",
        severity: highValue ? "high" : "high",
        human_review_required: false
      };
    case "refund_request":
      return {
        department: verdict === "inconsistent" ? "dispute_resolution" : "customer_support",
        severity: highValue ? "medium" : "low",
        human_review_required: verdict === "inconsistent"
      };
    case "duplicate_payment":
      return { department: "payments_ops", severity: "high", human_review_required: true };
    case "merchant_settlement_delay":
      return {
        department: "merchant_operations",
        severity: "medium",
        human_review_required: false
      };
    case "agent_cash_in_issue":
      return { department: "agent_operations", severity: "high", human_review_required: true };
    case "phishing_or_social_engineering":
      return { department: "fraud_risk", severity: "critical", human_review_required: true };
    case "other":
      return {
        department: "customer_support",
        severity: "low",
        human_review_required: false
      };
  }
};
