import test from "node:test";
import assert from "node:assert/strict";

import { createPotionPracticeResult } from "../../src/web/shared/potion-results.mjs";
import {
  createPotionGameConfig,
  createPotionSession,
  submitPotionAnswer,
} from "../../src/web/potion-engine.mjs";

test("finished potion sessions can be serialized into saved practice results", () => {
  const config = createPotionGameConfig({
    sessionQuestionCount: 2,
    questionTimeLimitSec: 3,
  });

  const session = createPotionSession({
    config,
    comboCatalog: [{ id: "combo-A" }],
    dominantColorByComboId: { "combo-A": "blue" },
    questionPlan: ["combo-A", "combo-A"],
    sessionId: "potion-session-finished",
    createdAt: "2026-04-17T00:00:00.000Z",
  });

  const firstTurn = submitPotionAnswer(
    session,
    {
      selectedColor: "blue",
      actualColor: "blue",
      responseTimeMs: 1000,
    },
    {
      answeredAt: "2026-04-17T00:00:01.000Z",
    },
  );

  const finalTurn = submitPotionAnswer(
    firstTurn.session,
    {
      selectedColor: "blue",
      actualColor: "blue",
      responseTimeMs: 1250,
    },
    {
      answeredAt: "2026-04-17T00:00:03.250Z",
    },
  );

  const practiceResult = createPotionPracticeResult(finalTurn.session);

  assert.deepEqual(practiceResult, {
    id: "potion-session-finished",
    gameId: "potion",
    playedAt: "2026-04-17T00:00:03.250Z",
    practiceScore: 90,
    practiceAccuracy: 1,
    roundsCompleted: 2,
    durationMs: 2250,
    configSnapshot: {
      sessionQuestionCount: 2,
      questionTimeLimitSec: 3,
    },
  });
});
