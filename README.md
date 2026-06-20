# AccessAdvisor

**Catch accessibility issues before they ship.**

AccessAdvisor is a full-stack AI-powered tool that automatically reviews your GitHub pull requests and live web pages for WCAG 2.1 accessibility violations — using a RAG (Retrieval-Augmented Generation) pipeline grounded in the official specification. Every finding cites a specific Success Criterion and includes an exact code fix. No hallucinations, no guesses.

---

## Features

**GitHub PR Reviewer**
Connect a repo, enter a PR number, and AccessAdvisor fetches the diff, runs it through the RAG pipeline, and posts inline review comments directly on the PR at the exact lines that violate accessibility criteria.

**URL Scanner**
Paste any live URL and a headless browser renders the full page. The RAG pipeline analyzes the DOM and streams back a structured accessibility audit in real time — violations, affected elements, and fixes.

**RAG-grounded, not hallucinated**
The WCAG 2.1 specification is chunked, embedded, and stored in a local vector database. Every analysis retrieves the most relevant spec excerpts and forces the model to only cite violations that appear in the retrieved context.

---

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | Anthropic Claude claude-sonnet-4-5 (streaming) |
| Embeddings | OpenAI text-embedding-3-small |
| Vector store | ChromaDB (local, persistent) |
| RAG framework | LlamaIndex 0.10+ |
| Backend | FastAPI + uvicorn (Python 3.11) |
| URL rendering | Playwright (headless Chromium) |
| GitHub integration | PyGithub |
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | NextAuth.js v5 (GitHub OAuth) |

---

## How It Works

AccessAdvisor uses **Retrieval-Augmented Generation (RAG)** to ground every accessibility finding in the real WCAG 2.1 specification — not in the model's training memory.

```
INGEST (runs once on first startup)
────────────────────────────────────
  WCAG 2.1 spec + Quick Reference HTML
              │
              ▼
  Split into 512-token chunks (50-token overlap)
              │
              ▼
  Embed each chunk → OpenAI text-embedding-3-small
              │
              ▼
  Store 650 vectors → ChromaDB ("wcag_docs" collection)


QUERY (per request)
────────────────────────────────────
  User input: code diff or rendered DOM HTML
              │
              ▼
  Embed input → same OpenAI model
              │
              ▼
  ChromaDB similarity search → top 15 chunks
              │
              ▼
  Re-rank by cosine score → keep top 6
              │
              ▼
  Build prompt: system instructions + WCAG context + input
              │
              ▼
  Claude claude-sonnet-4-5 (streaming)
              │
              ▼
  Streamed violations: [SC X.X.X] · description · fix
```

This means every violation is **traceable** — you can follow it back to the exact paragraph in the WCAG 2.1 document that it was retrieved from.

---

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- API keys for Anthropic and OpenAI
- A GitHub OAuth App (for PR reviews)

### 1. Clone and configure

```bash
git clone https://github.com/AryanSingh103/access-advisor.git
cd access-advisor
cp .env.example .env
```

Edit `.env` and fill in your keys:

| Variable | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) — embeddings only |
| `GITHUB_CLIENT_ID` | GitHub → Settings → Developer Settings → OAuth Apps |
| `GITHUB_CLIENT_SECRET` | Same OAuth App |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |

For the GitHub OAuth App, set:
- Homepage URL: `http://localhost:3000`
- Callback URL: `http://localhost:3000/api/auth/callback/github`

### 2. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
python -m playwright install chromium
```

### 3. Start the backend

```bash
cd backend
uvicorn main:app --reload
```

On first startup, AccessAdvisor automatically ingests the WCAG 2.1 spec into ChromaDB (~30 seconds for embeddings). Every startup after that loads the existing index instantly.

Verify it's running:
```bash
curl http://localhost:8000/health
# {"status":"ok","service":"AccessAdvisor API"}
```

### 4. Install and start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
access-advisor/
├── backend/
│   ├── main.py              # FastAPI app, CORS, startup ingest
│   ├── config.py            # Typed settings from .env
│   ├── requirements.txt
│   ├── data/
│   │   ├── wcag21.html          # WCAG 2.1 specification
│   │   └── wcag21_quickref.html # WCAG 2.1 Quick Reference
│   ├── rag/
│   │   ├── ingest.py        # Document loading, chunking, ChromaDB storage
│   │   └── query.py         # Retrieval, re-ranking, Claude streaming
│   └── routers/
│       ├── analyze.py       # POST /api/analyze — generic SSE endpoint
│       ├── github.py        # POST /api/github/analyze-pr + post-comments
│       └── scanner.py       # POST /api/scan-url — Playwright + NDJSON stream
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx             # Landing page
        │   ├── dashboard/page.tsx   # Dashboard with repo list and PRs
        │   ├── dashboard/pr/[id]/   # PR analysis view
        │   └── scan/page.tsx        # URL scanner
        ├── components/
        │   └── WcagBadge.tsx        # Reusable criterion badge with WCAG links
        └── lib/
            └── api.ts               # Backend API helpers, streaming generators
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/analyze` | Analyze code or DOM — returns SSE stream |
| `POST` | `/api/github/analyze-pr` | Fetch PR diff and return violations as JSON |
| `POST` | `/api/github/post-comments` | Post inline review comments on a PR |
| `POST` | `/api/scan-url` | Render URL with Playwright and stream violations as NDJSON |

---

## License

MIT
