import { startTransition, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getPotionCurrentQuestion,
  submitPotionAnswer,
  timeoutPotionQuestion,
} from "../../../web/potion-engine.mjs";
import {
  createPotionViewState,
  normalizePotionSettings,
} from "../../../web/potion/state.mjs";
import {
  getPotionDisplayQuestionInfo,
  POTION_FINISHED_REDIRECT_DELAY_MS,
} from "../../../web/potion/timers.mjs";
import { savePracticeResult } from "../../../web/storage.mjs";
import { createPotionPracticeResult } from "../../../web/shared/potion-results.mjs";
import { ROUTES } from "../../../web/shared/routes.mjs";
import {
  createAdvancedPotionState,
  createCheckingPotionState,
  createResetPotionState,
  createStartedPotionState,
  syncPotionStateWithSettings,
} from "./state-utils.js";

export function usePotionGame({ potionSettings, onResultsChange }) {
  const navigate = useNavigate();
  const [potionState, setPotionState] = useState(() =>
    createPotionViewState({
      settings: normalizePotionSettings(potionSettings),
    }),
  );
  const [now, setNow] = useState(() => Date.now());
  const potionStateRef = useRef(potionState);
  const onResultsChangeRef = useRef(onResultsChange);
  const currentQuestion = getPotionCurrentQuestion(potionState.session);
  const questionInfo = getPotionDisplayQuestionInfo(
    potionState,
    currentQuestion,
    now,
  );

  useEffect(() => {
    potionStateRef.current = potionState;
  }, [potionState]);

  useEffect(() => {
    onResultsChangeRef.current = onResultsChange;
  }, [onResultsChange]);

  useEffect(() => {
    const nextSettings = normalizePotionSettings(potionSettings);
    const nextState = syncPotionStateWithSettings(
      potionStateRef.current,
      nextSettings,
    );
    if (nextState === potionStateRef.current) {
      return;
    }

    commitPotionState(nextState);
  }, [
    potionSettings.questionTimeLimitSec,
    potionSettings.sessionQuestionCount,
  ]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      (potionState.phase !== "tutorial" && potionState.phase !== "playing")
    ) {
      return undefined;
    }

    let frameId = null;

    const tick = () => {
      startTransition(() => {
        setNow(Date.now());
      });
      frameId = window.requestAnimationFrame(tick);
    };

    setNow(Date.now());
    frameId = window.requestAnimationFrame(tick);

    return () => {
      if (frameId != null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [
    potionState.phase,
    potionState.introEndsAtMs,
    potionState.questionStartedAtMs,
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || potionState.phase !== "tutorial") {
      return undefined;
    }

    const remainingMs = Math.max(potionState.introEndsAtMs - Date.now(), 0);
    if (remainingMs <= 0) {
      startPotionGame();
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      startPotionGame();
    }, remainingMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [potionState.phase, potionState.introEndsAtMs]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      potionState.phase !== "playing" ||
      !potionState.questionStartedAtMs
    ) {
      return undefined;
    }

    const timeLimitMs = potionState.session.config.questionTimeLimitSec * 1000;
    const remainingMs = Math.max(
      timeLimitMs - (Date.now() - potionState.questionStartedAtMs),
      0,
    );

    if (remainingMs <= 0) {
      handlePotionTimeout();
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      handlePotionTimeout();
    }, remainingMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    potionState.phase,
    potionState.questionStartedAtMs,
    potionState.session.config.questionTimeLimitSec,
  ]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      potionState.phase !== "checking" ||
      potionState.checkingEndsAtMs == null
    ) {
      return undefined;
    }

    const remainingMs = Math.max(potionState.checkingEndsAtMs - Date.now(), 0);
    const timeoutId = window.setTimeout(() => {
      advancePotionQuestion();
    }, remainingMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [potionState.phase, potionState.checkingEndsAtMs]);

  useEffect(() => {
    if (typeof window === "undefined" || potionState.phase !== "finished") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      completePotionExperience();
    }, POTION_FINISHED_REDIRECT_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [potionState.phase]);

  function commitPotionState(nextState) {
    potionStateRef.current = nextState;
    setPotionState(nextState);
  }

  function startPotionGame() {
    const nextState = createStartedPotionState(potionStateRef.current, Date.now());
    if (nextState === potionStateRef.current) {
      return;
    }

    commitPotionState(nextState);
    setNow(Date.now());
  }

  function advancePotionQuestion() {
    const nextState = createAdvancedPotionState(potionStateRef.current, Date.now());
    if (nextState === potionStateRef.current) {
      return;
    }

    commitPotionState(nextState);
    setNow(Date.now());
  }

  function completePotionExperience() {
    navigate(ROUTES.results);
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

    commitPotionState(createResetPotionState(potionStateRef.current));
    navigate(ROUTES.home);
  }

  function handlePotionTimeout() {
    const currentState = potionStateRef.current;
    if (currentState.phase !== "playing") {
      return;
    }

    const turn = timeoutPotionQuestion(currentState.session, {
      answeredAt: new Date().toISOString(),
    });

    commitPotionTurn(
      currentState,
      turn,
      currentState.session.config.questionTimeLimitSec * 1000,
    );
  }

  function submitPotionChoice(color) {
    const currentState = potionStateRef.current;
    if (currentState.phase !== "playing") {
      return;
    }

    const answeredAtMs = Date.now();
    const questionStartedAtMs =
      currentState.questionStartedAtMs ?? answeredAtMs;
    const responseTimeMs = Math.max(answeredAtMs - questionStartedAtMs, 0);
    const turn = submitPotionAnswer(
      currentState.session,
      {
        selectedColor: color,
        responseTimeMs,
      },
      {
        answeredAt: new Date(answeredAtMs).toISOString(),
      },
    );

    commitPotionTurn(currentState, turn, responseTimeMs);
  }

  function commitPotionTurn(currentState, turn, responseTimeMs) {
    const nextState = createCheckingPotionState(
      currentState,
      turn,
      responseTimeMs,
      Date.now(),
    );

    if (turn.isFinished) {
      const practiceResult = createPotionPracticeResult(turn.session);
      if (practiceResult && nextState.savedResultId !== turn.session.id) {
        nextState.savedResultId = turn.session.id;
        onResultsChangeRef.current?.(savePracticeResult(practiceResult));
      }
    }

    commitPotionState(nextState);
    setNow(Date.now());
  }

  function setHoveredChoiceColor(color) {
    const currentState = potionStateRef.current;
    if (currentState.phase !== "playing") {
      return;
    }

    const nextColor = color === "blue" || color === "red" ? color : null;
    if (currentState.hoveredChoiceColor === nextColor) {
      return;
    }

    commitPotionState({
      ...currentState,
      hoveredChoiceColor: nextColor,
    });
  }

  return {
    currentQuestion,
    now,
    onAbort: abortPotionSession,
    onChoiceHover: setHoveredChoiceColor,
    onComplete: completePotionExperience,
    onSelectChoice: submitPotionChoice,
    potionState,
    questionInfo,
    showTimeoutOverlay:
      potionState.phase === "checking" && potionState.feedback?.timedOut,
  };
}
