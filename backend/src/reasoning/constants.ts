export const LANGUAGE_VALUES = ["en", "bn", "mixed"] as const;
export const CHANNEL_VALUES = [
  "in_app_chat",
  "call_center",
  "email",
  "merchant_portal",
  "field_agent"
] as const;
export const USER_TYPE_VALUES = ["customer", "merchant", "agent", "unknown"] as const;
export const TRANSACTION_TYPE_VALUES = [
  "transfer",
  "payment",
  "cash_in",
  "cash_out",
  "settlement",
  "refund"
] as const;
export const TRANSACTION_STATUS_VALUES = [
  "completed",
  "failed",
  "pending",
  "reversed"
] as const;
export const EVIDENCE_VERDICT_VALUES = [
  "consistent",
  "inconsistent",
  "insufficient_data"
] as const;
export const CASE_TYPE_VALUES = [
  "wrong_transfer",
  "payment_failed",
  "refund_request",
  "duplicate_payment",
  "merchant_settlement_delay",
  "agent_cash_in_issue",
  "phishing_or_social_engineering",
  "other"
] as const;
export const SEVERITY_VALUES = ["low", "medium", "high", "critical"] as const;
export const DEPARTMENT_VALUES = [
  "customer_support",
  "dispute_resolution",
  "payments_ops",
  "merchant_operations",
  "agent_operations",
  "fraud_risk"
] as const;
