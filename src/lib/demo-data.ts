import type {
  CandidateProfile,
  CoachProfile,
  InterviewSession,
  QuestionBankItem,
  RubricCategory,
  TranscriptTurn
} from "./types";

export const demoCoaches: CoachProfile[] = [
  {
    id: "coach_ava",
    fullName: "Ava Patel",
    email: "ava.coach@example.test",
    role: "coach",
    specialty: "Product leadership loops"
  },
  {
    id: "coach_omar",
    fullName: "Omar Chen",
    email: "omar.admin@example.test",
    role: "admin",
    specialty: "Engineering interview systems"
  }
];

export const demoCandidates: CandidateProfile[] = [
  {
    id: "cand_maya",
    fullName: "Maya Rivera",
    email: "maya.rivera@example.test",
    targetRole: "Product Manager",
    cohort: "June AI SaaS cohort",
    coachId: "coach_ava",
    practiceContext: {
      interviewFormat: "strategy_panel",
      jobDescriptionSignals: ["activation analytics", "AI onboarding experimentation", "cross-functional prioritization"],
      resumeEvidenceAnchors: ["first-invoice activation lift", "self-serve versus coached onboarding trade-off"]
    },
    readinessScore: 88,
    lastActiveAt: "2026-05-30T15:30:00Z"
  },
  {
    id: "cand_noah",
    fullName: "Noah Brooks",
    email: "noah.brooks@example.test",
    targetRole: "Full Stack Engineer",
    cohort: "June AI SaaS cohort",
    coachId: "coach_omar",
    practiceContext: {
      interviewFormat: "technical_loop",
      jobDescriptionSignals: ["secure provider boundaries", "low-latency scoring", "Supabase RLS ownership"],
      resumeEvidenceAnchors: ["transcript scoring architecture", "provider-key isolation plan"]
    },
    readinessScore: 84,
    lastActiveAt: "2026-05-27T18:00:00Z"
  },
  {
    id: "cand_lena",
    fullName: "Lena Okafor",
    email: "lena.okafor@example.test",
    targetRole: "Product Manager",
    cohort: "Founders returning to PM",
    coachId: "coach_ava",
    practiceContext: {
      interviewFormat: "behavioral_loop",
      jobDescriptionSignals: ["founder-to-PM storytelling", "metric ownership", "coachability under pressure"],
      resumeEvidenceAnchors: ["founder operating cadence", "post-feedback practice plan"]
    },
    readinessScore: 78,
    lastActiveAt: "2026-05-28T19:15:00Z"
  }
];

export const questionBank: QuestionBankItem[] = [
  {
    id: "q_behavioral_ownership",
    title: "Ownership under ambiguity",
    prompt:
      "Tell me about a time you owned a messy, ambiguous problem and moved it to a measurable outcome.",
    roleFocus: "Product Manager",
    difficulty: "intermediate",
    tags: ["behavioral", "ownership", "ambiguity", "STAR"],
    rubricFocus: ["Communication", "Structure", "Coachability"]
  },
  {
    id: "q_product_strategy",
    title: "Product strategy trade-off",
    prompt:
      "You have two quarters to improve activation for an AI SaaS onboarding flow. How do you prioritize bets?",
    roleFocus: "Product Manager",
    difficulty: "senior",
    tags: ["strategy", "metrics", "prioritization"],
    rubricFocus: ["Role Depth", "Structure"]
  },
  {
    id: "q_fullstack_architecture",
    title: "AI feature architecture",
    prompt:
      "Design a low-latency interview feedback feature that stores transcripts, scores rubrics, and keeps provider keys safe.",
    roleFocus: "Full Stack Engineer",
    difficulty: "senior",
    tags: ["architecture", "security", "supabase", "provider-boundary"],
    rubricFocus: ["Role Depth", "Communication"]
  },
  {
    id: "q_coachability_followup",
    title: "Coachability follow-up",
    prompt:
      "What feedback have you received that changed your next interview performance?",
    roleFocus: "All roles",
    difficulty: "foundational",
    tags: ["coachability", "reflection", "growth"],
    rubricFocus: ["Coachability", "Communication"]
  }
];

export const rubricCategories: RubricCategory[] = [
  {
    id: "rubric_communication",
    category: "Communication",
    description: "Clear, concise answer framing with concrete evidence.",
    maxScore: 25
  },
  {
    id: "rubric_role_depth",
    category: "Role Depth",
    description: "Shows domain-specific judgment for the target role.",
    maxScore: 25
  },
  {
    id: "rubric_structure",
    category: "Structure",
    description: "Uses a repeatable structure such as STAR, problem/constraints/options, or metric tree.",
    maxScore: 25
  },
  {
    id: "rubric_coachability",
    category: "Coachability",
    description: "Responds to feedback and identifies deliberate practice actions.",
    maxScore: 25
  }
];

