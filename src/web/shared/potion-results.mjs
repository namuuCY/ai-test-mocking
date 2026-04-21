import { roundNumber } from "./formatters.mjs";

export function getPotionSessionDurationMs(session) {
  if (session.startedAt && session.endedAt) {
    const durationMs =
      Date.parse(session.endedAt) - Date.parse(session.startedAt);
    return Number.isFinite(durationMs) && durationMs > 0
      ? durationMs
      : session.completedQuestionCount *
          session.config.questionTimeLimitSec *
          1000;
  }

  return (
    session.completedQuestionCount * session.config.questionTimeLimitSec * 1000
  );
}

export function createPotionPracticeResult(session) {
  if (!session?.summary) {
    return null;
  }

  return {
    id: session.id,
    gameId: "potion",
    playedAt: session.endedAt ?? new Date().toISOString(),
    practiceScore: roundNumber(session.summary.practiceScore, 2),
    practiceAccuracy: roundNumber(session.summary.practiceAccuracy, 4),
    roundsCompleted: session.completedQuestionCount,
    durationMs: getPotionSessionDurationMs(session),
    configSnapshot: {
      sessionQuestionCount: session.config.sessionQuestionCount,
      questionTimeLimitSec: session.config.questionTimeLimitSec,
    },
  };
}
