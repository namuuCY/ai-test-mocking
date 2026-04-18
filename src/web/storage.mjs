const STORAGE_KEY = "ai-test-mocking.practice-results.v1";
let memoryResults = [];

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

export function summarizeResultsByGame(results) {
  const summaryByGameId = {};

  for (const result of results) {
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
