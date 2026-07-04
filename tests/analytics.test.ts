import { describe, expect, it } from "vitest";
import {
  auditCandidatePracticeContext,
  buildCandidateProgressTimeline,
  computeAdminAnalytics
} from "@/lib/analytics";
import { demoCandidates, demoSessions, questionBank } from "@/lib/demo-data";

describe("admin analytics", () => {
  it("summarizes candidate role coverage, completion rate, and average score", () => {
    const analytics = computeAdminAnalytics({
      candidates: demoCandidates,
      sessions: demoSessions
    });

    expect(analytics.totalCandidates).toBe(3);
    expect(analytics.sessionsCompleted).toBe(4);
    expect(analytics.averageScore).toBe(83);
    expect(analytics.roleCoverage).toEqual({
      "Product Manager": 2,
      "Full Stack Engineer": 1
    });
    expect(analytics.practiceContextReadyCandidates).toBe(3);
    expect(analytics.practiceContextGaps).toEqual([]);
  });

  it("builds a chronological progress timeline for one candidate", () => {
    const timeline = buildCandidateProgressTimeline({
      candidateId: "cand_maya",
      sessions: demoSessions
    });

    expect(timeline).toEqual([
      { date: "2026-05-21", score: 76, label: "PM behavioral screen" },
      { date: "2026-05-29", score: 88, label: "PM product strategy loop" }
    ]);
  });

  it("keeps candidates anchored to job-specific signals and resume evidence", () => {
    for (const candidate of demoCandidates) {
      expect(candidate.practiceContext.jobDescriptionSignals.length).toBeGreaterThanOrEqual(2);
      expect(candidate.practiceContext.companyResearchSignals.length).toBeGreaterThanOrEqual(1);
      expect(candidate.practiceContext.resumeEvidenceAnchors.length).toBeGreaterThanOrEqual(2);
    }

    expect(demoCandidates[0].practiceContext.jobDescriptionSignals).toContain("activation analytics");
    expect(demoCandidates[0].practiceContext.companyResearchSignals).toContain("usage-based pricing motion");
  });

  it("includes career-narrative practice for non-linear candidates", () => {
    const careerNarrativeQuestion = questionBank.find((question) => question.tags.includes("career-changer"));
    const lenaFollowUp = demoSessions.find((session) => session.id === "sess_lena_followup");

    expect(careerNarrativeQuestion?.prompt.toLowerCase()).toContain("transferable evidence");
    expect(careerNarrativeQuestion?.prompt.toLowerCase()).toContain("job description");
    expect(careerNarrativeQuestion?.tags).toContain("non-linear-path");
    expect(lenaFollowUp?.selectedQuestionIds).toContain("q_career_pivot_narrative");
  });

  it("flags generic or under-evidenced practice context before sessions become canned", () => {
    const gaps = auditCandidatePracticeContext([
      ...demoCandidates,
      {
        ...demoCandidates[0],
        id: "cand_generic",
        practiceContext: {
          interviewFormat: "recruiter_screen",
          jobDescriptionSignals: ["communication", "leadership"],
          companyResearchSignals: ["company research"],
          resumeEvidenceAnchors: ["teamwork"]
        }
      }
    ]);

    expect(gaps).toEqual([
      {
        candidateId: "cand_generic",
        missing: ["job_description_signals", "company_research_signals", "resume_evidence_anchors"]
      }
    ]);
  });
});
