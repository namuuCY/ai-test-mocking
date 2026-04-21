import test from "node:test";
import assert from "node:assert/strict";

import { createPotionViewState } from "../../src/web/potion/state.mjs";
import {
  createAdvancedPotionState,
  createCheckingPotionState,
  createStartedPotionState,
  syncPotionStateWithSettings,
} from "../../src/app/features/potion/state-utils.js";

test("syncPotionStateWithSettings recreates tutorial state for new settings", () => {
  const potionState = createPotionViewState({
    settings: {
      questionTimeLimitSec: 3,
      sessionQuestionCount: 40,
    },
  });

  const nextState = syncPotionStateWithSettings(potionState, {
    questionTimeLimitSec: 5,
    sessionQuestionCount: 60,
  });

  assert.notEqual(nextState, potionState);
  assert.equal(nextState.phase, "tutorial");
  assert.equal(nextState.settings.questionTimeLimitSec, 5);
  assert.equal(nextState.settings.sessionQuestionCount, 60);
  assert.equal(nextState.session.config.questionTimeLimitSec, 5);
  assert.equal(nextState.session.config.sessionQuestionCount, 60);
});

test("syncPotionStateWithSettings keeps active session and only updates comparable settings", () => {
  const potionState = createStartedPotionState(
    createPotionViewState({
      settings: {
        questionTimeLimitSec: 3,
        sessionQuestionCount: 40,
      },
    }),
    1000,
  );

  const nextState = syncPotionStateWithSettings(potionState, {
    questionTimeLimitSec: 6,
    sessionQuestionCount: 50,
  });

  assert.notEqual(nextState, potionState);
  assert.equal(nextState.phase, "playing");
  assert.equal(nextState.settings.questionTimeLimitSec, 6);
  assert.equal(nextState.settings.sessionQuestionCount, 50);
  assert.equal(nextState.session.config.questionTimeLimitSec, 3);
  assert.equal(nextState.session.config.sessionQuestionCount, 40);
});

test("createCheckingPotionState captures feedback and schedules checking expiry", () => {
  const potionState = createStartedPotionState(createPotionViewState(), 1000);

  const nextState = createCheckingPotionState(
    potionState,
    {
      session: {
        ...potionState.session,
        status: "playing",
      },
      question: {
        comboId: "combo-1",
        questionNumber: 2,
      },
      questionResult: {
        actualColor: "blue",
        selectedColor: "red",
        timedOut: false,
      },
      speedBandScore: 4,
      visibleResult: "failure",
    },
    820,
    5000,
  );

  assert.equal(nextState.phase, "checking");
  assert.equal(nextState.feedback.questionNumber, 2);
  assert.equal(nextState.feedback.comboId, "combo-1");
  assert.equal(nextState.feedback.responseTimeMs, 820);
  assert.equal(nextState.checkingEndsAtMs, 6200);
  assert.equal(nextState.questionStartedAtMs, null);
});

test("createAdvancedPotionState moves finished checking state to finished screen", () => {
  const checkingState = {
    ...createPotionViewState(),
    phase: "checking",
    feedback: {
      actualColor: "red",
      comboId: "combo-2",
      questionNumber: 40,
      responseTimeMs: 1100,
      selectedColor: "red",
      speedBandScore: 1,
      timedOut: false,
      visibleResult: "success",
    },
    session: {
      ...createPotionViewState().session,
      status: "finished",
    },
  };

  const nextState = createAdvancedPotionState(checkingState, 7000);

  assert.equal(nextState.phase, "finished");
  assert.equal(nextState.feedback, null);
  assert.equal(nextState.checkingEndsAtMs, null);
  assert.equal(nextState.questionStartedAtMs, null);
});
