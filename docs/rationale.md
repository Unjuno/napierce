# Rationale

This document explains the idea behind Napierce.

Napierce is not mainly an agent runner. It is a planning tool for human-review-bounded candidate generation.

The core problem is simple:

```text
AI can generate candidates faster than humans can read, compare, and judge them.
```

Therefore the main constraint is often not generation speed. The main constraint is human review capacity.

Napierce uses time budgets, timing measurements, and a `1/e`-inspired exploration split to produce a finite candidate plan.

It is important to separate three claims:

1. The classical secretary problem has a proof under its own assumptions.
2. Napierce does not assume every AI workflow satisfies those assumptions.
3. Human-review-bounded workflows can still be measured and tested mathematically.

## 1. Classical 1/e result

### 1.1 Setting

There are `N` candidates in uniformly random order.

The decision-maker sees candidates one by one, can rank each new candidate relative to all previous candidates, and must either accept or reject the current candidate immediately.

Rejected candidates cannot be recalled.

The goal is to maximize the probability of selecting the single best candidate.

### 1.2 Threshold rule

For a threshold `r`, the rule is:

1. Reject the first `r - 1` candidates.
2. Remember the best candidate among those first `r - 1` candidates.
3. From candidate `r` onward, accept the first candidate who is better than every previous candidate.

### 1.3 Success probability

Suppose the overall best candidate appears at position `i`.

This happens with probability `1 / N` for each `i`.

If `i < r`, the rule cannot select that candidate, because the first `r - 1` candidates are rejected.

If `i >= r`, the rule selects the best candidate exactly when the best candidate among the first `i - 1` positions lies in the initial observation block `1, ..., r - 1`.

Given that the overall best appears at position `i`, the best of the first `i - 1` positions is equally likely to be at any of those `i - 1` positions.

So the conditional success probability is:

```text
(r - 1) / (i - 1)
```

Therefore the success probability for threshold `r` is:

```text
P_N(r) = (1 / N) * sum_{i=r}^{N} (r - 1) / (i - 1)
       = ((r - 1) / N) * sum_{j=r-1}^{N-1} (1 / j)
```

### 1.4 Asymptotic maximization

Let:

```text
r ≈ alpha * N
```

where `0 < alpha < 1`.

For large `N`, the harmonic sum can be approximated by a logarithm:

```text
sum_{j=r-1}^{N-1} (1 / j) ≈ log(N / r)
```

So:

```text
P_N(r) ≈ alpha * log(1 / alpha)
       = -alpha * log(alpha)
```

Maximize:

```text
f(alpha) = -alpha * log(alpha)
```

Differentiate:

```text
f'(alpha) = -log(alpha) - 1
```

Set `f'(alpha) = 0`:

```text
-log(alpha) - 1 = 0
log(alpha) = -1
alpha = 1 / e
```

The maximum value is:

```text
f(1 / e) = 1 / e
```

Thus the classical asymptotic rule is to observe about `N / e` candidates first.

## 2. Why Napierce does not directly copy the secretary problem

AI-generated candidates differ from the classical secretary setting.

In most AI workflows:

- candidates can be saved,
- candidates can be compared later,
- candidates can be filtered by tests or human review,
- prompts and context can change,
- the goal is often sufficient quality under a time limit, not irreversible selection of the single best item.

Therefore, Napierce does not discard the first `N / e` outputs.

Instead:

- the first phase explores the task and collects diverse candidates,
- the second phase refines promising directions,
- the final review set is selected from all saved candidates,
- the human chooses from a finite reviewable set.

## 3. Human review is the binding constraint

For writing, documentation, prompts, specifications, and many code-review workflows, final quality is judged by a human.

Machine checks can help with length, structure, tests, duplicate removal, and obvious rule violations. They cannot fully replace human judgment of purpose, clarity, tone, intent, and reader fit.

So Napierce treats human review time as first-class data.

A workflow may measure review events such as:

- candidate opened,
- candidate read,
- candidate skipped,
- candidate accepted,
- candidate rejected,
- next candidate clicked.

From these events, Napierce can estimate:

- mean review time,
- standard deviation,
- p50 review time,
- p90 review time,
- p95 review time,
- reviewable candidate count under a fixed review budget.

Different artifacts should have different timing profiles. A short label, a paragraph rewrite, a README section, and a code patch are not the same review unit.

## 4. Review-bounded planning model

### 4.1 Variables

