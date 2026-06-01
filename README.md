# Napierce

Napierce is a small CLI for planning bounded AI-agent iterations.

It helps you decide how many times to run an AI agent under a fixed time budget, using latency estimates and a 1/e-inspired split between broad exploration and focused refinement.

Napierce is for agent-driven iterative work such as code repair, prompt improvement, document editing, specification cleanup, UI copy refinement, and other repetitive improvement tasks.

It is not a web search tool.
It is not a direct implementation of the classical secretary problem.
It treats the 1/e idea as a practical budgeting heuristic for deciding how much time to spend exploring before focusing on refinement.

## Core idea

AI agents can keep producing more revisions, fixes, drafts, and alternatives.

That does not mean you should keep asking for more.

Napierce turns a human or compute time limit into a bounded iteration plan:

1. Set a time budget.
2. Estimate one agent iteration's latency.
3. Convert the time budget into a maximum trial count.
4. Use about `N / e` iterations for broad exploration.
5. Use the remaining iterations for focused refinement.
6. Save all candidates.
7. Review only the top candidates.
8. Stop before review fatigue destroys decision quality.

## Why 1/e?

The `1/e` split is inspired by optimal stopping theory. In the classical setting, about the first `N / e` observations are used to learn a baseline, and later observations are compared against that baseline.

Napierce does not assume that AI-agent workflows exactly satisfy that model. Agent outputs can usually be saved, compared later, revised, and filtered by human review or tests.

Therefore, Napierce uses `N / e` as an exploration-budget rule:

- the first phase explores the task and collects candidate outputs,
- the second phase refines promising directions,
- the final selection is made from all saved candidates,
- the goal is practical bounded improvement, not a universal optimality claim.

The point is to avoid endless agent iteration when the real limits are time, review attention, and decision quality.

## Example

Planned CLI shape:

```bash
napierce plan --budget 60m --p95 45s
```

Example output:

```json
{
  "budget_seconds": 3600,
  "safe_latency_seconds": 45,
  "max_trials": 80,
  "explore_trials": 30,
  "refine_trials": 50,
  "strategy": "p95"
}
```

## Use cases

- Decide how many times to run a coding agent before reviewing results.
- Limit repeated prompt improvement loops.
- Bound document or specification editing passes.
- Split a fixed time budget into exploration and refinement phases.
- Keep agent output reviewable instead of letting revisions grow without a stopping rule.

## Non-goals

Napierce will not initially:

- run agents directly,
- call LLM APIs,
- judge output quality by itself,
- automatically merge code,
- replace human review,
- claim a universal optimal stopping theorem for all agent workflows.

The first version should stay small: calculate a bounded iteration plan and report it clearly.

## Planned MVP

The first usable version should provide:

- `napierce plan` for calculating iteration budgets,
- support for `--budget`, `--p95`, `--mean`, `--sd`, and safety factors,
- JSON output for scripts and agent tools,
- human-readable output for CLI use,
- tests for duration parsing and budget calculation.

## Formula

For a fixed time budget `T` and safe per-iteration latency `L`:

```text
N = floor(T / L)
explore = ceil(N / e)
refine = N - explore
```

`L` may be a measured p95 latency, or a conservative estimate such as:

```text
L = mean + lambda * standard_deviation
```

This is a heuristic for practical planning. It reuses the `1/e` split as a bounded exploration rule for saved, reviewable agent outputs.

## Status

Pre-implementation / experimental.

The current goal is to build a minimal CLI that makes agent iteration budgets explicit, reproducible, and easy to inspect.

## License

Apache-2.0 is intended for this project.
A `LICENSE` file should be added before the first tagged release.
