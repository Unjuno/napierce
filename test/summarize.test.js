import test from "node:test";
import assert from "node:assert/strict";
import { summarizeReviewEvents } from "../src/summarize.js";

test("summarize review events", () => {
  const summary = summarizeReviewEvents(
    [
      { candidate_id: "cand_001", elapsed_seconds: 60, action: "reject", score: 2 },
      { candidate_id: "cand_002", elapsed_seconds: 90, action: "maybe", score: 4 },
      { candidate_id: "cand_003", elapsed_seconds: 120, action: "accept", score: 5 },
    ],
    { review_budget_seconds: 300, final_review_candidates: 3 },
  );

  assert.equal(summary.reviewed_candidates, 3);
  assert.equal(summary.accepted_candidates, 1);
  assert.equal(summary.maybe_candidates, 1);
  assert.equal(summary.rejected_candidates, 1);
  assert.equal(summary.mean_review_seconds, 90);
  assert.equal(summary.sd_review_seconds, 30);
  assert.equal(summary.p50_review_seconds, 90);
  assert.equal(summary.p95_review_seconds, 117);
  assert.equal(summary.stopping.should_stop, true);
  assert.deepEqual(summary.stopping.reasons, [
    "final review candidate quota reached",
    "strong candidate found: cand_003",
  ]);
  assert.equal(summary.top_candidates[0].candidate_id, "cand_003");
});
