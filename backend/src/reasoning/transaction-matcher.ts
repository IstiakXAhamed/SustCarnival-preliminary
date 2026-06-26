import { isKnownTransactionTypeForCase } from "./case-classifier";
import { extractAmounts, normalizeText } from "./text";
import type { CaseType, TransactionEntry, TransactionMatch } from "./types";

const duplicatePayment = (
  transactions: readonly TransactionEntry[]
): TransactionEntry | null => {
  const ordered = [...transactions].sort(
    (left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp)
  );
  for (const current of ordered) {
    const currentTime = Date.parse(current.timestamp);
    const duplicate = ordered.find((candidate) => {
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
        diffSeconds > 0 &&
        diffSeconds <= 60
      );
    });
    if (duplicate !== undefined) {
      return Date.parse(duplicate.timestamp) > currentTime ? duplicate : current;
    }
  }
  return null;
};

const scoreTransaction = (
  transaction: TransactionEntry,
  caseType: CaseType,
  amounts: readonly number[]
): number => {
  let score = 0;
  if (amounts.includes(transaction.amount)) {
    score += 5;
  }
  if (isKnownTransactionTypeForCase(caseType, transaction)) {
    score += 3;
  }
  return score;
};

export const matchTransaction = (
  complaint: string,
  caseType: CaseType,
  transactions: readonly TransactionEntry[]
): TransactionMatch => {
  if (caseType === "phishing_or_social_engineering" || transactions.length === 0) {
    return { transaction: null, ambiguous: false, reason_codes: [] };
  }
  if (caseType === "duplicate_payment") {
    const duplicate = duplicatePayment(transactions);
    return {
      transaction: duplicate,
      ambiguous: duplicate === null,
      reason_codes: duplicate === null ? ["duplicate_not_confirmed"] : ["duplicate_match"]
    };
  }

  const text = normalizeText(complaint);
  const amounts = extractAmounts(text);
  const scored = transactions
    .map((transaction) => ({
      transaction,
      score: scoreTransaction(transaction, caseType, amounts)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const first = scored[0];
  if (first === undefined) {
    return { transaction: null, ambiguous: false, reason_codes: ["no_transaction_match"] };
  }

  const tied = scored.filter((entry) => entry.score === first.score);
  if (tied.length > 1) {
    return { transaction: null, ambiguous: true, reason_codes: ["ambiguous_match"] };
  }

  return {
    transaction: first.transaction,
    ambiguous: false,
    reason_codes: ["transaction_match"]
  };
};
