import logging
import os
import re
import sys
from typing import AsyncGenerator

import anthropic

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import settings
from rag.ingest import get_or_create_index
from rag.parse import VIOLATION_TOOL, violations_from_tool_response

logger = logging.getLogger(__name__)

_UI_PATTERN = re.compile(
    r"<div|<button|<img|<input|<a\s|<form|<label|<select|<textarea|jsx|\.tsx",
    re.IGNORECASE,
)


def has_ui_content(content: str) -> bool:
    return bool(_UI_PATTERN.search(content))


SYSTEM_PROMPT = (
    "You are an accessibility compliance expert reviewing code and web pages against WCAG 2.1. "
    "You will be given excerpts from the official WCAG 2.1 specification as context, followed by "
    "the code or DOM to analyze. Only cite violations that are directly supported by the provided "
    "context — do not invent criteria. For each violation found, format it as: "
    "[SC X.X.X - Criterion Name (Level XX)]: description of the specific issue found. "
    "Fix: exact code change to fix it. "
    "If no violations are found, say so clearly."
)

STRUCTURED_SYSTEM_PROMPT = (
    "You are an accessibility compliance expert reviewing code and web pages against WCAG 2.1. "
    "You will be given excerpts from the official WCAG 2.1 specification as context, followed by "
    "the content to analyze. Only report violations that are directly supported by the provided "
    "context — do not invent criteria. Report every violation via the report_violations tool in a "
    "single call; pass an empty list if the content is compliant.\n\n"
    "Line numbers:\n"
    "- If the content is a unified diff, derive line_number from the @@ hunk headers: it is the "
    "NEW-file line number of the added/changed line containing the violation. Only report "
    "violations on added (+) lines.\n"
    "- If the content is a plain source file, line_number is the 1-indexed line in the file.\n"
    "- If the content is rendered DOM HTML, set line_number to null."
)

_CONTENT_LABELS = {
    "code": "Source code to analyze",
    "diff": "Unified diff (PR patch) to analyze",
    "dom": "Rendered DOM HTML to analyze",
}

_index = None


def _get_index():
    global _index
    if _index is None:
        _index = get_or_create_index()
    return _index


def _build_user_message(content: str, content_type: str) -> str:
    os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY

    index = _get_index()
    retriever = index.as_retriever(similarity_top_k=15)
    nodes_with_scores = retriever.retrieve(content)

    nodes_with_scores.sort(key=lambda n: n.score if n.score is not None else 0, reverse=True)
    top_nodes = nodes_with_scores[:6]

    context_chunks = "\n\n---\n\n".join(
        f"[WCAG Context {i+1}]\n{n.node.get_content()}" for i, n in enumerate(top_nodes)
    )

    label = _CONTENT_LABELS.get(content_type, "Content to analyze")
    return (
        f"WCAG 2.1 Context:\n\n{context_chunks}\n\n"
        f"---\n\n"
        f"{label}:\n\n{content}"
    )


async def analyze_content_structured(content: str, content_type: str) -> list[dict]:
    """Analyze content and return normalized violation dicts via Claude tool use."""
    user_message = _build_user_message(content, content_type)
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    message = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=4096,
        system=STRUCTURED_SYSTEM_PROMPT,
        tools=[VIOLATION_TOOL],
        tool_choice={"type": "tool", "name": "report_violations"},
        messages=[{"role": "user", "content": user_message}],
    )

    if message.stop_reason == "max_tokens":
        logger.warning("Structured analysis hit max_tokens — violation list may be truncated")

    return violations_from_tool_response(message)


async def analyze_content(content: str, content_type: str) -> AsyncGenerator[str, None]:
    user_message = _build_user_message(content, content_type)
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    with client.messages.stream(
        model="claude-sonnet-4-5",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    ) as stream:
        for text in stream.text_stream:
            yield text
