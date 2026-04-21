import { DEFAULT_POTION_INGREDIENTS } from "../potion-engine.mjs";
import {
  getPotionDisplayQuestionInfo,
  getPotionIntroCountdownText,
  getPotionIntroProgressRatio,
  getPotionQuestionTimeRatio,
  isPotionQuestionTimerDanger,
} from "./timers.mjs";

export function renderPotionPage({ potionState, currentQuestion }) {
  const questionInfo = getPotionDisplayQuestionInfo(potionState, currentQuestion);

  return `
    <section class="potion-route">
      <div class="potion-route__stage">
        ${
          potionState.phase === "tutorial"
            ? renderPotionTutorialStage(potionState, currentQuestion)
            : potionState.phase === "finished"
              ? renderPotionFinishedStage()
              : renderPotionQuestionStage(potionState, questionInfo, currentQuestion)
        }
      </div>
      ${renderPotionTimeoutOverlay(potionState)}
    </section>
  `;
}

function renderPotionTutorialStage(potionState, currentQuestion) {
  const config = potionState.session.config;
  const progressRatio = getPotionIntroProgressRatio(potionState);

  return `
    <section class="potion-tutorial-card">
      <header class="potion-tutorial-card__header">
        <span>마법약 만들기</span>
        <span class="potion-tutorial-card__divider"></span>
        <span>실전</span>
      </header>
      <div class="potion-tutorial-card__body">
        <div class="potion-tutorial-card__preview">
          <div class="potion-tutorial-card__preview-bar"></div>
          ${renderPotionIngredientMatrix(currentQuestion?.combo, { compact: true })}
          <div class="potion-tutorial-card__preview-actions">
            <span class="tutorial-pill tutorial-pill--blue">파란약</span>
            <span class="tutorial-pill tutorial-pill--red">빨간약</span>
          </div>
        </div>
        <ol class="potion-tutorial-card__rules">
          <li>4개의 재료 조합이 총 ${config.sessionQuestionCount}번 제시됩니다.</li>
          <li>4개의 재료 조합이 어떤 마법약으로 제조될지 정확히 기억하여 제조될 마법약을 선택해 주세요.</li>
          <li>같은 재료 조합이라도 경우에 따라 결과가 달라지니 더 높은 확률로 제조될 마법약을 선택해 주세요.</li>
          <li>각 문항은 ${config.questionTimeLimitSec}초 안에 응답해야 합니다.</li>
        </ol>
      </div>
      <div class="potion-tutorial-card__footer">
        <div class="tutorial-progress">
          <span class="tutorial-progress__fill" style="transform:scaleX(${progressRatio})"></span>
        </div>
        <p class="potion-tutorial-card__countdown">${getPotionIntroCountdownText(potionState)}</p>
      </div>
    </section>
  `;
}

function renderPotionQuestionStage(potionState, questionInfo, currentQuestion) {
  const feedback = potionState.feedback;
  const isInlineFeedback =
    potionState.phase === "checking" && feedback && !feedback.timedOut;
  const displayedCombo = getPotionDisplayedCombo(potionState, currentQuestion);
  const timerRatio = getPotionQuestionTimeRatio(potionState);
  const timerDangerClass = isPotionQuestionTimerDanger(potionState)
    ? " is-danger"
    : "";

  return `
    <section class="potion-question-card">
      ${renderPotionQuestionHeader(questionInfo)}
      <div class="potion-question-card__timer">
        <span
          class="potion-question-card__timer-fill${timerDangerClass}"
          style="transform:scaleX(${timerRatio})"
        ></span>
      </div>
      <div class="potion-question-card__content">
        ${
          isInlineFeedback
            ? renderPotionAnsweredFeedbackBody(potionState)
            : `
              <div class="potion-question-card__body">
                ${renderPotionIngredientMatrix(displayedCombo)}
              </div>
              <div class="potion-question-card__actions">
                ${renderPotionChoiceButtons(potionState)}
              </div>
            `
        }
      </div>
    </section>
  `;
}

function renderPotionAnsweredFeedbackBody(potionState) {
  const feedback = potionState.feedback;
  if (!feedback || feedback.timedOut) {
    return "";
  }

  return `
    <div class="potion-question-card__feedback-body">
      ${renderPotionFeedbackCard(potionState)}
    </div>
  `;
}

