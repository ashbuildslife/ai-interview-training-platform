import { questionBank, rubricCategories } from "../demo-data";
import type {
  FeedbackReport,
  FeedbackReportRequest,
  FollowUpRequest,
  FollowUpResponse,
  InterviewAiProvider,
  RubricScore,
  TranscriptTurn
} from "../types";

function latestCandidateAnswer(transcript: TranscriptTurn[]): string {
  const answers = transcript.filter((turn) => turn.speaker === "candidate");
  return answers.at(-1)?.text ?? "";
}

function extractMetricEvidence(transcript: TranscriptTurn[]): string {
  const allCandidateAnswers = transcript
    .filter((turn) => turn.speaker === "candidate")
    .map((turn) => turn.text)
    .join(" ");
  const metricMatch = allCandidateAnswers.match(/\b\d+%|\b\d+\s+(weeks|months|days)\b/i);
  return metricMatch ? `Uses measurable evidence: ${metricMatch[0]}.` : "Needs one sharper measurable outcome.";
}

function buildRubricScores(transcript: TranscriptTurn[]): RubricScore[] {
  const joined = transcript.map((turn) => turn.text.toLowerCase()).join(" ");
  const hasMetric = /\d+%|reduced|increased|target|metric/.test(joined);
  const hasTradeoff = /trade-off|tradeoff|separated|priorit|option/.test(joined);
  const hasOwnership = /ownership|owned|shared target|moved/.test(joined);

  const scoreByCategory: Record<string, number> = {
    Communication: hasMetric ? 22 : 18,
    "Role Depth": hasTradeoff ? 21 : 17,
    Structure: hasOwnership ? 23 : 18,
    Coachability: 20
  };

  return rubricCategories.map((category) => ({
    category: category.category,
    score: scoreByCategory[category.category] ?? 18,
    maxScore: category.maxScore,
    evidence:
      category.category === "Communication"
        ? extractMetricEvidence(transcript)
        : category.category === "Role Depth"
          ? "Explains product constraints and the self-serve versus coached trade-off."
          : category.category === "Structure"
            ? "Frames context, action, and result in a STAR-like sequence."
            : "Identifies a concrete next practice loop with coach feedback."
  }));
}

const SCRIPTED_PATTERNS = [
  /\b(?:leveraged synergies|drove alignment|passionate about|circle back|deep dive|move the needle|low-hanging fruit|boil the ocean|thought leadership)\b/i,
  /\b(?:I believe that |What I would say is |In my experience, I've always )/gi
];

function detectScriptedLanguage(transcript: TranscriptTurn[]): string | null {
  const candidateText = transcript
    .filter((turn) => turn.speaker === "candidate")
    .map((turn) => turn.text)
    .join(" ");

  const hits = SCRIPTED_PATTERNS
    .flatMap((pattern) => candidateText.match(pattern) ?? [])
    .filter((hit) => hit.length > 0);

  if (hits.length === 0) return null;

  const phrases = hits.map((hit) => `"${hit}"`).join(", ");
  return `Detected ${hits.length} scripted-sounding phrase(s): ${phrases}. Answers may sound rehearsed or AI-polished rather than authentic.`;
}

export function createMockInterviewAiProvider(): InterviewAiProvider {
  return {
    provider: "mock",
    async generateFollowUp(request: FollowUpRequest): Promise<FollowUpResponse> {
      const baseQuestion = questionBank.find((question) => question.id === request.questionId);
      const focus = baseQuestion?.tags.includes("ownership") ? "ownership" : baseQuestion?.tags[0] ?? "judgment";
      const answer = latestCandidateAnswer(request.transcript);
      const asksForTradeoff = /trade-off|tradeoff|option|priorit/i.test(answer);

      return {
        question: `For the ${request.session.targetRole} loop, go one layer deeper: ${
          asksForTradeoff
            ? "what signal told you the trade-off was working?"
            : "what trade-off did you make, and how did you know it worked?"
        }`,
        reason: `Targets ${focus} because the candidate gave context and outcome, but the coach still needs a sharper decision signal.`,
        coachGuidance:
          "Ask for one metric, one rejected alternative, and one reflection on what the candidate would do differently."
      };
    },
    async generateFeedbackReport(request: FeedbackReportRequest): Promise<FeedbackReport> {
      const rubricScores = buildRubricScores(request.transcript);
      const total = rubricScores.reduce((sum, score) => sum + score.score, 0);

      const risks: string[] = [
        "Opening setup runs long before the action/result appears.",
        "Could make the rejected alternative and stakeholder alignment clearer."
      ];

      const scriptedFlag = detectScriptedLanguage(request.transcript);
      if (scriptedFlag) {
        risks.push(scriptedFlag);
      }

      return {
        sessionId: request.session.id,
        generatedAt: "2026-06-04T19:55:00Z",
        overallScore: total,
        summary:
          "Strong practice loop: the candidate anchors the answer in a business outcome, names a real cross-functional trade-off, and can improve by tightening the first 30 seconds.",
        strengths: [
          "Uses a concrete activation metric instead of vague collaboration language.",
          "Connects ownership to a shipped product change and measurable time-to-value improvement.",
          "Responds well to follow-up pressure about trade-offs."
        ],
        risks,
        recommendedPractice:
          "Practice a 90-second STAR answer: Situation in one sentence, Task/decision in one sentence, Action with one trade-off, Result with one metric, then one reflection. Record two reps before the next coach review.",
        rubricScores
      };
    }
  };
}
