import type {
  CASE_TYPE_VALUES,
  CHANNEL_VALUES,
  DEPARTMENT_VALUES,
  EVIDENCE_VERDICT_VALUES,
  LANGUAGE_VALUES,
  SEVERITY_VALUES,
  TRANSACTION_STATUS_VALUES,
  TRANSACTION_TYPE_VALUES,
  USER_TYPE_VALUES
} from "./constants";

export type Language = (typeof LANGUAGE_VALUES)[number];
export type Channel = (typeof CHANNEL_VALUES)[number];
export type UserType = (typeof USER_TYPE_VALUES)[number];
export type TransactionType = (typeof TRANSACTION_TYPE_VALUES)[number];
export type TransactionStatus = (typeof TRANSACTION_STATUS_VALUES)[number];
export type EvidenceVerdict = (typeof EVIDENCE_VERDICT_VALUES)[number];
export type CaseType = (typeof CASE_TYPE_VALUES)[number];
export type Severity = (typeof SEVERITY_VALUES)[number];
export type Department = (typeof DEPARTMENT_VALUES)[number];

export type TransactionEntry = {
  readonly transaction_id: string;
  readonly timestamp: string;
  readonly type: TransactionType;
  readonly amount: number;
  readonly counterparty: string;
  readonly status: TransactionStatus;
};

export type AnalyzeTicketRequest = {
  readonly ticket_id: string;
  readonly complaint: string;
  readonly language?: Language;
  readonly channel?: Channel;
  readonly user_type?: UserType;
  readonly campaign_context?: string;
  readonly transaction_history?: readonly TransactionEntry[];
  readonly metadata?: Record<string, unknown>;
};

export type AnalyzeTicketResponse = {
  readonly ticket_id: string;
  readonly relevant_transaction_id: string | null;
  readonly evidence_verdict: EvidenceVerdict;
  readonly case_type: CaseType;
  readonly severity: Severity;
  readonly department: Department;
  readonly agent_summary: string;
  readonly recommended_next_action: string;
  readonly customer_reply: string;
  readonly human_review_required: boolean;
  readonly confidence: number;
  readonly reason_codes: readonly string[];
};

export type Classification = {
  readonly case_type: CaseType;
  readonly reason_codes: readonly string[];
};

export type TransactionMatch = {
  readonly transaction: TransactionEntry | null;
  readonly ambiguous: boolean;
  readonly reason_codes: readonly string[];
};

export type Routing = {
  readonly department: Department;
  readonly severity: Severity;
  readonly human_review_required: boolean;
};
