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

function transcriptWithCandidateAnswers(answers: string[]): TranscriptTurn[] {
  return answers.flatMap((text, index) => [
    {
      id: `turn_${index}_coach`,
      sessionId: "sess_test",
      speaker: "coach" as const,
      timestamp: `0${index}:00`,
      text: index === 0 ? "Tell me about a difficult decision." : "How did you handle a disagreement?",
      questionId: index === 0 ? "q_decision" : "q_disagreement"
    },
    {
      id: `turn_${index}_candidate`,
      sessionId: "sess_test",
      speaker: "candidate" as const,
      timestamp: `0${index}:20`,
      text,
      questionId: index === 0 ? "q_decision" : "q_disagreement"
    }
  ]);
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
    expect(first.question).toContain("first-invoice activation lift");
    expect(first.reason).toContain("ownership");
    expect(first.reason).toContain("activation analytics");
  });

  it("falls back to a concrete resume example when candidate context is unavailable", async () => {
    const provider = createMockInterviewAiProvider();
    const followUp = await provider.generateFollowUp({
      session: { ...demoInterviewSession, candidateId: "cand_missing" },
      questionId: "q_behavioral_ownership",
      transcript: demoTranscript
    });

    expect(followUp.question).toContain("Anchor the answer in one concrete resume example.");
    expect(followUp.question).not.toContain("undefined");
    expect(followUp.reason).toContain("backed by resume evidence");
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

  it("recognizes written percentages as measurable result evidence", async () => {
    const provider = createMockInterviewAiProvider();
    const report = await provider.generateFeedbackReport({
      session: demoInterviewSession,
      transcript: transcriptWithCandidateAnswer(
        "I owned the onboarding experiment and increased activation by 28 percent after testing two alternatives."
      )
    });
    const communication = report.rubricScores.find((score) => score.category === "Communication");

    expect(communication?.score).toBe(22);
    expect(communication?.evidence).toContain("28 percent");
  });

  it("does not award quantitative evidence credit for a vague improvement claim", async () => {
    const provider = createMockInterviewAiProvider();
    const report = await provider.generateFeedbackReport({
      session: demoInterviewSession,
      transcript: transcriptWithCandidateAnswer(
        "I owned the onboarding redesign, aligned the team, and significantly increased activation after launch."
      )
    });
    const communication = report.rubricScores.find((score) => score.category === "Communication");

    expect(communication?.score).toBe(18);
    expect(communication?.evidence).toBe("Needs one sharper measurable outcome.");
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
  it("connects scripted language risks to candidate target role and practice context", async () => {
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
    expect(scriptedRisks[0]).toContain("Product Manager");
    expect(scriptedRisks[0]).toContain("activation analytics");
    expect(scriptedRisks[0]).toContain("rehearsed corporate language");
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


describe("mock interview AI provider - answer focus", () => {
  it("flags a developed answer that delays the candidate action behind a long setup", async () => {
    const provider = createMockInterviewAiProvider();
    const backgroundHeavyTranscript = transcriptWithCandidateAnswer(
      "The company had expanded into three markets, and each region used a different onboarding process with separate reporting definitions. " +
      "Sales focused on signed contracts, support tracked completed setup calls, and product counted the first dashboard visit. " +
      "Leadership had debated the discrepancy for two quarters while customer complaints increased and several renewal conversations exposed the same confusion. " +
      "Before the planning cycle, there was still no shared owner, baseline, or decision rule for comparing the regional experiences. " +
      "I mapped the full funnel, interviewed six account leads, and chose first successful invoice as the shared activation measure. " +
      "We then reduced time-to-value by 24% in six weeks, and I learned to align the metric before proposing experiments."
    );

    const report = await provider.generateFeedbackReport({
      session: demoInterviewSession,
      transcript: backgroundHeavyTranscript
    });

    const focusRisks = report.risks.filter((risk) => risk.includes("Answer focus arrives late"));
    expect(focusRisks).toHaveLength(1);
    expect(focusRisks[0]).toContain("first 45 words");
    expect(focusRisks[0]).toContain("Front-load the decision");
  });

  it("accepts a developed answer that names the candidate action early", async () => {
    const provider = createMockInterviewAiProvider();
    const focusedTranscript = transcriptWithCandidateAnswer(
      "I mapped the onboarding funnel first and chose first successful invoice as the shared activation measure. " +
      "The company had expanded into three markets, and each region used a different process with separate reporting definitions. " +
      "I interviewed six account leads, compared the regional experiences, and presented one decision rule to sales, support, and product. " +
      "We tested two guided setup paths, reduced time-to-value by 24% in six weeks, and increased activation across the next three customer cohorts. " +
      "I learned to align teams on the decision metric before proposing experiments, and since then I start every rollout that way."
    );

    const report = await provider.generateFeedbackReport({
      session: demoInterviewSession,
      transcript: focusedTranscript
    });

    const focusRisks = report.risks.filter((risk) => risk.includes("Answer focus arrives late"));
    expect(focusRisks).toHaveLength(0);
  });
});

describe("mock interview AI provider — personal contribution clarity", () => {
  it("flags team-level answers that hide the candidate's personal contribution", async () => {
    const provider = createMockInterviewAiProvider();
    const teamOnlyTranscript = transcriptWithCandidateAnswer(
      "We improved activation by 31% after the team shipped a redesigned onboarding path. " +
      "The team aligned sales, product, and support around one funnel metric. " +
      "We launched three experiments and reduced time-to-value by two weeks while the organization adopted the new process."
    );

    const report = await provider.generateFeedbackReport({
      session: demoInterviewSession,
      transcript: teamOnlyTranscript
    });

    const contributionRisks = report.risks.filter((risk) =>
      risk.includes("Personal contribution is hard to verify")
    );
    expect(contributionRisks.length).toBeGreaterThanOrEqual(1);
    expect(contributionRisks[0]).toContain("personally owned");
    expect(contributionRisks[0]).toContain("AI-assisted answers");
  });

  it("does not flag team outcomes when the candidate names their own action", async () => {
    const provider = createMockInterviewAiProvider();
    const personallyAnchoredTranscript = transcriptWithCandidateAnswer(
      "I mapped the onboarding funnel, interviewed five sales reps, and decided which step to remove first. " +
      "We reduced time-to-value by two weeks after I presented the rollout plan to support and product leads."
    );

    const report = await provider.generateFeedbackReport({
      session: demoInterviewSession,
      transcript: personallyAnchoredTranscript
    });

    const contributionRisks = report.risks.filter((risk) =>
      risk.includes("Personal contribution is hard to verify")
    );
    expect(contributionRisks).toHaveLength(0);
  });
});

describe("mock interview AI provider — STAR reflection", () => {
  it("flags developed answers that omit a lesson or next-time adjustment", async () => {
    const provider = createMockInterviewAiProvider();
    const noReflectionTranscript = transcriptWithCandidateAnswer(
      "I mapped the onboarding funnel, interviewed five sales reps, and decided which step to remove first. " +
      "I presented the rollout plan to support and product leads, and we reduced time-to-value by two weeks. " +
      "The change increased activation by 31% across the next three customer cohorts."
    );

    const report = await provider.generateFeedbackReport({
      session: demoInterviewSession,
      transcript: noReflectionTranscript
    });

    const reflectionRisks = report.risks.filter((risk) => risk.includes("Reflection is missing"));
    expect(reflectionRisks).toHaveLength(1);
    expect(reflectionRisks[0]).toContain("would change next time");
  });

  it("accepts a concise reflection grounded in what the candidate learned", async () => {
    const provider = createMockInterviewAiProvider();
    const reflectiveTranscript = transcriptWithCandidateAnswer(
      "I mapped the onboarding funnel, interviewed five sales reps, and decided which step to remove first. " +
      "I presented the rollout plan to support and product leads, and we reduced time-to-value by two weeks. " +
      "I learned to agree on the decision metric before proposing experiments, and since then I start every rollout that way."
    );

    const report = await provider.generateFeedbackReport({
      session: demoInterviewSession,
      transcript: reflectiveTranscript
    });

    const reflectionRisks = report.risks.filter((risk) => risk.includes("Reflection is missing"));
    expect(reflectionRisks).toHaveLength(0);
  });
});

describe("mock interview AI provider — filler pacing", () => {
  it("flags repeated fillers when they make a developed answer harder to follow", async () => {
    const provider = createMockInterviewAiProvider();
    const fillerHeavyTranscript = transcriptWithCandidateAnswer(
      "Um, I mean, the onboarding funnel was unclear, and, uh, basically, I started by mapping each handoff. " +
      "You know, I interviewed sales and support, and, um, I kind of found that every team used a different activation definition. " +
      "I mean, I set one shared measure, tested two paths, and reduced time-to-value by 24% in six weeks."
    );

    const report = await provider.generateFeedbackReport({
      session: demoInterviewSession,
      transcript: fillerHeavyTranscript
    });

    const fillerRisks = report.risks.filter((risk) => risk.includes("Frequent filler language"));
    expect(fillerRisks).toHaveLength(1);
    expect(fillerRisks[0]).toContain("brief pause");
  });

  it("allows an occasional filler in an otherwise clear answer", async () => {
    const provider = createMockInterviewAiProvider();
    const conversationalTranscript = transcriptWithCandidateAnswer(
      "Um, I mapped the onboarding funnel and interviewed sales, product, and support to find the conflicting activation definitions. " +
      "I chose first successful invoice as the shared measure, tested two guided setup paths, and reduced time-to-value by 24% in six weeks. " +
      "I learned to align teams on the decision metric before proposing experiments."
    );

    const report = await provider.generateFeedbackReport({
      session: demoInterviewSession,
      transcript: conversationalTranscript
    });

    const fillerRisks = report.risks.filter((risk) => risk.includes("Frequent filler language"));
    expect(fillerRisks).toHaveLength(0);
  });
});

describe("mock interview AI provider — answer adaptability", () => {
  it("flags memorized openings repeated across different interview questions", async () => {
    const provider = createMockInterviewAiProvider();
    const report = await provider.generateFeedbackReport({
      session: demoInterviewSession,
      transcript: transcriptWithCandidateAnswers([
        "The most important thing to understand about this situation is that I owned the launch decision and reduced onboarding time by two weeks.",
        "The most important thing to understand about this situation is that I mapped the disagreement and proposed a shared decision rule."
      ])
    });

    const adaptabilityRisks = report.risks.filter((risk) => risk.includes("Repeated 8-word opening"));
    expect(adaptabilityRisks).toHaveLength(1);
    expect(adaptabilityRisks[0]).toContain("adapted to the question");
  });

  it("allows answers that open with question-specific decisions", async () => {
    const provider = createMockInterviewAiProvider();
    const report = await provider.generateFeedbackReport({
      session: demoInterviewSession,
      transcript: transcriptWithCandidateAnswers([
        "I paused the launch after the pilot exposed a billing error, then fixed the rollout plan with finance.",
        "I mapped the disagreement to two competing success metrics and proposed a shared decision rule."
      ])
    });

    const adaptabilityRisks = report.risks.filter((risk) => risk.includes("Repeated 8-word opening"));
    expect(adaptabilityRisks).toHaveLength(0);
  });
});
