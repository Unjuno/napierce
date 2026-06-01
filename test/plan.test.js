import test from "node:test";
import assert from "node:assert/strict";
import { createPlan } from "../src/plan.js";

test("create review-bounded p95 plan", () => {
  const plan = createPlan({
    generationBudgetSeconds: 1200,
    generationP95Seconds: 30,
    reviewBudgetSeconds: 900,
    reviewP95Seconds: 90,
    oversample: 3,
  });

  assert.deepEqual(plan, {
    generation_budget_seconds: 1200,
    review_budget_seconds: 900,
    generation_latency_seconds: 30,
    review_latency_seconds: 90,
    max_generated_candidates: 40,
    reviewable_candidates: 10,
    oversample: 3,
    planned_candidates: 30,
    explore_candidates: 12,
    refine_candidates: 18,
    final_review_candidates: 10,
    strategy: "review_bounded_generation_p95_review_p95",
  });
});

test("planned candidates are capped by generation budget", () => {
  const plan = createPlan({
    generationBudgetSeconds: 100,
    generationP95Seconds: 10,
    reviewBudgetSeconds: 1000,
    reviewP95Seconds: 10,
    oversample: 3,
  });

  assert.equal(plan.max_generated_candidates, 10);
  assert.equal(plan.reviewable_candidates, 100);
  assert.equal(plan.planned_candidates, 10);
});

test("mean and sd latency strategy", () => {
  const plan = createPlan({
    generationBudgetSeconds: 1200,
    generationMeanSeconds: 20,
    generationSdSeconds: 5,
    reviewBudgetSeconds: 900,
    reviewMeanSeconds: 60,
    reviewSdSeconds: 15,
    lambda: 2,
    oversample: 3,
  });

  assert.equal(plan.generation_latency_seconds, 30);
  assert.equal(plan.review_latency_seconds, 90);
  assert.equal(plan.planned_candidates, 30);
  assert.equal(plan.strategy, "review_bounded_generation_mean_sd_review_mean_sd");
});

test("oversample must be at least one", () => {
  assert.throws(
    () => createPlan({
      generationBudgetSeconds: 1200,
      generationP95Seconds: 30,
      reviewBudgetSeconds: 900,
      reviewP95Seconds: 90,
      oversample: 0.5,
    }),
    /oversample must be at least 1/,
  );
});
