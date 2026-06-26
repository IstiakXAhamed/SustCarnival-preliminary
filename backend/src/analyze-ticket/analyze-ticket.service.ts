import { Injectable } from "@nestjs/common";
import { AiEnrichmentService } from "../ai-enrichment/ai-enrichment.service";
import { classifyCase } from "../reasoning/case-classifier";
import { evaluateEvidence } from "../reasoning/evidence-evaluator";
import { routeCase } from "../reasoning/routing";
import { matchTransaction } from "../reasoning/transaction-matcher";
import {
  buildAgentSummary,
  buildCustomerReply,
  buildNextAction
} from "../safety/reply-templates";
import { ensureSafeText } from "../safety/safety-checker";
import type {
  AnalyzeTicketRequest,
  AnalyzeTicketResponse,
  Classification,
  EvidenceVerdict,
  Routing,
  TransactionMatch
} from "../reasoning/types";

@Injectable()
export class AnalyzeTicketService {
  private readonly aiEnrichment = new AiEnrichmentService();

  async analyze(input: AnalyzeTicketRequest): Promise<AnalyzeTicketResponse> {
    try {
      const classification = classifyCase(input);
      const transactions = input.transaction_history ?? [];
      const match = matchTransaction(
        input.complaint,
        classification.case_type,
        transactions
      );
      const verdict = evaluateEvidence(
        classification.case_type,
        match,
        transactions,
        input.complaint
      );
      const routing = routeCase(
        classification.case_type,
        verdict,
        match.transaction,
        match.ambiguous
      );

      const replyInput = {
        request: input,
        case_type: classification.case_type,
        evidence_verdict: verdict,
        transaction: match.transaction,
        ambiguous: match.ambiguous,
        transactions
      };

      const ruleSummary = ensureSafeText(buildAgentSummary(replyInput));
      const ruleNextAction = ensureSafeText(buildNextAction(replyInput));
      const ruleReply = ensureSafeText(buildCustomerReply(replyInput));

      let agentSummary = ruleSummary;
      let recommendedNextAction = ruleNextAction;
      let customerReply = ruleReply;

      if (shouldEnrich(this.aiEnrichment, classification, match, verdict, transactions)) {
        const aiResult = await this.aiEnrichment.enrich({
          request: input,
          case_type: classification.case_type,
          evidence_verdict: verdict,
          transaction: match.transaction,
          ambiguous: match.ambiguous,
          transactions,
          routing
        });
        if (aiResult !== null) {
          agentSummary = ensureSafeText(aiResult.agent_summary);
          recommendedNextAction = ensureSafeText(aiResult.recommended_next_action);
          customerReply = ensureSafeText(aiResult.customer_reply);
        }
      }

      return {
        ticket_id: input.ticket_id,
        relevant_transaction_id: match.transaction?.transaction_id ?? null,
        evidence_verdict: verdict,
        case_type: classification.case_type,
        severity: routing.severity,
        department: routing.department,
        agent_summary: agentSummary,
        recommended_next_action: recommendedNextAction,
        customer_reply: customerReply,
        human_review_required: routing.human_review_required,
        confidence: confidenceFor(classification.case_type, verdict, match.ambiguous),
        reason_codes: buildReasonCodes(classification, match, verdict, routing)
      };
    } catch (error) {
      // Safe fallback response to prevent application crash or 5xx leaks
      return {
        ticket_id: input?.ticket_id ?? "UNKNOWN",
        relevant_transaction_id: null,
        evidence_verdict: "insufficient_data",
        case_type: "other",
        severity: "low",
        department: "customer_support",
        agent_summary: "System encountered an unexpected processing error. Falling back to default routing.",
        recommended_next_action: "Ask the customer for clarification regarding their issue.",
        customer_reply: "We have received your request. Our support team will review the issue and contact you through official channels. Please do not share your PIN or OTP with anyone.",
        human_review_required: false,
        confidence: 0.5,
        reason_codes: ["internal_processing_fallback"]
      };
    }
  }
}

const shouldEnrich = (
  aiEnrichment: AiEnrichmentService,
  classification: Classification,
  match: TransactionMatch,
  verdict: EvidenceVerdict,
  transactions: readonly { readonly transaction_id: string }[]
): boolean => {
  if (!aiEnrichment.isEnabled()) {
    return false;
  }
  if (match.ambiguous) {
    return true;
  }
  if (verdict === "insufficient_data" && transactions.length > 0) {
    return true;
  }
  if (classification.case_type === "other") {
    return true;
  }
  return false;
};

const confidenceFor = (
  caseType: string,
  verdict: string,
  ambiguous: boolean
): number => {
  if (ambiguous) {
    return 0.65;
  }
  if (caseType === "phishing_or_social_engineering") {
    return 0.95;
  }
  switch (verdict) {
    case "consistent":
      return 0.9;
    case "inconsistent":
      return 0.75;
    case "insufficient_data":
      return 0.6;
    default:
      return 0.6;
  }
};

const buildReasonCodes = (
  classification: Classification,
  match: TransactionMatch,
  verdict: EvidenceVerdict,
  routing: Routing
): readonly string[] => {
  const codes: string[] = [classification.case_type];
  if (match.transaction !== null) {
    codes.push("transaction_match");
  } else if (match.ambiguous) {
    codes.push("ambiguous_match");
  } else if (match.reason_codes.includes("duplicate_not_confirmed")) {
    codes.push("duplicate_not_confirmed");
  }
  if (match.ambiguous) {
    codes.push("needs_clarification");
  }
  if (routing.human_review_required) {
    codes.push("dispute_initiated");
  }
  if (verdict === "inconsistent") {
    codes.push("evidence_inconsistent");
  } else if (verdict === "insufficient_data" && !match.ambiguous) {
    codes.push("insufficient_data");
  }
  return codes;
};
