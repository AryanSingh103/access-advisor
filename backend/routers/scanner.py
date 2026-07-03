import json
import logging
import re
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from playwright.async_api import async_playwright
from pydantic import BaseModel

from rag.query import analyze_content_structured

logger = logging.getLogger(__name__)
router = APIRouter()

MAX_HTML_CHARS = 60_000

_STRIP_TAGS_RE = re.compile(
    r"<(script|style|svg|noscript)\b[^>]*>.*?</\1>",
    re.DOTALL | re.IGNORECASE,
)
_COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)
_WHITESPACE_RE = re.compile(r"\n\s*\n+")


class ScanRequest(BaseModel):
    url: str


def _validate_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")


def _prepare_html(html: str) -> str:
    """Strip non-semantic bulk and cap size before sending to the LLM."""
    html = _STRIP_TAGS_RE.sub("", html)
    html = _COMMENT_RE.sub("", html)
    html = _WHITESPACE_RE.sub("\n", html)
    if len(html) > MAX_HTML_CHARS:
        html = html[:MAX_HTML_CHARS] + "\n<!-- truncated for analysis -->"
    return html


@router.post("/scan-url")
async def scan_url(request: ScanRequest) -> StreamingResponse:
    _validate_url(request.url)

    async def generate():
        yield json.dumps({"type": "progress", "stage": "rendering"}) + "\n"
        try:
            async with async_playwright() as pw:
                browser = await pw.chromium.launch(headless=True)
                page = await browser.new_page()
                await page.goto(request.url, wait_until="networkidle", timeout=30000)
                html = await page.inner_html("body")
                await browser.close()
        except Exception as exc:
            logger.error("Playwright error: %s", exc)
            yield json.dumps({"type": "error", "error": f"Failed to render URL: {exc}"}) + "\n"
            return

        yield json.dumps({"type": "progress", "stage": "analyzing"}) + "\n"
        try:
            violations = await analyze_content_structured(_prepare_html(html), "dom")
        except Exception as exc:
            logger.error("Analysis error: %s", exc)
            yield json.dumps({"type": "error", "error": f"Analysis failed: {exc}"}) + "\n"
            return

        for v in violations:
            yield json.dumps({"type": "violation", **v}) + "\n"
        yield json.dumps({"type": "done", "total_violations": len(violations)}) + "\n"

    return StreamingResponse(generate(), media_type="application/x-ndjson")
