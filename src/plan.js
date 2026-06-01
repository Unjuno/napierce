export function createPlan(input) {
  const generationBudgetSeconds = requirePositiveNumber(input.generationBudgetSeconds, "generationBudgetSeconds");
  const reviewBudgetSeconds = requirePositiveNumber(input.reviewBudgetSeconds, "reviewBudgetSeconds");
  const generationLatencySeconds = resolveLatency(input, "generation");
  const reviewLatencySeconds = resolveLatency(input, "review");
  const oversample = input.oversample == null ? 3 : requirePositiveNumber(input.oversample, "oversample");

  const maxGeneratedCandidates = Math.floor(generationBudgetSeconds / generationLatencySeconds);
  const reviewableCandidates = Math.floor(reviewBudgetSeconds / reviewLatencySeconds);

  if (maxGeneratedCandidates < 1) {
    throw new Error("generation budget is too small for even one candidate.");
  }

  if (reviewableCandidates < 1) {
    throw new Error("review budget is too small for even one candidate.");
  }

  const plannedCandidates = Math.min(
    maxGeneratedCandidates,
    Math.ceil(oversample * reviewableCandidates),
  );

  const exploreCandidates = Math.ceil(plannedCandidates / Math.E);
  const refineCandidates = plannedCandidates - exploreCandidates;

  return {
    generation_budget_seconds: roundSeconds(generationBudgetSeconds),
    review_budget_seconds: roundSeconds(reviewBudgetSeconds),
    generation_latency_seconds: roundSeconds(generationLatencySeconds),
    review_latency_seconds: roundSeconds(reviewLatencySeconds),
    max_generated_candidates: maxGeneratedCandidates,
    reviewable_candidates: reviewableCandidates,
    oversample,
    planned_candidates: plannedCandidates,
    explore_candidates: exploreCandidates,
    refine_candidates: refineCandidates,
    final_review_candidates: reviewableCandidates,
    strategy: latencyStrategy(input),
  };
}

function resolveLatency(input, prefix) {
  const p95Key = `${prefix}P95Seconds`;
  const meanKey = `${prefix}MeanSeconds`;
  const sdKey = `${prefix}SdSeconds`;

  if (input[p95Key] != null) {
    return requirePositiveNumber(input[p95Key], p95Key);
  }

  if (input[meanKey] == null || input[sdKey] == null) {
    throw new Error(`${prefix} latency requires either p95 or both mean and sd.`);
  }

  const mean = requirePositiveNumber(input[meanKey], meanKey);
  const sd = requireNonNegativeNumber(input[sdKey], sdKey);
  const lambda = input.lambda == null ? 2 : requireNonNegativeNumber(input.lambda, "lambda");

  const latency = mean + lambda * sd;
  return requirePositiveNumber(latency, `${prefix} latency`);
}

function latencyStrategy(input) {
  const generation = input.generationP95Seconds != null ? "generation_p95" : "generation_mean_sd";
  const review = input.reviewP95Seconds != null ? "review_p95" : "review_mean_sd";
  return `review_bounded_${generation}_${review}`;
}

function requirePositiveNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive number.`);
  }
  return value;
}

function requireNonNegativeNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative number.`);
  }
  return value;
}

function roundSeconds(value) {
  return Number(value.toFixed(3));
}
