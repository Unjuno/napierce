# Rationale

This document explains the idea behind Napierce.

Napierce uses the classical `1/e` split as a practical exploration-budget rule for bounded AI-agent iterations.

It is important to separate two claims:

1. The classical secretary problem has a proof under its own assumptions.
2. Napierce does not assume every AI-agent workflow satisfies those assumptions.

Napierce uses the same split because it gives a simple default for deciding how much of a fixed budget should be spent learning the task before focusing on refinement.

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

AI-agent iterations differ from the classical setting.

In most agent workflows:

- candidates can be saved,
- candidates can be compared later,
- candidates can be rescored with tests or human review,
- prompts and context can change,
- the goal is often sufficient quality under a time limit, not irreversible selection of the single best item.

Therefore, Napierce does not discard the first `N / e` outputs.

Instead:

- the first phase explores the task and collects candidates,
- the second phase refines promising directions,
- the final selection is made from all saved candidates.

## 3. Agent-side improvement condition

Napierce can support a useful improvement claim, but only under explicit conditions.

It should not claim universal optimality.

### 3.1 Variables

| Symbol | Meaning | Unit | Definition | Type |
|---|---:|---:|---|---|
| `T` | available time budget | seconds | user- or system-defined time limit | scalar |
| `L` | safe latency per iteration | seconds / iteration | measured p95 or conservative estimate | scalar |
| `N` | maximum iterations | iterations | `floor(T / L)` | integer |
| `r` | exploration iterations | iterations | `ceil(N / e)` | integer |
| `q_i` | quality of candidate `i` | score | evaluator, tests, or human review | scalar |
| `B_k` | best score after `k` iterations | score | `max(q_1, ..., q_k)` | scalar |
| `C` | cost per iteration | seconds, money, or review burden | task-dependent | scalar |
| `V(q)` | utility of quality score `q` | utility | user-defined value function | scalar |

### 3.2 Minimal improvement criterion

A Napierce-style workflow is useful if it improves quality per bounded resource.

One measurable criterion is:

```text
E[V(B_N^napierce)] - Cost_N^napierce
  >
E[V(B_N^baseline)] - Cost_N^baseline
```

where the baseline may be:

- running the same prompt repeatedly,
- stopping by intuition,
- asking the agent to keep improving until the user gets tired,
- using a fixed arbitrary number of iterations.

### 3.3 Sufficient condition

A sufficient condition for Napierce to improve expected net utility is:

```text
E[V(B_N^napierce)] >= E[V(B_N^baseline)] + epsilon
```

and:

```text
Cost_N^napierce <= Cost_N^baseline + delta
```

with:

```text
epsilon > delta
```

In words:

Napierce improves the workflow if the expected value gained from better candidate selection exceeds the extra cost of planning, logging, and phase separation.

### 3.4 Practical stopping condition

Let the expected next improvement at step `k` be:

```text
EI_k = E[max(0, q_{k+1} - B_k) | history up to k]
```

Continue if:

```text
EI_k > marginal_cost_k
```

Stop if:

```text
EI_k <= marginal_cost_k
```

This is not the classical secretary proof.

It is the agent-side decision rule: keep iterating only while the expected improvement is worth the additional time, compute, and review burden.

## 4. What can be claimed

Napierce may claim:

- it makes iteration budgets explicit,
- it converts time limits into trial counts,
- it gives a simple default exploration/refinement split,
- it helps prevent endless agent iteration,
- it supports reproducible comparison between agent workflows.

Napierce should not claim:

- universal optimality,
- that every agent workflow satisfies the secretary problem,
- that `N / e` is always the best split,
- that human review can be removed,
- that quality can be measured without task-specific assumptions.

## 5. References

- Thomas S. Ferguson, "Who Solved the Secretary Problem?", Statistical Science, 1989.
- P. R. Freeman, "The Secretary Problem and its Extensions: A Review", International Statistical Review, 1983.
- F. Thomas Bruss, "Sum the odds to one and stop", Annals of Probability, 2000.
