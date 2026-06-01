# User Guide

This guide explains how to use Napierce in practice.

Napierce helps you avoid generating more AI candidates than you can actually review.

It is built around one simple idea:

```text
Start from human review capacity, then plan AI candidate generation around it.
```

The v0.1.0 workflow is:

```text
plan -> review -> summarize
```

## 1. When to use Napierce

Use Napierce when you want AI to produce several possible improvements, but you do not want to read an unlimited number of outputs.

Good examples:

- improving a README,
- rewriting a paragraph,
- comparing prompt variants,
- reviewing specification alternatives,
- choosing UI copy,
- inspecting code-repair candidates,
- selecting among generated proposals.

Napierce is useful when:

```text
AI can generate many candidates,
but a human must make the final judgment.
```

## 2. What Napierce is not

Napierce does not automatically decide which candidate is best.

It does not replace the human reviewer.

It does not need to call an LLM API.

It does not need to run an AI agent directly.

It does not require a browser UI.

Instead, it helps you decide:

- how many candidates to generate,
- how many candidates you can review,
- how to split generation into exploration and refinement,
- when to stop reviewing,
- what evidence was used for the decision.

## 3. Basic workflow

The basic flow is:

```text
1. Define the task.
2. Define review criteria.
3. Decide how much time you can spend generating candidates.
4. Decide how much time you can spend reviewing candidates.
5. Estimate or measure generation time per candidate.
6. Estimate or measure review time per candidate.
7. Run `napierce plan`.
8. Generate or import candidates.
9. Review candidates one by one.
10. Record actions, scores, notes, and review time.
11. Run `napierce summarize` on the saved review events.
12. Choose from the final reviewable set.
```

## 4. Step 1: Define the task

A task should be specific.

Weak task:

```text
Improve this text.
```

Better task:

```text
Rewrite this README introduction so that a new developer understands the value of Napierce in 30 seconds.
```

Another example:

```text
Generate alternative Quora question drafts about using 1/e-inspired budgeting for human-reviewed AI workflows.
```

## 5. Step 2: Define review criteria

Before generating candidates, decide what the human will judge.

Example criteria for writing:

- clarity,
- brevity,
- reader fit,
- accuracy,
- tone,
- usefulness,
- whether it preserves the original intent.

Example criteria for code-repair candidates:

- tests pass,
- patch is small,
- intent is preserved,
- risk is low,
- maintenance cost is acceptable.

The criteria do not need to be perfect.

They just need to be clear enough that the human does not keep changing the target while reviewing.

## 6. Step 3: Estimate generation and review time

Napierce separates two time budgets:

```text
generation budget = time available for creating candidates
review budget = time available for human review
```

Example:

```text
generation budget: 20 minutes
review budget: 15 minutes
```

Then estimate or measure:

```text
generation p95: 30 seconds per candidate
review p95: 90 seconds per candidate
```

p95 means a conservative estimate: most candidates should take no longer than this value.

If you do not have p95 yet, start with a rough estimate. Later, Napierce can use recorded review timings to improve the estimate.

## 7. Step 4: Create a plan

Example command:

```bash
napierce plan \
  --generate-budget 20m \
  --generation-p95 30s \
  --review-budget 15m \
  --review-p95 90s \
  --oversample 3 \
  --json
```

Example JSON result:

```json
{
  "generation_budget_seconds": 1200,
  "review_budget_seconds": 900,
  "generation_latency_seconds": 30,
  "review_latency_seconds": 90,
  "max_generated_candidates": 40,
  "reviewable_candidates": 10,
  "oversample": 3,
  "planned_candidates": 30,
  "explore_candidates": 12,
  "refine_candidates": 18,
  "final_review_candidates": 10,
  "strategy": "review_bounded_generation_p95_review_p95"
}
```

Interpretation:

- AI could generate up to 40 candidates in 20 minutes.
- The human can review about 10 candidates in 15 minutes.
- With oversampling set to 3, Napierce plans 30 generated candidates.
- The first 12 candidates are for broad exploration.
- The next 18 candidates are for focused refinement.
- The final review set should contain 10 candidates.

## 8. Step 5: Generate candidates

Napierce itself does not need to generate candidates.

You can generate candidates with any tool:

- ChatGPT,
- Codex,
- Claude Code,
- Cursor,
- a local script,
- a custom agent,
- manual variants.

The important rule is:

```text
Do not generate unlimited candidates.
Follow the planned candidate count.
```

For the example above, generate 30 candidates, not 300.

## 9. Step 6: Use exploration and refinement

The `explore_candidates` count is not a stopping point.

It is the point where broad exploration should end.

Example:

```text
Candidates 1-12: explore different directions.
Candidates 13-30: refine promising directions.
```

For writing, exploration might mean:

- one concise version,
- one more rigorous version,
- one beginner-friendly version,
- one provocative version,
- one technical version.

