import { computeAdminAnalytics, buildCandidateProgressTimeline } from "@/lib/analytics";
import {
  demoCandidates,
  demoCoaches,
  demoInterviewSession,
  demoSessions,
  demoTranscript,
  findCandidate,
  findCoach,
  questionBank,
  questionsForSession
} from "@/lib/demo-data";
import { createMockInterviewAiProvider } from "@/lib/providers/mock";

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "purple" | "amber" }) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    purple: "border-indigo-200 bg-indigo-50 text-indigo-700",
    amber: "border-amber-200 bg-amber-50 text-amber-800"
  };

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur ${className}`}>{children}</section>;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-indigo-600" style={{ width: `${value}%` }} />
    </div>
  );
}

type IconProps = { className?: string };

function IconFrame({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

function BrainIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M9.5 2.5a3 3 0 0 0-3 3v.3a3.5 3.5 0 0 0-2 6.2 4 4 0 0 0 3.5 6h.5" />
      <path d="M14.5 2.5a3 3 0 0 1 3 3v.3a3.5 3.5 0 0 1 2 6.2 4 4 0 0 1-3.5 6h-.5" />
      <path d="M12 3v18" />
      <path d="M8 8h2" />
      <path d="M14 8h2" />
      <path d="M8 14h2" />
      <path d="M14 14h2" />
    </IconFrame>
  );
}

function UsersIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </IconFrame>
  );
}

function ClipboardListIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <rect height="18" rx="2" width="14" x="5" y="3" />
      <path d="M9 7h6" />
      <path d="M9 12h6" />
      <path d="M9 17h4" />
    </IconFrame>
  );
}

function ShieldCheckIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-5" />
    </IconFrame>
  );
}

function MessageSquareTextIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      <path d="M8 8h8" />
      <path d="M8 12h6" />
    </IconFrame>
  );
}

function ChartIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M4 19V5" />
      <path d="M4 19h17" />
      <path d="m8 15 3-4 4 2 5-7" />
    </IconFrame>
  );
}

export default async function Home() {
  const provider = createMockInterviewAiProvider();
  const activeCandidate = findCandidate(demoInterviewSession.candidateId);
  const activeCoach = findCoach(demoInterviewSession.coachId);
  const followUp = await provider.generateFollowUp({
    session: demoInterviewSession,
    questionId: "q_behavioral_ownership",
    transcript: demoTranscript
  });
  const report = await provider.generateFeedbackReport({ session: demoInterviewSession, transcript: demoTranscript });
  const analytics = computeAdminAnalytics({ candidates: demoCandidates, sessions: demoSessions });
  const progress = buildCandidateProgressTimeline({ candidateId: "cand_maya", sessions: demoSessions });
  const activeQuestions = questionsForSession(demoInterviewSession);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-5 py-8 md:px-8 lg:px-10">
      <header className="grid gap-6 rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-sm backdrop-blur lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone="purple">Next.js App Router</Badge>
            <Badge tone="green">Mock AI default</Badge>
            <Badge>Supabase-style schema</Badge>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-indigo-600">Portfolio demo</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              AI interview training for candidates, coaches, and hiring-prep teams.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-slate-600">
              A local-only SaaS MVP demo showing role-aware interview practice, deterministic AI follow-ups,
              transcript scoring, coach feedback reports, and an admin analytics dashboard.
            </p>
          </div>
        </div>
        <section className="rounded-3xl border border-slate-900 bg-slate-950 p-6 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <BrainIcon className="h-8 w-8 text-indigo-300" />
            <div>
              <p className="text-sm text-indigo-200">Active practice loop</p>
              <h2 className="text-2xl font-bold">{demoInterviewSession.title}</h2>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-400">Candidate</dt>
              <dd className="font-semibold">{activeCandidate?.fullName}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Coach</dt>
              <dd className="font-semibold">{activeCoach?.fullName}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Target role</dt>
              <dd className="font-semibold">{demoInterviewSession.targetRole}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Mock score</dt>
              <dd className="font-semibold">{report.overallScore}/100</dd>
            </div>
          </dl>
        </section>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <UsersIcon className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-bold">Candidate workspace</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Candidates see their target role, upcoming sessions, readiness score, and specific practice loops.
          </p>
          <div className="mt-5 space-y-4">
            {demoCandidates.map((candidate) => (
              <div key={candidate.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{candidate.fullName}</p>
                    <p className="text-sm text-slate-500">{candidate.targetRole}</p>
                  </div>
                  <Badge tone={candidate.readinessScore >= 84 ? "green" : "amber"}>{candidate.readinessScore}% ready</Badge>
                </div>
                <div className="mt-3"><ProgressBar value={candidate.readinessScore} /></div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Context anchors</p>
                <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-600">
                  {candidate.practiceContext.jobDescriptionSignals.slice(0, 2).map((signal) => (
                    <li key={`${candidate.id}-${signal}`}>• {signal}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Format: {candidate.practiceContext.interviewFormat.replaceAll("_", " ")} · Proof: {candidate.practiceContext.resumeEvidenceAnchors[0]}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <ClipboardListIcon className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-bold">Session builder</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Coaches assemble role-specific practice sessions from a question bank and choose mock-AI or manual follow-ups.
          </p>
          <div className="mt-5 space-y-3">
            {activeQuestions.map((question) => (
              <article key={question.id} className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-950">{question.title}</h3>
                  <Badge tone="purple">{question.difficulty}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{question.prompt}</p>
              </article>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-bold">Coach/admin roles</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The data model separates candidates from coaches/admins so production Supabase RLS can enforce ownership.
          </p>
          <div className="mt-5 space-y-3">
            {demoCoaches.map((coach) => (
              <div key={coach.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{coach.fullName}</p>
                  <Badge tone={coach.role === "admin" ? "purple" : "slate"}>{coach.role}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500">{coach.specialty}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <div className="flex items-center gap-3">
            <MessageSquareTextIcon className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-bold">Transcript and mock AI follow-up</h2>
          </div>
          <div className="mt-5 space-y-3">
            {demoTranscript.map((turn) => (
              <div key={turn.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <span>{turn.speaker}</span>
                  <span>{turn.timestamp}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{turn.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <Badge tone="purple">Deterministic mock AI</Badge>
            <p className="mt-3 font-semibold text-slate-950">{followUp.question}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{followUp.reason}</p>
            <p className="mt-2 text-sm font-medium text-indigo-700">Coach note: {followUp.coachGuidance}</p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <ChartIcon className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-bold">Rubric scoring and feedback report</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">{report.summary}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {report.rubricScores.map((score) => (
              <div key={score.category} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{score.category}</p>
                  <p className="font-black text-indigo-700">{score.score}/{score.maxScore}</p>
                </div>
                <div className="mt-3"><ProgressBar value={(score.score / score.maxScore) * 100} /></div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{score.evidence}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
            <strong>Recommended practice:</strong> {report.recommendedPractice}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <Card>
          <h2 className="text-xl font-bold">Admin progress dashboard</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-950 p-4 text-white">
              <p className="text-sm text-slate-300">Candidates</p>
              <p className="text-3xl font-black">{analytics.totalCandidates}</p>
            </div>
            <div className="rounded-2xl bg-indigo-600 p-4 text-white">
              <p className="text-sm text-indigo-100">Completed</p>
              <p className="text-3xl font-black">{analytics.sessionsCompleted}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Avg score</p>
              <p className="text-3xl font-black">{analytics.averageScore}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Scheduled</p>
              <p className="text-3xl font-black">{analytics.sessionsScheduled}</p>
            </div>
          </div>
          <div className="mt-5 space-y-2 text-sm text-slate-600">
            {Object.entries(analytics.roleCoverage).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>{role}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Candidate progress timeline</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Admins and coaches can inspect score movement over time before approving candidates for harder loops.
          </p>
          <div className="mt-6 space-y-4">
            {progress.map((point) => (
              <div key={`${point.date}-${point.label}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[8rem_1fr_4rem] md:items-center">
                <p className="text-sm font-semibold text-slate-500">{point.date}</p>
                <div>
                  <p className="font-semibold text-slate-950">{point.label}</p>
                  <div className="mt-2"><ProgressBar value={point.score} /></div>
                </div>
                <p className="text-2xl font-black text-indigo-700">{point.score}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">Question bank preview</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {questionBank.map((question) => (
            <article key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{question.roleFocus}</Badge>
                <Badge tone="amber">{question.difficulty}</Badge>
              </div>
              <h3 className="mt-3 font-semibold text-slate-950">{question.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{question.prompt}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Rubric: {question.rubricFocus.join(" / ")}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
