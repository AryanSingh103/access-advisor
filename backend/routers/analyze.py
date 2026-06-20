import logging
from typing import Literal

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from rag.query import analyze_content

logger = logging.getLogger(__name__)
router = APIRouter()


class AnalyzeRequest(BaseModel):
    content: str
    content_type: Literal["code", "dom"]


@router.post("/analyze")
async def analyze(request: AnalyzeRequest) -> StreamingResponse:
    async def token_stream():
        async for token in analyze_content(request.content, request.content_type):
            yield token

    return StreamingResponse(token_stream(), media_type="text/event-stream")