export const demoSessions: InterviewSession[] = [
  {
    id: "sess_maya_behavioral",
    title: "PM behavioral screen",
    candidateId: "cand_maya",
    coachId: "coach_ava",
    targetRole: "Product Manager",
    status: "completed",
    scheduledFor: "2026-05-21",
    durationMinutes: 42,
    selectedQuestionIds: ["q_behavioral_ownership", "q_coachability_followup"],
    followUpMode: "mock_ai",
    finalScore: 76
  },
  {
    id: "sess_maya_strategy",
    title: "PM product strategy loop",
    candidateId: "cand_maya",
    coachId: "coach_ava",
    targetRole: "Product Manager",
    status: "completed",
    scheduledFor: "2026-05-29",
    durationMinutes: 48,
    selectedQuestionIds: ["q_product_strategy", "q_behavioral_ownership"],
    followUpMode: "mock_ai",
    finalScore: 88
  },
  {
    id: "sess_noah_architecture",
    title: "Full-stack architecture loop",
    candidateId: "cand_noah",
    coachId: "coach_omar",
    targetRole: "Full Stack Engineer",
    status: "completed",
    scheduledFor: "2026-05-25",
    durationMinutes: 55,
    selectedQuestionIds: ["q_fullstack_architecture", "q_coachability_followup"],
    followUpMode: "mock_ai",
    finalScore: 84
  },
  {
    id: "sess_lena_metrics",
    title: "PM analytics and prioritization",
    candidateId: "cand_lena",
    coachId: "coach_ava",
    targetRole: "Product Manager",
    status: "completed",
    scheduledFor: "2026-05-26",
    durationMinutes: 45,
    selectedQuestionIds: ["q_product_strategy", "q_coachability_followup"],
    followUpMode: "mock_ai",
    finalScore: 84
  },
  {
    id: "sess_lena_followup",
    title: "Coachability tune-up",
    candidateId: "cand_lena",
    coachId: "coach_ava",
    targetRole: "Product Manager",
    status: "scheduled",
    scheduledFor: "2026-06-03",
    durationMinutes: 30,
    selectedQuestionIds: ["q_behavioral_ownership", "q_coachability_followup"],
    followUpMode: "mock_ai"
  }
];

export const demoInterviewSession = demoSessions[1];

export const demoTranscript: TranscriptTurn[] = [
  {
    id: "turn_001",
    sessionId: demoInterviewSession.id,
    speaker: "coach",
    timestamp: "00:00",
    text: "Walk me through a time you took ownership of an ambiguous product problem.",
    questionId: "q_behavioral_ownership"
  },
  {
    id: "turn_002",
    sessionId: demoInterviewSession.id,
    speaker: "candidate",
    timestamp: "00:31",
    text:
      "At a billing startup, trial activation was flat and ownership was split between sales, product, and onboarding. I mapped the funnel, found that teams were optimizing different definitions of activation, and set a shared target around first successful invoice. We shipped guided setup, a weekly metric review, and reduced time-to-value by 34% in six weeks.",
    questionId: "q_behavioral_ownership"
  },
  {
    id: "turn_003",
    sessionId: demoInterviewSession.id,
    speaker: "ai",
    timestamp: "01:42",
    text:
      "Follow-up: which trade-off did you make when sales wanted a high-touch path and product wanted self-serve only?",
    questionId: "q_behavioral_ownership"
  },
  {
    id: "turn_004",
    sessionId: demoInterviewSession.id,
    speaker: "candidate",
    timestamp: "02:14",
    text:
      "I separated the first invoice milestone from expansion education. We kept the first-use journey self-serve, then triggered a human coaching offer after the first invoice for accounts with three or more invited teammates.",
    questionId: "q_behavioral_ownership"
  }
];

export function findCandidate(candidateId: string): CandidateProfile | undefined {
  return demoCandidates.find((candidate) => candidate.id === candidateId);
}

export function findCoach(coachId: string): CoachProfile | undefined {
  return demoCoaches.find((coach) => coach.id === coachId);
}

export function questionsForSession(session: InterviewSession): QuestionBankItem[] {
  const selected = new Set(session.selectedQuestionIds);
  return questionBank.filter((question) => selected.has(question.id));
}
