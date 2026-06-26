import type {
  AnalyzeTicketRequest,
  CaseType,
  EvidenceVerdict,
  Routing,
  TransactionEntry
} from "../reasoning/types";

export type AiEnrichmentInput = {
  readonly request: AnalyzeTicketRequest;
  readonly case_type: CaseType;
  readonly evidence_verdict: EvidenceVerdict;
  readonly transaction: TransactionEntry | null;
  readonly ambiguous: boolean;
  readonly transactions: readonly TransactionEntry[];
  readonly routing: Routing;
};

export type AiEnrichmentOutput = {
  readonly agent_summary: string;
  readonly recommended_next_action: string;
  readonly customer_reply: string;
};
