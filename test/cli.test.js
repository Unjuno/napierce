import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
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

test("CLI rejects unknown command", async () => {
  await assert.rejects(
    () => execFileAsync(process.execPath, ["bin/napierce.js", "unknown"]),
    /unknown command/,
  );
});
