export const POTION_TIMER_DANGER_THRESHOLD_SEC = 1;
export const POTION_FEEDBACK_STAGE_DURATION_MS = 1200;
export const POTION_FINISHED_REDIRECT_DELAY_MS = 1200;

export function createPotionTimerRegistry() {
  return {
    introAnimationFrame: null,
    introAutoStart: null,
    questionAnimationFrame: null,
    questionTimeout: null,
    feedbackAdvance: null,
    finishedRedirect: null,
  };
}

export function getPotionDisplayQuestionInfo(
  potionState,
  currentQuestion,
  now = Date.now(),
) {
  const questionNumber =
    potionState.phase === "checking"
      ? (potionState.feedback?.questionNumber ??
        potionState.session.completedQuestionCount)
      : (currentQuestion?.questionNumber ??
        potionState.session.completedQuestionCount);
  const remainingQuestions =
    potionState.session.config.sessionQuestionCount - questionNumber;

  return {
    questionNumber,
    remainingQuestions,
    timerValue: getPotionTimerDisplayValue(potionState, now),
  };
}

export function getPotionTimerDisplayValue(potionState, now = Date.now()) {
  const timeLimitMs = potionState.session.config.questionTimeLimitSec * 1000;

  if (potionState.phase === "checking" && potionState.feedback) {
    const remainingMs = potionState.feedback.timedOut
      ? 0
      : Math.max(timeLimitMs - potionState.feedback.responseTimeMs, 0);
    return Math.max(Math.ceil(remainingMs / 1000), 1);
  }

  if (potionState.phase === "playing" && potionState.questionStartedAtMs) {
    const remainingMs = Math.max(
      timeLimitMs - (now - potionState.questionStartedAtMs),
      0,
    );
    return Math.max(Math.ceil(remainingMs / 1000), 1);
  }

  return potionState.session.config.questionTimeLimitSec;
}

export function getPotionQuestionTimeRatio(potionState, now = Date.now()) {
  const timeLimitMs = potionState.session.config.questionTimeLimitSec * 1000;

  if (potionState.phase === "checking" && potionState.feedback) {
    const remainingMs = potionState.feedback.timedOut
      ? 0
      : Math.max(timeLimitMs - potionState.feedback.responseTimeMs, 0);
    return clamp(timeLimitMs > 0 ? remainingMs / timeLimitMs : 0, 0, 1);
  }

  if (potionState.phase === "playing" && potionState.questionStartedAtMs) {
    const remainingMs = Math.max(
      timeLimitMs - (now - potionState.questionStartedAtMs),
      0,
    );
    return clamp(timeLimitMs > 0 ? remainingMs / timeLimitMs : 0, 0, 1);
  }

  return 0;
}

export function isPotionQuestionTimerDanger(
  potionState,
  now = Date.now(),
) {
  const timeLimitMs = potionState.session.config.questionTimeLimitSec * 1000;

  if (potionState.phase === "checking" && potionState.feedback) {
    const remainingMs = potionState.feedback.timedOut
      ? 0
      : Math.max(timeLimitMs - potionState.feedback.responseTimeMs, 0);
    return (
      remainingMs > 0 && remainingMs <= POTION_TIMER_DANGER_THRESHOLD_SEC * 1000
    );
  }

  if (potionState.phase !== "playing" || !potionState.questionStartedAtMs) {
    return false;
  }

  const remainingMs = Math.max(
    timeLimitMs - (now - potionState.questionStartedAtMs),
    0,
  );
  return remainingMs > 0 && remainingMs <= POTION_TIMER_DANGER_THRESHOLD_SEC * 1000;
}

export function getPotionIntroRemainingMs(potionState, now = Date.now()) {
  return Math.max(potionState.introEndsAtMs - now, 0);
}

export function getPotionIntroProgressRatio(potionState, now = Date.now()) {
  const totalIntroMs = potionState.session.config.introAutoStartSec * 1000;
  if (totalIntroMs <= 0) {
    return 1;
  }

  return clamp(1 - getPotionIntroRemainingMs(potionState, now) / totalIntroMs, 0, 1);
}

