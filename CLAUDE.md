# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```

No test runner is configured. There is no lint script — formatting is left to the developer.

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Without these, the app runs in **demo mode** (`isDemoMode = true` in `src/lib/supabase.js`), returning hardcoded mock data and skipping all Supabase calls.

## Architecture

### Frontend (Vite + React)

Single-page app with one main component in `src/App.jsx`. No router — all state is managed locally with `useState`. The UI has two modes toggled by a header pill switch:

- **日記 (diary)** — uses template `diary_logic`
- **掲示板 (board)** — uses templates `board_concept_1/2/3`, one for each writing concept

Flow: select template → keywords load from Supabase `knowledge_chunks` table → user picks keywords → calls `generateContent()` → results rendered as editable cards with typewriter animation.

### Backend (Supabase Edge Functions — Deno)

Three Edge Functions under `supabase/functions/`:

| Function | Purpose |
|---|---|
| `super-processor` | **Primary** — handles both diary and board content generation. Reads prompts from `writing_styles` table, templates from `reference_diaries`, and tips from `knowledge_chunks`. Calls OpenRouter (Grok `x-ai/grok-4.1-fast`). |
| `generate-column` | Legacy function for diary mode using old `writing_config` table schema. Kept for reference. |
| `generate-suggestions` | Legacy AI-powered suggestion function. Not currently wired to UI. |

The active code path is: `App.jsx` → `generateContent()` in `src/lib/supabase.js` → `super-processor` Edge Function.

### Database Tables

| Table | Purpose |
|---|---|
| `writing_styles` | System prompts per style slug (e.g. `pana_emotion`, `board_common`, `board_concept_1`) — JSON stored in `system_prompt` column |
| `reference_diaries` | Few-shot example texts, filtered by `style_id` and `content_type` |
| `knowledge_chunks` | Keyword pool organized by `category` (`board_writing_tip`, `emotion`, `situation`, `technique`) |
| `writing_config` | Legacy table from original architecture; only used by `generate-column` |

### Edge Function Environment Variables

Set in Supabase Dashboard > Project Settings > Edge Functions:

- `XAI_API_KEY` — OpenRouter API key (used by `super-processor`)
- `OPENROUTER_API_KEY` — OpenRouter API key (used by `generate-column`)
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — auto-injected by Supabase runtime
- `SITE_URL` — deployed URL for OpenRouter HTTP-Referer header

### Content Generation Logic (super-processor)

**Board mode with `conceptId`:** Loads `board_common` style (framework structure + shared rules) + the specific concept style (`board_concept_N`). Fetches matching reference templates from `reference_diaries` filtered by `content_type = 'board_temp'` and title matching `base_templates` array from concept JSON. Selects 2 random examples as few-shot.

**Diary mode / board without conceptId:** Loads style by `styleSlug`, fetches examples by `style_id + content_type`, and optionally applies a random `board_writing_tip` from `knowledge_chunks`.

The AI is instructed to produce **N patterns** separated by `---パターンN---` markers. The frontend splits on this delimiter and parses `タイトル:` from the first line of each pattern.

### Deployment

Deployed to Vercel. Push to Git — Vercel auto-deploys from the connected repository. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel environment variables.
