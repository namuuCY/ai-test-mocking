import {
  DEFAULT_POTION_GAME_CONFIG,
  validatePotionGameConfig,
} from "./config.js";
import { buildPotionComboCatalog } from "./combo.js";
import {
  getPotionSpeedBandScore,
  getPotionVisibleResult,
  scorePotionPracticeSession,
} from "./scoring.js";

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

  if (typeof answer.remainingTimeRatio === "number") {
    return answer.remainingTimeRatio < 0;
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

function assertPositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
