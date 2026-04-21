export const DEFAULT_POTION_INGREDIENTS = Object.freeze([
  Object.freeze({
    id: "ingredient-1",
    label: "재료 1",
    accent: "ember",
    art: "seed",
  }),
  Object.freeze({
    id: "ingredient-2",
    label: "재료 2",
    accent: "moss",
    art: "mint",
  }),
  Object.freeze({
    id: "ingredient-3",
    label: "재료 3",
    accent: "crystal",
    art: "grass",
  }),
  Object.freeze({
    id: "ingredient-4",
    label: "재료 4",
    accent: "mist",
    art: "wing",
  }),
]);

const DOMINANT_COLOR_PROBABILITY_FALLBACK = 0.8;
const DOMINANT_COLOR_PROBABILITY_MIN_QUESTION_COUNT = 40;
const DOMINANT_COLOR_PROBABILITY_MAX_QUESTION_COUNT = 100;
const DOMINANT_COLOR_PROBABILITY_AT_MIN_QUESTION_COUNT = 0.95;
const DOMINANT_COLOR_PROBABILITY_AT_MAX_QUESTION_COUNT = 0.8;

export const DEFAULT_POTION_GAME_CONFIG = deepFreeze({
  introAutoStartSec: 9,
  sessionQuestionCount: 100,
  questionTimeLimitSec: 3,
  ingredientCount: 4,
  comboCountTotal: 14,
  comboCountBySize: {
    single: 4,
    pair: 6,
    triple: 4,
  },
  dominantColorProbability: 0.8,
  dominantColorAssignment: "per-session",
  feedbackMode: "immediate",
  timeoutVisibleResult: "failure",
  timeoutSpeedScore: 0,
  responseOptions: ["blue", "red"],
  timeScoreBands: [
    { remainingRatioMin: 0.4, scoreRatio: 1.0 },
    { remainingRatioMin: 0.2, scoreRatio: 0.6 },
    { remainingRatioMin: 0.1, scoreRatio: 0.3 },
    { remainingRatioMin: 0.0, scoreRatio: 0.1 },
  ],
  scoreWeights: {
    normalizedHitRate: 35,
    dominantChoiceRate: 25,
    responseSpeedScore: 20,
    learningSpeed: 10,
    recoveryRate: 10,
  },
  learningExposureScoreMap: {
    2: 1.0,
    3: 0.8,
    4: 0.6,
    5: 0.4,
    6: 0.2,
  },
});

export function createPotionGameConfig(overrides = {}) {
  const hasExplicitDominantColorProbability = Object.prototype.hasOwnProperty.call(
    overrides,
    "dominantColorProbability",
  );
  const config = {
    ...DEFAULT_POTION_GAME_CONFIG,
    ...overrides,
    comboCountBySize: {
      ...DEFAULT_POTION_GAME_CONFIG.comboCountBySize,
      ...overrides.comboCountBySize,
    },
    responseOptions: overrides.responseOptions
      ? [...overrides.responseOptions]
      : [...DEFAULT_POTION_GAME_CONFIG.responseOptions],
    timeScoreBands: normalizeTimeScoreBands(
      overrides.timeScoreBands ?? DEFAULT_POTION_GAME_CONFIG.timeScoreBands,
    ),
    scoreWeights: {
      ...DEFAULT_POTION_GAME_CONFIG.scoreWeights,
      ...overrides.scoreWeights,
    },
    learningExposureScoreMap: normalizeLearningExposureScoreMap({
      ...DEFAULT_POTION_GAME_CONFIG.learningExposureScoreMap,
      ...overrides.learningExposureScoreMap,
    }),
  };

  if (!hasExplicitDominantColorProbability) {
    config.dominantColorProbability =
      getPotionDominantColorProbabilityForQuestionCount(
        config.sessionQuestionCount,
      );
  }

  validatePotionGameConfig(config);
  return deepFreeze(config);
}

export function getPotionDominantColorProbabilityForQuestionCount(questionCount) {
  if (!Number.isFinite(questionCount)) {
    throw new Error("questionCount must be a finite number.");
  }

  if (
    questionCount < DOMINANT_COLOR_PROBABILITY_MIN_QUESTION_COUNT ||
    questionCount > DOMINANT_COLOR_PROBABILITY_MAX_QUESTION_COUNT
  ) {
    return DOMINANT_COLOR_PROBABILITY_FALLBACK;
  }

  const progress =
    (questionCount - DOMINANT_COLOR_PROBABILITY_MIN_QUESTION_COUNT) /
    (DOMINANT_COLOR_PROBABILITY_MAX_QUESTION_COUNT -
      DOMINANT_COLOR_PROBABILITY_MIN_QUESTION_COUNT);
  const probability =
    DOMINANT_COLOR_PROBABILITY_AT_MIN_QUESTION_COUNT -
    (DOMINANT_COLOR_PROBABILITY_AT_MIN_QUESTION_COUNT -
      DOMINANT_COLOR_PROBABILITY_AT_MAX_QUESTION_COUNT) *
      progress;

  return Number(probability.toFixed(4));
}

