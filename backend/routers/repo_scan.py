import json
import logging

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from github import Github, GithubException
from pydantic import BaseModel

from rag.query import analyze_content, has_ui_content

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_EXTENSIONS = {".html", ".jsx", ".tsx", ".vue", ".svelte"}
MAX_FILE_SIZE = 100 * 1024  # 100 KB
MAX_FILES = 50


class RepoScanRequest(BaseModel):
    repo: str
    github_token: str


def _is_scannable(filename: str) -> bool:
    return any(filename.endswith(ext) for ext in ALLOWED_EXTENSIONS)


@router.post("/repo-scan")
async def repo_scan(request: RepoScanRequest) -> StreamingResponse:
    async def generate():
        try:
            gh = Github(request.github_token)
            repo = gh.get_repo(request.repo)
        except GithubException as exc:
            yield json.dumps({"type": "error", "message": f"GitHub error: {exc}"}) + "\n"
            return
        except Exception as exc:
            yield json.dumps({"type": "error", "message": str(exc)}) + "\n"
            return

        try:
            contents = repo.get_git_tree(sha="HEAD", recursive=True)
            all_files = [
                f for f in contents.tree
                if f.type == "blob" and _is_scannable(f.path) and (f.size or 0) <= MAX_FILE_SIZE
            ]
        except Exception as exc:
            yield json.dumps({"type": "error", "message": f"Failed to list repo files: {exc}"}) + "\n"
            return

        files_to_scan = all_files[:MAX_FILES]
        total = len(files_to_scan)

        if total == 0:
            yield json.dumps({"type": "done", "total_files": 0, "total_violations": 0}) + "\n"
            return

        total_violations = 0

        for index, file_info in enumerate(files_to_scan):
            path = file_info.path
            yield json.dumps({"type": "file_start", "file": path, "index": index, "total": total}) + "\n"

            try:
                file_content = repo.get_contents(path)
                if isinstance(file_content, list):
                    continue
                code = file_content.decoded_content.decode("utf-8", errors="replace")

                if not has_ui_content(code):
                    logger.info("Skipping %s — no UI markup detected", path)
                    yield json.dumps({
                        "type": "file_result",
                        "file": path,
                        "index": index,
                        "violations": [],
                        "skipped": True,
                        "reason": "no UI markup",
                    }) + "\n"
                    continue

                full_response = ""
                async for token in analyze_content(code, "code"):
                    full_response += token

                violations = _parse_violations(full_response, path)
                total_violations += len(violations)

                yield json.dumps({
                    "type": "file_result",
                    "file": path,
                    "index": index,
                    "violations": violations,
                }) + "\n"

            except Exception as exc:
                logger.warning("Skipping %s: %s", path, exc)
                yield json.dumps({
                    "type": "file_result",
                    "file": path,
                    "index": index,
                    "violations": [],
                    "skipped": True,
                    "reason": str(exc),
                }) + "\n"

        yield json.dumps({"type": "done", "total_files": total, "total_violations": total_violations}) + "\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


import re

_VIOLATION_RE = re.compile(
    r"\[SC\s*([\d.]+)\s*[-–]\s*([^(]+?)\s*\(Level\s*(A{1,3})\)\]:\s*(.*?)(?=Fix:|$)",
    re.DOTALL | re.IGNORECASE,
)
_FIX_RE = re.compile(r"Fix:\s*(.*?)(?=\[SC|\Z)", re.DOTALL | re.IGNORECASE)


def _parse_violations(text: str, file_path: str) -> list[dict]:
    results = []
    for match in _VIOLATION_RE.finditer(text):
        remaining = text[match.end():]
        fix_match = _FIX_RE.match(remaining)
        results.append({
            "file_path": file_path,
            "criterion": match.group(1).strip(),
            "criterion_name": match.group(2).strip(),
            "level": match.group(3).strip(),
            "description": match.group(4).strip(),
            "fix": fix_match.group(1).strip() if fix_match else "",
        })
    return results
