const STORAGE_KEY = "ai-test-mocking.practice-results.v1";
let memoryResults = [];

const DEFAULT_POTION_RESULT_CONFIG = Object.freeze({
  sessionQuestionCount: 100,
  questionTimeLimitSec: 3,
});

export function loadPracticeResults() {
  const storage = getStorage();

  try {
    const rawValue = storage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter((entry) => entry && typeof entry === "object" && typeof entry.id === "string")
      .sort((left, right) => {
        const leftTime = Date.parse(left.playedAt ?? 0);
        const rightTime = Date.parse(right.playedAt ?? 0);
        return rightTime - leftTime;
      });
  } catch {
    return [];
  }
}

export function savePracticeResult(nextResult) {
  const results = [nextResult, ...loadPracticeResults().filter((entry) => entry.id !== nextResult.id)]
    .sort((left, right) => Date.parse(right.playedAt ?? 0) - Date.parse(left.playedAt ?? 0))
    .slice(0, 50);

  const storage = getStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify(results));
  memoryResults = results;
  return results;
}

export function clearPracticeResults() {
  const storage = getStorage();
  storage.removeItem(STORAGE_KEY);
  memoryResults = [];
}

export function summarizeResultsByGame(results, options = {}) {
  const summaryByGameId = {};
  const comparableResults = filterComparablePracticeResults(results, options);

  for (const result of comparableResults) {
    const gameId = result.gameId;
    if (!summaryByGameId[gameId]) {
      summaryByGameId[gameId] = {
        latest: result,
        best: result,
        total: 0,
      };
    }

    summaryByGameId[gameId].total += 1;

    const currentBest = summaryByGameId[gameId].best;
    if ((result.practiceScore ?? -Infinity) > (currentBest.practiceScore ?? -Infinity)) {
      summaryByGameId[gameId].best = result;
    }
  }

  return summaryByGameId;
}

export function filterComparablePracticeResults(results, options = {}) {
  const potionConfigSignature = getPotionConfigSignature(options.potionConfig);
  if (!potionConfigSignature) {
    return [...results];
  }

  return results.filter((result) => {
    if (result?.gameId !== "potion") {
      return true;
    }

    return getPotionResultConfigSignature(result) === potionConfigSignature;
  });
}

export function getPotionResultConfigSignature(resultOrConfig) {
  const questionCount = Number(
    resultOrConfig?.configSnapshot?.sessionQuestionCount ??
      resultOrConfig?.sessionQuestionCount ??
      (resultOrConfig?.gameId === "potion"
        ? DEFAULT_POTION_RESULT_CONFIG.sessionQuestionCount
        : NaN),
  );
  const timeLimitSec = Number(
    resultOrConfig?.configSnapshot?.questionTimeLimitSec ??
      resultOrConfig?.questionTimeLimitSec ??
      (resultOrConfig?.gameId === "potion"
        ? DEFAULT_POTION_RESULT_CONFIG.questionTimeLimitSec
        : NaN),
  );

  if (!Number.isFinite(questionCount) || !Number.isFinite(timeLimitSec)) {
    return null;
  }

  return `potion:${questionCount}:${timeLimitSec}`;
}

function getPotionConfigSignature(config) {
  if (!config) {
    return null;
  }

  return getPotionResultConfigSignature(config);
}

function getStorage() {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  return {
    getItem(key) {
      return key === STORAGE_KEY && memoryResults.length > 0
        ? JSON.stringify(memoryResults)
        : null;
    },
    setItem(key, value) {
      if (key === STORAGE_KEY) {
        memoryResults = JSON.parse(value);
      }
    },
    removeItem(key) {
      if (key === STORAGE_KEY) {
        memoryResults = [];
      }
    },
  };
}
