from __future__ import annotations
"""Retrieval recall: does the top-k the LLM actually sees contain the spec text
for the criterion the snippet violates?

A chunk "covers" criterion X if it contains X's number ("1.1.1") or X's exact
name ("Non-text Content"). Measured at k=6 (what the LLM gets) and k=15
(what Chroma returns before the slice).
"""
import json
import os
import pathlib
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import settings
os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
from rag.ingest import get_or_create_index
from cases import CASES

HERE = pathlib.Path(__file__).parent
CRIT = json.loads((HERE / "wcag21_criteria.json").read_text())
index = get_or_create_index()
retr = index.as_retriever(similarity_top_k=15)


def covers(text: str, sc: str) -> bool:
    return sc in text or CRIT[sc]["name"].lower() in text.lower()


rows, hit6, hit15 = [], 0, 0
for case in CASES:
    nodes = retr.retrieve(case["code"])
    nodes.sort(key=lambda n: n.score or 0, reverse=True)
    txt6 = "\n".join(n.node.get_content() for n in nodes[:6])
    txt15 = "\n".join(n.node.get_content() for n in nodes)
    c6, c15 = covers(txt6, case["expected"]), covers(txt15, case["expected"])
    hit6 += c6
    hit15 += c15
    rows.append(dict(id=case["id"], expected=case["expected"], covered_at_k6=c6, covered_at_k15=c15,
                     top_score=round(nodes[0].score, 4), sixth_score=round(nodes[5].score, 4)))
    print(f"{case['id']:28s} exp={case['expected']:7s} k6={'HIT ' if c6 else 'miss'} k15={'HIT ' if c15 else 'miss'}")

n = len(CASES)
summary = dict(cases=n,
               recall_at_k6=round(100 * hit6 / n, 2),
               recall_at_k15=round(100 * hit15 / n, 2),
               gain_from_k6_to_k15_pct_points=round(100 * (hit15 - hit6) / n, 2))
print("\n=== retrieval recall ===")
print(json.dumps(summary, indent=2))
(HERE / "results_retrieval_recall.json").write_text(json.dumps({"per_case": rows, "summary": summary}, indent=2))
