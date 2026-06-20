import logging
import os
import sys
from typing import AsyncGenerator

import anthropic
from llama_index.embeddings.openai import OpenAIEmbedding

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import settings
from rag.ingest import get_or_create_index

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are an accessibility compliance expert reviewing code and web pages against WCAG 2.1. "
    "You will be given excerpts from the official WCAG 2.1 specification as context, followed by "
    "the code or DOM to analyze. Only cite violations that are directly supported by the provided "
    "context — do not invent criteria. For each violation found, format it as: "
    "[SC X.X.X - Criterion Name (Level XX)]: description of the specific issue found. "
    "Fix: exact code change to fix it. "
    "If no violations are found, say so clearly."
)

_index = None


def _get_index():
    global _index
    if _index is None:
        _index = get_or_create_index()
    return _index


async def analyze_content(content: str, content_type: str) -> AsyncGenerator[str, None]:
    os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
    os.environ["ANTHROPIC_API_KEY"] = settings.ANTHROPIC_API_KEY

    index = _get_index()
    embed_model = OpenAIEmbedding(model="text-embedding-3-small")
    query_embedding = embed_model.get_query_embedding(content)

    retriever = index.as_retriever(similarity_top_k=10)
    nodes_with_scores = retriever.retrieve(content)

    nodes_with_scores.sort(key=lambda n: n.score if n.score is not None else 0, reverse=True)
    top_nodes = nodes_with_scores[:4]

    context_chunks = "\n\n---\n\n".join(
        f"[WCAG Context {i+1}]\n{n.node.get_content()}" for i, n in enumerate(top_nodes)
    )

    user_message = (
        f"WCAG 2.1 Context:\n\n{context_chunks}\n\n"
        f"---\n\n"
        f"{'Code' if content_type == 'code' else 'DOM HTML'} to analyze:\n\n{content}"
    )

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    with client.messages.stream(
        model="claude-sonnet-4-5",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    ) as stream:
        for text in stream.text_stream:
            yield text
