from __future__ import annotations
"""Latency + rerank-effect measurement for the retrieval pipeline.

Measures, per query:
  - embed_s        : OpenAI text-embedding-3-small call for the query
  - search_s       : ChromaDB similarity search (top 15)
  - rerank_s       : the sort-and-slice step (top 15 -> top 6) in rag/query.py
  - retrieve_s     : embed + search combined (what LlamaIndex .retrieve() costs)
Also records whether "top 15 sorted by score, sliced to 6" differs from
"retrieve top 6 directly" -- i.e. whether the rerank step changes anything.
"""
import json
import os
import pathlib
import statistics
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import settings
from rag.ingest import get_or_create_index
from cases import CASES

os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
HERE = pathlib.Path(__file__).parent

index = get_or_create_index()
embed_model = index._embed_model
r15 = index.as_retriever(similarity_top_k=15)
r6 = index.as_retriever(similarity_top_k=6)

rows = []
for case in CASES:
    q = case["code"]

    t = time.perf_counter()
    embed_model.get_query_embedding(q)
    embed_s = time.perf_counter() - t

    t = time.perf_counter()
    nodes15 = r15.retrieve(q)
    retrieve15_s = time.perf_counter() - t

    t = time.perf_counter()
    ranked = sorted(nodes15, key=lambda n: n.score if n.score is not None else 0, reverse=True)
    top6_from15 = ranked[:6]
    rerank_s = time.perf_counter() - t

    t = time.perf_counter()
    nodes6 = r6.retrieve(q)
    retrieve6_s = time.perf_counter() - t

    ids_from15 = [n.node.node_id for n in top6_from15]
    ids_direct = [n.node.node_id for n in nodes6]
    order_from15 = [n.node.node_id for n in nodes15[:6]]

    rows.append({
        "id": case["id"],
        "embed_s": round(embed_s, 4),
        "retrieve15_s": round(retrieve15_s, 4),
        "search_only_s": round(max(retrieve15_s - embed_s, 0), 4),
        "rerank_s": round(rerank_s, 8),
        "retrieve6_s": round(retrieve6_s, 4),
        "rerank_changed_set": sorted(ids_from15) != sorted(ids_direct),
        "rerank_changed_order_vs_chroma": ids_from15 != order_from15,
        "top6_set_equals_direct_top6": sorted(ids_from15) == sorted(ids_direct),
        "top15_scores": [round(n.score, 4) for n in nodes15],
    })
    print(f"{case['id']:28s} embed={embed_s*1000:6.1f}ms  retrieve15={retrieve15_s*1000:6.1f}ms  "
          f"rerank={rerank_s*1e6:6.1f}us  set_changed={rows[-1]['rerank_changed_set']}")

(HERE / "results_retrieval_perf.json").write_text(json.dumps(rows, indent=2))


def summ(key):
    vals = [r[key] for r in rows]
    return dict(mean=round(statistics.mean(vals), 5),
                median=round(statistics.median(vals), 5),
                p95=round(sorted(vals)[int(0.95 * len(vals)) - 1], 5),
                min=round(min(vals), 5), max=round(max(vals), 5))


print("\n--- summary over", len(rows), "queries ---")
for k in ("embed_s", "search_only_s", "retrieve15_s", "rerank_s", "retrieve6_s"):
    print(f"{k:16s}", summ(k))
print("rerank changed the SET of 6 chunks in",
      sum(r["rerank_changed_set"] for r in rows), "/", len(rows), "queries")
print("rerank changed the ORDER vs Chroma's own order in",
      sum(r["rerank_changed_order_vs_chroma"] for r in rows), "/", len(rows), "queries")
