import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from github import Github
from pydantic import BaseModel

from rag.query import analyze_content_structured, has_ui_content

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
    criterion_name: str = ""
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


class FailedComment(BaseModel):
    file_path: str
    line_number: Optional[int]
    reason: str


class PostCommentsResponse(BaseModel):
    comments_posted: int
    failed: list[FailedComment]


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
        if not has_ui_content(file.patch):
            logger.info("Skipping %s — no UI markup detected", file.filename)
            continue

        raw_violations = await analyze_content_structured(file.patch, "diff")
        violations = [Violation(file_path=file.filename, **v) for v in raw_violations]
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
    failed: list[FailedComment] = []
    for v in request.violations:
        body = (
            f"**[SC {v.criterion} — {v.criterion_name} (Level {v.level})]** {v.description}\n\n"
            f"**Fix:** {v.fix}"
        )
        if v.line_number is None:
            failed.append(
                FailedComment(file_path=v.file_path, line_number=None, reason="no line number")
            )
            continue
        try:
            pr.create_review_comment(
                body=body,
                commit=commit,
                path=v.file_path,
                line=v.line_number,
                side="RIGHT",
            )
            posted += 1
        except Exception as exc:
            logger.warning("Could not post comment on %s:%s — %s", v.file_path, v.line_number, exc)
            failed.append(
                FailedComment(file_path=v.file_path, line_number=v.line_number, reason=str(exc))
            )

    return PostCommentsResponse(comments_posted=posted, failed=failed)
