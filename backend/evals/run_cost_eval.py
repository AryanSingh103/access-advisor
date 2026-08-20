from __future__ import annotations

"""Cost comparison: one Claude call per file (current design) vs one call per
chunk (naive baseline).

Input token counts are EXACT — taken from the Anthropic /v1/messages/count_tokens
endpoint (the pinned SDK 0.29.0 has no count_tokens helper, so this calls the
REST endpoint directly with httpx). Output tokens are not counted here; they are
identical per-call in expectation, so the per-chunk arm multiplies them by N.

Pricing (claude-sonnet-4-5, verified at platform.claude.com/docs/en/about-claude/pricing
on 2026-08-19): $3.00 / MTok input, $15.00 / MTok output.
"""
import json
import os
import pathlib
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import httpx
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.schema import Document

from config import settings

os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
from rag.ingest import get_or_create_index
from rag.parse import VIOLATION_TOOL
from rag.query import STRUCTURED_SYSTEM_PROMPT

HERE = pathlib.Path(__file__).parent
MODEL = "claude-sonnet-4-5"
IN_PER_MTOK, OUT_PER_MTOK = 3.00, 15.00
MEAN_OUTPUT_TOKENS = 201.2  # measured mean over 30 RAG-arm calls (results_scored.json)

index = get_or_create_index()
retriever = index.as_retriever(similarity_top_k=15)
splitter = SentenceSplitter(chunk_size=512, chunk_overlap=50)


def wcag_context(content: str) -> str:
    nodes = retriever.retrieve(content)
    nodes.sort(key=lambda n: n.score or 0, reverse=True)
    return "\n\n---\n\n".join(
        f"[WCAG Context {i+1}]\n{n.node.get_content()}" for i, n in enumerate(nodes[:6]))


def count_input_tokens(user_message: str) -> int:
    r = httpx.post(
        "https://api.anthropic.com/v1/messages/count_tokens",
        headers={"x-api-key": settings.ANTHROPIC_API_KEY,
                 "anthropic-version": "2023-06-01",
                 "content-type": "application/json"},
        json={"model": MODEL, "system": STRUCTURED_SYSTEM_PROMPT,
              "tools": [VIOLATION_TOOL],
              "messages": [{"role": "user", "content": user_message}]},
        timeout=60,
    )
    r.raise_for_status()
    return r.json()["input_tokens"]


def build(content: str) -> str:
    return (f"WCAG 2.1 Context:\n\n{wcag_context(content)}\n\n---\n\n"
            f"Source code to analyze:\n\n{content}")


def analyze(label: str, text: str) -> dict:
    # Arm A: current design — one call for the whole file.
    a_tokens = count_input_tokens(build(text))

    # Arm B: naive per-chunk — split, retrieve per chunk, one call per chunk.
    chunks = [n.get_content() for n in splitter.get_nodes_from_documents([Document(text=text)])]
    b_tokens = [count_input_tokens(build(c)) for c in chunks]

    a_in_cost = a_tokens / 1e6 * IN_PER_MTOK
    b_in_cost = sum(b_tokens) / 1e6 * IN_PER_MTOK
    a_out_cost = MEAN_OUTPUT_TOKENS / 1e6 * OUT_PER_MTOK
    b_out_cost = len(chunks) * MEAN_OUTPUT_TOKENS / 1e6 * OUT_PER_MTOK

    row = {
        "target": label, "source_chars": len(text), "source_lines": text.count("\n") + 1,
        "batched_calls": 1, "batched_input_tokens": a_tokens,
        "per_chunk_calls": len(chunks), "per_chunk_input_tokens": sum(b_tokens),
        "per_chunk_input_tokens_each": b_tokens,
        "input_token_ratio": round(sum(b_tokens) / a_tokens, 2),
        "batched_cost_usd": round(a_in_cost + a_out_cost, 6),
        "per_chunk_cost_usd": round(b_in_cost + b_out_cost, 6),
        "cost_ratio": round((b_in_cost + b_out_cost) / (a_in_cost + a_out_cost), 2),
        "pct_cost_saved_by_batching": round(100 * (1 - (a_in_cost + a_out_cost) / (b_in_cost + b_out_cost)), 2),
    }
    print(json.dumps({k: v for k, v in row.items() if k != "per_chunk_input_tokens_each"}, indent=2))
    return row


targets = []
for path in sys.argv[1:]:
    p = pathlib.Path(path)
    targets.append((str(p), p.read_text(encoding="utf-8", errors="replace")))

rows = [analyze(label, text) for label, text in targets]
(HERE / "results_cost.json").write_text(json.dumps(
    {"pricing": {"model": MODEL, "input_per_mtok": IN_PER_MTOK, "output_per_mtok": OUT_PER_MTOK,
                 "mean_output_tokens_per_call_measured": MEAN_OUTPUT_TOKENS},
     "per_target": rows}, indent=2))