export function getPotionIntroCountdownText(potionState, now = Date.now()) {
  const remainingSeconds = Math.max(
    Math.ceil(getPotionIntroRemainingMs(potionState, now) / 1000),
    0,
  );
  return `${remainingSeconds}초가 지나면 자동으로 시작됩니다.`;
}

export function createPotionTimerController({
  getState,
  getRootElement,
  timers,
  onStartPotionGame,
  onHandlePotionTimeout,
  onAdvancePotionQuestion,
  onCompletePotionExperience,
}) {
  function ensurePotionLoopForCurrentState() {
    const state = getState();
    const { potion } = state;
    const isPotionRoute = state.route === "/games/potion";

    if (!isPotionRoute) {
      clearAllPotionTimers();
      return;
    }

    if (potion.phase === "tutorial") {
      clearFinishedRedirectTimer();
      if (potion.introEndsAtMs <= Date.now()) {
        state.potion.introEndsAtMs =
          Date.now() + state.potion.session.config.introAutoStartSec * 1000;
      }
      scheduleIntroCountdown();
      return;
    }

    clearIntroTimers();

    if (potion.phase === "playing") {
      clearFinishedRedirectTimer();
      scheduleQuestionCountdown();
      return;
    }

    clearQuestionTimers();

    if (potion.phase === "checking") {
      clearFinishedRedirectTimer();
      scheduleFeedbackAdvance();
      return;
    }

    clearFeedbackTimer();
    if (potion.phase === "finished") {
      schedulePotionFinishedRedirect();
      return;
    }

    clearFinishedRedirectTimer();
  }

  function clearAllPotionTimers() {
    clearIntroTimers();
    clearQuestionTimers();
    clearFeedbackTimer();
    clearFinishedRedirectTimer();
  }

  function scheduleIntroCountdown() {
    if (typeof window === "undefined") {
      return;
    }

    clearIntroTimers();

    const remainingMs = getPotionIntroRemainingMs(getState().potion);
    if (remainingMs <= 0) {
      onStartPotionGame();
      return;
    }

    timers.introAutoStart = window.setTimeout(() => {
      onStartPotionGame();
    }, remainingMs);

    syncPotionIntroUi();
    schedulePotionIntroAnimation();
  }

  function clearIntroTimers() {
    if (typeof window === "undefined") {
      return;
    }

    if (timers.introAnimationFrame) {
      window.cancelAnimationFrame(timers.introAnimationFrame);
      timers.introAnimationFrame = null;
    }

    if (timers.introAutoStart) {
      window.clearTimeout(timers.introAutoStart);
      timers.introAutoStart = null;
    }
  }

  function scheduleQuestionCountdown() {
    if (typeof window === "undefined") {
      return;
    }

    clearQuestionTimers();

    const potionState = getState().potion;
    const timeLimitMs = potionState.session.config.questionTimeLimitSec * 1000;
    const elapsedMs = Date.now() - potionState.questionStartedAtMs;
    const remainingMs = timeLimitMs - elapsedMs;

    if (remainingMs <= 0) {
      onHandlePotionTimeout();
      return;
    }

    timers.questionTimeout = window.setTimeout(() => {
      onHandlePotionTimeout();
    }, remainingMs);

    syncPotionQuestionTimerUi();
    schedulePotionQuestionTimerAnimation();
  }

  function clearQuestionTimers() {
    if (typeof window === "undefined") {
      return;
    }

    if (timers.questionAnimationFrame) {
      window.cancelAnimationFrame(timers.questionAnimationFrame);
      timers.questionAnimationFrame = null;
    }

    if (timers.questionTimeout) {
      window.clearTimeout(timers.questionTimeout);
      timers.questionTimeout = null;
    }
  }

  function scheduleFeedbackAdvance() {
    if (typeof window === "undefined") {
      return;
    }

    clearFeedbackTimer();

    const remainingMs = Math.max(
      (getState().potion.checkingEndsAtMs ?? Date.now()) - Date.now(),
      0,
    );
    timers.feedbackAdvance = window.setTimeout(() => {
      onAdvancePotionQuestion();
    }, remainingMs);
  }

  function clearFeedbackTimer() {
    if (typeof window === "undefined") {
      return;
    }

    if (timers.feedbackAdvance) {
      window.clearTimeout(timers.feedbackAdvance);
      timers.feedbackAdvance = null;
    }
  }

  function schedulePotionFinishedRedirect() {
    if (typeof window === "undefined") {
      return;
    }

    clearFinishedRedirectTimer();
    timers.finishedRedirect = window.setTimeout(() => {
      onCompletePotionExperience();
    }, POTION_FINISHED_REDIRECT_DELAY_MS);
  }

  function clearFinishedRedirectTimer() {
    if (typeof window === "undefined") {
      return;
    }

    if (timers.finishedRedirect) {
      window.clearTimeout(timers.finishedRedirect);
      timers.finishedRedirect = null;
    }
  }

  function syncPotionQuestionTimerUi() {
    const state = getState();
    const rootElement = getRootElement();
    if (
      !rootElement ||
      state.route !== "/games/potion" ||
      state.potion.phase !== "playing"
    ) {
      return;
    }

    const timerFillElement = rootElement.querySelector(
      ".potion-question-card__timer-fill",
    );
    if (timerFillElement) {
      timerFillElement.style.transform = `scaleX(${getPotionQuestionTimeRatio(state.potion)})`;
      timerFillElement.classList.toggle(
        "is-danger",
        isPotionQuestionTimerDanger(state.potion),
      );
    }

    const countdownElement = rootElement.querySelector(
      ".potion-question-card__countdown",
    );
    if (countdownElement) {
      countdownElement.textContent = String(getPotionTimerDisplayValue(state.potion));
    }
  }

  function syncPotionIntroUi() {
    const state = getState();
    const rootElement = getRootElement();
    if (
      !rootElement ||
      state.route !== "/games/potion" ||
      state.potion.phase !== "tutorial"
    ) {
      return;
    }

    const progressFillElement = rootElement.querySelector(
      ".tutorial-progress__fill",
    );
    if (progressFillElement) {
      progressFillElement.style.transform = `scaleX(${getPotionIntroProgressRatio(state.potion)})`;
    }

    const countdownElement = rootElement.querySelector(
      ".potion-tutorial-card__countdown",
    );
    if (countdownElement) {
      countdownElement.textContent = getPotionIntroCountdownText(state.potion);
    }
  }

  function schedulePotionIntroAnimation() {
    const state = getState();
    const rootElement = getRootElement();
    if (
      typeof window === "undefined" ||
      !rootElement ||
      state.route !== "/games/potion" ||
      state.potion.phase !== "tutorial"
    ) {
      return;
    }

    const animate = () => {
      const nextState = getState();
      if (
        nextState.route !== "/games/potion" ||
        nextState.potion.phase !== "tutorial"
      ) {
        timers.introAnimationFrame = null;
        return;
      }

      const remainingMs = getPotionIntroRemainingMs(nextState.potion);
      if (remainingMs <= 0) {
        timers.introAnimationFrame = null;
        onStartPotionGame();
        return;
      }

      syncPotionIntroUi();
      timers.introAnimationFrame = window.requestAnimationFrame(animate);
    };

    timers.introAnimationFrame = window.requestAnimationFrame(animate);
  }

  function schedulePotionQuestionTimerAnimation() {
    const state = getState();
    const rootElement = getRootElement();
    if (
      typeof window === "undefined" ||
      !rootElement ||
      state.route !== "/games/potion" ||
      state.potion.phase !== "playing"
    ) {
      return;
    }

    const animate = () => {
      const nextState = getState();
      if (
        nextState.route !== "/games/potion" ||
        nextState.potion.phase !== "playing"
      ) {
        timers.questionAnimationFrame = null;
        return;
      }

      syncPotionQuestionTimerUi();
      timers.questionAnimationFrame = window.requestAnimationFrame(animate);
    };

    timers.questionAnimationFrame = window.requestAnimationFrame(animate);
  }

  return {
    clearAllPotionTimers,
    clearFeedbackTimer,
    clearFinishedRedirectTimer,
    clearIntroTimers,
    clearQuestionTimers,
    ensurePotionLoopForCurrentState,
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
