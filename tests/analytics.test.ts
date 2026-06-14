import { describe, expect, it } from "vitest";
import { computeAdminAnalytics, buildCandidateProgressTimeline } from "@/lib/analytics";
import { demoCandidates, demoSessions } from "@/lib/demo-data";

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
      expect(candidate.practiceContext.resumeEvidenceAnchors.length).toBeGreaterThanOrEqual(2);
    }

    expect(demoCandidates[0].practiceContext.jobDescriptionSignals).toContain("activation analytics");
  });
});
