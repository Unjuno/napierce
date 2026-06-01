# Design

Napierce is a human-review-bounded candidate planning tool.

It helps people decide how many AI-generated candidates to create, how many to inspect, and when to stop generating or reviewing.

The core premise is:

```text
AI generation can be fast and cheap, but human review is slow, limited, and quality-critical.
```

Napierce should therefore optimize for a finite, reviewable candidate set rather than unlimited generation.

## 1. Product definition

Napierce is not primarily an AI-agent runner.

It is a CLI planning and logging tool for human decision workflows that use AI-generated candidates.

The first product target is:

```text
Given generation constraints and human review constraints,
produce a bounded candidate plan and record review evidence.
```

## 2. Supported mode

Napierce should be CLI-first and CLI-complete.

There is no need to ship a browser UI in this project.

If Napierce proves useful, other people can build UIs on top of its JSON and JSONL formats.

The word "online" in this project should mean online measurement or online updating of timing profiles, not a web application requirement.

Expected commands:

```bash
napierce plan
napierce review
napierce summarize
```

The shared file formats should remain simple enough for other tools to consume:

- candidate records,
- review event records,
- plan records,
- summary records.

## 3. Main workflow

```text
1. Define task and review criteria.
2. Estimate or measure generation time.
3. Estimate or measure human review time.
4. Compute generated candidate count.
5. Compute reviewable candidate count.
6. Generate or import candidates.
7. Review candidates one by one in the CLI.
8. Record timing, action, score, and notes.
9. Stop when a review budget or stopping rule is reached.
10. Summarize the evidence and show top candidates.
```

The final decision remains human.

Napierce should not silently auto-accept final candidates.

