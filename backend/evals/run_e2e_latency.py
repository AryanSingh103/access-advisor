from __future__ import annotations

"""Serial (no concurrency contention) end-to-end latency of the real pipeline
function the API routes call: rag.query.analyze_content_structured.
Splits retrieval from generation.
"""
import asyncio
import json
import os
import pathlib
import statistics
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import settings

os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
from cases import CASES

from rag import query as Q

HERE = pathlib.Path(__file__).parent
SAMPLE = CASES[:10]
rows = []
for c in SAMPLE:
    t0 = time.perf_counter()
    msg = Q._build_user_message(c["code"], "code")
    t1 = time.perf_counter()
    v = asyncio.get_event_loop().run_until_complete(Q.analyze_content_structured(c["code"], "code"))
    t2 = time.perf_counter()
    # _build_user_message ran twice (once here, once inside); subtract one retrieval
    rows.append({"id": c["id"], "retrieval_s": round(t1 - t0, 3),
                     "total_s": round(t2 - t0, 3),
                     "generation_s": round((t2 - t1) - (t1 - t0), 3),
                     "violations": len(v)})
    print(rows[-1])

def s(k):
    v = sorted(r[k] for r in rows)
    return {"mean": round(statistics.mean(v), 3), "median": round(statistics.median(v), 3),
                "p95": round(v[int(0.95 * len(v)) - 1], 3), "min": v[0], "max": v[-1]}

out = {"n": len(rows), "retrieval_s": s("retrieval_s"), "generation_s": s("generation_s"),
       "end_to_end_s": {k: round(v, 3) for k, v in
                        {"mean": statistics.mean(r["retrieval_s"] + r["generation_s"] for r in rows),
                             "median": statistics.median(r["retrieval_s"] + r["generation_s"] for r in rows)}.items()},
       "per_case": rows}
print(json.dumps({k: v for k, v in out.items() if k != "per_case"}, indent=2))
(HERE / "results_e2e_latency.json").write_text(json.dumps(out, indent=2))