function renderPotionTimeoutOverlay(potionState) {
  const feedback = potionState.feedback;
  if (potionState.phase !== "checking" || !feedback || !feedback.timedOut) {
    return "";
  }

  return `
    <div class="potion-page-overlay" aria-live="assertive">
      <article class="potion-timeout-card" role="alert">
        <div class="potion-timeout-card__icon" aria-hidden="true">
          ${renderPotionInfoIcon()}
        </div>
        <p>제한 시간이 지나 응답이 저장되지 않았습니다.</p>
        <p>제한 시간 내 '파란약' 또는 '빨간약' 버튼을 클릭해 주세요.</p>
      </article>
    </div>
  `;
}

function getPotionDisplayedCombo(potionState, currentQuestion) {
  if (potionState.phase !== "checking" || !potionState.feedback) {
    return currentQuestion?.combo ?? null;
  }

  return (
    potionState.session.comboCatalog.find(
      (combo) => combo.id === potionState.feedback.comboId,
    ) ??
    currentQuestion?.combo ??
    null
  );
}

function renderPotionQuestionHeader(questionInfo) {
  return `
    <header class="potion-question-card__header">
      <div class="potion-question-card__prompt">
        <strong>${questionInfo.questionNumber}</strong>
        <span class="potion-question-card__separator"></span>
        <span>제시되는 재료의 조합으로 어떤 마법약이 제조될지 예측해 보세요.</span>
      </div>
      <div class="potion-question-card__side">
        <div class="potion-question-card__meta">
          <span class="potion-question-card__remaining">남은 문항 ${questionInfo.remainingQuestions}</span>
          <span class="potion-question-card__countdown">${questionInfo.timerValue}</span>
        </div>
        <button
          type="button"
          class="potion-question-card__reset"
          data-action="abort-potion-session"
        >
          리셋
        </button>
      </div>
    </header>
  `;
}

function renderPotionIngredientMatrix(combo, options = {}) {
  const activeIngredientIds = new Set(combo?.ingredientIds ?? []);
  const sizeClass = options.compact ? "is-compact" : "";

  return `
    <div class="potion-ingredient-matrix ${sizeClass}">
      ${DEFAULT_POTION_INGREDIENTS.map((ingredient) =>
        renderPotionIngredientSlot(
          ingredient,
          activeIngredientIds.has(ingredient.id),
          options,
        ),
      ).join("")}
    </div>
  `;
}

function renderPotionIngredientSlot(ingredient, isActive, options = {}) {
  return `
    <article class="potion-ingredient-slot ${isActive ? "is-active" : "is-idle"} ${options.compact ? "is-compact" : ""}">
      ${
        isActive
          ? renderPotionIngredientArt(ingredient.art)
          : renderPotionPlaceholderArt()
      }
    </article>
  `;
}

function renderPotionIngredientArt(art) {
  switch (art) {
    case "seed":
      return `
        <svg class="ingredient-art ingredient-art--seed" viewBox="0 0 96 96" aria-hidden="true">
          <ellipse cx="46" cy="52" rx="16" ry="24"></ellipse>
          <ellipse cx="58" cy="40" rx="10" ry="18"></ellipse>
          <path d="M35 40c-9-4-14-12-15-22c10 4 16 11 19 21"></path>
        </svg>
      `;
    case "grass":
      return `
        <svg class="ingredient-art ingredient-art--grass" viewBox="0 0 96 96" aria-hidden="true">
          <path d="M24 74c5-18 6-33 4-47"></path>
          <path d="M38 78c3-22 3-40-1-55"></path>
          <path d="M52 80c4-25 5-45 9-61"></path>
          <path d="M67 77c-3-18-2-34 5-49"></path>
        </svg>
      `;
    case "wing":
      return `
        <svg class="ingredient-art ingredient-art--wing" viewBox="0 0 96 96" aria-hidden="true">
          <path d="M24 54c10-20 27-29 50-29c-3 10-10 18-20 24c7 4 12 10 15 18c-21 1-36-4-45-13"></path>
        </svg>
      `;
    case "mint":
    default:
      return `
        <svg class="ingredient-art ingredient-art--mint" viewBox="0 0 96 96" aria-hidden="true">
          <ellipse cx="49" cy="30" rx="12" ry="20"></ellipse>
          <ellipse cx="30" cy="46" rx="12" ry="18" transform="rotate(-28 30 46)"></ellipse>
          <ellipse cx="48" cy="50" rx="13" ry="19"></ellipse>
          <ellipse cx="65" cy="46" rx="12" ry="18" transform="rotate(28 65 46)"></ellipse>
          <path d="M47 68c1-18 1-34-2-50"></path>
        </svg>
      `;
  }
}

function renderPotionPlaceholderArt() {
  return `
    <svg class="ingredient-placeholder" viewBox="0 0 160 108" aria-hidden="true">
      <path d="M0 78c26-18 52-18 78 0c20 14 48 12 82-2v32H0z" fill="#c7ccd3"></path>
      <path d="M0 90c25-11 47-8 68 4c18 10 48 8 92-3v17H0z" fill="#d7dbe0"></path>
    </svg>
  `;
}

