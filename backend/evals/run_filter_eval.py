from __future__ import annotations
"""How much work does the two-stage file filter actually remove?

Stage 1 (repo_scan.py): extension allowlist {.html,.jsx,.tsx,.vue,.svelte}
                        plus size cap 100 KB.
Stage 2 (rag/query.py has_ui_content): regex for UI markup in file contents.

Only files surviving BOTH stages cost a Claude call.
"""
import json, os, pathlib, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from rag.query import has_ui_content
from routers.repo_scan import ALLOWED_EXTENSIONS, MAX_FILE_SIZE, _is_scannable

HERE = pathlib.Path(__file__).parent
REPOS = [pathlib.Path(p) for p in sys.argv[1:]]


def tracked_files(repo: pathlib.Path):
    out = subprocess.run(["git", "-C", str(repo), "ls-files"], capture_output=True, text=True).stdout
    return [l for l in out.splitlines() if l]


rows = []
for repo in REPOS:
    files = tracked_files(repo)
    ext_pass, ext_and_size_pass, ui_pass = [], [], []
    for f in files:
        if not _is_scannable(f):
            continue
        ext_pass.append(f)
        p = repo / f
        try:
            if p.stat().st_size > MAX_FILE_SIZE:
                continue
            text = p.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        ext_and_size_pass.append(f)
        if has_ui_content(text):
            ui_pass.append(f)

    total = len(files)
    row = dict(
        repo=repo.name,
        total_tracked_files=total,
        after_extension_filter=len(ext_pass),
        after_extension_and_size_filter=len(ext_and_size_pass),
        after_ui_content_filter=len(ui_pass),
        pct_removed_by_extension=round(100 * (1 - len(ext_pass) / total), 2) if total else 0,
        pct_removed_overall=round(100 * (1 - len(ui_pass) / total), 2) if total else 0,
        pct_of_ext_survivors_removed_by_ui_regex=(
            round(100 * (1 - len(ui_pass) / len(ext_and_size_pass)), 2) if ext_and_size_pass else None),
        llm_calls_without_any_filter=total,
        llm_calls_with_filters=len(ui_pass),
    )
    rows.append(row)
    print(json.dumps(row, indent=2))

agg_total = sum(r["total_tracked_files"] for r in rows)
agg_ext = sum(r["after_extension_filter"] for r in rows)
agg_extsize = sum(r["after_extension_and_size_filter"] for r in rows)
agg_ui = sum(r["after_ui_content_filter"] for r in rows)
summary = dict(
    repos=len(rows), allowed_extensions=sorted(ALLOWED_EXTENSIONS),
    max_file_size_bytes=MAX_FILE_SIZE,
    total_tracked_files=agg_total,
    after_extension_filter=agg_ext,
    after_extension_and_size_filter=agg_extsize,
    after_ui_content_filter=agg_ui,
    pct_removed_by_extension=round(100 * (1 - agg_ext / agg_total), 2),
    pct_removed_overall=round(100 * (1 - agg_ui / agg_total), 2),
    pct_of_ext_survivors_removed_by_ui_regex=round(100 * (1 - agg_ui / agg_extsize), 2),
)
print("\n=== AGGREGATE ===")
print(json.dumps(summary, indent=2))
(HERE / "results_filter.json").write_text(json.dumps({"per_repo": rows, "aggregate": summary}, indent=2))
