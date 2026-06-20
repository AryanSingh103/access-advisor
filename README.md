# AccessAdvisor

> RAG-powered WCAG 2.1 accessibility reviewer for GitHub PRs and live URLs.

## Tech Stack

- **Backend:** Python 3.11, FastAPI, LlamaIndex, ChromaDB, OpenAI embeddings, Anthropic Claude claude-sonnet-4-5, Playwright, PyGithub
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, NextAuth.js v5

## Setup

### 1. Clone and configure environment

```bash
git clone <repo>
cd access-advisor
cp .env.example .env
# Fill in your API keys in .env
```

Required keys:
- `ANTHROPIC_API_KEY` — from console.anthropic.com
- `OPENAI_API_KEY` — from platform.openai.com (used for embeddings only)
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — GitHub OAuth App (callback: http://localhost:3000/api/auth/callback/github)
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`

### 2. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
python -m playwright install chromium
```

### 3. Run the backend

```bash
cd backend
uvicorn main:app --reload
```

On first startup, the backend automatically ingests WCAG 2.1 HTML documents into ChromaDB (650 chunks). This takes ~30 seconds. Subsequent startups load the existing index instantly.

The API is available at http://localhost:8000. Test with:
```bash
curl http://localhost:8000/health
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
```

### 5. Run the frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:3000.

---

## Architecture — RAG Pipeline

```
INGEST (once on startup):
  wcag21.html + wcag21_quickref.html
        │
        ▼
  SentenceSplitter (512 tokens, 50 overlap)
        │
        ▼  650 chunks
  OpenAI text-embedding-3-small
        │
        ▼  vectors
  ChromaDB (collection: "wcag_docs")

QUERY (per request):
  User input (code diff or DOM HTML)
        │
        ▼
  Embed with text-embedding-3-small
        │
        ▼
  ChromaDB top-15 similarity search
        │
        ▼
  Re-rank → keep top-6 by cosine score
        │
        ▼
  Build prompt: system + WCAG context chunks + input
        │
        ▼
  Claude claude-sonnet-4-5 (streaming)
        │
        ▼
  Streamed violation report (SSE / NDJSON)
```

## How it works

**RAG (Retrieval-Augmented Generation)** grounds LLM responses in real documents instead of training-data memory. Here's the flow:

1. The WCAG 2.1 spec is chunked into 512-token segments and embedded into vectors stored in ChromaDB.
2. When a user submits code or a URL, the input is embedded and compared against all stored vectors.
3. The 6 most semantically similar WCAG chunks are retrieved and injected into the Claude prompt as grounding context.
4. Claude is instructed to only cite violations that appear in the retrieved context — not to hallucinate criteria.
5. Every violation cites a specific Success Criterion (e.g., SC 4.1.2) with the exact text from the spec.

This means every accessibility finding is traceable back to the official WCAG 2.1 document.

## Screenshots

<!-- Screenshots will be added after the UI is built -->