## 4. Planning model

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
G_max = floor(T_g / L_g)
K = floor(T_r / L_r)
N = min(G_max, ceil(rho * K))
r = ceil(N / e)
refine = N - r
F = K
```

Where:

```text
G_max = maximum generated candidates
K = reviewable candidates
N = planned generated candidates
r = exploration candidates
refine = focused refinement candidates
F = final review candidates
```

### 4.1 Interpretation

- `G_max` says how many candidates AI can generate under the generation budget.
- `K` says how many candidates a human can review under the review budget.
- `N` limits generation to a multiple of human review capacity.
- `r` gives a default exploration phase size.
- `F` is the number of candidates that should be shown for final review.

## 5. Review-time measurement

Human review time should be measured directly whenever possible.

A review interval starts when a candidate is displayed and ends when the human takes an action.

Actions:

```text
accept
reject
skip
maybe
best_so_far
quit
```

For each reviewed candidate, record:

- candidate id,
- opened timestamp,
- action timestamp,
- elapsed seconds,
- action,
- optional score,
- optional note.

Napierce should calculate:

```text
mean review time
standard deviation
p50 review time
p90 review time
p95 review time
reviewed candidate count
accepted candidate count
skipped candidate count
```

The p95 value should be preferred for planning when timings have a long right tail.

## 6. Artifact types

Review time depends on what the human is reading.

Napierce should support artifact-type labels:

```text
short_label
paragraph
readme_section
specification
prompt
code_patch
other
```

Timing profiles should eventually be grouped by artifact type.

A global average is acceptable for a prototype, but it is too crude for serious use.

## 7. Scoring model

Napierce should keep human action and score separate.

A candidate may be high quality but not suitable for the current task.

Recommended action values:

```text
accept
reject
skip
maybe
best_so_far
```

Recommended score scale:

```text
1 = unusable
2 = weak
3 = usable with edits
4 = good
5 = strong candidate
```

Optional fields:

```text
confidence: 1..5
workload: 1..5
note: string
```

## 8. Stopping conditions

Napierce should show stopping recommendations rather than silently stopping.

Possible stopping conditions:

### 8.1 Review budget exhausted

```text
review_elapsed_seconds >= review_budget_seconds
```

### 8.2 Review quota reached

```text
reviewed_candidates >= final_review_candidates
```

### 8.3 Strong candidate found

```text
score >= accept_score_threshold
```

Example:

```text
accept_score_threshold = 5
```

### 8.4 No improvement window

```text
best_score_now - best_score_w_reviews_ago < epsilon
```

### 8.5 Human stops

The reviewer can quit and summarize at any point.

Stopping means:

```text
stop generating or reviewing and summarize current evidence
```

It does not mean automatic adoption.

## 9. Data model

### 9.1 Candidate record

```json
{
  "candidate_id": "cand_001",
  "task_id": "task_001",
  "artifact_type": "readme_section",
  "source": "llm",
  "phase": "explore",
  "content_path": "candidates/cand_001.md",
  "metadata": {
    "model": "unknown",
    "prompt_variant": "clarity",
    "generated_at": "2026-06-01T00:00:00Z"
  }
}
```

### 9.2 Review event record

```json
{
  "event_id": "evt_001",
  "task_id": "task_001",
  "candidate_id": "cand_001",
  "reviewer_id": "local_user",
  "opened_at": "2026-06-01T00:01:00Z",
  "acted_at": "2026-06-01T00:02:12Z",
  "elapsed_seconds": 72,
  "action": "maybe",
  "score": 4,
  "confidence": 3,
  "workload": 2,
  "note": "Clear but slightly too long."
}
```

### 9.3 Plan record

```json
{
  "task_id": "task_001",
  "generation_budget_seconds": 1200,
  "review_budget_seconds": 900,
  "generation_latency_seconds": 30,
  "review_latency_seconds": 90,
  "oversample": 3,
  "max_generated_candidates": 40,
  "reviewable_candidates": 10,
  "planned_candidates": 30,
  "explore_candidates": 12,
  "refine_candidates": 18,
  "final_review_candidates": 10
}
```

## 10. CLI requirements

### 10.1 `napierce plan`

Inputs:

```text
--generate-budget
--generation-p95
--generation-mean
--generation-sd
--review-budget
--review-p95
--review-mean
--review-sd
--lambda
--oversample
--json
```

Outputs:

- human-readable plan,
- JSON plan,
- warnings for impossible or very small budgets.

### 10.2 `napierce review`

Inputs:

```text
--candidates
--criteria
--out
--reviewer
--json
```

Behavior:

- show one candidate at a time,
- start timer when candidate is displayed,
- ask for action and optional score,
- write JSONL review events.

### 10.3 `napierce summarize`

Inputs:

```text
--events
--plan
--json
```

Outputs:

- timing summary,
- score summary,
- action counts,
- p50/p90/p95 review time,
- top candidates,
- stopping-rule status.

## 11. Online measurement

Napierce can update timing estimates as review logs accumulate.

This is online measurement, not a required web UI.

Examples:

```text
new review event -> update mean review time
new review event -> update standard deviation
new review event -> update p95 estimate
new task type -> update artifact-specific timing profile
```

The CLI should remain the reference implementation.

External UIs may consume the JSONL logs later, but they are outside the MVP.

## 12. Mathematical verification

Napierce is testable as a workflow rule.

A baseline workflow can be compared against Napierce by measuring:

- final human-rated quality,
- total review time,
- generated candidate count,
- reviewed candidate count,
- accepted candidate count,
- time to accepted candidate,
- reviewer confidence,
- reviewer workload.

A simple utility model:

```text
U = V(Q) - a * R - b * C_g - c * H
```

Where:

```text
Q = final human-rated quality
R = human review time
C_g = generation cost
H = human burden
V(Q) = utility of quality
a, b, c = cost weights
```

Napierce improves over a baseline if:

```text
E[U_napierce] > E[U_baseline]
```

A simpler metric is:

```text
E[Q_napierce / R_napierce] > E[Q_baseline / R_baseline]
```

This should be tested with repeated tasks, recorded timing logs, and human ratings.

## 13. Research basis

The design follows four research-informed constraints:

1. Human evaluation remains important for language generation because automatic metrics do not fully capture all quality dimensions.
2. Candidate sets can become too large for reliable human judgment, although choice-overload effects are context-dependent and should not be overstated.
3. Review is a workload-bearing task; timing and subjective workload can be measured.
4. A bounded workflow can be compared mathematically against baselines using quality, time, cost, and burden metrics.

See [docs/research.md](research.md) for details.

## 14. MVP scope

MVP includes:

- `napierce plan`,
- `napierce review`,
- `napierce summarize`,
- duration parsing,
- review-event JSONL input/output,
- JSON output,
- human-readable CLI output,
- plan calculation tests,
- summary tests,
- CLI smoke tests.

MVP does not include:

- browser UI,
- LLM API calls,
- automatic candidate generation,
- automatic final judgment,
- automatic code merge,
- complex optimization algorithms,
- account systems.

## 15. Open questions

- Should timing profiles be stored globally or per project?
- Should artifact type be required for every candidate?
- Should p95 be the default planning value?
- Should workload be a simple 1..5 score or a compact workload questionnaire?
