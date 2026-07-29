import { findCandidate, questionBank, rubricCategories } from "../demo-data";
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

const QUANTIFIED_OUTCOME_PATTERNS = [
  /\b\d+(?:\.\d+)?\s*(?:%|percent\b)/i,
  /\b\d+(?:\.\d+)?x\b/i,
  /[$£€]\s?\d+(?:\.\d+)?(?:\s?[kmb])?\b/i,
  /\b\d+(?:\.\d+)?\s+(?:weeks?|months?|days?|hours?|minutes?)\b/i
];

function findQuantifiedOutcome(transcript: TranscriptTurn[]): string | null {
  const candidateText = transcript
    .filter((turn) => turn.speaker === "candidate")
    .map((turn) => turn.text)
    .join(" ");

  for (const pattern of QUANTIFIED_OUTCOME_PATTERNS) {
    const match = candidateText.match(pattern);
    if (match) return match[0];
  }

  return null;
}

function extractMetricEvidence(transcript: TranscriptTurn[]): string {
  const metric = findQuantifiedOutcome(transcript);
  return metric ? `Uses measurable evidence: ${metric}.` : "Needs one sharper measurable outcome.";
}

function buildRubricScores(transcript: TranscriptTurn[]): RubricScore[] {
  const joined = transcript.map((turn) => turn.text.toLowerCase()).join(" ");
  const hasMetric = findQuantifiedOutcome(transcript) !== null;
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

const CASUAL_SPEECH_MARKERS = [
  /\b(?:um|uh|er|hmm)\b/i,
  /\b(?:you know|I mean|like|sort of|kind of|basically|honestly|actually)\b/i,
  /\b(?:I think|I'd say|I guess|I feel like|I suppose|maybe|probably)\b/i,
  /\.{2,}/,
  /—/,
  /, like, /i
];

function detectOverPolishedText(transcript: TranscriptTurn[]): string | null {
  const candidateText = transcript
    .filter((turn) => turn.speaker === "candidate")
    .map((turn) => turn.text)
    .join(" ");

  if (candidateText.length < 200) return null;

  const hasNaturalMarker = CASUAL_SPEECH_MARKERS.some((pattern) =>
    pattern.test(candidateText)
  );

  if (!hasNaturalMarker) {
    return (
      "Answer reads as unusually polished with no conversational markers " +
      "(hesitations, reformulations, or hedging phrases). " +
      "In 2026, hiring managers increasingly flag flawlessly structured answers " +
      "as potential AI assistance — candidates benefit from preserving natural delivery."
    );
  }

  return null;
}

const FILLER_PATTERNS = [
  /\b(?:um+|uh+|er+|hmm+)\b/gi,
  /\b(?:you know|I mean|kind of|sort of|basically)\b/gi
];

function detectExcessiveFillerLanguage(transcript: TranscriptTurn[]): string | null {
  const candidateText = transcript
    .filter((turn) => turn.speaker === "candidate")
    .map((turn) => turn.text)
    .join(" ")
    .trim();
  const wordCount = candidateText.split(/\s+/).filter(Boolean).length;

  if (wordCount < 40) return null;

  const fillerCount = FILLER_PATTERNS.reduce(
    (count, pattern) => count + (candidateText.match(pattern) ?? []).length,
    0
  );
  const fillerRate = fillerCount / wordCount;

  if (fillerCount < 5 || fillerRate < 0.06) return null;

  return (
    `Frequent filler language (${fillerCount} instances across ${wordCount} words) may obscure the answer. ` +
    "Replace repeated fillers with a brief pause so the evidence and decision remain easy to follow."
  );
}

const ANSWER_FOCUS_PATTERN = /\b(?:I\s+(?:led|owned|built|decided|designed|shipped|measured|prioritized|mapped|changed|created|implemented|proposed|chose|rejected|validated|interviewed|analyzed|presented|set)|we\s+(?:delivered|shipped|built|improved|reduced|increased|launched|implemented|created|adopted))\b/i;
const MIN_DEVELOPED_ANSWER_WORDS = 80;
const MAX_BACKGROUND_WORDS = 45;

function detectDelayedAnswerFocus(transcript: TranscriptTurn[]): string | null {
  const candidateAnswers = transcript.filter((turn) => turn.speaker === "candidate");

  for (const answer of candidateAnswers) {
    const text = answer.text.trim();
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < MIN_DEVELOPED_ANSWER_WORDS) continue;

    const focusMatch = text.match(ANSWER_FOCUS_PATTERN);
    const wordsBeforeFocus = focusMatch?.index === undefined
      ? words.length
      : text.slice(0, focusMatch.index).split(/\s+/).filter(Boolean).length;

    if (wordsBeforeFocus > MAX_BACKGROUND_WORDS) {
      return (
        `Answer focus arrives late: this ${words.length}-word response does not name the candidate's ` +
        `action, decision, or result in the first ${MAX_BACKGROUND_WORDS} words. ` +
        "Front-load the decision, then keep only the background needed to understand it."
      );
    }
  }

  return null;
}

function detectWeakPersonalContribution(transcript: TranscriptTurn[]): string | null {
  const candidateText = transcript
    .filter((turn) => turn.speaker === "candidate")
    .map((turn) => turn.text)
    .join(" ");

  if (candidateText.length < 120) return null;

  const namesPersonalAction = /\b(?:I|my)\s+(?:led|owned|built|decided|designed|shipped|measured|prioritized|mapped|changed|created|implemented|proposed|chose|rejected|validated|interviewed|analyzed|presented)\b/i.test(
    candidateText
  );
  const leansOnTeamOutcome = /\b(?:we|the team|our team)\s+(?:delivered|shipped|built|improved|reduced|increased|launched|implemented|drove|created|adopted)\b/i.test(
    candidateText
  );

  if (leansOnTeamOutcome && !namesPersonalAction) {
    return (
      "Personal contribution is hard to verify: the answer leans on team-level outcomes " +
      "without naming the candidate's own decision, action, or evidence. " +
      "Recruiters probing AI-assisted answers will ask what they personally owned and " +
      "how their resume proof maps to the claim."
    );
  }

  return null;
}

function detectMissingReflection(transcript: TranscriptTurn[]): string | null {
  const candidateText = transcript
    .filter((turn) => turn.speaker === "candidate")
    .map((turn) => turn.text)
    .join(" ");

  if (candidateText.length < 120) return null;

  const namesReflection = /\b(?:I learned|I would do differently|I'd do differently|next time|in hindsight|since then|changed how I)\b/i.test(
    candidateText
  );

  if (!namesReflection) {
    return (
      "Reflection is missing: the answer gives context, action, or outcome without naming " +
      "what the candidate learned or would change next time. Add one concise lesson so the " +
      "STAR story shows adaptability instead of sounding memorized."
    );
  }

  return null;
}

export function createMockInterviewAiProvider(): InterviewAiProvider {
  return {
    provider: "mock",
    async generateFollowUp(request: FollowUpRequest): Promise<FollowUpResponse> {
      const baseQuestion = questionBank.find((question) => question.id === request.questionId);
      const focus = baseQuestion?.tags.includes("ownership") ? "ownership" : baseQuestion?.tags[0] ?? "judgment";
      const candidate = findCandidate(request.session.candidateId);
      const jobSignal = candidate?.practiceContext.jobDescriptionSignals[0];
      const evidenceAnchor = candidate?.practiceContext.resumeEvidenceAnchors[0];
      const answer = latestCandidateAnswer(request.transcript);
      const asksForTradeoff = /trade-off|tradeoff|option|priorit/i.test(answer);
      const roleContext = jobSignal ? ` on ${jobSignal}` : "";
      const evidencePrompt = evidenceAnchor
        ? `Anchor the answer in the resume evidence "${evidenceAnchor}".`
        : "Anchor the answer in one concrete resume example.";

      return {
        question: `For the ${request.session.targetRole} loop, go one layer deeper${roleContext}: ${
          asksForTradeoff
            ? "what signal told you the trade-off was working?"
            : "what trade-off did you make, and how did you know it worked?"
        } ${evidencePrompt}`,
        reason: `Targets ${focus}${
          jobSignal ? ` and the job signal "${jobSignal}"` : ""
        } because the candidate gave context and outcome, but the coach still needs a sharper decision signal backed by resume evidence.`,
        coachGuidance:
          "Ask for one metric, one rejected alternative, and one reflection on what the candidate would do differently."
      };
    },
    async generateFeedbackReport(request: FeedbackReportRequest): Promise<FeedbackReport> {
      const rubricScores = buildRubricScores(request.transcript);
      const total = rubricScores.reduce((sum, score) => sum + score.score, 0);

      const candidate = findCandidate(request.session.candidateId);
      const roleHint = candidate
        ? ` For ${candidate.targetRole} practice, ${candidate.practiceContext.jobDescriptionSignals.slice(0, 2).join(" and ")} signals carry more weight than rehearsed corporate language.`
        : "";

      const risks: string[] = [
        "Could make the rejected alternative and stakeholder alignment clearer."
      ];

      const delayedFocusFlag = detectDelayedAnswerFocus(request.transcript);
      if (delayedFocusFlag) {
        risks.push(delayedFocusFlag);
      }

      const scriptedFlag = detectScriptedLanguage(request.transcript);
      if (scriptedFlag) {
        risks.push(`${scriptedFlag}${roleHint}`);
      }

      const overPolishedFlag = detectOverPolishedText(request.transcript);
      if (overPolishedFlag) {
        risks.push(`${overPolishedFlag}${roleHint}`);
      }

      const fillerFlag = detectExcessiveFillerLanguage(request.transcript);
      if (fillerFlag) {
        risks.push(fillerFlag);
      }

      const personalContributionFlag = detectWeakPersonalContribution(request.transcript);
      if (personalContributionFlag) {
        risks.push(`${personalContributionFlag}${roleHint}`);
      }

      const missingReflectionFlag = detectMissingReflection(request.transcript);
      if (missingReflectionFlag) {
        risks.push(`${missingReflectionFlag}${roleHint}`);
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
