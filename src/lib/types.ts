export type AppRole = "candidate" | "coach" | "admin";

export type SessionStatus = "draft" | "scheduled" | "in_progress" | "completed";

export interface CandidateProfile {
  id: string;
  fullName: string;
  email: string;
  targetRole: string;
  cohort: string;
  coachId: string;
  practiceContext: CandidatePracticeContext;
  readinessScore: number;
  lastActiveAt: string;
}

export interface CandidatePracticeContext {
  interviewFormat: "recruiter_screen" | "behavioral_loop" | "technical_loop" | "strategy_panel";
  jobDescriptionSignals: string[];
  resumeEvidenceAnchors: string[];
}

export interface CoachProfile {
  id: string;
  fullName: string;
  email: string;
  role: Extract<AppRole, "coach" | "admin">;
  specialty: string;
}

export interface QuestionBankItem {
  id: string;
  title: string;
  prompt: string;
  roleFocus: string;
  difficulty: "foundational" | "intermediate" | "senior";
  tags: string[];
  rubricFocus: string[];
}

export interface InterviewSession {
  id: string;
  title: string;
  candidateId: string;
  coachId: string;
  targetRole: string;
  status: SessionStatus;
  scheduledFor: string;
  durationMinutes: number;
  selectedQuestionIds: string[];
  followUpMode: "mock_ai" | "manual";
  finalScore?: number;
}

export interface TranscriptTurn {
  id: string;
  sessionId: string;
  speaker: "candidate" | "coach" | "ai";
  timestamp: string;
  text: string;
  questionId?: string;
}

export interface RubricCategory {
  id: string;
  category: string;
  description: string;
  maxScore: number;
}

export interface RubricScore {
  category: string;
  score: number;
  maxScore: number;
  evidence: string;
}

export interface FeedbackReport {
  sessionId: string;
  generatedAt: string;
  overallScore: number;
  summary: string;
  strengths: string[];
  risks: string[];
  recommendedPractice: string;
  rubricScores: RubricScore[];
}

export interface FollowUpRequest {
  session: InterviewSession;
  questionId: string;
  transcript: TranscriptTurn[];
}

export interface FollowUpResponse {
  question: string;
  reason: string;
  coachGuidance: string;
}

export interface FeedbackReportRequest {
  session: InterviewSession;
  transcript: TranscriptTurn[];
}

export interface InterviewAiProvider {
  provider: "mock" | "openai" | "anthropic";
  generateFollowUp(request: FollowUpRequest): Promise<FollowUpResponse>;
  generateFeedbackReport(request: FeedbackReportRequest): Promise<FeedbackReport>;
}