Refinement then focuses on the directions that look useful.

## 10. Step 7: Reduce to a reviewable set

If 30 candidates were generated but the human can review 10, reduce the set to 10.

Possible filters:

- remove duplicates,
- remove candidates that violate hard constraints,
- remove candidates that are too long,
- remove candidates that ignore the task,
- keep diverse candidates,
- keep the strongest candidates by coarse score.

The final set should be small enough for a human to read carefully.

## 11. Step 8: Prepare candidate JSONL

MVP candidate records must embed reviewable text directly in the JSONL record.

Valid fields for candidate text are `content`, `text`, and `body`:

```jsonl
{"candidate_id":"cand_001","content":"First candidate text."}
{"candidate_id":"cand_002","text":"Second candidate text."}
{"candidate_id":"cand_003","body":"Third candidate text."}
```

File-backed candidate loading through `content_path` is outside v0.1.0.

## 12. Step 9: Review candidates

A CLI review session may look like this:

```text
Candidate 1 / 10

[Candidate content]

Action:
  a = accept
  r = reject
  s = skip
  m = maybe
  b = best so far
  q = quit

Score 1-5:
Note:
```

Recommended actions:

```text
accept = usable for the task
reject = not usable
skip = not worth judging deeply
maybe = possible candidate
best_so_far = strongest candidate seen so far
quit = stop the interactive review session
```

Recommended score scale:

```text
1 = unusable
2 = weak
3 = usable with edits
4 = good
5 = strong candidate
```

Example command:

```bash
napierce review \
  --candidates candidates.jsonl \
  --out review-events.jsonl
```

`review` is interactive. It does not support `--json`; review events are written to `--out` as JSONL.

## 13. Step 10: Record timing

For each candidate, Napierce should record:

- when the candidate was opened,
- when the human acted,
- elapsed review seconds,
- action,
- score,
- optional note.

Example event:

```json
{
  "candidate_id": "cand_007",
  "elapsed_seconds": 84,
  "action": "maybe",
  "score": 4,
  "note": "Clear, but too long for the README introduction."
}
```

These records allow Napierce to estimate future review speed.

## 14. Step 11: Summarize review evidence

After the review session, summarize the saved review events:

```bash
napierce summarize --events review-events.jsonl --json
```

The summary reports:

- reviewed count,
- accepted / maybe / rejected / skipped counts,
- mean review time,
- sample standard deviation,
- p50 / p90 / p95 review time,
- top candidates,
- stopping reasons.

## 15. Step 12: Stop correctly

Stopping does not mean automatic adoption.

Stopping means:

```text
stop generating or reviewing and summarize the evidence.
```

Common stopping reasons:

- review budget reached,
- reviewable candidate quota reached,
- strong candidate found,
- no improvement after several reviews,
- human chooses to stop.

Example summary:

```text
Reviewed: 10 / 10
Elapsed: 14m 32s / 15m
Best score: 5
Accepted: 1
Maybe: 3
Rejected: 6

Recommendation:
Stop reviewing. You reached the review budget and found a strong candidate.
```

The human still makes the final decision.

## 16. Online measurement, not browser UI

Napierce does not need a browser UI to be useful.

In this project, online means that review timing estimates can be updated as new review events are recorded.

Example:

```text
new review event -> update mean review time
new review event -> update standard deviation
new review event -> update p95 estimate
```

The CLI is the reference implementation.

Other people can build a web UI later if they want. That is outside the core scope.

## 17. How to use recorded data later

After several sessions, Napierce can learn better timing estimates.

For example:

```text
paragraph candidates: p95 review time = 75s
README section candidates: p95 review time = 140s
code patches: p95 review time = 300s
```

Then future plans become more realistic.

This is why timing records matter.

They turn review capacity from a guess into measured data.

## 18. Practical rules

Use these defaults at first:

```text
oversample = 3
score scale = 1..5
planning latency = p95 when available
final review set = 5 to 10 candidates for writing tasks
```

Avoid these mistakes:

```text
Do not generate hundreds of candidates if the human can review only ten.
Do not treat AI score as final truth.
Do not keep asking for improvements without a review budget.
Do not mix very different artifact types in one timing estimate.
Do not let stopping mean automatic acceptance.
```

## 19. Quick example

Task:

```text
Improve the opening paragraph of a README.
```

Criteria:

```text
clear, short, accurate, useful for a new developer
```

Plan:

```bash
napierce plan --generate-budget 20m --generation-p95 30s --review-budget 10m --review-p95 60s --oversample 3 --json
```

Result:

```text
AI can generate up to 40 candidates.
Human can review about 10 candidates.
Generate 30 candidates.
Use 12 for exploration.
Use 18 for refinement.
Show 10 final candidates to the human.
```

Decision:

```text
Review the 10 candidates.
Score and comment.
Run summarize on the saved review-events JSONL.
Choose the final candidate manually.
```
