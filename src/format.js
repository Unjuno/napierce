export function formatPlanText(plan) {
  return [
    "Napierce plan",
    "",
    `Generation budget: ${plan.generation_budget_seconds}s`,
    `Review budget: ${plan.review_budget_seconds}s`,
    `Generation latency: ${plan.generation_latency_seconds}s/candidate`,
    `Review latency: ${plan.review_latency_seconds}s/candidate`,
    "",
    `Max generated candidates: ${plan.max_generated_candidates}`,
    `Reviewable candidates: ${plan.reviewable_candidates}`,
    `Oversample: ${plan.oversample}`,
    `Planned candidates: ${plan.planned_candidates}`,
    "",
    `Explore candidates: ${plan.explore_candidates}`,
    `Refine candidates: ${plan.refine_candidates}`,
    `Final review candidates: ${plan.final_review_candidates}`,
    "",
    `Strategy: ${plan.strategy}`,
  ].join("\n");
}
