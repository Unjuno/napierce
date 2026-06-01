# Napierce

Napierce is a small CLI for planning human-review-bounded candidate generation.

It helps you decide how many AI-generated candidates to create, how many should be used for broad exploration, and how many a human can realistically review under a fixed time budget.

Napierce is useful for writing, documentation, prompt improvement, specification cleanup, UI copy refinement, code-repair review, and other workflows where AI can generate more candidates than humans can read.

It is not a web search tool.
It is not a direct implementation of the classical secretary problem.
It is not mainly an AI-agent runner.

Napierce treats the `1/e` idea as a practical budgeting heuristic for deciding where broad exploration should end and review-gated refinement should begin.

## Core idea

AI can generate candidates faster than humans can read, compare, and judge them.

That means the main limit is often not generation speed. The main limit is human review capacity.

Napierce turns generation time, review time, and latency estimates into a bounded candidate plan:

1. Define the improvement goal.
2. Define the human review criteria.
3. Estimate generation latency per candidate.
4. Measure or estimate human review time per candidate.
5. Compute how many candidates can be generated.
6. Compute how many candidates can actually be reviewed.
7. Use about `N / e` generated candidates for broad exploration.
8. Use the remaining generated candidates for focused refinement.
9. Save all candidates.
10. Reduce them to a small reviewable candidate set.
11. Let the human choose from that finite set.

The goal is not to let an LLM optimize text or code indefinitely.
The goal is to produce a bounded, diverse, reviewable candidate set for human judgment.

## Documentation

- [Design](docs/design.md): product design, CLI/online modes, data model, stopping conditions, and MVP scope.
- [Research notes](docs/research.md): research basis for human review, evaluation limits, workload, and testability.
- [Rationale](docs/rationale.md): classical `1/e` proof, review-bounded planning model, and claim boundaries.

## Human review timing

For subjective artifacts such as prose, documentation, specifications, and prompts, final quality is judged by a human reader.

Napierce therefore treats review time as first-class data.

A workflow can record events such as:

- candidate opened,
- candidate read,
- candidate skipped,
- candidate accepted,
- candidate rejected,
- next candidate clicked.

From those events, Napierce can estimate:

- mean review time,
- standard deviation,
- p50 / p90 / p95 review time,
- reviewable candidate count under a fixed review budget.

Different candidate types take different amounts of time to read. A short UI label, a paragraph rewrite, a README section, and a code patch should not be treated as the same review unit.

The first version can use simple timing logs. Later versions can group timings by task type, artifact type, length bucket, or review mode.

## Why 1/e?

The `1/e` split is inspired by optimal stopping theory. In the classical setting, about the first `N / e` observations are used to learn a baseline, and later observations are compared against that baseline.

Napierce does not assume that AI workflows exactly satisfy that model. AI-generated candidates can usually be saved, compared later, revised, and filtered by human review or tests.

Therefore, Napierce uses `N / e` as an exploration-budget rule:

- the first phase explores the task and collects diverse candidates,
- the second phase refines promising directions,
- the final review set is selected from all saved candidates,
- the goal is practical bounded improvement, not a universal optimality claim.

The point is to avoid endless generation when the real limits are time, review attention, and decision quality.

For the classical proof and the agent-side improvement conditions, see [docs/rationale.md](docs/rationale.md).

## Example

Planned CLI shape:

```bash
napierce plan \
  --generate-budget 20m \
  --generation-p95 30s \
  --review-budget 15m \
  --review-p95 90s \
  --oversample 3
```

Example output:

```json
{
  "generation_budget_seconds": 1200,
  "review_budget_seconds": 900,
  "generation_p95_seconds": 30,
  "review_p95_seconds": 90,
  "max_generated_candidates": 40,
  "reviewable_candidates": 10,
  "oversample": 3,
  "planned_candidates": 30,
  "explore_candidates": 12,
  "refine_candidates": 18,
  "final_review_candidates": 10,
  "strategy": "review_bounded_p95"
}
```

In this example, AI could generate up to 40 candidates during the generation budget, but the human can review about 10 candidates during the review budget. Napierce therefore plans 30 generated candidates and requires the workflow to reduce them to 10 final review candidates.

## Use cases

- Produce multiple writing candidates without making the human read everything.
- Bound document or specification editing passes.
- Limit repeated prompt improvement loops.
- Decide how many code-repair candidates to generate before review.
- Split a fixed generation budget into exploration and refinement phases.
- Convert human review time into a finite reviewable candidate count.
- Keep AI output reviewable instead of letting revisions grow without a stopping rule.

## Non-goals

Napierce will not initially:

- run agents directly,
- call LLM APIs,
- judge final output quality by itself,
- automatically merge code,
- replace human review,
- claim a universal optimal stopping theorem for all AI workflows.

The first version should stay small: calculate a bounded candidate plan and report it clearly.

## Planned MVP

The first usable version should provide:

- `napierce plan` for calculating bounded candidate plans,
- support for generation budget and generation latency,
- support for review budget and review latency,
- support for `--p95`, `--mean`, `--sd`, and safety factors,
- support for an oversampling ratio,
- JSON output for scripts and agent tools,
- human-readable output for CLI use,
- tests for duration parsing and budget calculation.

## Formula

Let:

```text
T_g = generation time budget
L_g = safe generation latency per candidate
T_r = human review time budget
L_r = safe human review time per candidate
rho = oversampling ratio
```

Then:

```text
max_generated = floor(T_g / L_g)
reviewable = floor(T_r / L_r)
planned = min(max_generated, ceil(rho * reviewable))
explore = ceil(planned / e)
refine = planned - explore
final_review = reviewable
```

Review latency can come from direct measurement:

```text
L_r = p95(review_time_samples)
```

or from a conservative estimate:

```text
L_r = mean(review_time_samples) + lambda * standard_deviation(review_time_samples)
```

This is mathematically testable as a workflow rule. A baseline workflow can be compared against Napierce by measuring final human-rated quality, review time, generated candidate count, and reviewable candidate count.

This is still a heuristic for practical planning. It reuses the `1/e` split as a bounded exploration rule for saved, reviewable AI-generated candidates.

## Status

Pre-implementation / experimental.

The current goal is to build a minimal CLI that makes candidate generation and human review limits explicit, reproducible, and easy to inspect.

## License

Apache-2.0 is intended for this project.
A `LICENSE` file should be added before the first tagged release.
