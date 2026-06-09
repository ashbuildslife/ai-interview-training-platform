# Architecture

This document covers the structural decisions behind the AI Interview Training Platform. how data flows, how the AI provider boundary works, and how the system would operate in production.

## Request flow

```
Browser
  → Next.js App Router (src/app/page.tsx)
    → src/lib/demo-data.ts        (fixture data: candidates, sessions, transcripts)
    → src/lib/providers/index.ts   (AI provider selector)
      → mock.ts                    (deterministic, default, tested)
      → openai.ts                  (stub, fails closed without key)
      → anthropic.ts               (stub, fails closed without key)
    → src/lib/analytics.ts         (admin summaries and progress timelines)
```

The page component is an async server component. It loads fixture data, calls the configured AI provider for follow-up questions and feedback reports, and passes everything to the client component tree. There is no client-side data fetching in this demo. everything renders server-side from local data.

## AI provider boundary

The `src/lib/providers/` directory enforces a single interface: `InterviewAiProvider`. Every provider implements `generateFollowUp` and `generateFeedbackReport`.

The selector in `index.ts` reads `AI_PROVIDER` from the environment and instantiates the matching adapter. The default is `mock`.

**Mock provider (default):**
- Deterministic. Same transcript always produces the same follow-up questions and rubric scores.
- Used by all Vitest tests.
- Scores are derived from simple transcript signal analysis: metric evidence, trade-off language, ownership framing, and STAR-like structure.

**OpenAI and Anthropic stubs:**
- Exist to show the provider-swapping pattern.
- Both fail closed. They check for API keys and throw if missing. Neither is wired to a live model.
- In production, the application would add prompt templates and streaming response handling to these files while keeping the mock provider as the test harness.

## Data model

The Supabase migration in `supabase/migrations/` defines:

```
profiles
  ├── role: candidate | coach | admin

candidates
  ├── profile_id → profiles
  ├── coach_id → profiles
  ├── target_role, cohort, readiness_score

question_bank
  ├── role_focus, difficulty, tags, rubric_focus

interview_sessions
  ├── candidate_id, coach_id
  ├── selected_question_ids
  ├── follow_up_mode: mock_ai | manual
  ├── status: scheduled | in_progress | completed
  ├── final_score

transcript_turns
  ├── session_id → interview_sessions
  ├── speaker: coach | candidate | ai
  ├── text, timestamp, question_id

rubric_scores
  ├── session_id → interview_sessions
  ├── category, score, max_score, evidence

feedback_reports
  ├── session_id → interview_sessions
  ├── overall_score, summary, strengths, risks, recommended_practice
```

### Row-level security (RLS)

The migration includes RLS policies as schema documentation:

| Policy | Scope |
|---|---|
| Candidates read own sessions and reports | `candidate_id = auth.uid()` |
| Coaches read their assigned candidates | `coach_id = auth.uid()` |
| Admins read all operational data | `is_admin()` check on profiles |

These policies are documented in the migration SQL but not enforced in the local demo, which runs from fixture data without Supabase Auth.

## Human-in-the-loop gate

The mock AI generates follow-up questions and draft feedback reports. The UI positions coaches as reviewers, not as bypassed operators. This is intentional.

In production:
- AI-generated feedback should require coach approval before a candidate can see it.
- Coaches can override rubric scores with their own judgment.
- Every coach edit should be audited.

The demo shows the coach review surface inline. The approval workflow is noted as a production roadmap item.

## Where real Supabase would plug in

Currently, all data is served from `src/lib/demo-data.ts`. static TypeScript arrays. To wire a real Supabase backend:

1. Add Supabase Auth to the Next.js app.
2. Replace demo-data.ts with Supabase client queries.
3. Enable RLS and test that policies reject unauthorized reads.
4. The session-builder and analytics components don't change. They consume the same TypeScript interfaces.

The schema migration and RLS policies are already written. The data layer is deliberately thin so swapping from fixtures to a database is a focused change, not a rewrite.

## Testing strategy

Tests live alongside source files:

```
src/lib/__tests__/
  └── mock.test.ts        ← mock AI follow-up generation
  └── analytics.test.ts   ← admin analytics and progress timelines
```

All tests use Vitest and the mock provider. No tests require network access, real API keys, or a running Supabase instance.

The `npm test` command runs all test files. CI runs `npm test` after lint and typecheck and before the production build.
