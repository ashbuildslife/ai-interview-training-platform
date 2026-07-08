import type { CandidatePracticeContext, CandidateProfile, InterviewSession, QuestionBankItem, SessionStatus } from "./types";

const MIN_JOB_DESCRIPTION_SIGNALS = 2;
const MIN_COMPANY_RESEARCH_SIGNALS = 1;
const MIN_RESUME_EVIDENCE_ANCHORS = 2;

const UPCOMING_SESSION_STATUSES = new Set<SessionStatus>(["draft", "scheduled", "in_progress"]);

const INTERVIEW_FORMAT_QUESTION_SIGNALS: Record<CandidatePracticeContext["interviewFormat"], string[]> = {
  recruiter_screen: ["behavioral", "coachability", "career-changer"],
  behavioral_loop: ["behavioral", "coachability", "career-changer"],
  technical_loop: ["architecture", "security", "provider-boundary"],
  strategy_panel: ["strategy", "prioritization", "metrics"]
};

const GENERIC_CONTEXT_TERMS = new Set([
  "communication",
  "leadership",
  "teamwork",
  "problem solving",
  "culture fit",
  "company research"
]);

export interface AdminAnalyticsInput {
  candidates: CandidateProfile[];
  sessions: InterviewSession[];
  questions?: QuestionBankItem[];
}

export type CandidatePracticeContextMissingReason =
  | "job_description_signals"
  | "company_research_signals"
  | "resume_evidence_anchors";

export interface CandidatePracticeContextGap {
  candidateId: string;
  missing: CandidatePracticeContextMissingReason[];
}

export type InterviewFormatPracticeMissingReason = "candidate_context" | "format_question_alignment";

export interface InterviewFormatPracticeGap {
  sessionId: string;
  candidateId: string;
  interviewFormat?: CandidatePracticeContext["interviewFormat"];
  missing: InterviewFormatPracticeMissingReason[];
  requiredQuestionSignals?: string[];
}

export interface InterviewFormatReadinessInput {
  candidates: CandidateProfile[];
  sessions: InterviewSession[];
  questions: QuestionBankItem[];
}

export interface AdminAnalytics {
  totalCandidates: number;
  sessionsCompleted: number;
  sessionsScheduled: number;
  averageScore: number;
  roleCoverage: Record<string, number>;
  atRiskCandidateIds: string[];
  practiceContextReadyCandidates: number;
  practiceContextGaps: CandidatePracticeContextGap[];
  formatCheckedUpcomingSessions: number;
  formatReadyUpcomingSessions: number;
  interviewFormatGaps: InterviewFormatPracticeGap[];
}

function countSpecificContextValues(values: string[]): number {
  return values.filter((value) => {
    const normalized = value.trim().toLowerCase();
    return normalized.length > 0 && !GENERIC_CONTEXT_TERMS.has(normalized);
  }).length;
}

export function auditSessionInterviewFormatReadiness({
  candidates,
  sessions,
  questions
}: InterviewFormatReadinessInput): InterviewFormatPracticeGap[] {
  const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const questionById = new Map(questions.map((question) => [question.id, question]));

  return sessions.flatMap((session): InterviewFormatPracticeGap[] => {
    if (!UPCOMING_SESSION_STATUSES.has(session.status)) {
      return [];
    }

    const candidate = candidateById.get(session.candidateId);

    if (!candidate) {
      return [{ sessionId: session.id, candidateId: session.candidateId, missing: ["candidate_context"] }];
    }

    const requiredQuestionSignals = INTERVIEW_FORMAT_QUESTION_SIGNALS[candidate.practiceContext.interviewFormat];
    const selectedQuestionTags = session.selectedQuestionIds.flatMap(
      (questionId) => questionById.get(questionId)?.tags.map((tag) => tag.trim().toLowerCase()) ?? []
    );
    const hasFormatAlignedQuestion = selectedQuestionTags.some((tag) => requiredQuestionSignals.includes(tag));

    return hasFormatAlignedQuestion
      ? []
      : [
          {
            sessionId: session.id,
            candidateId: candidate.id,
            interviewFormat: candidate.practiceContext.interviewFormat,
            missing: ["format_question_alignment"],
            requiredQuestionSignals
          }
        ];
  });
}

export function auditCandidatePracticeContext(candidates: CandidateProfile[]): CandidatePracticeContextGap[] {
  return candidates.flatMap((candidate) => {
    const missing: CandidatePracticeContextMissingReason[] = [];

    if (countSpecificContextValues(candidate.practiceContext.jobDescriptionSignals) < MIN_JOB_DESCRIPTION_SIGNALS) {
      missing.push("job_description_signals");
    }

    if (countSpecificContextValues(candidate.practiceContext.companyResearchSignals) < MIN_COMPANY_RESEARCH_SIGNALS) {
      missing.push("company_research_signals");
    }

    if (countSpecificContextValues(candidate.practiceContext.resumeEvidenceAnchors) < MIN_RESUME_EVIDENCE_ANCHORS) {
      missing.push("resume_evidence_anchors");
    }

    return missing.length === 0 ? [] : [{ candidateId: candidate.id, missing }];
  });
}

export function computeAdminAnalytics({ candidates, sessions, questions }: AdminAnalyticsInput): AdminAnalytics {
  const completed = sessions.filter((session) => session.status === "completed");
  const scored = completed.filter((session) => typeof session.finalScore === "number");
  const scoreTotal = scored.reduce((sum, session) => sum + (session.finalScore ?? 0), 0);
  const roleCoverage = candidates.reduce<Record<string, number>>((counts, candidate) => {
    counts[candidate.targetRole] = (counts[candidate.targetRole] ?? 0) + 1;
    return counts;
  }, {});
  const practiceContextGaps = auditCandidatePracticeContext(candidates);
  const upcomingSessions = sessions.filter((session) => UPCOMING_SESSION_STATUSES.has(session.status));
  const interviewFormatGaps = questions
    ? auditSessionInterviewFormatReadiness({ candidates, sessions, questions })
    : [];

  return {
    totalCandidates: candidates.length,
    sessionsCompleted: completed.length,
    sessionsScheduled: sessions.filter((session) => session.status === "scheduled").length,
    averageScore: scored.length === 0 ? 0 : Math.round(scoreTotal / scored.length),
    roleCoverage,
    atRiskCandidateIds: candidates
      .filter((candidate) => candidate.readinessScore < 80)
      .map((candidate) => candidate.id),
    practiceContextReadyCandidates: candidates.length - practiceContextGaps.length,
    practiceContextGaps,
    formatCheckedUpcomingSessions: questions ? upcomingSessions.length : 0,
    formatReadyUpcomingSessions: questions ? upcomingSessions.length - interviewFormatGaps.length : 0,
    interviewFormatGaps
  };
}

export interface CandidateProgressPoint {
  date: string;
  score: number;
  label: string;
}

export function buildCandidateProgressTimeline({
  candidateId,
  sessions
}: {
  candidateId: string;
  sessions: InterviewSession[];
}): CandidateProgressPoint[] {
  return sessions
    .filter(
      (session) =>
        session.candidateId === candidateId &&
        session.status === "completed" &&
        typeof session.finalScore === "number"
    )
    .sort((left, right) => left.scheduledFor.localeCompare(right.scheduledFor))
    .map((session) => ({
      date: session.scheduledFor,
      score: session.finalScore ?? 0,
      label: session.title
    }));
}