function renderPotionChoiceButtons(potionState) {
  const isPlaying = potionState.phase === "playing";
  const hoveredChoiceColor = isPlaying ? potionState.hoveredChoiceColor : null;
  const selectedColor = null;
  const blueStateClass = [
    selectedColor === "blue" ? "is-selected" : "",
    hoveredChoiceColor === "blue" ? "is-hovered" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const redStateClass = [
    selectedColor === "red" ? "is-selected" : "",
    hoveredChoiceColor === "red" ? "is-hovered" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <div class="potion-choice-row">
      <button
        type="button"
        class="potion-choice-button potion-choice-button--blue ${blueStateClass}"
        data-action="potion-answer"
        data-color="blue"
        ${isPlaying ? "" : "disabled"}
      >
        파란약
      </button>
      <button
        type="button"
        class="potion-choice-button potion-choice-button--red ${redStateClass}"
        data-action="potion-answer"
        data-color="red"
        ${isPlaying ? "" : "disabled"}
      >
        빨간약
      </button>
    </div>
  `;
}

function renderPotionFeedbackCard(potionState) {
  const feedback = potionState.feedback;
  if (!feedback) {
    return "";
  }

  const isSuccess = feedback.visibleResult === "success";
  const actualColorLabel =
    feedback.actualColor === "blue" ? "파란약" : "빨간약";
  const title = feedback.timedOut
    ? "시간 초과"
    : isSuccess
      ? "예측 성공"
      : "예측 실패";

  return `
    <article class="potion-feedback-card ${isSuccess ? "is-success" : "is-failure"}">
      <div class="potion-feedback-card__art">
        ${renderPotionFlaskArt(feedback.actualColor, isSuccess)}
      </div>
      <div class="potion-feedback-card__copy">
        <h2>${title}</h2>
        <p>${actualColorLabel}이 제조되었습니다.</p>
      </div>
    </article>
  `;
}

function renderPotionFlaskArt(color, isSuccess) {
  const liquidClass = color === "blue" ? "is-blue" : "is-red";
  return `
    <svg class="potion-flask ${liquidClass}" viewBox="0 0 180 120" aria-hidden="true">
      <g class="potion-flask__spark ${isSuccess ? "is-visible" : ""}">
        <path d="M132 24v12"></path>
        <path d="M146 30h12"></path>
        <path d="M142 18l8-8"></path>
        <path d="M142 42l8 8"></path>
      </g>
      <g transform="translate(52 12)">
        <rect x="22" y="0" width="18" height="24" rx="8"></rect>
        <path d="M18 18h26l-4 14l28 34c12 15 2 38-17 38H11C-8 102-18 79-6 64l28-32z"></path>
        <path class="potion-flask__liquid" d="M4 74c10-6 22-4 35 4c9 6 19 7 32 3c1 12-8 23-22 23H18C6 104-1 89 4 74z"></path>
      </g>
    </svg>
  `;
}

function renderPotionInfoIcon() {
  return `
    <svg class="potion-info-icon" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="20"></circle>
      <path d="M24 20v12"></path>
      <circle cx="24" cy="14" r="2"></circle>
    </svg>
  `;
}

function renderPotionFinishedStage() {
  return `
    <section class="potion-finished-card">
      <div class="potion-finished-card__icon">
        ${renderPotionFinishBadge()}
      </div>
      <h1>수고하셨어요!</h1>
      <p>마법약 만들기 과제를 완료했어요.</p>
      <p class="potion-finished-card__hint">잠시 후 연습 기록으로 이동합니다.</p>
      <button
        type="button"
        class="potion-finished-card__button"
        data-action="complete-potion"
        aria-label="연습 기록 보기"
      >
        연습 기록 보기
      </button>
    </section>
  `;
}

function renderPotionFinishBadge() {
  return `
    <svg class="potion-finish-badge" viewBox="0 0 80 80" aria-hidden="true">
      <rect x="8" y="8" width="64" height="64" rx="18"></rect>
      <path d="M43 20h8v10h-8z"></path>
      <path d="M28 30h24l-4 11l14 16c6 7 1 17-8 17H26c-9 0-14-10-8-17l14-16z"></path>
      <path class="potion-finish-badge__liquid" d="M22 57c7-4 14-3 23 3c5 3 11 4 19 1c0 7-5 13-12 13H28c-6 0-10-7-6-17z"></path>
    </svg>
  `;
}
