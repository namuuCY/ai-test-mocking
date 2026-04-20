import test from "node:test";
import assert from "node:assert/strict";

import {
  filterComparablePracticeResults,
  getPotionResultConfigSignature,
  summarizeResultsByGame,
} from "../../src/web/storage.mjs";

test("potion summaries compare only records with the same config snapshot", () => {
  const results = [
    {
      id: "legacy-default",
      gameId: "potion",
      practiceScore: 81,
      playedAt: "2026-04-20T09:00:00.000Z",
    },
    {
      id: "potion-40-10",
      gameId: "potion",
      practiceScore: 88,
      playedAt: "2026-04-21T09:00:00.000Z",
      configSnapshot: {
        sessionQuestionCount: 40,
        questionTimeLimitSec: 10,
      },
    },
    {
      id: "sequence-any",
      gameId: "sequence",
      practiceScore: 77,
      playedAt: "2026-04-21T10:00:00.000Z",
    },
  ];

  const comparableResults = filterComparablePracticeResults(results, {
    potionConfig: {
      sessionQuestionCount: 40,
      questionTimeLimitSec: 10,
    },
  });
  const summary = summarizeResultsByGame(results, {
    potionConfig: {
      sessionQuestionCount: 40,
      questionTimeLimitSec: 10,
    },
  });

  assert.deepEqual(
    comparableResults.map((result) => result.id),
    ["potion-40-10", "sequence-any"],
  );
  assert.equal(summary.potion.latest.id, "potion-40-10");
  assert.equal(summary.potion.best.id, "potion-40-10");
  assert.equal(summary.sequence.latest.id, "sequence-any");
});

test("legacy potion records without config snapshots default to the original settings", () => {
  const legacyResult = {
    id: "legacy-default",
    gameId: "potion",
    practiceScore: 81,
    playedAt: "2026-04-20T09:00:00.000Z",
  };

  assert.equal(
    getPotionResultConfigSignature(legacyResult),
    "potion:100:3",
  );
  assert.equal(
    getPotionResultConfigSignature({
      sessionQuestionCount: 40,
      questionTimeLimitSec: 10,
    }),
    "potion:40:10",
  );
});
