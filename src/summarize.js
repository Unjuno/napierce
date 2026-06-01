import { mean, percentile, round, standardDeviation } from "./stats.js";

const TERMINAL_POSITIVE_ACTIONS = new Set(["accept", "best_so_far"]);

export function summarizeReviewEvents(events, plan = null) {
  const normalized = events.map(normalizeEvent);
  const elapsed = normalized.map((event) => event.elapsed_seconds);
  const scored = normalized.filter((event) => event.score != null);
  const actionCounts = countBy(normalized, "action");
  const reviewedCount = normalized.length;
  const acceptedCount = actionCounts.accept ?? 0;
  const maybeCount = actionCounts.maybe ?? 0;
  const rejectedCount = actionCounts.reject ?? 0;
  const skippedCount = actionCounts.skip ?? 0;
  const totalReviewSeconds = elapsed.reduce((sum, value) => sum + value, 0);
  const topCandidates = topScoredCandidates(normalized);

  const summary = {
    reviewed_candidates: reviewedCount,
    accepted_candidates: acceptedCount,
    maybe_candidates: maybeCount,
    rejected_candidates: rejectedCount,
    skipped_candidates: skippedCount,
    action_counts: actionCounts,
    score_count: scored.length,
    total_review_seconds: round(totalReviewSeconds),
    mean_review_seconds: round(mean(elapsed)),
    sd_review_seconds: round(standardDeviation(elapsed)),
    p50_review_seconds: round(percentile(elapsed, 50)),
    p90_review_seconds: round(percentile(elapsed, 90)),
    p95_review_seconds: round(percentile(elapsed, 95)),
    top_candidates: topCandidates,
    stopping: stoppingStatus(normalized, plan),
  };

  if (plan) {
    summary.plan = {
      review_budget_seconds: plan.review_budget_seconds ?? null,
      final_review_candidates: plan.final_review_candidates ?? null,
    };
  }

  return summary;
}

export function formatSummaryText(summary) {
  const lines = [
    "Napierce review summary",
    "",
    `Reviewed: ${summary.reviewed_candidates}`,
    `Accepted: ${summary.accepted_candidates}`,
    `Maybe: ${summary.maybe_candidates}`,
    `Rejected: ${summary.rejected_candidates}`,
    `Skipped: ${summary.skipped_candidates}`,
    "",
    `Total review time: ${summary.total_review_seconds}s`,
    `Mean review time: ${summary.mean_review_seconds}s`,
    `SD review time: ${summary.sd_review_seconds}s`,
    `p50 review time: ${summary.p50_review_seconds}s`,
    `p90 review time: ${summary.p90_review_seconds}s`,
    `p95 review time: ${summary.p95_review_seconds}s`,
    "",
    "Stopping:",
    ...summary.stopping.reasons.map((reason) => `- ${reason}`),
  ];

  if (summary.top_candidates.length > 0) {
    lines.push("", "Top candidates:");
    for (const candidate of summary.top_candidates) {
      lines.push(`- ${candidate.candidate_id}: score=${candidate.score}, action=${candidate.action}`);
    }
  }

  return lines.join("\n");
}

function normalizeEvent(event) {
  if (typeof event !== "object" || event == null) {
    throw new Error("review event must be an object.");
  }

  const elapsed = Number(event.elapsed_seconds);
  if (!Number.isFinite(elapsed) || elapsed < 0) {
    throw new Error("review event elapsed_seconds must be a non-negative number.");
  }

  const action = event.action == null ? "unknown" : String(event.action);
  const score = event.score == null || event.score === "" ? null : Number(event.score);

  if (score != null && (!Number.isFinite(score) || score < 1 || score > 5)) {
    throw new Error("review event score must be between 1 and 5 when provided.");
  }

  return {
    ...event,
    candidate_id: event.candidate_id == null ? "unknown" : String(event.candidate_id),
    elapsed_seconds: elapsed,
    action,
    score,
  };
}

function countBy(items, key) {
  const counts = {};
  for (const item of items) {
    const value = item[key] ?? "unknown";
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function topScoredCandidates(events) {
  return events
    .filter((event) => event.score != null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.elapsed_seconds - b.elapsed_seconds;
    })
    .slice(0, 5)
    .map((event) => ({
      candidate_id: event.candidate_id,
      score: event.score,
      action: event.action,
      elapsed_seconds: event.elapsed_seconds,
    }));
}

function stoppingStatus(events, plan) {
  const reasons = [];
  const reviewedCount = events.length;
  const totalReviewSeconds = events.reduce((sum, event) => sum + event.elapsed_seconds, 0);
  const strongCandidate = events.find((event) => event.score === 5 || TERMINAL_POSITIVE_ACTIONS.has(event.action));

  if (plan?.review_budget_seconds != null && totalReviewSeconds >= plan.review_budget_seconds) {
    reasons.push("review budget reached");
  }

  if (plan?.final_review_candidates != null && reviewedCount >= plan.final_review_candidates) {
    reasons.push("final review candidate quota reached");
  }

  if (strongCandidate) {
    reasons.push(`strong candidate found: ${strongCandidate.candidate_id}`);
  }

  if (reasons.length === 0) {
    reasons.push("continue or stop manually; no configured stopping condition has been reached");
  }

  return {
    should_stop: reasons.some((reason) => reason !== "continue or stop manually; no configured stopping condition has been reached"),
    reasons,
  };
}
