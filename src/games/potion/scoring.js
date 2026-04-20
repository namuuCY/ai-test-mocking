const { DEFAULT_POTION_GAME_CONFIG } = require("./config");
const { buildPotionComboCatalog } = require("./combo");

function scorePotionPracticeSession(questionResults, options = {}) {
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
        scoredQuestionCount: 0,
        dominantChoiceCount: 0,
        visibleSuccessCount: 0,
        visibleFailureCount: 0,
        learnedAtExposure: null,
        learningScore: 0,
        pendingRecovery: false,
        recoveryOpportunities: 0,
        recoverySuccesses: 0,
        recoveryFailures: 0,
        observedBlueCount: 0,
        observedRedCount: 0,
      },
    ]),
  );

  let scoredQuestionCount = 0;
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
    const establishedDominantColor = getObservedDominantColor(comboState);
    const scoreEligible = establishedDominantColor !== null;
    const selectedDominant =
      scoreEligible && question.selectedColor === establishedDominantColor;

    let recoveryResolvedAs = null;
    if (comboState.pendingRecovery && scoreEligible) {
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

    const visibleResult = getPotionVisibleResult(question, config);
    const speedBandScore = scoreEligible ? getPotionSpeedBandScore(question, config) : 0;

    if (scoreEligible) {
      scoredQuestionCount += 1;
      comboState.scoredQuestionCount += 1;

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

      if (visibleResult === "success") {
        visibleSuccessCount += 1;
        comboState.visibleSuccessCount += 1;
      } else {
        recoveryOpportunities += 1;
        comboState.recoveryOpportunities += 1;
        comboState.visibleFailureCount += 1;
        comboState.pendingRecovery = true;
      }

      speedBandScoreTotal += speedBandScore;
    }

    recordObservedActualColor(comboState, question.actualColor);

    questionBreakdown.push({
      questionNumber: index + 1,
      comboId: question.comboId,
      comboExposureNumber: exposureNumber,
      establishedDominantColor,
      scoreEligible,
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
    scoredQuestionCount: state.scoredQuestionCount,
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

  const actualHitRate = safeDivide(visibleSuccessCount, scoredQuestionCount);
  const normalizedHitRate = clamp(
    actualHitRate / config.dominantColorProbability,
    0,
    1,
  );
  const dominantChoiceRate = safeDivide(dominantChoiceCount, scoredQuestionCount);
  const responseSpeedScore = safeDivide(speedBandScoreTotal, scoredQuestionCount);
  const learningSpeed =
    comboBreakdown.reduce((sum, combo) => sum + combo.learningScore, 0) /
    comboBreakdown.length;
  const recoveryRate = safeDivide(recoverySuccesses, recoveryOpportunities);

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
    scoredQuestionCount,
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

function getPotionVisibleResult(question, config = DEFAULT_POTION_GAME_CONFIG) {
  if (question.timedOut || question.selectedColor == null) {
    return config.timeoutVisibleResult;
  }

  return question.selectedColor === question.actualColor ? "success" : "failure";
}

function getPotionSpeedBandScore(question, config = DEFAULT_POTION_GAME_CONFIG) {
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

function getRemainingTimeRatioFromResponseTime(responseTimeMs, config) {
  if (typeof responseTimeMs !== "number" || Number.isNaN(responseTimeMs) || responseTimeMs < 0) {
    throw new Error(
      "question.responseTimeMs must be a non-negative number when remainingTimeRatio is not provided.",
    );
  }

  const timeLimitMs = config.questionTimeLimitSec * 1000;
  return clamp((timeLimitMs - responseTimeMs) / timeLimitMs, 0, 1);
}

function getObservedDominantColor(comboState) {
  if (comboState.observedBlueCount > comboState.observedRedCount) {
    return "blue";
  }

  if (comboState.observedRedCount > comboState.observedBlueCount) {
    return "red";
  }

  return null;
}

function recordObservedActualColor(comboState, actualColor) {
  if (actualColor === "blue") {
    comboState.observedBlueCount += 1;
    return;
  }

  comboState.observedRedCount += 1;
}

function safeDivide(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : 0;
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

function validateQuestionResult(question, index) {
  const colorFields = ["actualColor", "dominantColor"];
  for (const field of colorFields) {
    if (!isPotionColor(question[field])) {
      throw new Error(`questionResults[${index}].${field} must be "blue" or "red".`);
    }
  }

  if (
    question.selectedColor != null &&
    !isPotionColor(question.selectedColor)
  ) {
    throw new Error(`questionResults[${index}].selectedColor must be null, "blue", or "red".`);
  }

  if (typeof question.comboId !== "string" || question.comboId.length === 0) {
    throw new Error(`questionResults[${index}].comboId must be a non-empty string.`);
  }
}

function isPotionColor(value) {
  return value === "blue" || value === "red";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

module.exports = {
  getPotionSpeedBandScore,
  getPotionVisibleResult,
  scorePotionPracticeSession,
};