| Symbol | Meaning | Unit | Definition | Type |
|---|---:|---:|---|---|
| `T_g` | generation time budget | seconds | time available for generating candidates | scalar |
| `L_g` | safe generation latency | seconds / candidate | p95 or conservative generation time | scalar |
| `T_r` | human review time budget | seconds | time available for human review | scalar |
| `L_r` | safe human review latency | seconds / candidate | p95 or conservative review time | scalar |
| `rho` | oversampling ratio | dimensionless | generated candidates per reviewable candidate | scalar |
| `G_max` | maximum generated candidates | candidates | `floor(T_g / L_g)` | integer |
| `K` | reviewable candidates | candidates | `floor(T_r / L_r)` | integer |
| `N` | planned generated candidates | candidates | `min(G_max, ceil(rho * K))` | integer |
| `r` | exploration candidates | candidates | `ceil(N / e)` | integer |
| `F` | final review candidates | candidates | normally `K` | integer |

### 4.2 Candidate count formulas

```text
G_max = floor(T_g / L_g)
K = floor(T_r / L_r)
N = min(G_max, ceil(rho * K))
r = ceil(N / e)
refine = N - r
F = K
```

Unit check:

```text
T_g / L_g = seconds / (seconds / candidate) = candidates
T_r / L_r = seconds / (seconds / candidate) = candidates
```

So both generated and reviewable candidate counts are dimensionally consistent.

### 4.3 Review latency estimation

Review latency may be estimated from measured samples:

```text
L_r = p95(review_time_samples)
```

or from a conservative mean-plus-deviation rule:

```text
L_r = mean(review_time_samples) + lambda * standard_deviation(review_time_samples)
```

The p95 approach is usually safer when review times have a long right tail.

## 5. Mathematical testability

Napierce can be tested as a workflow rule.

It does not need to prove universal optimality to be useful. It needs to outperform or clarify a baseline under measurable constraints.

### 5.1 Baselines

Possible baselines include:

- subjective stopping,
- fixed candidate count,
- generate as many as possible,
- ask the agent to keep improving until the human gets tired,
- generate one candidate and edit manually.

### 5.2 Measured outcomes

A comparison can measure:

- final human-rated quality,
- total human review time,
- number of generated candidates,
- number of reviewed candidates,
- acceptance rate,
- time to accepted candidate,
- fatigue or confidence rating,
- whether the final candidate satisfies the stated purpose.

### 5.3 Improvement criterion

Let:

| Symbol | Meaning | Unit | Definition | Type |
|---|---:|---:|---|---|
| `Q` | final human-rated quality | score | human rating or rubric score | scalar |
| `R` | human review time | seconds | measured review time | scalar |
| `C_g` | generation cost | money, tokens, or seconds | cost of candidate generation | scalar |
| `H` | human burden score | score | fatigue, confidence loss, or subjective load | scalar |
| `V(Q)` | utility of final quality | utility | user-defined value function | scalar |
| `a`, `b`, `c` | cost weights | utility/unit | user-defined penalty weights | scalars |

A simple net utility can be defined as:

```text
U = V(Q) - a * R - b * C_g - c * H
```

Napierce improves over a baseline if:

```text
E[U_napierce] > E[U_baseline]
```

or, for a simpler quality-per-review-time metric:

```text
E[Q_napierce / R_napierce] > E[Q_baseline / R_baseline]
```

This is mathematically testable with repeated tasks, recorded timings, and human ratings.

### 5.4 Sufficient condition

A sufficient condition for Napierce to improve expected net utility is:

```text
E[V(Q_napierce)] >= E[V(Q_baseline)] + epsilon
```

and:

```text
E[a * R_napierce + b * C_g_napierce + c * H_napierce]
  <=
E[a * R_baseline + b * C_g_baseline + c * H_baseline] + delta
```

with:

```text
epsilon > delta
```

In words:

Napierce improves the workflow if the expected value gained from better or more reviewable candidates exceeds the additional generation, review, and coordination cost.

## 6. What can be claimed

Napierce may claim:

- it makes generation and review budgets explicit,
- it converts review time into a finite reviewable candidate count,
- it records timing data for later calibration,
- it gives a simple default exploration/refinement split,
- it helps prevent endless AI candidate generation,
- it supports reproducible comparison between candidate-generation workflows.

Napierce should not claim:

- universal optimality,
- that every AI workflow satisfies the secretary problem,
- that `N / e` is always the best split,
- that human review can be removed,
- that subjective quality can be fully automated,
- that one timing profile applies to all artifact types.

## 7. References

- Thomas S. Ferguson, "Who Solved the Secretary Problem?", Statistical Science, 1989.
- P. R. Freeman, "The Secretary Problem and its Extensions: A Review", International Statistical Review, 1983.
- F. Thomas Bruss, "Sum the odds to one and stop", Annals of Probability, 2000.
