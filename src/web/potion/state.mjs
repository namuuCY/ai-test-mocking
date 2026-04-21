import {
  DEFAULT_POTION_GAME_CONFIG,
  DEFAULT_POTION_INGREDIENTS,
  buildPotionComboCatalog,
  createPotionGameConfig,
  createPotionSession,
} from "../potion-engine.mjs";
import { POTION_SETTING_DEFINITIONS } from "../shared/potion-content.mjs";

export function createDefaultPotionSettings() {
  return {
    sessionQuestionCount: DEFAULT_POTION_GAME_CONFIG.sessionQuestionCount,
    questionTimeLimitSec: DEFAULT_POTION_GAME_CONFIG.questionTimeLimitSec,
  };
}

export function normalizePotionSettings(settings = {}) {
  return {
    sessionQuestionCount: normalizePotionSettingValue(
      "sessionQuestionCount",
      settings.sessionQuestionCount,
      DEFAULT_POTION_GAME_CONFIG.sessionQuestionCount,
    ),
    questionTimeLimitSec: normalizePotionSettingValue(
      "questionTimeLimitSec",
      settings.questionTimeLimitSec,
      DEFAULT_POTION_GAME_CONFIG.questionTimeLimitSec,
    ),
  };
}

export function normalizePotionSettingValue(
  settingKey,
  rawValue,
  fallbackValue,
) {
  const definition = POTION_SETTING_DEFINITIONS[settingKey];
  if (!definition) {
    return fallbackValue;
  }

  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) {
    return fallbackValue;
  }

  return clamp(Math.round(numericValue), definition.min, definition.max);
}

export function shouldResetPotionStateOnEntry(entryMode, phase) {
  return normalizePotionEntryMode(entryMode) === "fresh" || phase === "finished";
}

export function createPotionViewState(options = {}) {
  const settings = normalizePotionSettings(
    options.settings ?? createDefaultPotionSettings(),
  );
  const session = createFreshPotionSession(settings);

  return {
    settings,
    phase: "tutorial",
    session,
    introEndsAtMs: Date.now() + session.config.introAutoStartSec * 1000,
    questionStartedAtMs: null,
    checkingEndsAtMs: null,
    feedback: null,
    hoveredChoiceColor: null,
    savedResultId: null,
  };
}

export function createFreshPotionSession(
  settings = createDefaultPotionSettings(),
) {
  const normalizedSettings = normalizePotionSettings(settings);
  const config = createPotionGameConfig(normalizedSettings);

  return createPotionSession({
    config,
    comboCatalog: buildPotionComboCatalog(DEFAULT_POTION_INGREDIENTS, config),
    createdAt: new Date().toISOString(),
  });
}

function normalizePotionEntryMode(entryMode) {
  return entryMode === "fresh" ? "fresh" : "auto";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
