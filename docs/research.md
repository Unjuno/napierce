# Research Notes

This document records the research basis behind Napierce.

Napierce is a human-review-bounded candidate planning tool. Its core assumption is that AI can generate more candidates than humans can reliably read, compare, and judge.

The purpose of this document is not to prove universal optimality. It is to justify the product design and make the assumptions testable.

## 1. Natural-language outputs still need human judgment

For writing, documentation, prompts, specifications, and many review tasks, final quality depends on purpose, reader fit, intent, clarity, tone, and task usefulness.

Automatic metrics can help, but they do not fully replace human judgment.

Research on natural language generation evaluation repeatedly reports limitations in automatic metrics and evaluation practice:

- Gehrmann, Clark, and Sellam survey long-running obstacles in generated-text evaluation and distinguish problems in human evaluation, automatic evaluation, and datasets.
- Schmidtova et al. survey automatic metrics in NLG and report issues such as inappropriate metric use, missing implementation details, and missing correlations with human judgments.
- Colombo et al. compare automatic and human metrics and argue that automatic metrics remain substantially different from human judgment.

Implication for Napierce:

```text
Napierce should not try to automatically decide final quality.
It should help humans review fewer, better-organized candidates.
```

## 2. Human review is a workload-bearing process

Reviewing candidate outputs is work.

A reviewer must read, compare, remember the task goal, apply criteria, and decide.

This creates time cost and cognitive burden.

Cognitive load theory is relevant because problem solving and task processing can consume limited working-memory resources. NASA-TLX is relevant because it gives a practical model for measuring perceived workload across dimensions such as mental demand, temporal demand, effort, performance, and frustration.

Implication for Napierce:

```text
Review time and review burden should be measured directly.
They should not be treated as free.
```

## 3. Too many candidates can harm decision quality

Choice overload should not be overstated as a universal law. Meta-analytic work suggests that the effect is context-dependent.

However, the practical risk remains clear for AI workflows:

```text
if the model generates more candidates than the human can inspect,
the workflow becomes less reviewable.
```

Napierce therefore focuses on bounded candidate sets rather than unlimited candidate generation.

Implication for Napierce:

```text
The system should plan for a reviewable candidate count K,
not merely a generated candidate count N.
```

## 4. Timing is measurable

Human review timing can be measured through simple events:

```text
candidate displayed
candidate action clicked
candidate accepted
candidate rejected
candidate skipped
candidate scored
```

From these events, Napierce can estimate:

```text
mean review time
standard deviation
p50 review time
p90 review time
p95 review time
```

Review times should be grouped by artifact type when possible:

```text
short_label
paragraph
readme_section
specification
prompt
code_patch
```

Implication for Napierce:

```text
The CLI and online UI should share the same event log format.
```

## 5. Planning formula

Napierce separates generation capacity from review capacity.

Let:

```text
T_g = generation time budget
L_g = safe generation latency per candidate
T_r = human review time budget
L_r = safe review latency per candidate
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
F = final review candidates
```

Unit checks:

```text
T_g / L_g = seconds / (seconds / candidate) = candidates
T_r / L_r = seconds / (seconds / candidate) = candidates
```

## 6. Mathematical verification

Napierce can be tested as a workflow rule.

It should be compared against baselines such as:

- subjective stopping,
- fixed candidate count,
- generate-as-many-as-possible,
- one-shot generation,
- manual editing without candidate planning.

Measured outcomes:

```text
Q = final human-rated quality
R = human review time
C_g = generation cost
H = human workload or burden
A = acceptance indicator
K = reviewed candidate count
N = generated candidate count
```

A simple utility model:

```text
U = V(Q) - a * R - b * C_g - c * H
```

Napierce improves over a baseline if:

```text
E[U_napierce] > E[U_baseline]
```

A simpler metric:

```text
E[Q_napierce / R_napierce] > E[Q_baseline / R_baseline]
```

This is testable with repeated tasks, recorded timings, and human ratings.

## 7. Practical experimental design

A minimal experiment:

```text
Task type: writing or documentation improvement
Number of tasks: at least 20 to 30 small tasks
Participants: one or more human reviewers
Baseline A: subjective stopping
Baseline B: fixed candidate count
Treatment: Napierce planning
Measurements: quality, review time, reviewed count, accepted count, workload
```

Decision rule:

```text
PASS if Napierce improves quality per review time without increasing workload.
FAIL if quality drops or workload increases without compensating benefit.
UNCERTAIN if the result is task-dependent or confidence intervals overlap.
```

## 8. Design implications

Napierce should:

- treat human review time as first-class data,
- support both CLI and online review,
- log candidate actions and elapsed seconds,
- support artifact-type timing profiles,
- avoid automatic final judgment,
- produce a finite reviewable candidate set,
- expose stopping recommendations,
- keep all candidates for auditability.

Napierce should not:

- claim automatic quality evaluation,
- claim universal optimality,
- assume all candidates take equal time to review,
- assume generated count is the same as reviewable count,
- hide the human decision point.

## 9. References

- Sweller, J. (1988). Cognitive load during problem solving: Effects on learning. Cognitive Science.
- Hart, S. G., & Staveland, L. E. (1988). Development of NASA-TLX: Results of empirical and theoretical research. In Human Mental Workload.
- Scheibehenne, B., Greifeneder, R., & Todd, P. M. (2010). Can there ever be too many options? A meta-analytic review of choice overload. Journal of Consumer Research.
- Gehrmann, S., Clark, E., & Sellam, T. (2022). Repairing the Cracked Foundation: A Survey of Obstacles in Evaluation Practices for Generated Text.
- Schmidtova, P., Mahamood, S., Balloccu, S., Dusek, O., Gatt, A., Gkatzia, D., Howcroft, D. M., Platek, O., & Sivaprasad, A. (2024). Automatic Metrics in Natural Language Generation: A Survey of Current Evaluation Practices.
- Colombo, P., Peyrard, M., Noiry, N., West, R., & Piantanida, P. (2022). The Glass Ceiling of Automatic Evaluation in Natural Language Generation.
