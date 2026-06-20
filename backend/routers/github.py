import logging
import re
from typing import Optional

from fastapi import APIRouter, HTTPException
from github import Github
from pydantic import BaseModel

from rag.query import analyze_content

logger = logging.getLogger(__name__)
router = APIRouter()


class AnalyzePRRequest(BaseModel):
    repo: str
    pr_number: int
    github_token: str


class Violation(BaseModel):
    file_path: str
    line_number: Optional[int]
    criterion: str
    level: str
    description: str
    fix: str


class AnalyzePRResponse(BaseModel):
    violations: list[Violation]


class PostCommentsRequest(BaseModel):
    repo: str
    pr_number: int
    github_token: str
    violations: list[Violation]


class PostCommentsResponse(BaseModel):
    comments_posted: int


def _parse_violations(raw_text: str, file_path: str) -> list[Violation]:
    violations: list[Violation] = []
    pattern = re.compile(
        r"\[SC\s*([\d.]+)\s*[-–]\s*([^(]+?)\s*\(Level\s*(A{1,3})\)\]:\s*(.*?)(?=Fix:|$)",
        re.DOTALL | re.IGNORECASE,
    )
    fix_pattern = re.compile(r"Fix:\s*(.*?)(?=\[SC|\Z)", re.DOTALL | re.IGNORECASE)

    matches = list(pattern.finditer(raw_text))
    for i, match in enumerate(matches):
        criterion = match.group(1).strip()
        level = match.group(3).strip()
        description = match.group(4).strip()

        fix_text = ""
        remaining = raw_text[match.end():]
        fix_match = fix_pattern.match(remaining)
        if fix_match:
            fix_text = fix_match.group(1).strip()

        violations.append(
            Violation(
                file_path=file_path,
                line_number=None,
                criterion=criterion,
                level=level,
                description=description,
                fix=fix_text,
            )
        )
    return violations


@router.post("/analyze-pr", response_model=AnalyzePRResponse)
async def analyze_pr(request: AnalyzePRRequest) -> AnalyzePRResponse:
    try:
        gh = Github(request.github_token)
        repo = gh.get_repo(request.repo)
        pr = repo.get_pull(request.pr_number)
    except Exception as exc:
        logger.error("GitHub API error: %s", exc)
        raise HTTPException(status_code=400, detail=f"GitHub API error: {exc}")

    all_violations: list[Violation] = []

    for file in pr.get_files():
        if not file.patch:
            continue

        full_response = ""
        async for token in analyze_content(file.patch, "code"):
            full_response += token

        violations = _parse_violations(full_response, file.filename)
        all_violations.extend(violations)
        logger.info("File %s → %d violations", file.filename, len(violations))

    return AnalyzePRResponse(violations=all_violations)


@router.post("/post-comments", response_model=PostCommentsResponse)
async def post_comments(request: PostCommentsRequest) -> PostCommentsResponse:
    try:
        gh = Github(request.github_token)
        repo = gh.get_repo(request.repo)
        pr = repo.get_pull(request.pr_number)
        commit = pr.get_commits().reversed[0]
    except Exception as exc:
        logger.error("GitHub API error: %s", exc)
        raise HTTPException(status_code=400, detail=f"GitHub API error: {exc}")

    posted = 0
    for v in request.violations:
        if v.line_number is None:
            continue
        body = (
            f"**[SC {v.criterion} — Level {v.level}]** {v.description}\n\n"
            f"**Fix:** {v.fix}"
        )
        try:
            pr.create_review_comment(body=body, commit=commit, path=v.file_path, line=v.line_number)
            posted += 1
        except Exception as exc:
            logger.warning("Could not post comment on %s:%s — %s", v.file_path, v.line_number, exc)

    return PostCommentsResponse(comments_posted=posted)
