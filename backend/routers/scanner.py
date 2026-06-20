import json
import logging
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from playwright.async_api import async_playwright
from pydantic import BaseModel

from rag.query import analyze_content

logger = logging.getLogger(__name__)
router = APIRouter()

CHUNK_SIZE = 2000


class ScanRequest(BaseModel):
    url: str


def _validate_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")


def _chunk_html(html: str, size: int = CHUNK_SIZE) -> list[str]:
    return [html[i : i + size] for i in range(0, len(html), size)]


def _dedup_violations(violations: list[dict]) -> list[dict]:
    seen: set[str] = set()
    result: list[dict] = []
    for v in violations:
        key = v.get("criterion", "") + v.get("description", "")[:80]
        if key not in seen:
            seen.add(key)
            result.append(v)
    return result


import re

_VIOLATION_RE = re.compile(
    r"\[SC\s*([\d.]+)\s*[-–]\s*([^(]+?)\s*\(Level\s*(A{1,3})\)\]:\s*(.*?)(?=Fix:|$)",
    re.DOTALL | re.IGNORECASE,
)
_FIX_RE = re.compile(r"Fix:\s*(.*?)(?=\[SC|\Z)", re.DOTALL | re.IGNORECASE)


def _parse_violations_from_text(text: str) -> list[dict]:
    results = []
    for match in _VIOLATION_RE.finditer(text):
        remaining = text[match.end():]
        fix_match = _FIX_RE.match(remaining)
        results.append(
            {
                "criterion": match.group(1).strip(),
                "criterion_name": match.group(2).strip(),
                "level": match.group(3).strip(),
                "description": match.group(4).strip(),
                "fix": fix_match.group(1).strip() if fix_match else "",
            }
        )
    return results


@router.post("/scan-url")
async def scan_url(request: ScanRequest) -> StreamingResponse:
    _validate_url(request.url)

    async def generate():
        try:
            async with async_playwright() as pw:
                browser = await pw.chromium.launch(headless=True)
                page = await browser.new_page()
                await page.goto(request.url, wait_until="networkidle", timeout=30000)
                html = await page.inner_html("body")
                await browser.close()
        except Exception as exc:
            logger.error("Playwright error: %s", exc)
            yield json.dumps({"error": f"Failed to render URL: {exc}"}) + "\n"
            return

        chunks = _chunk_html(html)
        all_violations: list[dict] = []

        for i, chunk in enumerate(chunks):
            full_response = ""
            async for token in analyze_content(chunk, "dom"):
                full_response += token

            violations = _parse_violations_from_text(full_response)
            all_violations.extend(violations)

        deduped = _dedup_violations(all_violations)
        for v in deduped:
            yield json.dumps(v) + "\n"

    return StreamingResponse(generate(), media_type="application/x-ndjson")
