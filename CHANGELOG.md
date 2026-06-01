# Changelog

## v0.1.0

Initial CLI MVP for human-review-bounded candidate generation.

### Added

- `napierce plan` for calculating bounded candidate plans from generation and review budgets.
- `napierce review` for recording human review events as JSONL.
- `napierce summarize` for aggregating review timing, scores, actions, top candidates, and stopping reasons.
- Support for p95 latency estimates.
- Support for mean-plus-standard-deviation latency estimates.
- Support for oversampling from reviewable candidate count.
- `1/e`-inspired exploration/refinement split.
- JSON output for scripts and tool integration.
- Human-readable CLI output.
- JSONL utilities for candidate and review-event workflows.
- Summary statistics: mean, sample standard deviation, p50, p90, and p95.
- Node 20 / 22 CI.
- Tests for duration parsing, planning, summarization, and CLI smoke behavior.
- Documentation set:
  - README
  - User guide
  - Design
  - Research notes
  - Rationale

### Scope

This release is CLI-first and CLI-complete for the MVP workflow:

```text
plan -> review -> summarize
```

Napierce does not call LLM APIs, generate candidates, judge final quality automatically, or provide a browser UI.

### Known limitations

- Candidate records must embed text in `content`, `text`, or `body`.
- File-backed candidate loading through `content_path` is not included.
- Timing profiles are not persisted globally or by project yet.
- `review` records action timing and review evidence, but advanced workload questionnaires are not included.
- Stopping recommendations are simple rule-based summaries, not automatic final decisions.
