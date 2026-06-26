import type {
  AnalyzeTicketRequest,
  CaseType,
  EvidenceVerdict,
  TransactionEntry
} from "../reasoning/types";

type ReplyInput = {
  readonly request: AnalyzeTicketRequest;
  readonly case_type: CaseType;
  readonly evidence_verdict: EvidenceVerdict;
  readonly transaction: TransactionEntry | null;
};

const txLabel = (transaction: TransactionEntry | null): string =>
  transaction === null ? "the relevant transaction" : `transaction ${transaction.transaction_id}`;

export const buildCustomerReply = (input: ReplyInput): string => {
  if (input.request.language === "bn") {
    return buildBanglaReply(input);
  }
  return buildEnglishReply(input);
};

const buildEnglishReply = (input: ReplyInput): string => {
  const label = txLabel(input.transaction);
  if (input.evidence_verdict === "inconsistent") {
    return `We have received your concern about ${label}. The available transaction information needs careful review before any action can be taken. Our team will check the details through official support channels. Please do not share your PIN or OTP with anyone.`;
  }
  switch (input.case_type) {
    case "wrong_transfer":
      return `We have noted your concern about ${label}. Please do not share your PIN or OTP with anyone. Our dispute team will review the case and contact you through official support channels.`;
    case "payment_failed":
      return `We have noted that ${label} may have caused an unexpected balance deduction. Our payments team will review the case and any eligible amount will be returned through official channels. Please do not share your PIN or OTP with anyone.`;
    case "refund_request":
      return "Thank you for reaching out. Refunds for completed merchant payments depend on the merchant's own policy. We recommend contacting the merchant directly through official merchant details. Please do not share your PIN or OTP with anyone.";
    case "duplicate_payment":
      return `We have noted the possible duplicate payment for ${label}. Our payments team will verify the case and any eligible amount will be returned through official channels. Please do not share your PIN or OTP with anyone.`;
    case "merchant_settlement_delay":
      return `We have noted your concern about ${label}. Our merchant operations team will check the settlement status and update you through official channels.`;
    case "agent_cash_in_issue":
      return `We have noted your concern about ${label}. Our agent operations team will verify the cash-in status and update you through official channels. Please do not share your PIN or OTP with anyone.`;
    case "phishing_or_social_engineering":
      return "Thank you for reaching out before sharing any information. We never ask for your PIN, OTP, or password under any circumstances. Please do not share these with anyone, even if they claim to be from us. Our fraud team has been notified of this incident.";
    case "other":
      return "Thank you for reaching out. Please share the transaction ID, amount, approximate time, and a short description of what went wrong so we can help you faster. Please do not share your PIN or OTP with anyone.";
  }
};

const buildBanglaReply = (input: ReplyInput): string => {
  const idText =
    input.transaction === null ? "আপনার অভিযোগ" : `আপনার লেনদেন ${input.transaction.transaction_id}`;
  switch (input.case_type) {
    case "phishing_or_social_engineering":
      return "সতর্ক থাকার জন্য ধন্যবাদ। আমরা কখনো আপনার পিন, ওটিপি বা পাসওয়ার্ড চাই না। কেউ আমাদের পরিচয় দিলেও এগুলো শেয়ার করবেন না। আমাদের ফ্রড টিম বিষয়টি দেখবে।";
    case "agent_cash_in_issue":
      return `${idText} এর বিষয়ে আমরা অবগত হয়েছি। আমাদের এজেন্ট অপারেশন্স দল এটি যাচাই করবে এবং অফিসিয়াল চ্যানেলে আপনাকে জানাবে। অনুগ্রহ করে কারো সাথে আপনার পিন বা ওটিপি শেয়ার করবেন না।`;
    default:
      return `${idText} এর বিষয়ে আমরা অবগত হয়েছি। আমাদের দল বিষয়টি যাচাই করবে এবং অফিসিয়াল চ্যানেলে আপনাকে জানাবে। অনুগ্রহ করে কারো সাথে আপনার পিন বা ওটিপি শেয়ার করবেন না।`;
  }
};

export const buildAgentSummary = (input: ReplyInput): string => {
  const amount =
    input.transaction === null ? "" : ` ${input.transaction.amount} BDT`;
  const tx =
    input.transaction === null
      ? "No single matching transaction was identified"
      : `${input.transaction.transaction_id}${amount} (${input.transaction.type}, ${input.transaction.status})`;
  return `${tx}. Case classified as ${input.case_type} with ${input.evidence_verdict} evidence.`;
};

export const buildNextAction = (input: ReplyInput): string => {
  if (input.evidence_verdict === "insufficient_data") {
    return "Ask for the missing transaction details before initiating any financial action.";
  }
  if (input.evidence_verdict === "inconsistent") {
    return "Flag for human review and verify the claim against transaction history before taking action.";
  }
  switch (input.case_type) {
    case "wrong_transfer":
      return "Verify the transaction details and initiate the wrong-transfer dispute workflow per policy.";
    case "payment_failed":
      return "Investigate ledger status and initiate standard reversal flow only if the failed deduction is confirmed.";
    case "refund_request":
      return "Explain that refund eligibility depends on merchant policy and guide the customer safely.";
    case "duplicate_payment":
      return "Verify the duplicate with payments operations and the biller before any reversal.";
    case "merchant_settlement_delay":
      return "Route to merchant operations to verify settlement batch status and communicate an official update.";
    case "agent_cash_in_issue":
      return "Route to agent operations to verify the pending cash-in and settlement state.";
    case "phishing_or_social_engineering":
      return "Escalate to fraud risk and remind the customer never to share credentials.";
    case "other":
      return "Ask the customer for specific transaction details and issue description.";
  }
};
