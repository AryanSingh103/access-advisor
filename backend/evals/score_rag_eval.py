from __future__ import annotations
"""Score the RAG vs no-RAG results into resume-grade numbers."""
import json
import pathlib

HERE = pathlib.Path(__file__).parent
R = json.loads((HERE / "results_rag_vs_norag.json").read_text())
CRIT = json.loads((HERE / "wcag21_criteria.json").read_text())


def arm_stats(arm: str):
    cits = [c for case in R for c in case[arm]["citations"]]
    n = len(cits)
    bad_num = [c for c in cits if not c["number_is_real_wcag21_sc"]]
    bad_name = [c for c in cits if c["number_is_real_wcag21_sc"] and not c["name_matches_spec"]]
    bad_lvl = [c for c in cits if c["number_is_real_wcag21_sc"] and not c["level_matches_spec"]]
    fully_ok = [c for c in cits if c["number_is_real_wcag21_sc"] and c["name_matches_spec"] and c["level_matches_spec"]]

    hits = 0
    for case in R:
        reported = {c["criterion"] for c in case[arm]["citations"]}
        if case["expected"] in reported:
            hits += 1

    tok_in = sum(case[arm]["usage"]["input_tokens"] for case in R)
    tok_out = sum(case[arm]["usage"]["output_tokens"] for case in R)
    lat = [case[arm]["elapsed_s"] for case in R]

    return dict(
        arm=arm,
        cases=len(R),
        total_citations=n,
        citations_per_case=round(n / len(R), 2),
        # --- hallucination ---
        invalid_sc_number=len(bad_num),
        invalid_sc_number_pct=round(100 * len(bad_num) / n, 2) if n else None,
        wrong_name_for_valid_number=len(bad_name),
        wrong_name_pct=round(100 * len(bad_name) / n, 2) if n else None,
        wrong_level_for_valid_number=len(bad_lvl),
        wrong_level_pct=round(100 * len(bad_lvl) / n, 2) if n else None,
        fully_correct_citations=len(fully_ok),
        fully_correct_pct=round(100 * len(fully_ok) / n, 2) if n else None,
        # --- recall on the seeded violation ---
        cases_where_expected_sc_reported=hits,
        expected_sc_recall_pct=round(100 * hits / len(R), 2),
        # --- cost / latency ---
        input_tokens_total=tok_in,
        output_tokens_total=tok_out,
        input_tokens_per_case=round(tok_in / len(R), 1),
        output_tokens_per_case=round(tok_out / len(R), 1),
        mean_latency_s=round(sum(lat) / len(lat), 2),
        bad_number_examples=[(c["criterion"], c["criterion_name"]) for c in bad_num][:12],
        bad_name_examples=[(c["criterion"], c["criterion_name"], CRIT[c["criterion"]]["name"]) for c in bad_name][:12],
        bad_level_examples=[(c["criterion"], c["level"], CRIT[c["criterion"]]["level"]) for c in bad_lvl][:12],
    )


rag, norag = arm_stats("rag"), arm_stats("norag")

# grounding: is the cited SC number literally present in the retrieved chunks?
rag_cits = [c for case in R for c in case["rag"]["citations"]]
in_ctx = sum(1 for c in rag_cits if c["number_present_in_retrieved_context"])
grounding = dict(
    rag_citations=len(rag_cits),
    cited_number_appears_in_retrieved_chunks=in_ctx,
    pct=round(100 * in_ctx / len(rag_cits), 2),
)

out = dict(rag=rag, norag=norag, grounding_check=grounding)
(HERE / "results_scored.json").write_text(json.dumps(out, indent=2))

def show(d):
    for k in ("cases","total_citations","citations_per_case","invalid_sc_number","invalid_sc_number_pct",
              "wrong_name_for_valid_number","wrong_name_pct","wrong_level_for_valid_number","wrong_level_pct",
              "fully_correct_citations","fully_correct_pct","cases_where_expected_sc_reported",
              "expected_sc_recall_pct","input_tokens_per_case","output_tokens_per_case","mean_latency_s"):
        print(f"  {k:38s} {d[k]}")

print("=== RAG arm ===")
show(rag)
print("=== NO-RAG arm ===")
show(norag)
print("=== grounding ===")
print(" ", grounding)
print("\nRAG bad numbers:", rag["bad_number_examples"])
print("NORAG bad numbers:", norag["bad_number_examples"])
print("\nRAG bad names:", rag["bad_name_examples"])
print("NORAG bad names:", norag["bad_name_examples"])
print("\nRAG bad levels:", rag["bad_level_examples"])
print("NORAG bad levels:", norag["bad_level_examples"])
