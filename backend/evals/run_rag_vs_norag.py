from __future__ import annotations

"""RAG vs no-RAG eval: does retrieval reduce hallucinated WCAG citations?

Both arms use the SAME model, system prompt and tool schema. The ONLY
difference is whether the retrieved WCAG 2.1 spec chunks are prepended to
the user message. Results are written to results_rag_vs_norag.json.
"""
import json
import os
import pathlib
import sys
import time
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import anthropic
from cases import CASES

from config import settings
from rag.parse import VIOLATION_TOOL, violations_from_tool_response
from rag.query import STRUCTURED_SYSTEM_PROMPT, _get_index

HERE = pathlib.Path(__file__).parent
CRITERIA = json.loads((HERE / "wcag21_criteria.json").read_text())
MODEL = "claude-sonnet-4-5"
client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def retrieve(content: str, top_k: int = 15, keep: int = 6):
    """Mirrors rag.query._build_user_message retrieval exactly."""
    os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
    retriever = _get_index().as_retriever(similarity_top_k=top_k)
    nodes = retriever.retrieve(content)
    nodes.sort(key=lambda n: n.score if n.score is not None else 0, reverse=True)
    return nodes[:keep]


def build_message(content: str, nodes) -> str:
    if nodes is None:
        return f"Source code to analyze:\n\n{content}"
    ctx = "\n\n---\n\n".join(
        f"[WCAG Context {i+1}]\n{n.node.get_content()}" for i, n in enumerate(nodes)
    )
    return f"WCAG 2.1 Context:\n\n{ctx}\n\n---\n\nSource code to analyze:\n\n{content}"


def call_claude(user_message: str):
    msg = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=STRUCTURED_SYSTEM_PROMPT,
        tools=[VIOLATION_TOOL],
        tool_choice={"type": "tool", "name": "report_violations"},
        messages=[{"role": "user", "content": user_message}],
    )
    return violations_from_tool_response(msg), {
        "input_tokens": msg.usage.input_tokens,
        "output_tokens": msg.usage.output_tokens,
    }


def score_citation(v: dict, context_text: str | None) -> dict:
    num = v["criterion"].strip()
    real = CRITERIA.get(num)
    name_ok = bool(real) and _norm(v["criterion_name"]) == _norm(real["name"])
    level_ok = bool(real) and v["level"] == real["level"]
    in_ctx = None if context_text is None else (num in context_text)
    return {
        "criterion": num,
        "criterion_name": v["criterion_name"],
        "level": v["level"],
        "number_is_real_wcag21_sc": bool(real),
        "name_matches_spec": name_ok,
        "level_matches_spec": level_ok,
        "number_present_in_retrieved_context": in_ctx,
    }


def _norm(s: str) -> str:
    return "".join(ch for ch in s.lower() if ch.isalnum())


def run_case(case: dict) -> dict:
    out = {"id": case["id"], "expected": case["expected"],
           "also_acceptable": case["also_acceptable"], "code": case["code"]}

    nodes = retrieve(case["code"])
    ctx_text = "\n\n".join(n.node.get_content() for n in nodes)

    for arm, msg, ctx in (
        ("rag", build_message(case["code"], nodes), ctx_text),
        ("norag", build_message(case["code"], None), None),
    ):
        t0 = time.perf_counter()
        violations, usage = call_claude(msg)
        out[arm] = {
            "elapsed_s": round(time.perf_counter() - t0, 3),
            "usage": usage,
            "n_violations": len(violations),
            "citations": [score_citation(v, ctx) for v in violations],
        }
    out["retrieved_chunk_chars"] = len(ctx_text)
    return out


if __name__ == "__main__":
    t0 = time.perf_counter()
    with ThreadPoolExecutor(max_workers=6) as ex:
        results = list(ex.map(run_case, CASES))
    (HERE / "results_rag_vs_norag.json").write_text(json.dumps(results, indent=2))
    print(f"{len(results)} cases x 2 arms in {time.perf_counter()-t0:.1f}s")
