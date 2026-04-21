import { DEFAULT_POTION_GAME_CONFIG } from "../potion-engine.mjs";

export function formatPotionConfigLabel(config) {
  const questionCount =
    config?.sessionQuestionCount ??
    DEFAULT_POTION_GAME_CONFIG.sessionQuestionCount;
  const timeLimitSec =
    config?.questionTimeLimitSec ??
    DEFAULT_POTION_GAME_CONFIG.questionTimeLimitSec;

  return `${questionCount}문항 · ${timeLimitSec}초`;
}

export function formatPotionProbability(probability) {
  if (typeof probability !== "number") {
    return "-";
  }

  const percent = probability * 100;
  const hasFraction = Math.abs(percent - Math.round(percent)) > 1e-9;
  return `${hasFraction ? percent.toFixed(1) : percent.toFixed(0)}%`;
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatPercent(value) {
  return `${Math.round((value ?? 0) * 100)}%`;
}

export function formatScore(value) {
  return `${roundNumber(value ?? 0, 1).toFixed(1)}점`;
}

export function formatDuration(durationMs) {
  const totalSeconds = Math.max(Math.round((durationMs ?? 0) / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}분 ${String(seconds).padStart(2, "0")}초`;
}

export function roundNumber(value, decimals) {
  const multiplier = 10 ** decimals;
  return Math.round((value ?? 0) * multiplier) / multiplier;
}
