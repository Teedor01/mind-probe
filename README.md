# MindProbe

**MindProbe teaches a student, finds the exact concept a student misunderstands, then proves whether that misunderstanding was fixed.**

Not a tutor. Not a summarizer. Not a quiz generator. An understanding engine.:

```
explanation → reasoning extraction → misconception detection → targeted intervention → re-test
```

MVP scope: one subject, one fixed prerequisite chain.

```
Slope → Derivative → Gradient → Learning Rate → Gradient Descent
```

## Why this isn't "ChatGPT wrapped in a UI"

The LLM never controls the application. It only ever returns structured
assessments (JSON, forced via tool-use). A separate, deterministic Python
layer (`backend/app/scoring.py`, `diagnosis.py`) is the only code that:

- updates concept understanding scores
- decides which concept is the true "first broken prerequisite"
- decides when probing is done and it's time to intervene
- decides whether a misconception actually got resolved

This separation is the core engineering constraint of the project, not an
implementation detail — see `backend/app/llm.py`'s module docstring.

## Architecture

```
frontend/   Next.js 14 (App Router, TS, Tailwind) — 5 views: Start, Learn, Teach, Understanding Analysis (Debug Only), Retest
backend/    FastAPI + SQLAlchemy — Postgres-ready, SQLite by default for local dev
            app/concept_graph.py   hardcoded 5-node prerequisite chain
            app/llm.py             Groq API calls (free tier), structured output only
            app/scoring.py         deterministic state transitions
            app/diagnosis.py       assembles the concept-map payload
            app/routers/session.py the full lesson→teach→probe→intervention→retest loop
```

The graph is 5 hardcoded nodes; a generic graph engine would be
over-engineering for this scope.

## Running it locally

### Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then add your GROQ_API_KEY
uvicorn app.main:app --reload
```

Uses **Groq's free API** (OpenAI-compatible), no billing required. Get a
free key at [console.groq.com](https://console.groq.com), no credit card
needed. Default model is set via `GROQ_MODEL` in `.env`
(`openai/gpt-oss-20b` works well and supports tool calling; Groq is
retiring `llama-3.3-70b-versatile`, so don't rely on that one long-term).
`gpt-oss-20b` is a reasoning model... it spends part of its token budget on
internal reasoning before producing output, so plain-text calls in
`llm.py` pass `reasoning_effort: "low"` and use generous `max_tokens`
headroom to avoid coming back empty. Free tier is rate-limited
(requests/min and requests/day caps), which is plenty for demoing but
worth knowing if you're iterating heavily the night before the deadline.

Runs on `http://localhost:8000`. Uses SQLite (`mindprobe.db`) by default,
point `DATABASE_URL` at Postgres for the real deployment.

There's also `backend/test_offline.py`, which exercises the entire scoring
loop with mocked LLM responses (no API key or network needed)... useful for
verifying the deterministic logic didn't break after an edit:

```bash
python3 test_offline.py
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   
npm run dev
```

Runs on `http://localhost:3000`.

## The loop, end to end

Progress is deliberately withheld until the very end. The student never
sees a score or a "here's what's wrong with you" screen until after
they've been taught, explained themselves, and answered several
questions — otherwise the diagnosis biases how they answer the probes.

1. **Start** — student begins a session on the fixed gradient-descent chain.
   The start screen sets expectations up front (what the four-step loop
   involves) and previews the chain being covered before the student
   commits to starting.
2. **Learn** — MindProbe teaches the whole chain first, a 400-500 word
   passage walking Slope → Derivative → Gradient → Learning Rate → Gradient
   Descent (`POST /lesson`, plain LLM generation, not personalized... nothing
   is known about the student yet).
3. **Explain** — student explains gradient descent back in their own words.
   `POST /teach` sends this to the LLM for structured assessment (claims,
   correct/incorrect reasoning, missing concepts, misconceptions, and a
   0-100 confidence score per concept in the chain). Deterministic code then
   walks the chain from the most foundational concept forward and flags the
   *first* one below the weak threshold... the true root cause, not just
   whatever concept scored lowest. None of this is shown yet.
4. **Probe** — 3 to 4 Socratic diagnostic questions targeting the root
   concept (`MIN_PROBES_PER_CONCEPT = 3`, `MAX_PROBES_PER_CONCEPT = 4` in
   `scoring.py`), each graded by the LLM and scored deterministically. Even
   a correct answer on question 1 doesn't end the loop early... there's a
   floor of 3 questions before "resolved" is allowed to short-circuit it,
   and a hard ceiling of 4 regardless of outcome. Feedback on each answer
   stays on screen until the student clicks through to the next question,
   it doesn't auto-advance.
5. **Intervention** — once the minimum is met (and either resolved, or the
   ceiling is hit), a 3-5 sentence minimal correction is generated, naming
   the misconception directly.
6. **Retest** — one new question, different in surface form, designed to be
   unanswerable while still holding the old misconception.
7. **Progress** (the first and only reveal) — the misconception summary,
   before/after concept maps side by side, and a resolved/not-resolved
   verdict. Fixing the root concept also lifts the scores of concepts that
   depend on it (deterministic rule in `scoring.apply_retest_result`), which
   is the actual product claim: the chain, not just one node, gets stronger.

The `/diagnosis` route still exists as a standalone debug view (raw
misconception map at any point in a session) but isn't linked from the
normal flow anymore... useful if you want to eyeball what the model inferred
without running the whole loop.

## Demo script (2 min)

1. Skim the Learn lesson.
2. Type a flawed explanation, e.g.: *"Gradient tells us how much we should
   change the weights."*
3. Answer the 3-4 Socratic probes (nothing revealed yet... this is the part
   that makes it feel like an oral exam, not a quiz).
4. Read the minimal intervention.
5. Answer the retest question correctly.
6. First reveal: misconception named, before/after map... root concept and
   its dependents both jump — "Misconception resolved."

## Design

Light "purple SaaS" theme, white cards on a soft lavender-grey background
(`#F6F6FB`), a single purple accent (`#6D5FFB`) for the brand color and
primary actions, Inter as the only typeface. Tokens live in
`frontend/tailwind.config.ts`. This is the correct, intended design...
**an earlier session briefly overwrote it with a dark "diagnostic
instrument" theme (graphite background, amber accents) by mistake; that
was reverted and should not be reintroduced.**

The prerequisite chain is shown as a simple pill sequence with arrows
(`Slope → Derivative → ...`), used consistently on the start screen and
throughout the flow — there's no separate gauge/dial visualization. The
start screen is a two-column layout: session pitch, chain preview, and
CTA on the left; a "what to expect" walkthrough of the four-step loop on
the right, with a supporting feature row underneath.

## What's deliberately not built

- No generic knowledge-graph engine (5 hardcoded nodes is enough for one subject)
- No multi-subject support
- No user accounts / auth (session-id in the URL is enough for a demo)
- No spaced repetition or longitudinal tracking (that's a different product)
