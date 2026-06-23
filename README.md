# AccessAdvisor

**Catch accessibility issues before they ship.**

AccessAdvisor is a full-stack AI tool that reviews GitHub pull requests, live web pages, and entire repositories for WCAG 2.1 accessibility violations using a RAG pipeline grounded in the official specification. Every finding cites a specific Success Criterion with an exact code fix — no hallucinations, no guesses.

---

## ✨ Features

🔍 **GitHub PR Reviewer** — Connect a repo, enter a PR number, and AccessAdvisor fetches the diff, runs it through the RAG pipeline, and posts inline review comments directly on the PR at the exact lines that violate accessibility criteria.

🌐 **URL Scanner** — Paste any live URL and a headless browser renders the full page. The pipeline analyzes the DOM and streams back a structured audit in real time — violations, affected elements, and fixes.

📂 **Repo Scanner** — Don't have a deployed URL? Point AccessAdvisor at any GitHub repository. It walks the file tree, fetches every UI file (`.html`, `.jsx`, `.tsx`, `.vue`, `.svelte`), and streams a full accessibility report with per-file violation counts and a downloadable JSON report.

📄 **Spec-grounded, not hallucinated** — The WCAG 2.1 specification is chunked, embedded, and stored locally in ChromaDB. Every analysis retrieves the most relevant spec excerpts and forces the model to only cite violations that appear in that context.

⚡ **Cost-optimized pipeline** — Non-UI files (utilities, configs, types) are filtered out before any API call. Each file is batched into a single Claude call rather than chunked, cutting API costs dramatically while keeping results accurate.

---

## 🛠 Tech Stack

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

## 🧠 How It Works

AccessAdvisor uses **Retrieval-Augmented Generation (RAG)** to ground every accessibility finding in the real WCAG 2.1 specification — not in the model's training memory.

```
INGEST  (runs once on first startup)
──────────────────────────────────────────
  WCAG 2.1 spec + Quick Reference HTML
              │
              ▼
  Split into 512-token chunks (50-token overlap)
              │
              ▼
  Embed each chunk → OpenAI text-embedding-3-small
              │
              ▼
  Store 650 vectors in ChromaDB ("wcag_docs")


QUERY  (per request)
──────────────────────────────────────────
  Code diff / rendered DOM / repo file content
              │
              ▼
  UI filter — skip non-markup files instantly
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
  Prompt: system instructions + WCAG context + input
              │
              ▼
  Claude claude-sonnet-4-5 streams response (1 call per file)
              │
              ▼
  [SC X.X.X · Criterion Name · Level A/AA] + fix
```

Every violation is **traceable** — retrievable back to the exact paragraph in the WCAG 2.1 document it came from.

---

## 📁 Project Structure

```
access-advisor/
├── backend/
│   ├── main.py              # FastAPI app, CORS, startup ingest
│   ├── config.py            # Typed settings from .env
│   ├── data/
│   │   ├── wcag21.html          # WCAG 2.1 specification
│   │   └── wcag21_quickref.html # WCAG 2.1 Quick Reference
│   ├── rag/
│   │   ├── ingest.py        # Document loading, chunking, ChromaDB storage
│   │   └── query.py         # Retrieval, re-ranking, UI filter, Claude streaming
│   └── routers/
│       ├── analyze.py       # POST /api/analyze
│       ├── github.py        # POST /api/github/analyze-pr + post-comments
│       ├── scanner.py       # POST /api/scan-url (headless browser)
│       └── repo_scan.py     # POST /api/repo-scan (GitHub file tree)
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx              # Landing page
        │   ├── dashboard/            # Dashboard + PR list
        │   ├── dashboard/pr/[id]/    # PR analysis view
        │   ├── scan/                 # URL scanner
        │   └── scan/repo/            # Repo scanner
        ├── components/
        │   └── WcagBadge.tsx         # Criterion badge with WCAG links
        └── lib/
            └── api.ts                # Backend helpers, streaming generators
```

---

## 🔌 API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/analyze` | Analyze code or DOM — SSE stream |
| `POST` | `/api/github/analyze-pr` | Fetch PR diff → violations JSON |
| `POST` | `/api/github/post-comments` | Post inline review comments on a PR |
| `POST` | `/api/scan-url` | Render URL → stream violations as NDJSON |
| `POST` | `/api/repo-scan` | Walk repo file tree → stream per-file results |

---

## 📄 License

MIT
