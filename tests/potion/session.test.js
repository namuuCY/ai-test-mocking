const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createPotionDominantColorMap,
  createPotionQuestionPlan,
  createPotionGameConfig,
  createPotionSession,
  getPotionCurrentQuestion,
  samplePotionActualColor,
  submitPotionAnswer,
  timeoutPotionQuestion,
} = require("../../src/games/potion");

test("dominant colors are assigned per combo using the provided rng", () => {
  const comboCatalog = [{ id: "A" }, { id: "B" }, { id: "C" }];
  const rng = createSequenceRng([0.1, 0.9, 0.2]);

  const dominantColorByComboId = createPotionDominantColorMap(comboCatalog, rng);

  assert.deepEqual(dominantColorByComboId, {
    A: "blue",
    B: "red",
    C: "blue",
  });
});

test("default question plan balances combo exposure across the session", () => {
  const comboCatalog = Array.from({ length: 14 }, (_, index) => ({ id: `C${index + 1}` }));
  const questionPlan = createPotionQuestionPlan(comboCatalog, 100, {
    rng: createSequenceRng([0.3, 0.7, 0.2, 0.9, 0.4]),
  });

  assert.equal(questionPlan.length, 100);

  const exposureCounts = questionPlan.reduce((counts, question) => {
    counts[question.comboId] = (counts[question.comboId] ?? 0) + 1;
    return counts;
  }, {});

  const exposureValues = Object.values(exposureCounts);
  assert.equal(Math.min(...exposureValues), 7);
  assert.equal(Math.max(...exposureValues), 8);
});

test("session progression resolves answers, timeouts, and final scoring", () => {
  const config = createPotionGameConfig({
    sessionQuestionCount: 3,
  });
  const comboCatalog = [{ id: "A" }, { id: "B" }];
  const session = createPotionSession({
    config,
    comboCatalog,
    dominantColorByComboId: {
      A: "blue",
      B: "red",
    },
    questionPlan: ["A", "B", "A"],
    sessionId: "session-under-test",
    createdAt: "2026-04-17T00:00:00.000Z",
  });

  assert.equal(session.status, "ready");
  assert.deepEqual(getPotionCurrentQuestion(session), {
    questionNumber: 1,
    comboId: "A",
    combo: { id: "A" },
    timeLimitSec: 3,
    questionsRemainingIncludingCurrent: 3,
  });

  const firstTurn = submitPotionAnswer(
    session,
    {
      selectedColor: "blue",
      actualColor: "blue",
      responseTimeMs: 1200,
    },
    {
      answeredAt: "2026-04-17T00:00:01.200Z",
    },
  );

  assert.equal(firstTurn.visibleResult, "success");
  assert.equal(firstTurn.speedBandScore, 1);
  assert.equal(firstTurn.session.status, "playing");
  assert.equal(firstTurn.session.startedAt, "2026-04-17T00:00:01.200Z");
  assert.equal(firstTurn.session.completedQuestionCount, 1);

  const secondTurn = timeoutPotionQuestion(firstTurn.session, {
    answeredAt: "2026-04-17T00:00:05.000Z",
    rng: createSequenceRng([0.2]),
  });

  assert.equal(secondTurn.visibleResult, "failure");
  assert.equal(secondTurn.speedBandScore, 0);
  assert.equal(secondTurn.questionResult.selectedColor, null);
  assert.equal(secondTurn.questionResult.actualColor, "red");
  assert.equal(secondTurn.session.completedQuestionCount, 2);

  const thirdTurn = submitPotionAnswer(
    secondTurn.session,
    {
      selectedColor: "blue",
      actualColor: "red",
      responseTimeMs: 2800,
    },
    {
      answeredAt: "2026-04-17T00:00:07.800Z",
    },
  );

  assert.equal(thirdTurn.isFinished, true);
  assert.equal(thirdTurn.session.status, "finished");
  assert.equal(thirdTurn.session.endedAt, "2026-04-17T00:00:07.800Z");
  assert.equal(thirdTurn.session.practiceAccuracy, 1 / 3);
  assert.equal(thirdTurn.session.summary.metrics.dominantChoiceRate, 2 / 3);
  assert.equal(thirdTurn.session.summary.metrics.recoveryRate, 0);
  assert.equal(thirdTurn.session.summary.visibleSuccessCount, 1);
});

test("actual color sampling follows the dominant-color probability", () => {
  const config = createPotionGameConfig({
    dominantColorProbability: 0.8,
  });

  assert.equal(
    samplePotionActualColor("blue", config, createSequenceRng([0.1])),
    "blue",
  );
  assert.equal(
    samplePotionActualColor("blue", config, createSequenceRng([0.95])),
    "red",
  );
});

function createSequenceRng(sequence) {
  let index = 0;

  return () => {
    const nextValue = sequence[index % sequence.length];
    index += 1;
    return nextValue;
  };
}
