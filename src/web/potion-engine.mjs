const DEFAULT_POTION_INGREDIENTS = Object.freeze([
  Object.freeze({ id: "ingredient-1", label: "재료 1", accent: "ember", art: "seed" }),
  Object.freeze({ id: "ingredient-2", label: "재료 2", accent: "moss", art: "mint" }),
  Object.freeze({ id: "ingredient-3", label: "재료 3", accent: "crystal", art: "grass" }),
  Object.freeze({ id: "ingredient-4", label: "재료 4", accent: "mist", art: "wing" }),
]);

const DEFAULT_POTION_GAME_CONFIG = deepFreeze({
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

  validatePotionGameConfig(config);
  return deepFreeze(config);
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

  validateTimeScoreBands(config.timeScoreBands);
  validateScoreWeights(config.scoreWeights);
  validateLearningExposureScoreMap(config.learningExposureScoreMap);
}

export function buildPotionComboCatalog(
  ingredients = DEFAULT_POTION_INGREDIENTS,
  config = DEFAULT_POTION_GAME_CONFIG,
) {
  validateIngredients(ingredients, config.ingredientCount);

  const singles = createComboEntries(createIngredientCombinations(ingredients, 1), "single");
  const pairs = createComboEntries(createIngredientCombinations(ingredients, 2), "pair");
  const triples = createComboEntries(createIngredientCombinations(ingredients, 3), "triple");

  assertComboCount(singles, config.comboCountBySize.single, "single");
  assertComboCount(pairs, config.comboCountBySize.pair, "pair");
  assertComboCount(triples, config.comboCountBySize.triple, "triple");

  const catalog = [...singles, ...pairs, ...triples];
  if (catalog.length !== config.comboCountTotal) {
    throw new Error(
      `Generated combo count (${catalog.length}) does not match config.comboCountTotal (${config.comboCountTotal}).`,
    );
  }

  return Object.freeze(catalog);
}

export function scorePotionPracticeSession(questionResults, options = {}) {
  if (!Array.isArray(questionResults)) {
    throw new Error("questionResults must be an array.");
  }

  const config = options.config ?? DEFAULT_POTION_GAME_CONFIG;
  const comboCatalog = normalizeComboCatalog(
    options.comboCatalog ?? buildPotionComboCatalog(undefined, config),
  );

  if (questionResults.length > config.sessionQuestionCount) {
    throw new Error(
      `questionResults cannot exceed sessionQuestionCount (${config.sessionQuestionCount}).`,
    );
  }

  const comboStates = new Map(
    comboCatalog.map((combo) => [
      combo.id,
      {
        comboId: combo.id,
        exposureCount: 0,
        dominantChoiceCount: 0,
        visibleSuccessCount: 0,
        visibleFailureCount: 0,
        learnedAtExposure: null,
        learningScore: 0,
        pendingRecovery: false,
        recoveryOpportunities: 0,
        recoverySuccesses: 0,
        recoveryFailures: 0,
      },
    ]),
  );

  let visibleSuccessCount = 0;
  let dominantChoiceCount = 0;
  let speedBandScoreTotal = 0;
  let recoveryOpportunities = 0;
  let recoverySuccesses = 0;

  const questionBreakdown = [];

  for (const [index, question] of questionResults.entries()) {
    validateQuestionResult(question, index);

    const comboState = comboStates.get(question.comboId);
    if (!comboState) {
      throw new Error(`Unknown comboId "${question.comboId}" at question index ${index}.`);
    }

    comboState.exposureCount += 1;
    const exposureNumber = comboState.exposureCount;
    const selectedDominant = question.selectedColor === question.dominantColor;

    let recoveryResolvedAs = null;
    if (comboState.pendingRecovery) {
      comboState.pendingRecovery = false;

      if (selectedDominant) {
        recoverySuccesses += 1;
        comboState.recoverySuccesses += 1;
        recoveryResolvedAs = "success";
      } else {
        comboState.recoveryFailures += 1;
        recoveryResolvedAs = "failure";
      }
    }

    if (selectedDominant) {
      dominantChoiceCount += 1;
      comboState.dominantChoiceCount += 1;

      if (comboState.learnedAtExposure === null) {
        comboState.learnedAtExposure = exposureNumber;
        comboState.learningScore =
          exposureNumber === 1
            ? 0
            : config.learningExposureScoreMap[exposureNumber] ?? 0;
      }
    }

    const visibleResult = getPotionVisibleResult(question, config);
    if (visibleResult === "success") {
      visibleSuccessCount += 1;
      comboState.visibleSuccessCount += 1;
    } else {
      recoveryOpportunities += 1;
      comboState.recoveryOpportunities += 1;
      comboState.visibleFailureCount += 1;
      comboState.pendingRecovery = true;
    }

    const speedBandScore = getPotionSpeedBandScore(question, config);
    speedBandScoreTotal += speedBandScore;

    questionBreakdown.push({
      questionNumber: index + 1,
      comboId: question.comboId,
      comboExposureNumber: exposureNumber,
      selectedColor: question.selectedColor ?? null,
      actualColor: question.actualColor,
      dominantColor: question.dominantColor,
      timedOut: Boolean(question.timedOut),
      selectedDominant,
      visibleResult,
      speedBandScore,
      recoveryResolvedAs,
      recoveryOpportunityCreated: visibleResult === "failure",
    });
  }

  const comboBreakdown = Array.from(comboStates.values()).map((state) => ({
    comboId: state.comboId,
    exposureCount: state.exposureCount,
    dominantChoiceCount: state.dominantChoiceCount,
    visibleSuccessCount: state.visibleSuccessCount,
    visibleFailureCount: state.visibleFailureCount,
    learnedAtExposure: state.learnedAtExposure,
    learningScore: state.learningScore,
    recoveryOpportunities: state.recoveryOpportunities,
    recoverySuccesses: state.recoverySuccesses,
    recoveryFailures: state.recoveryFailures,
    hasPendingRecovery: state.pendingRecovery,
  }));

  const actualHitRate = visibleSuccessCount / config.sessionQuestionCount;
  const normalizedHitRate = clamp(
    actualHitRate / config.dominantColorProbability,
    0,
    1,
  );
  const dominantChoiceRate = dominantChoiceCount / config.sessionQuestionCount;
  const responseSpeedScore = speedBandScoreTotal / config.sessionQuestionCount;
  const learningSpeed =
    comboBreakdown.reduce((sum, combo) => sum + combo.learningScore, 0) /
    comboBreakdown.length;
  const recoveryRate = recoverySuccesses / Math.max(recoveryOpportunities, 1);

  const practiceScore = clamp(
    config.scoreWeights.normalizedHitRate * normalizedHitRate +
      config.scoreWeights.dominantChoiceRate * dominantChoiceRate +
      config.scoreWeights.responseSpeedScore * responseSpeedScore +
      config.scoreWeights.learningSpeed * learningSpeed +
      config.scoreWeights.recoveryRate * recoveryRate,
    0,
    100,
  );

  return {
    questionCount: questionResults.length,
    expectedQuestionCount: config.sessionQuestionCount,
    practiceAccuracy: actualHitRate,
    practiceScore,
    visibleSuccessCount,
    dominantChoiceCount,
    recoveryOpportunities,
    recoverySuccesses,
    metrics: {
      actualHitRate,
      normalizedHitRate,
      dominantChoiceRate,
      responseSpeedScore,
      learningSpeed,
      recoveryRate,
    },
    comboBreakdown,
    questionBreakdown,
  };
}

export function getPotionVisibleResult(question, config = DEFAULT_POTION_GAME_CONFIG) {
  if (question.timedOut || question.selectedColor == null) {
    return config.timeoutVisibleResult;
  }

  return question.selectedColor === question.actualColor ? "success" : "failure";
}

export function getPotionSpeedBandScore(question, config = DEFAULT_POTION_GAME_CONFIG) {
  if (question.timedOut || question.selectedColor == null) {
    return config.timeoutSpeedScore;
  }

  const remainingTimeRatio =
    typeof question.remainingTimeRatio === "number"
      ? clamp(question.remainingTimeRatio, 0, 1)
      : getRemainingTimeRatioFromResponseTime(question.responseTimeMs, config);

  for (const band of config.timeScoreBands) {
    if (remainingTimeRatio >= band.remainingRatioMin) {
      return band.scoreRatio;
    }
  }

  return config.timeoutSpeedScore;
}

export function createPotionSession(options = {}) {
  const config = options.config ?? DEFAULT_POTION_GAME_CONFIG;
  validatePotionGameConfig(config);

  const comboCatalog = normalizeComboCatalog(
    options.comboCatalog ?? buildPotionComboCatalog(undefined, config),
  );
  const dominantColorByComboId = normalizeDominantColorByComboId(
    options.dominantColorByComboId ??
      createPotionDominantColorMap(comboCatalog, options.rng),
    comboCatalog,
  );
  const questionPlan = normalizeQuestionPlan(
    options.questionPlan ??
      createPotionQuestionPlan(comboCatalog, config.sessionQuestionCount, {
        rng: options.rng,
      }),
    comboCatalog,
    config.sessionQuestionCount,
  );

  return {
    id: options.sessionId ?? createPotionSessionId(options.rng),
    gameId: "potion",
    status: "ready",
    createdAt: options.createdAt ?? null,
    startedAt: null,
    endedAt: null,
    config,
    comboCatalog,
    dominantColorByComboId,
    questionPlan,
    currentQuestionIndex: 0,
    completedQuestionCount: 0,
    questionResults: [],
    practiceScore: null,
    practiceAccuracy: null,
    summary: null,
  };
}

export function createPotionDominantColorMap(comboCatalog, rng = Math.random) {
  const normalizedComboCatalog = normalizeComboCatalog(comboCatalog);
  const dominantColorByComboId = {};

  for (const combo of normalizedComboCatalog) {
    dominantColorByComboId[combo.id] = pickPotionColor(rng);
  }

  return dominantColorByComboId;
}

export function createPotionQuestionPlan(
  comboCatalog,
  questionCount = DEFAULT_POTION_GAME_CONFIG.sessionQuestionCount,
  options = {},
) {
  const normalizedComboCatalog = normalizeComboCatalog(comboCatalog);
  assertPositiveInteger(questionCount, "questionCount");

  const comboIds = normalizedComboCatalog.map((combo) => combo.id);
  const baseRepeatCount = Math.floor(questionCount / comboIds.length);
  const extraComboCount = questionCount % comboIds.length;

  const scheduledComboIds = [];
  for (const comboId of comboIds) {
    for (let repeatIndex = 0; repeatIndex < baseRepeatCount; repeatIndex += 1) {
      scheduledComboIds.push(comboId);
    }
  }

  const extraComboIds = shuffleArray([...comboIds], options.rng).slice(
    0,
    extraComboCount,
  );
  scheduledComboIds.push(...extraComboIds);

  return shuffleArray(scheduledComboIds, options.rng).map((comboId, index) => ({
    questionNumber: index + 1,
    comboId,
  }));
}

export function getPotionCurrentQuestion(session) {
  validatePotionSession(session);

  if (session.status === "finished") {
    return null;
  }

  const question = session.questionPlan[session.currentQuestionIndex];
  const combo = session.comboCatalog.find((entry) => entry.id === question.comboId) ?? null;

  return {
    questionNumber: question.questionNumber,
    comboId: question.comboId,
    combo,
    timeLimitSec: session.config.questionTimeLimitSec,
    questionsRemainingIncludingCurrent:
      session.questionPlan.length - session.currentQuestionIndex,
  };
}

export function submitPotionAnswer(session, answer = {}, options = {}) {
  validatePotionSession(session);

  if (session.status === "finished") {
    throw new Error("Cannot submit an answer for a finished potion session.");
  }

  const question = getPotionCurrentQuestion(session);
  const dominantColor = session.dominantColorByComboId[question.comboId];
  const timedOut = isPotionAnswerTimedOut(answer, session.config);
  const selectedColor = timedOut ? null : normalizeSelectedColor(answer.selectedColor);
  const actualColor =
    answer.actualColor ?? samplePotionActualColor(dominantColor, session.config, options.rng);

  validatePotionColor(actualColor, "answer.actualColor");

  const questionResult = {
    comboId: question.comboId,
    dominantColor,
    actualColor,
    selectedColor,
    timedOut,
  };

  if (typeof answer.responseTimeMs === "number") {
    questionResult.responseTimeMs = answer.responseTimeMs;
  }

  if (typeof answer.remainingTimeRatio === "number") {
    questionResult.remainingTimeRatio = clamp(answer.remainingTimeRatio, 0, 1);
  }

  const visibleResult = getPotionVisibleResult(questionResult, session.config);
  const speedBandScore = getPotionSpeedBandScore(questionResult, session.config);
  const questionResults = [...session.questionResults, questionResult];
  const completedQuestionCount = questionResults.length;
  const isFinished = completedQuestionCount >= session.questionPlan.length;

  let summary = null;
  let practiceScore = null;
  let practiceAccuracy = null;

  if (isFinished) {
    summary = scorePotionPracticeSession(questionResults, {
      config: session.config,
      comboCatalog: session.comboCatalog,
    });
    practiceScore = summary.practiceScore;
    practiceAccuracy = summary.practiceAccuracy;
  }

  const answeredAt = options.answeredAt ?? null;
  const nextSession = {
    ...session,
    status: isFinished ? "finished" : "playing",
    startedAt: session.startedAt ?? answeredAt,
    endedAt: isFinished ? answeredAt : null,
    currentQuestionIndex: completedQuestionCount,
    completedQuestionCount,
    questionResults,
    practiceScore,
    practiceAccuracy,
    summary,
  };

  return {
    session: nextSession,
    question,
    questionResult,
    visibleResult,
    speedBandScore,
    isFinished,
  };
}

export function timeoutPotionQuestion(session, options = {}) {
  return submitPotionAnswer(
    session,
    {
      selectedColor: null,
      timedOut: true,
      responseTimeMs: session.config.questionTimeLimitSec * 1000 + 1,
    },
    options,
  );
}

export function samplePotionActualColor(
  dominantColor,
  config = DEFAULT_POTION_GAME_CONFIG,
  rng = Math.random,
) {
  validatePotionColor(dominantColor, "dominantColor");

  return rng() < config.dominantColorProbability
    ? dominantColor
    : getOppositePotionColor(dominantColor);
}

function validateIngredients(ingredients, ingredientCount) {
  if (!Array.isArray(ingredients) || ingredients.length !== ingredientCount) {
    throw new Error(
      `Expected ${ingredientCount} ingredients, received ${Array.isArray(ingredients) ? ingredients.length : "invalid input"}.`,
    );
  }

  const ids = new Set();
  for (const ingredient of ingredients) {
    if (!ingredient || typeof ingredient.id !== "string" || ingredient.id.length === 0) {
      throw new Error("Each ingredient must have a non-empty string id.");
    }

    if (ids.has(ingredient.id)) {
      throw new Error(`Duplicate ingredient id "${ingredient.id}" is not allowed.`);
    }

    ids.add(ingredient.id);
  }
}

function createComboEntries(combinations, sizeKey) {
  return combinations.map((group) =>
    Object.freeze({
      id: group.map((ingredient) => ingredient.id).join("+"),
      size: group.length,
      sizeKey,
      ingredientIds: Object.freeze(group.map((ingredient) => ingredient.id)),
      ingredientLabels: Object.freeze(group.map((ingredient) => ingredient.label)),
      ingredients: Object.freeze(group.map((ingredient) => ({ ...ingredient }))),
    }),
  );
}

function createIngredientCombinations(ingredients, size) {
  const results = [];

  function walk(startIndex, currentGroup) {
    if (currentGroup.length === size) {
      results.push([...currentGroup]);
      return;
    }

    for (let index = startIndex; index < ingredients.length; index += 1) {
      currentGroup.push(ingredients[index]);
      walk(index + 1, currentGroup);
      currentGroup.pop();
    }
  }

  walk(0, []);
  return results;
}

function assertComboCount(combos, expectedCount, sizeKey) {
  if (combos.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} ${sizeKey} combos, received ${combos.length}.`,
    );
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

function getRemainingTimeRatioFromResponseTime(responseTimeMs, config) {
  if (typeof responseTimeMs !== "number" || Number.isNaN(responseTimeMs) || responseTimeMs < 0) {
    throw new Error(
      "question.responseTimeMs must be a non-negative number when remainingTimeRatio is not provided.",
    );
  }

  const timeLimitMs = config.questionTimeLimitSec * 1000;
  return clamp((timeLimitMs - responseTimeMs) / timeLimitMs, 0, 1);
}

function normalizeComboCatalog(comboCatalog) {
  if (!Array.isArray(comboCatalog) || comboCatalog.length === 0) {
    throw new Error("comboCatalog must be a non-empty array.");
  }

  const uniqueIds = new Set();
  return comboCatalog.map((combo, index) => {
    if (!combo || typeof combo.id !== "string" || combo.id.length === 0) {
      throw new Error(`comboCatalog[${index}] must contain a non-empty string id.`);
    }

    if (uniqueIds.has(combo.id)) {
      throw new Error(`comboCatalog contains duplicate id "${combo.id}".`);
    }

    uniqueIds.add(combo.id);
    return combo;
  });
}

function normalizeDominantColorByComboId(dominantColorByComboId, comboCatalog) {
  if (!dominantColorByComboId || typeof dominantColorByComboId !== "object") {
    throw new Error("dominantColorByComboId must be an object keyed by combo id.");
  }

  const normalizedMap = {};
  for (const combo of comboCatalog) {
    const dominantColor = dominantColorByComboId[combo.id];
    validatePotionColor(dominantColor, `dominantColorByComboId.${combo.id}`);
    normalizedMap[combo.id] = dominantColor;
  }

  return normalizedMap;
}

function normalizeQuestionPlan(questionPlan, comboCatalog, expectedQuestionCount) {
  if (!Array.isArray(questionPlan) || questionPlan.length !== expectedQuestionCount) {
    throw new Error(
      `questionPlan must contain exactly ${expectedQuestionCount} questions.`,
    );
  }

  const comboIdSet = new Set(comboCatalog.map((combo) => combo.id));

  return questionPlan.map((question, index) => {
    const comboId = typeof question === "string" ? question : question.comboId;
    if (!comboIdSet.has(comboId)) {
      throw new Error(`questionPlan[${index}] references unknown comboId "${comboId}".`);
    }

    return {
      questionNumber: index + 1,
      comboId,
    };
  });
}

function validatePotionSession(session) {
  if (!session || typeof session !== "object") {
    throw new Error("session must be an object.");
  }

  if (!Array.isArray(session.questionPlan) || !Array.isArray(session.questionResults)) {
    throw new Error("session must include questionPlan and questionResults arrays.");
  }

  if (!session.config) {
    throw new Error("session must include config.");
  }
}

function validateQuestionResult(question, index) {
  const colorFields = ["actualColor", "dominantColor"];
  for (const field of colorFields) {
    if (!isPotionColor(question[field])) {
      throw new Error(`questionResults[${index}].${field} must be "blue" or "red".`);
    }
  }

  if (question.selectedColor != null && !isPotionColor(question.selectedColor)) {
    throw new Error(`questionResults[${index}].selectedColor must be null, "blue", or "red".`);
  }

  if (typeof question.comboId !== "string" || question.comboId.length === 0) {
    throw new Error(`questionResults[${index}].comboId must be a non-empty string.`);
  }
}

function isPotionAnswerTimedOut(answer, config) {
  if (answer.timedOut === true) {
    return true;
  }

  if (answer.selectedColor == null) {
    return true;
  }

  if (typeof answer.responseTimeMs === "number") {
    return answer.responseTimeMs > config.questionTimeLimitSec * 1000;
  }

  return false;
}

function normalizeSelectedColor(selectedColor) {
  validatePotionColor(selectedColor, "answer.selectedColor");
  return selectedColor;
}

function validatePotionColor(value, fieldName) {
  if (value !== "blue" && value !== "red") {
    throw new Error(`${fieldName} must be "blue" or "red".`);
  }
}

function getOppositePotionColor(color) {
  return color === "blue" ? "red" : "blue";
}

function pickPotionColor(rng = Math.random) {
  return rng() < 0.5 ? "blue" : "red";
}

function shuffleArray(values, rng = Math.random) {
  const shuffledValues = [...values];

  for (let index = shuffledValues.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffledValues[index], shuffledValues[swapIndex]] = [
      shuffledValues[swapIndex],
      shuffledValues[index],
    ];
  }

  return shuffledValues;
}

function createPotionSessionId(rng = Math.random) {
  const suffix = Math.floor(rng() * 36 ** 8)
    .toString(36)
    .padStart(8, "0");

  return `potion-session-${suffix}`;
}

function isPotionColor(value) {
  return value === "blue" || value === "red";
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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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

export {
  DEFAULT_POTION_GAME_CONFIG,
  DEFAULT_POTION_INGREDIENTS,
};
