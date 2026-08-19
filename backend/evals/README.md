# AccessAdvisor evaluation suite

Measured, reproducible numbers for the RAG pipeline. Every script writes a
`results_*.json` next to itself so results can be re-checked without re-running.

All commands assume the working Python env:

```
PY=/Users/aryan/micromamba/bin/python3
cd backend/evals
```

## Ground truth

- `wcag21_criteria.json` — all 78 WCAG 2.1 success criteria (number, name,
  conformance level) parsed directly out of `backend/data/wcag21.html`.
  Counts: 30 Level A, 20 Level AA, 28 Level AAA.
- `cases.py` — 30 hand-authored snippets, each seeded with one clear violation
  covering 25 distinct success criteria.

## Scripts

| Script | What it measures | Output |
|---|---|---|
| `run_rag_vs_norag.py` | Same model/prompt/tool with vs without retrieved WCAG context | `results_rag_vs_norag.json` |
| `score_rag_eval.py` | Scores the above: invalid criteria, wrong names/levels, recall | `results_scored.json` |
| `run_retrieval_recall.py` | Does the top-k the LLM sees actually contain the right criterion? | `results_retrieval_recall.json` |
| `run_retrieval_perf.py` | Per-query retrieval timing; whether the 15→6 sort reorders anything | `results_retrieval_perf.json` |
| `run_latency_breakdown.py` | Clean per-stage latency (embed / Chroma search / sort), 5 repeats | `results_latency.json` |
| `run_e2e_latency.py` | Serial end-to-end latency of `analyze_content_structured` | `results_e2e_latency.json` |
| `run_filter_eval.py` | How many files the extension + UI-content filters remove | `results_filter.json` |
| `run_cost_eval.py` | Exact input tokens: one call per file vs one call per chunk | `results_cost.json` |
| `run_pr_cost_eval.py` | Same comparison on a real GitHub PR | `results_pr_cost_<pr>.json` |

`run_rag_vs_norag.py` makes 60 Claude calls. The other scripts make embedding
calls and token-count calls only (`run_e2e_latency.py` makes 10 Claude calls).

## Reproducing

```
$PY run_rag_vs_norag.py && $PY score_rag_eval.py
$PY run_retrieval_recall.py
$PY run_retrieval_perf.py
$PY run_latency_breakdown.py
$PY run_e2e_latency.py
$PY run_filter_eval.py <repo-dir> [<repo-dir> ...]
$PY run_cost_eval.py <file> [<file> ...]
$PY run_pr_cost_eval.py <owner/repo> <pr-number>
```

Test coverage needs `pip install pytest-cov`, then from `backend/`:

```
$PY -m pytest --cov=config --cov=main --cov=rag --cov=routers --cov-report=term -q
```
