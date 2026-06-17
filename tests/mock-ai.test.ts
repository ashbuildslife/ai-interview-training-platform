import { describe, expect, it } from "vitest";
import { createMockInterviewAiProvider } from "@/lib/providers/mock";
import { demoInterviewSession, demoTranscript } from "@/lib/demo-data";
import type { TranscriptTurn } from "@/lib/types";

function transcriptWithCandidateAnswer(text: string): TranscriptTurn[] {
  return [
    {
      id: "turn_001",
      sessionId: "sess_test",
      speaker: "coach",
      timestamp: "00:00",
      text: "Tell me about a time you led a cross-functional initiative.",
      questionId: "q_behavioral_ownership"
    },
    {
      id: "turn_002",
      sessionId: "sess_test",
      speaker: "candidate",
      timestamp: "00:20",
      text,
      questionId: "q_behavioral_ownership"
    }
  ];
}

describe("mock interview AI provider", () => {
  it("generates deterministic follow-up questions from role, question, and transcript context", async () => {
    const provider = createMockInterviewAiProvider();

    const first = await provider.generateFollowUp({
      session: demoInterviewSession,
      questionId: "q_behavioral_ownership",
      transcript: demoTranscript
    });
    const second = await provider.generateFollowUp({
      session: demoInterviewSession,
      questionId: "q_behavioral_ownership",
      transcript: demoTranscript
    });

    expect(first).toEqual(second);
    expect(first.question).toContain("Product Manager");
    expect(first.reason).toContain("ownership");
  });

  it("scores rubric categories and produces a feedback report with next steps", async () => {
    const provider = createMockInterviewAiProvider();

    const report = await provider.generateFeedbackReport({
      session: demoInterviewSession,
      transcript: demoTranscript
    });

    expect(report.overallScore).toBeGreaterThanOrEqual(70);
    expect(report.rubricScores).toHaveLength(4);
    expect(report.rubricScores.map((score) => score.category)).toEqual([
      "Communication",
      "Role Depth",
      "Structure",
      "Coachability"
    ]);
    expect(report.rubricScores[0].evidence).toContain("34%");
    expect(report.recommendedPractice).toContain("STAR");
  });

  it("does not flag scripted language when transcript uses concrete evidence", async () => {
    const provider = createMockInterviewAiProvider();

    const report = await provider.generateFeedbackReport({
      session: demoInterviewSession,
      transcript: demoTranscript
    });

    const scriptedRisks = report.risks.filter((risk) =>
      risk.includes("scripted")
    );
    expect(scriptedRisks).toHaveLength(0);
  });

  it("flags scripted language in feedback risks when transcript contains business buzzwords", async () => {
    const provider = createMockInterviewAiProvider();
    const buzzwordTranscript = transcriptWithCandidateAnswer(
      "I believe that we leveraged synergies across the organization to drive alignment. What I would say is that passionate about moving the needle, we were able to circle back and deep dive into the low-hanging fruit."
    );

    const report = await provider.generateFeedbackReport({
      session: demoInterviewSession,
      transcript: buzzwordTranscript
    });

    const scriptedRisks = report.risks.filter((risk) =>
      risk.includes("scripted")
    );
    expect(scriptedRisks.length).toBeGreaterThanOrEqual(1);
    expect(scriptedRisks[0]).toContain("rehearsed");
  });
});

describe("mock interview AI provider — over-polished detection", () => {
  it("flags flawless answers with no conversational markers as over-polished", async () => {
    const provider = createMockInterviewAiProvider();
    const polishedTranscript = transcriptWithCandidateAnswer(
      "I identified the core bottleneck in our onboarding funnel. " +
      "The activation rate had remained flat for three consecutive quarters. " +
      "I proposed a structured experiment framework with four treatment arms. " +
      "The winning variant reduced time-to-first-value by 28 percent, " +
      "and I presented the results to the executive team with a written recommendation. " +
      "We adopted the change across all product lines the following quarter."
    );

    const report = await provider.generateFeedbackReport({
      session: demoInterviewSession,
      transcript: polishedTranscript
    });

    const overPolishedRisks = report.risks.filter((risk) =>
      risk.includes("unusually polished")
    );
    expect(overPolishedRisks.length).toBeGreaterThanOrEqual(1);
    expect(overPolishedRisks[0]).toContain("conversational markers");
    expect(overPolishedRisks[0]).toContain("hiring managers");
  });

  it("does not flag natural-sounding answers with casual speech markers as over-polished", async () => {
    const provider = createMockInterviewAiProvider();
    const naturalTranscript = transcriptWithCandidateAnswer(
      "Um, so I think the main problem, you know, was that nobody actually owned the funnel. " +
      "I mean, sales had their version, product had theirs — and honestly, " +
      "I sort of just started mapping it out because, like, it was blocking everything. " +
      "We ended up reducing the time-to-value by about 34% which was, uh, pretty solid. " +
      "I'd say the hardest part was getting everyone to agree on a shared metric."
    );

    const report = await provider.generateFeedbackReport({
      session: demoInterviewSession,
      transcript: naturalTranscript
    });

    const overPolishedRisks = report.risks.filter((risk) =>
      risk.includes("unusually polished")
    );
    expect(overPolishedRisks).toHaveLength(0);
  });

  it("does not flag short answers (under 200 chars) as over-polished", async () => {
    const provider = createMockInterviewAiProvider();
    const shortTranscript = transcriptWithCandidateAnswer(
      "I led the onboarding redesign and we shipped it in four weeks."
    );

    const report = await provider.generateFeedbackReport({
      session: demoInterviewSession,
      transcript: shortTranscript
    });

    const overPolishedRisks = report.risks.filter((risk) =>
      risk.includes("unusually polished")
    );
    expect(overPolishedRisks).toHaveLength(0);
  });
});
