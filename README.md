# AI Interview Training Platform

A full-stack interview coaching application for teams that hire through structured, repeatable interviews. Candidates practice against a curated question bank. Coaches review session transcripts and AI-generated feedback reports. Admins track readiness across cohorts.

This project is a portfolio demonstration. built with Next.js, TypeScript, Supabase-style data modeling, and a provider-agnostic AI layer that defaults to deterministic mock responses for safe local review.

## Who this is for

**Hiring teams and HR leaders.** If your organization runs structured interviews and wants to reduce variance between interviewers, this shows the kind of tooling you can build.

**Engineering teams evaluating an agency partner.** It demonstrates production patterns. type safety, quality gates, schema design, provider boundaries, and CI. without requiring cloud credentials to run.

**AI agents and technical screeners.** It passes install, lint, typecheck, test, and build in a single CI workflow. It separates concerns between data, AI providers, and presentation. It uses deterministic mock providers so review is reproducible.

## What you're looking at

The demo models a product management interview practice loop:

![](docs/screenshots/01-dashboard-hero.png)

*Above: the main dashboard showing an active practice loop. candidate Maya Rivera working through a PM behavioral screen with coach Ava Patel. Mock AI follow-up questions appear in the transcript panel. The rubric scores update automatically from transcript analysis.*

Below are the key sections. Click through the screenshot set in `docs/screenshots/` to see each one full-size.

| Screenshot | What it shows |
|---|---|
| `01-dashboard-hero.png` | Landing view with active practice loop, candidate/coach assignment, and current score |
| `02-candidate-workspace-session-builder.png` | Three candidates across two roles, each with a readiness score and progress bar. Session builder panel shows coach-selected questions from the question bank |
| `03-transcript-follow-up.png` | Full transcript between coach, candidate, and AI. The mock AI generates a follow-up question that targets the candidate's weakest signal |
| `04-feedback-rubric-report.png` | Rubric scores across Communication, Role Depth, Structure, and Coachability. Each score includes evidence extracted from the transcript. A recommended practice loop is generated at the bottom |
| `05-admin-analytics.png` | Admin dashboard with candidate counts, completion metrics, average scores, role coverage, and a candidate progress timeline |

## Project story

This application was built to demonstrate end-to-end ownership of an AI-powered SaaS product. The brief was straightforward: can a candidate practice an interview, receive structured feedback, and give a coach enough signal to decide whether they're ready for a real loop, all from a single application?

The answer is yes. A candidate logs in (role-gated in production via Supabase Auth). A coach builds a session from a question bank, selecting questions by role, difficulty, and rubric focus. The candidate answers. An AI layer, swappable between mock, OpenAI, and Anthropic, generates follow-up questions and a scored feedback report. An admin dashboard tracks readiness across the cohort.

The AI provider boundary is the critical architectural decision. By default, the app uses a deterministic mock that scores from transcript signal (metric evidence, trade-off language, ownership framing). The mock is testable, reproducible, and safe for portfolio review. Swapping to a live provider is a configuration change. The mock remains the test harness.

## Quick start

You don't need any API keys, cloud accounts, or databases to run this.

```bash
npm install
npm run seed:demo
npm run dev
```

Open `http://localhost:3000`.

All data is fictional. All AI responses are deterministic mocks. Nothing calls an external service.

## Quality gates

Every push runs through:

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm test            # Vitest. 4 test files covering mock AI, rubric reports, admin analytics, and progress timelines
npm run build       # Production build
```

CI is defined in `.github/workflows/ci.yml` and runs on every push and pull request.

Tests verify:
- Mock AI follow-up generation targets the right question focus
- Rubric scores reflect transcript signal (metrics, trade-offs, structure)
- Admin analytics correctly aggregate across candidates and sessions
- Candidate progress timelines sort by date

## Tech choices

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js App Router | Server components, file-based routing, and the standard for React SaaS products in 2025–2026 |
| Language | TypeScript | Type safety across the data layer, provider boundary, and UI |
| Styling | Tailwind CSS | Utility-first, zero-runtime, and the design system ships as CSS. no component library lock-in |
| AI layer | Provider-agnostic adapter (mock / OpenAI / Anthropic) | Swap providers without touching UI or data logic. Mock provider makes testing deterministic |
| Data model | Supabase-style SQL with RLS policies | Schema design that maps directly to a production Supabase project. Mock data runs standalone |
| Testing | Vitest | Fast, Jest-compatible, first-class TypeScript support |
| CI | GitHub Actions | Standard for GitHub-hosted projects |

## Architecture at a glance

```
src/app/page.tsx          ← Presentation: dashboard, transcript, rubrics, analytics
  → src/lib/demo-data.ts  ← Fixture data: candidates, coaches, questions, sessions, transcripts
  → src/lib/providers/    ← AI provider boundary (mock default, OpenAI/Anthropic optional)
  → src/lib/analytics.ts  ← Admin summaries and progress timelines
```

```
supabase/
  → migrations/           ← Schema: profiles, candidates, sessions, transcript turns, rubric scores, feedback reports
  → seed.sql              ← Demo-ready SQL seed data
```

The architecture doc at `docs/architecture.md` covers provider boundaries, RLS policies, and the human-in-the-loop gate in detail.

## Environment

Copy `.env.example` to `.env.local` if you want to customize. The defaults work out of the box:

```
AI_PROVIDER=mock
```

Mock mode requires no provider keys. The OpenAI and Anthropic adapters are boundary stubs. They exist to show the provider-swapping pattern and fail closed without real keys.

## Supabase schema

The migration under `supabase/migrations/` models:

- **Profiles** with candidate, coach, and admin roles  
- **Candidate-coach assignments**  
- **Question bank** with role focus, difficulty, tags, and rubric coverage  
- **Interview sessions** with selected questions and follow-up modes  
- **Transcript turns** distinguished by speaker (coach, candidate, AI)  
- **Rubric scores** per category with evidence extracted from the transcript  
- **Feedback reports** with strengths, risks, and recommended practice

Row-level security policies are documented inline: candidates see their own sessions, assigned coaches see their candidates, and admins see operational analytics.

The demo runs entirely from local fixtures. no Supabase project required. The schema and RLS policies are there to show production data-modeling thinking.

## Demo data

All data is fictional and public-safe:

- 3 candidates across Product Manager and Full Stack Engineer roles  
- 2 coach/admin users  
- 4 question bank items covering behavioral, strategy, architecture, and coachability  
- 5 interview sessions (4 completed, 1 scheduled)  
- A transcript between coach Ava Patel and candidate Maya Rivera with mock AI follow-up  
- A generated feedback report with rubric scores

Refresh the demo seed:

```bash
npm run seed:demo
```

This writes `.generated/demo-seed.json`. The `.generated/` directory is git-ignored.

## Production roadmap

What a production version would add:

- Supabase Auth with role-based access  
- Coach approval workflow before AI-generated feedback reaches candidates  
- Live provider prompt templates with evaluation fixtures and cost controls  
- Per-tenant workspaces for enterprise training cohorts  
- Audit logs for report edits and coach overrides  
- Playwright end-to-end screenshot tests

## Safety

- No real API keys, secrets, tokens, or credentials are committed  
- All people, emails, companies, and metrics are fictional  
- `AI_PROVIDER=mock` is the default and the only provider that ships wired  
- No outbound network calls are made in default configuration  
- See `docs/public-safety.md` for the publication checklist

---

Built as a portfolio demonstration. Ready for private review.
