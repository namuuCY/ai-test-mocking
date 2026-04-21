import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_POTION_GAME_CONFIG,
  buildPotionComboCatalog,
  createPotionGameConfig,
  getPotionDominantColorProbabilityForQuestionCount,
  getPotionSpeedBandScore,
  scorePotionPracticeSession,
} from "../../src/games/potion/index.js";

test("default config produces the observed 14-combo catalog", () => {
  const comboCatalog = buildPotionComboCatalog();

  assert.equal(comboCatalog.length, DEFAULT_POTION_GAME_CONFIG.comboCountTotal);
  assert.equal(
    comboCatalog.filter((combo) => combo.sizeKey === "single").length,
    DEFAULT_POTION_GAME_CONFIG.comboCountBySize.single,
  );
  assert.equal(
    comboCatalog.filter((combo) => combo.sizeKey === "pair").length,
    DEFAULT_POTION_GAME_CONFIG.comboCountBySize.pair,
  );
  assert.equal(
    comboCatalog.filter((combo) => combo.sizeKey === "triple").length,
    DEFAULT_POTION_GAME_CONFIG.comboCountBySize.triple,
  );
});

test("speed bands follow the MVP thresholds including timeout", () => {
  assert.equal(
    getPotionSpeedBandScore({ selectedColor: "blue", responseTimeMs: 1500 }, DEFAULT_POTION_GAME_CONFIG),
    1.0,
  );
  assert.equal(
    getPotionSpeedBandScore({ selectedColor: "blue", responseTimeMs: 2400 }, DEFAULT_POTION_GAME_CONFIG),
    0.6,
  );
  assert.equal(
    getPotionSpeedBandScore({ selectedColor: "blue", responseTimeMs: 2700 }, DEFAULT_POTION_GAME_CONFIG),
    0.3,
  );
  assert.equal(
    getPotionSpeedBandScore({ selectedColor: "blue", responseTimeMs: 2950 }, DEFAULT_POTION_GAME_CONFIG),
    0.1,
  );
  assert.equal(
    getPotionSpeedBandScore({ selectedColor: null, timedOut: true }, DEFAULT_POTION_GAME_CONFIG),
    0,
  );
});

test("dominant-color probability scales with question count in the supported range", () => {
  assert.equal(
    getPotionDominantColorProbabilityForQuestionCount(100),
    0.8,
  );
  assert.equal(
    getPotionDominantColorProbabilityForQuestionCount(70),
    0.875,
  );
  assert.equal(
    getPotionDominantColorProbabilityForQuestionCount(40),
    0.95,
  );
  assert.equal(
    getPotionDominantColorProbabilityForQuestionCount(4),
    0.8,
  );

  const config = createPotionGameConfig({
    sessionQuestionCount: 50,
    questionTimeLimitSec: 10,
  });

  assert.equal(config.dominantColorProbability, 0.925);
});

test("speed bands stay proportional when the question time limit grows", () => {
  const config = createPotionGameConfig({
    sessionQuestionCount: 100,
    questionTimeLimitSec: 10,
  });

  assert.equal(
    getPotionSpeedBandScore({ selectedColor: "blue", responseTimeMs: 6000 }, config),
    1.0,
  );
  assert.equal(
    getPotionSpeedBandScore({ selectedColor: "blue", responseTimeMs: 8500 }, config),
    0.3,
  );
  assert.equal(
    getPotionSpeedBandScore({ selectedColor: "blue", responseTimeMs: 9800 }, config),
    0.1,
  );
});

test("practice scoring starts only after observed results establish a dominant color", () => {
  const config = createPotionGameConfig({
    sessionQuestionCount: 4,
  });
  const comboCatalog = [{ id: "A" }];

  const summary = scorePotionPracticeSession(
    [
      {
        comboId: "A",
        dominantColor: "red",
        actualColor: "blue",
        selectedColor: "blue",
        responseTimeMs: 1500,
      },
      {
        comboId: "A",
        dominantColor: "red",
        actualColor: "red",
        selectedColor: "blue",
        responseTimeMs: 2500,
      },
      {
        comboId: "A",
        dominantColor: "red",
        actualColor: "blue",
        selectedColor: "red",
        responseTimeMs: 500,
      },
      {
        comboId: "A",
        dominantColor: "red",
        actualColor: "blue",
        selectedColor: "blue",
        responseTimeMs: 2900,
      },
    ],
    {
      config,
      comboCatalog,
    },
  );

  assert.equal(summary.scoredQuestionCount, 2);
  assert.equal(summary.visibleSuccessCount, 1);
  assert.equal(summary.dominantChoiceCount, 2);
  assert.equal(summary.recoveryOpportunities, 1);
  assert.equal(summary.recoverySuccesses, 1);
  assert.equal(summary.practiceAccuracy, 0.5);
  assert.equal(summary.metrics.normalizedHitRate, 0.625);
  assert.equal(summary.metrics.dominantChoiceRate, 1);
  assert.equal(summary.metrics.responseSpeedScore, 0.2);
  assert.equal(summary.metrics.learningSpeed, 1);
  assert.equal(summary.metrics.recoveryRate, 1);
  assert.equal(summary.practiceScore, 70.875);
  assert.deepEqual(
    summary.questionBreakdown.map((question) => ({
      number: question.questionNumber,
      establishedDominantColor: question.establishedDominantColor,
      scoreEligible: question.scoreEligible,
      selectedDominant: question.selectedDominant,
    })),
    [
      {
        number: 1,
        establishedDominantColor: null,
        scoreEligible: false,
        selectedDominant: false,
      },
      {
        number: 2,
        establishedDominantColor: "blue",
        scoreEligible: true,
        selectedDominant: true,
      },
      {
        number: 3,
        establishedDominantColor: null,
        scoreEligible: false,
        selectedDominant: false,
      },
      {
        number: 4,
        establishedDominantColor: "blue",
        scoreEligible: true,
        selectedDominant: true,
      },
    ],
  );
});
