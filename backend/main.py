import logging
import secrets
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from rag.ingest import get_or_create_index
    logger.info("Starting up AccessAdvisor API — initializing vector store...")
    get_or_create_index()
    logger.info("Vector store ready.")
    yield


app = FastAPI(title="AccessAdvisor API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "AccessAdvisor API"}


async def require_api_key(x_api_key: str = Header(default="")) -> None:
    """When BACKEND_API_KEY is set, every /api route requires a matching X-API-Key."""
    if not settings.BACKEND_API_KEY:
        return
    if not secrets.compare_digest(x_api_key, settings.BACKEND_API_KEY):
        raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key")


from routers import analyze, github, scanner, repo_scan  # noqa: E402

app.include_router(analyze.router, prefix="/api", dependencies=[Depends(require_api_key)])
app.include_router(github.router, prefix="/api/github", dependencies=[Depends(require_api_key)])
app.include_router(scanner.router, prefix="/api", dependencies=[Depends(require_api_key)])
app.include_router(repo_scan.router, prefix="/api", dependencies=[Depends(require_api_key)])
