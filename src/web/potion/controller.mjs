import { submitPotionAnswer, timeoutPotionQuestion } from "../potion-engine.mjs";
import { savePracticeResult } from "../storage.mjs";
import { GAME_META } from "../shared/game-meta.mjs";
import { POTION_SETTING_DEFINITIONS } from "../shared/potion-content.mjs";
import { createPotionPracticeResult } from "../shared/potion-results.mjs";
import {
  createPotionViewState,
  normalizePotionSettingValue,
  shouldResetPotionStateOnEntry,
} from "./state.mjs";
import { POTION_FEEDBACK_STAGE_DURATION_MS } from "./timers.mjs";

export function createPotionController({
  state,
  renderApp,
  timerController,
  navigate,
  getRootElement,
}) {
  const pointerState = {
    x: null,
    y: null,
    isInsideRoot: false,
  };

  function setPotionPracticeSetting(settingKey, rawValue) {
    const definition = POTION_SETTING_DEFINITIONS[settingKey];
    if (!definition) {
      return;
    }

    const currentValue = state.potion.settings[settingKey];
    const nextValue = normalizePotionSettingValue(
      settingKey,
      rawValue,
      currentValue,
    );
    if (currentValue === nextValue && String(rawValue) === String(currentValue)) {
      return;
    }

    state.potion = createPotionViewState({
      settings: {
        ...state.potion.settings,
        [settingKey]: nextValue,
      },
    });
    renderApp();
  }

  function startPotionGame() {
    if (state.potion.phase === "playing") {
      return;
    }

    timerController.clearIntroTimers();
    timerController.clearFeedbackTimer();

    state.potion.phase = "playing";
    state.potion.feedback = null;
    state.potion.checkingEndsAtMs = null;
    state.potion.questionStartedAtMs = Date.now();

    timerController.ensurePotionLoopForCurrentState();
    renderApp();
  }

  function submitPotionChoice(color) {
    if (state.potion.phase !== "playing") {
      return;
    }

    const questionStartedAtMs = state.potion.questionStartedAtMs ?? Date.now();
    const responseTimeMs = Math.max(Date.now() - questionStartedAtMs, 0);
    const turn = submitPotionAnswer(
      state.potion.session,
      {
        selectedColor: color,
        responseTimeMs,
      },
      {
        answeredAt: new Date().toISOString(),
      },
    );

    commitPotionTurn(turn, responseTimeMs);
  }

  function handlePotionTimeout() {
    if (state.potion.phase !== "playing") {
      return;
    }

    const turn = timeoutPotionQuestion(state.potion.session, {
      answeredAt: new Date().toISOString(),
    });

    commitPotionTurn(
      turn,
      state.potion.session.config.questionTimeLimitSec * 1000,
    );
  }

  function advancePotionQuestion() {
    if (state.potion.phase !== "checking") {
      return;
    }

    if (state.potion.session.status === "finished") {
      state.potion.phase = "finished";
      state.potion.feedback = null;
      state.potion.questionStartedAtMs = null;
      state.potion.checkingEndsAtMs = null;

      timerController.ensurePotionLoopForCurrentState();
      renderApp();
      return;
    }

    state.potion.phase = "playing";
    state.potion.feedback = null;
    state.potion.questionStartedAtMs = Date.now();
    state.potion.checkingEndsAtMs = null;

    timerController.ensurePotionLoopForCurrentState();
    renderApp();
  }

  function enterPotionGame(entryMode = "auto") {
    if (shouldResetPotionStateOnEntry(entryMode, state.potion.phase)) {
      resetPotionExperience({ shouldRender: false });
    }

    if (state.route === GAME_META.potion.route) {
      timerController.ensurePotionLoopForCurrentState();
      renderApp();
      return;
    }

    navigate(GAME_META.potion.route);
  }

  function resetPotionExperience({ shouldRender = true } = {}) {
    timerController.clearAllPotionTimers();

    state.potion = createPotionViewState({
      settings: state.potion.settings,
    });

    timerController.ensurePotionLoopForCurrentState();
    if (shouldRender) {
      renderApp();
    }
  }

  function abortPotionSession() {
    if (typeof window !== "undefined") {
      const shouldAbort = window.confirm(
        "현재 진행 중인 게임은 저장되지 않고 메인 화면으로 돌아갑니다. 계속할까요?",
      );
      if (!shouldAbort) {
        return;
      }
    }

    timerController.clearAllPotionTimers();
    state.potion = createPotionViewState({
      settings: state.potion.settings,
    });
    navigate("/");
  }

  function completePotionExperience() {
    timerController.clearFinishedRedirectTimer();
    navigate("/results");
  }

  function handlePotionPointerMove(event) {
    if (event.pointerType && event.pointerType !== "mouse") {
      clearTrackedPointerState();
      return;
    }

    pointerState.x = event.clientX;
    pointerState.y = event.clientY;
    pointerState.isInsideRoot = true;
    syncPotionChoiceHoverFromPointer();
  }

  function handlePotionPointerLeave() {
    clearTrackedPointerState();
  }

  function syncPotionChoiceHoverFromPointer() {
    setPotionHoveredChoiceColor(getPotionHoveredChoiceColorFromPointer());
  }

  function commitPotionTurn(turn, responseTimeMs) {
    timerController.clearQuestionTimers();

    state.potion.session = turn.session;
    state.potion.feedback = {
      questionNumber: turn.question.questionNumber,
      comboId: turn.question.comboId,
      selectedColor: turn.questionResult.selectedColor,
      actualColor: turn.questionResult.actualColor,
      timedOut: turn.questionResult.timedOut,
      visibleResult: turn.visibleResult,
      responseTimeMs,
      speedBandScore: turn.speedBandScore,
    };

    state.potion.phase = "checking";
    state.potion.questionStartedAtMs = null;
    state.potion.checkingEndsAtMs =
      Date.now() + POTION_FEEDBACK_STAGE_DURATION_MS;

    if (turn.isFinished) {
      persistPotionResult();
    }

    timerController.ensurePotionLoopForCurrentState();
    renderApp();
  }

  function persistPotionResult() {
    const { session, savedResultId } = state.potion;
    if (!session.summary || savedResultId === session.id) {
      return;
    }

    const practiceResult = createPotionPracticeResult(session);
    if (!practiceResult) {
      return;
    }

    state.results = savePracticeResult(practiceResult);
    state.potion.savedResultId = session.id;
  }

  function clearTrackedPointerState() {
    pointerState.x = null;
    pointerState.y = null;
    pointerState.isInsideRoot = false;
    syncPotionChoiceHoverFromPointer();
  }

  function getPotionHoveredChoiceColorFromPointer() {
    if (
      typeof document === "undefined" ||
      !pointerState.isInsideRoot ||
      pointerState.x == null ||
      pointerState.y == null ||
      state.route !== "/games/potion" ||
      state.potion.phase !== "playing"
    ) {
      return null;
    }

    const hoveredElement = document.elementFromPoint(
      pointerState.x,
      pointerState.y,
    );
    if (!(hoveredElement instanceof Element)) {
      return null;
    }

    const hoveredButton = hoveredElement.closest(
      ".potion-choice-button[data-action='potion-answer']",
    );
    if (
      !(hoveredButton instanceof Element) ||
      hoveredButton.hasAttribute("disabled")
    ) {
      return null;
    }

    const hoveredColor = hoveredButton.getAttribute("data-color");
    return hoveredColor === "blue" || hoveredColor === "red"
      ? hoveredColor
      : null;
  }

  function setPotionHoveredChoiceColor(color) {
    const nextHoveredChoiceColor =
      color === "blue" || color === "red" ? color : null;
    if (state.potion.hoveredChoiceColor === nextHoveredChoiceColor) {
      return;
    }

    state.potion.hoveredChoiceColor = nextHoveredChoiceColor;
    syncPotionChoiceHoverUi();
  }

  function syncPotionChoiceHoverUi() {
    const rootElement = getRootElement();
    if (!rootElement) {
      return;
    }

    const choiceButtons = rootElement.querySelectorAll(
      ".potion-choice-button[data-action='potion-answer']",
    );
    for (const button of choiceButtons) {
      if (!(button instanceof Element)) {
        continue;
      }

      button.classList.toggle(
        "is-hovered",
        !button.hasAttribute("disabled") &&
          button.getAttribute("data-color") === state.potion.hoveredChoiceColor,
      );
    }
  }

  return {
    abortPotionSession,
    advancePotionQuestion,
    completePotionExperience,
    enterPotionGame,
    handlePotionTimeout,
    handlePotionPointerLeave,
    handlePotionPointerMove,
    resetPotionExperience,
    setPotionPracticeSetting,
    syncPotionChoiceHoverFromPointer,
    startPotionGame,
    submitPotionChoice,
  };
}
