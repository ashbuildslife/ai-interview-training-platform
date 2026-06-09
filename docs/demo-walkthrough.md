# Demo Walkthrough

A guided tour of the AI Interview Training Platform for non-technical reviewers.

Each section below corresponds to a screenshot in `docs/screenshots/`. Open the screenshots alongside this document. They show exactly what you'd see running the app locally.

---

## 1. Dashboard hero

![](docs/screenshots/01-dashboard-hero.png)

This is the first screen a user sees. It tells a complete story at a glance:

- **Top-left badges** show the tech stack: Next.js App Router, Mock AI, Supabase-style schema. These communicate "modern web application" without needing to read code.
- **Headline and description** explain what the product does. AI interview training for candidates, coaches, and hiring-prep teams.
- **Dark card on the right** is the active practice loop. It shows which candidate (Maya Rivera) is being coached, by whom (Ava Patel), for what role (Product Manager), and what score the mock AI assigned. This card updates when coaches select different sessions.

For a business stakeholder, this screen answers: "What is this? Who's using it? Is it working?"

---

## 2. Candidate workspace and session builder

![](docs/screenshots/02-candidate-workspace-session-builder.png)

Three panels side by side:

**Left. Candidate workspace.** Three candidates are listed: Maya Rivera (PM, 88% ready), Noah Brooks (Full Stack Engineer, 84%), and Lena Okafor (PM, 78%). Each has a progress bar and a "ready" badge. This is the roster view a coach or admin would use to decide who's prepared for their next live interview.

**Center. Session builder.** A coach assembles a practice session by selecting questions from a question bank. The screenshot shows three selected questions: "Ownership under ambiguity" (intermediate), "Product strategy trade-off" (senior), and "Coachability follow-up" (foundational). Each has a prompt and difficulty badge. Coaches can choose mock-AI or manual follow-up mode per session.

**Right. Coach/admin roles.** Shows the two coach profiles: Ava Patel (coach, product leadership loops) and Omar Chen (admin, engineering interview systems). The data model separates these roles so production Supabase RLS can enforce different access levels.

---

## 3. Transcript and AI follow-up

![](docs/screenshots/03-transcript-follow-up.png)

The transcript panel shows a conversation between Coach Ava Patel and Candidate Maya Rivera, with an AI turn in between:

1. **Coach** asks about ownership of an ambiguous product problem.
2. **Candidate** describes reducing time-to-value by 34% at a billing startup.
3. **AI** generates a follow-up: "Which trade-off did you make when sales wanted a high-touch path and product wanted self-serve only?"
4. **Candidate** responds with the self-serve vs. coached trade-off decision.

Below the transcript, a purple card contains the **Mock AI Follow-Up** section. The AI explains its reasoning and gives the coach guidance on what to probe next.

For a non-technical reviewer: the AI isn't just generating text. It's reading the transcript, identifying gaps in the candidate's answer, and producing a targeted follow-up that pushes deeper on decision-making.

---

## 4. Rubric scoring and feedback report

![](docs/screenshots/04-feedback-rubric-report.png)

After the session, the mock AI generates a scored feedback report:

- **Overall score:** 86/100
- **Summary:** a paragraph evaluating the candidate's strengths and areas for improvement.
- **Four rubric categories:** Communication (22/25), Role Depth (21/25), Structure (23/25), Coachability (20/25). Each includes evidence extracted from the transcript. for example, Communication gets credit for using measurable evidence; Structure gets credit for STAR-like framing.
- **Strengths and risks:** bulleted lists extracted from the transcript analysis.
- **Recommended practice:** a specific, actionable next step. in this case, practicing a 90-second STAR answer format.

This is the core product value: structured, repeatable feedback that a coach can review, adjust, and release to the candidate.

---

## 5. Admin analytics

![](docs/screenshots/05-admin-analytics.png)

The bottom section of the dashboard is for program managers and executives:

**Left: Admin progress dashboard.** Four summary cards: total candidates (3), sessions completed (4), average score (83), sessions scheduled (1). Below that, a role coverage breakdown showing 2 Product Manager candidates and 1 Full Stack Engineer.

**Right: Candidate progress timeline.** For candidate Maya Rivera, two data points are plotted: PM behavioral screen (76) followed by PM product strategy loop (88). This shows score improvement over time. This is the primary metric for whether the coaching program is working.

---

## What to look for as a reviewer

**If you're a business stakeholder or hiring manager**, focus on whether the screens tell a clear story. Can you understand what the product does without reading code? Does each panel have a purpose?

**If you're a technical evaluator**, check `docs/architecture.md` for the provider boundary, data model, and RLS policies. Then run `npm test` to see the test suite pass.

**If you're an AI agent screening this repo**, look at `.github/workflows/ci.yml` for the quality gate, `src/lib/providers/` for the adapter pattern, and `supabase/migrations/` for the schema design. Run `npm run build` to confirm it compiles cleanly.
