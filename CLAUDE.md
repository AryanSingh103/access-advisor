# AccessAdvisor

## Overview
AccessAdvisor is a full-stack web application that uses a RAG (Retrieval-Augmented Generation) pipeline to automatically review code and web pages for WCAG 2.1 accessibility violations. It offers two primary features: a GitHub PR Reviewer that fetches PR diffs and posts inline accessibility review comments directly on the PR, and a URL Scanner that renders any live URL via headless browser and streams back a structured accessibility audit report.

## Tech Stack

**Backend:**
- Python 3.11+ / FastAPI / uvicorn
- LlamaIndex 0.10+ (RAG pipeline: loading, chunking, embedding, retrieval)
- ChromaDB (local persistent vector store — collection name MUST be "wcag_docs")
- OpenAI text-embedding-3-small (embeddings only)
- Anthropic Claude claude-sonnet-4-5 (LLM generation via streaming)
- Playwright (headless Chromium for URL scanning)
- PyGithub (GitHub API: fetch PR diffs, post review comments)

**Frontend:**
- Next.js 16 with App Router, TypeScript strict mode (see frontend/AGENTS.md — APIs differ from older Next.js; consult node_modules/next/dist/docs/)
- Tailwind CSS + shadcn/ui
- NextAuth.js v5 with GitHub OAuth
- Native fetch with ReadableStream for streaming

## Commit Policy

After every single atomic change, immediately run:
  git add -A && git commit -m "<type>(<scope>): <description>"

Use conventional commit format. Examples:
  feat(backend): scaffold FastAPI app with health check endpoint
  feat(rag): add ChromaDB vector store initialization
  feat(frontend): create landing page hero section
  chore(deps): add llama-index chromadb openai to requirements.txt
  fix(rag): correct chunk overlap parameter to 50 tokens

Commit after:
- Every new file created (even empty ones)
- Every function or API route added
- Every dependency installed (commit the updated requirements.txt or package.json immediately)
- Every bug fix
- Every UI component built
- Every style or copy change

Never batch multiple logical changes into one commit. One change = one commit.

## ChromaDB Note

The ChromaDB collection MUST be named **"wcag_docs"** — no other name is acceptable. This is enforced throughout the RAG pipeline.
