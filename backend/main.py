import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


from routers import analyze, github, scanner, repo_scan  # noqa: E402

app.include_router(analyze.router, prefix="/api")
app.include_router(github.router, prefix="/api/github")
app.include_router(scanner.router, prefix="/api")
app.include_router(repo_scan.router, prefix="/api")
