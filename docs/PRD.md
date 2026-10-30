# Digital Dark Spot — Product Requirements Document (PRD)

## Problem Statement
People rely on online information to make important decisions about education, careers, public services, research, and business. However, relevant information is often scattered across multiple websites and documents. Some sources may be outdated, different sources may provide conflicting details, and important questions may remain unanswered.

Challenge: Design and build a web-based platform that analyzes information from multiple sources about a topic and helps users identify potential information gaps, conflicting claims, outdated details, and unanswered questions. The platform should present evidence with source references and guide users on what to verify next.

## Architecture & System Design
- **Frontend (/client):** Vite + React + TypeScript + React Router v6 + Tailwind CSS v4 + shadcn/ui + Watermelon UI components + Motion (`motion/react`).
- **Backend (/server):** Node + Express, in-memory storage, SSRF protection, multi-provider LLM layer (Gemini, OpenAI, Anthropic), deterministic analysis engine.
- **Design Tokens:** Watermelon Seed brand palette (Rind, Flesh, Pith, Seed, Crack, Wilt).

## Workflow Pipeline
1. Source Ingestion (SSRF guard, 12s timeout, clean text, temporal date/cycle detection)
2. AI Claim Extraction (Strict JSON, delimited untrusted context, verbatim quote verification)
3. Deterministic Analysis (Uncovered gaps, thin coverage, cross-source conflicts, freshness warnings, coverage matrix, prioritized verification checklist)
4. Interactive Dashboard (Half-Melon Slice View, side-by-side conflict cards, Evidence Drawer, session-persisted checklist export)
