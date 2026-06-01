import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCandidate } from "../src/review.js";

test("normalize candidate with content field", () => {
  assert.deepEqual(normalizeCandidate({ candidate_id: "cand_a", content: "A" }), {
    candidate_id: "cand_a",
    content: "A",
  });
});

test("normalize candidate with text field", () => {
  assert.equal(normalizeCandidate({ candidate_id: "cand_b", text: "B" }).content, "B");
});

test("normalize candidate with body field", () => {
  assert.equal(normalizeCandidate({ candidate_id: "cand_c", body: "C" }).content, "C");
});

test("normalize string candidate", () => {
  assert.deepEqual(normalizeCandidate("plain candidate", 0), {
    candidate_id: "cand_001",
    content: "plain candidate",
  });
});

test("reject candidate without reviewable text", () => {
  assert.throws(() => normalizeCandidate({ candidate_id: "cand_path", content_path: "candidate.md" }), /must contain content, text, or body/);
});
