from __future__ import annotations
"""Clean per-stage latency: embed the query, then query ChromaDB directly with
that vector. Avoids the noise of subtracting two separate wall-clock calls.
30 queries x 5 repeats.
"""
import json
import os
import pathlib
import statistics
import sys
import time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import settings
os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
import chromadb
from llama_index.embeddings.openai import OpenAIEmbedding
from rag.ingest import CHROMA_PATH, COLLECTION_NAME
from cases import CASES

HERE = pathlib.Path(__file__).parent
embed = OpenAIEmbedding(model="text-embedding-3-small")
coll = chromadb.PersistentClient(path=CHROMA_PATH).get_collection(COLLECTION_NAME)
print("collection count:", coll.count())

embed_ms, search15_ms, search6_ms, rerank_us = [], [], [], []
REPEATS = 5
for case in CASES:
    q = case["code"]
    t = time.perf_counter()
    vec = embed.get_query_embedding(q)
    embed_ms.append((time.perf_counter() - t) * 1000)
    for _ in range(REPEATS):
        t = time.perf_counter()
        res15 = coll.query(query_embeddings=[vec], n_results=15)
        search15_ms.append((time.perf_counter() - t) * 1000)
        t = time.perf_counter()
        coll.query(query_embeddings=[vec], n_results=6)
        search6_ms.append((time.perf_counter() - t) * 1000)
    pairs = list(zip(res15["ids"][0], res15["distances"][0]))
    t = time.perf_counter()
    top6 = sorted(pairs, key=lambda p: p[1])[:6]
    rerank_us.append((time.perf_counter()-t)*1e6)

def s(name, vals, unit):
    v = sorted(vals)
    print(f"{name:14s} n={len(v):4d}  mean={statistics.mean(v):8.3f}{unit}  median={statistics.median(v):8.3f}{unit}  "
          f"p95={v[int(0.95*len(v))-1]:8.3f}{unit}  min={v[0]:7.3f}  max={v[-1]:8.3f}")
    return dict(n=len(v), mean=statistics.mean(v), median=statistics.median(v),
                p95=v[int(0.95*len(v))-1], min=v[0], max=v[-1], unit=unit.strip())

out = {
  "embed_query": s("embed_query", embed_ms, "ms"),
  "chroma_top15": s("chroma_top15", search15_ms, "ms"),
  "chroma_top6":  s("chroma_top6",  search6_ms, "ms"),
  "rerank_sort":  s("rerank_sort",  rerank_us, "us"),
  "vectors_in_collection": coll.count(),
  "repeats_per_query": REPEATS,
}
(HERE / "results_latency.json").write_text(json.dumps(out, indent=2, default=float))