export function validatePotionGameConfig(config) {
  assertPositiveInteger(config.introAutoStartSec, "introAutoStartSec");
  assertPositiveInteger(config.sessionQuestionCount, "sessionQuestionCount");
  assertPositiveInteger(config.questionTimeLimitSec, "questionTimeLimitSec");
  assertPositiveInteger(config.ingredientCount, "ingredientCount");
  assertPositiveInteger(config.comboCountTotal, "comboCountTotal");

  const comboKeys = ["single", "pair", "triple"];
  const comboTotal = comboKeys.reduce((sum, key) => {
    const value = config.comboCountBySize[key];
    assertNonNegativeInteger(value, `comboCountBySize.${key}`);
    return sum + value;
  }, 0);

  if (comboTotal !== config.comboCountTotal) {
    throw new Error(
      `comboCountBySize must sum to comboCountTotal (${config.comboCountTotal}), received ${comboTotal}.`,
    );
  }

  if (
    typeof config.dominantColorProbability !== "number" ||
    config.dominantColorProbability <= 0 ||
    config.dominantColorProbability > 1
  ) {
    throw new Error("dominantColorProbability must be between 0 and 1.");
  }

  if (config.dominantColorAssignment !== "per-session") {
    throw new Error('dominantColorAssignment must be "per-session".');
  }

  if (config.feedbackMode !== "immediate") {
    throw new Error('feedbackMode must be "immediate".');
  }

  if (config.timeoutVisibleResult !== "failure") {
    throw new Error('timeoutVisibleResult must be "failure".');
  }

  if (
    typeof config.timeoutSpeedScore !== "number" ||
    config.timeoutSpeedScore < 0 ||
    config.timeoutSpeedScore > 1
  ) {
    throw new Error("timeoutSpeedScore must be between 0 and 1.");
  }

  if (
    config.responseOptions.length !== 2 ||
    !config.responseOptions.includes("blue") ||
    !config.responseOptions.includes("red")
  ) {
    throw new Error('responseOptions must contain exactly "blue" and "red".');
  }

  validateTimeScoreBands(config.timeScoreBands);
  validateScoreWeights(config.scoreWeights);
  validateLearningExposureScoreMap(config.learningExposureScoreMap);
}

function validateTimeScoreBands(timeScoreBands) {
  if (!Array.isArray(timeScoreBands) || timeScoreBands.length === 0) {
    throw new Error("timeScoreBands must be a non-empty array.");
  }

  let previousMin = Infinity;
  for (const [index, band] of timeScoreBands.entries()) {
    if (
      typeof band.remainingRatioMin !== "number" ||
      band.remainingRatioMin < 0 ||
      band.remainingRatioMin > 1
    ) {
      throw new Error(
        `timeScoreBands[${index}].remainingRatioMin must be between 0 and 1.`,
      );
    }

    if (
      typeof band.scoreRatio !== "number" ||
      band.scoreRatio < 0 ||
      band.scoreRatio > 1
    ) {
      throw new Error(`timeScoreBands[${index}].scoreRatio must be between 0 and 1.`);
    }

    if (band.remainingRatioMin > previousMin) {
      throw new Error("timeScoreBands must be sorted by remainingRatioMin descending.");
    }

    previousMin = band.remainingRatioMin;
  }

  const smallestBand = timeScoreBands[timeScoreBands.length - 1];
  if (smallestBand.remainingRatioMin !== 0) {
    throw new Error("timeScoreBands must include a lowest band at remainingRatioMin 0.");
  }
}

function validateScoreWeights(scoreWeights) {
  const weightKeys = [
    "normalizedHitRate",
    "dominantChoiceRate",
    "responseSpeedScore",
    "learningSpeed",
    "recoveryRate",
  ];

  const totalWeight = weightKeys.reduce((sum, key) => {
    const value = scoreWeights[key];
    if (typeof value !== "number" || value < 0) {
      throw new Error(`scoreWeights.${key} must be a non-negative number.`);
    }

    return sum + value;
  }, 0);

  if (Math.abs(totalWeight - 100) > 1e-9) {
    throw new Error(`scoreWeights must sum to 100, received ${totalWeight}.`);
  }
}

function validateLearningExposureScoreMap(learningExposureScoreMap) {
  const entries = Object.entries(learningExposureScoreMap);
  if (entries.length === 0) {
    throw new Error("learningExposureScoreMap must define at least one exposure score.");
  }

  for (const [exposure, score] of entries) {
    const exposureNumber = Number(exposure);
    if (!Number.isInteger(exposureNumber) || exposureNumber < 2) {
      throw new Error("learningExposureScoreMap keys must be integers greater than or equal to 2.");
    }

    if (typeof score !== "number" || score < 0 || score > 1) {
      throw new Error(`learningExposureScoreMap.${exposure} must be between 0 and 1.`);
    }
  }
}

function normalizeTimeScoreBands(timeScoreBands) {
  return timeScoreBands
    .map((band) => ({
      remainingRatioMin: band.remainingRatioMin,
      scoreRatio: band.scoreRatio,
    }))
    .sort((left, right) => right.remainingRatioMin - left.remainingRatioMin);
}

function normalizeLearningExposureScoreMap(learningExposureScoreMap) {
  return Object.fromEntries(
    Object.entries(learningExposureScoreMap)
      .map(([exposure, score]) => [Number(exposure), score])
      .sort(([left], [right]) => left - right),
  );
}

function assertPositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
}

function assertNonNegativeInteger(value, fieldName) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer.`);
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);
  for (const property of Object.values(value)) {
    deepFreeze(property);
  }

  return value;
}
