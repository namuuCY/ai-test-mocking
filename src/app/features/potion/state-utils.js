import { createPotionViewState } from "../../../web/potion/state.mjs";
import { POTION_FEEDBACK_STAGE_DURATION_MS } from "../../../web/potion/timers.mjs";

export function hasSamePotionSettings(left, right) {
  return (
    left?.sessionQuestionCount === right?.sessionQuestionCount &&
    left?.questionTimeLimitSec === right?.questionTimeLimitSec
  );
}

export function syncPotionStateWithSettings(potionState, nextSettings) {
  if (hasSamePotionSettings(potionState.settings, nextSettings)) {
    return potionState;
  }

  if (potionState.phase === "tutorial" || potionState.phase === "finished") {
    return createPotionViewState({
      settings: nextSettings,
    });
  }

  return {
    ...potionState,
    settings: nextSettings,
  };
}

export function createStartedPotionState(potionState, now = Date.now()) {
  if (potionState.phase === "playing") {
    return potionState;
  }

  return {
    ...potionState,
    phase: "playing",
    feedback: null,
    hoveredChoiceColor: null,
    checkingEndsAtMs: null,
    questionStartedAtMs: now,
  };
}

export function createCheckingPotionState(
  potionState,
  turn,
  responseTimeMs,
  now = Date.now(),
) {
  return {
    ...potionState,
    session: turn.session,
    phase: "checking",
    feedback: {
      questionNumber: turn.question.questionNumber,
      comboId: turn.question.comboId,
      selectedColor: turn.questionResult.selectedColor,
      actualColor: turn.questionResult.actualColor,
      timedOut: turn.questionResult.timedOut,
      visibleResult: turn.visibleResult,
      responseTimeMs,
      speedBandScore: turn.speedBandScore,
    },
    hoveredChoiceColor: null,
    questionStartedAtMs: null,
    checkingEndsAtMs: now + POTION_FEEDBACK_STAGE_DURATION_MS,
  };
}

export function createAdvancedPotionState(potionState, now = Date.now()) {
  if (potionState.phase !== "checking") {
    return potionState;
  }

  if (potionState.session.status === "finished") {
    return {
      ...potionState,
      phase: "finished",
      feedback: null,
      hoveredChoiceColor: null,
      questionStartedAtMs: null,
      checkingEndsAtMs: null,
    };
  }

  return {
    ...potionState,
    phase: "playing",
    feedback: null,
    hoveredChoiceColor: null,
    questionStartedAtMs: now,
    checkingEndsAtMs: null,
  };
}

export function createResetPotionState(potionState) {
  return createPotionViewState({
    settings: potionState.settings,
  });
}
