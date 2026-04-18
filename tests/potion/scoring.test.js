const test = require("node:test");
const assert = require("node:assert/strict");

const {
  DEFAULT_POTION_GAME_CONFIG,
  buildPotionComboCatalog,
  createPotionGameConfig,
  getPotionSpeedBandScore,
  scorePotionPracticeSession,
} = require("../../src/games/potion");

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

test("practice scoring reflects visible hits, dominant choices, learning, and recovery", () => {
  const config = createPotionGameConfig({
    sessionQuestionCount: 4,
  });
  const comboCatalog = [{ id: "A" }, { id: "B" }];

  const summary = scorePotionPracticeSession(
    [
      {
        comboId: "A",
        dominantColor: "blue",
        actualColor: "red",
        selectedColor: "blue",
        responseTimeMs: 1500,
      },
      {
        comboId: "B",
        dominantColor: "red",
        actualColor: "red",
        selectedColor: "blue",
        responseTimeMs: 2500,
      },
      {
        comboId: "A",
        dominantColor: "blue",
        actualColor: "blue",
        selectedColor: "blue",
        responseTimeMs: 500,
      },
      {
        comboId: "B",
        dominantColor: "red",
        actualColor: "red",
        selectedColor: "red",
        responseTimeMs: 2900,
      },
    ],
    {
      config,
      comboCatalog,
    },
  );

  assert.equal(summary.visibleSuccessCount, 2);
  assert.equal(summary.dominantChoiceCount, 3);
  assert.equal(summary.recoveryOpportunities, 2);
  assert.equal(summary.recoverySuccesses, 2);
  assert.equal(summary.practiceAccuracy, 0.5);
  assert.equal(summary.metrics.normalizedHitRate, 0.625);
  assert.equal(summary.metrics.dominantChoiceRate, 0.75);
  assert.equal(summary.metrics.responseSpeedScore, 0.6);
  assert.equal(summary.metrics.learningSpeed, 0.5);
  assert.equal(summary.metrics.recoveryRate, 1);
  assert.equal(summary.practiceScore, 67.625);
});
