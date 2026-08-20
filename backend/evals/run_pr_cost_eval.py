from __future__ import annotations

"""Per-PR cost on a REAL GitHub PR, measured the way routers/github.py works.

github.py loops PR files, skips files whose patch fails has_ui_content, and
makes exactly one Claude call per surviving patch. This measures:
  - how many of the PR's files the UI filter removes
  - exact input tokens for the batched (per-file) design
  - exact input tokens for a naive per-chunk design over the same patches
"""
import json
import os
import pathlib
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import httpx
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.schema import Document

from config import settings

os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
from rag.ingest import get_or_create_index
from rag.parse import VIOLATION_TOOL
from rag.query import STRUCTURED_SYSTEM_PROMPT, has_ui_content

HERE = pathlib.Path(__file__).parent
MODEL, IN_PER_MTOK, OUT_PER_MTOK, MEAN_OUT = "claude-sonnet-4-5", 3.00, 15.00, 201.2
index = get_or_create_index()
retriever = index.as_retriever(similarity_top_k=15)
splitter = SentenceSplitter(chunk_size=512, chunk_overlap=50)


def ctx(c):
    n = retriever.retrieve(c)
    n.sort(key=lambda x: x.score or 0, reverse=True)
    return "\n\n---\n\n".join(f"[WCAG Context {i+1}]\n{x.node.get_content()}" for i, x in enumerate(n[:6]))


def build(c): return f"WCAG 2.1 Context:\n\n{ctx(c)}\n\n---\n\nUnified diff (PR patch) to analyze:\n\n{c}"


def count(msg):
    r = httpx.post("https://api.anthropic.com/v1/messages/count_tokens",
        headers={"x-api-key": settings.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01",
                 "content-type": "application/json"},
        json={"model": MODEL, "system": STRUCTURED_SYSTEM_PROMPT, "tools": [VIOLATION_TOOL],
              "messages": [{"role": "user", "content": msg}]}, timeout=60)
    r.raise_for_status()
    return r.json()["input_tokens"]


repo, pr = sys.argv[1], sys.argv[2]
files = json.loads(subprocess.run(
    ["gh", "api", f"repos/{repo}/pulls/{pr}/files", "--paginate"],
    capture_output=True, text=True, check=True,
).stdout.replace("][", ","))

with_patch = [f for f in files if f.get("patch")]
kept = [f for f in with_patch if has_ui_content(f["patch"])]
print(f"PR {repo}#{pr}: {len(files)} files, {len(with_patch)} with a patch, "
      f"{len(kept)} survive has_ui_content ({100*(1-len(kept)/max(len(with_patch),1)):.1f}% filtered)")

batched_tok, chunk_tok, chunk_calls = 0, 0, 0
for f in kept:
    batched_tok += count(build(f["patch"]))
    cs = [n.get_content() for n in splitter.get_nodes_from_documents([Document(text=f["patch"])])]
    chunk_calls += len(cs)
    for c in cs:
        chunk_tok += count(build(c))

# Naive "no filter, per chunk" baseline: every patched file, chunked.
nofilter_calls, nofilter_tok = 0, 0
for f in with_patch:
    cs = [n.get_content() for n in splitter.get_nodes_from_documents([Document(text=f["patch"])])]
    nofilter_calls += len(cs)
    for c in cs:
        nofilter_tok += count(build(c))


def cost(tok, calls): return tok / 1e6 * IN_PER_MTOK + calls * MEAN_OUT / 1e6 * OUT_PER_MTOK


out = {
    "repo": repo, "pr": int(pr), "files_in_pr": len(files), "files_with_patch": len(with_patch),
    "files_after_ui_filter": len(kept),
    "pct_files_filtered_out": round(100 * (1 - len(kept) / len(with_patch)), 2),
    "current_design": {"calls": len(kept), "input_tokens": batched_tok, "cost_usd": round(cost(batched_tok, len(kept)), 6)},
    "per_chunk_same_files": {"calls": chunk_calls, "input_tokens": chunk_tok, "cost_usd": round(cost(chunk_tok, chunk_calls), 6)},
    "per_chunk_no_filter": {"calls": nofilter_calls, "input_tokens": nofilter_tok, "cost_usd": round(cost(nofilter_tok, nofilter_calls), 6)},
}
out["saving_vs_per_chunk_same_files_pct"] = round(100 * (1 - out["current_design"]["cost_usd"] / out["per_chunk_same_files"]["cost_usd"]), 2)
out["saving_vs_per_chunk_no_filter_pct"] = round(100 * (1 - out["current_design"]["cost_usd"] / out["per_chunk_no_filter"]["cost_usd"]), 2)
print(json.dumps(out, indent=2))
(HERE / f"results_pr_cost_{pr}.json").write_text(json.dumps(out, indent=2))
