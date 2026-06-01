import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("CLI prints JSON plan", async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    "bin/napierce.js",
    "plan",
    "--generate-budget",
    "20m",
    "--generation-p95",
    "30s",
    "--review-budget",
    "15m",
    "--review-p95",
    "90s",
    "--oversample",
    "3",
    "--json",
  ]);

  const plan = JSON.parse(stdout);
  assert.equal(plan.max_generated_candidates, 40);
  assert.equal(plan.reviewable_candidates, 10);
  assert.equal(plan.planned_candidates, 30);
  assert.equal(plan.explore_candidates, 12);
  assert.equal(plan.refine_candidates, 18);
});

test("CLI summarizes JSONL events", async () => {
  const dir = await mkdtemp(join(tmpdir(), "napierce-"));
  const eventsPath = join(dir, "events.jsonl");

  await writeFile(
    eventsPath,
    [
      JSON.stringify({ candidate_id: "cand_001", elapsed_seconds: 30, action: "reject", score: 1 }),
      JSON.stringify({ candidate_id: "cand_002", elapsed_seconds: 60, action: "accept", score: 5 }),
    ].join("\n"),
  );

  const { stdout } = await execFileAsync(process.execPath, [
    "bin/napierce.js",
    "summarize",
    "--events",
    eventsPath,
    "--json",
  ]);

  const summary = JSON.parse(stdout);
  assert.equal(summary.reviewed_candidates, 2);
  assert.equal(summary.accepted_candidates, 1);
  assert.equal(summary.mean_review_seconds, 45);
  assert.equal(summary.stopping.should_stop, true);
});

test("CLI review rejects JSON mode", async () => {
  await assert.rejects(
    () => execFileAsync(process.execPath, [
      "bin/napierce.js",
      "review",
      "--candidates",
      "candidates.jsonl",
      "--out",
      "review-events.jsonl",
      "--json",
    ]),
    /--json is not supported for interactive review/,
  );
});

test("CLI rejects unknown command", async () => {
  await assert.rejects(
    () => execFileAsync(process.execPath, ["bin/napierce.js", "unknown"]),
    /unknown command/,
  );
});
