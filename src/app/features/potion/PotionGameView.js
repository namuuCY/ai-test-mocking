import React from "react";

import { DEFAULT_POTION_INGREDIENTS } from "../../../web/potion-engine.mjs";
import {
  getPotionIntroCountdownText,
  getPotionIntroProgressRatio,
  getPotionQuestionTimeRatio,
  isPotionQuestionTimerDanger,
} from "../../../web/potion/timers.mjs";

const h = React.createElement;

export function PotionGameView({
  currentQuestion,
  now,
  onAbort,
  onChoiceHover,
  onComplete,
  onSelectChoice,
  potionState,
  questionInfo,
  showTimeoutOverlay,
}) {
  return h(
    "section",
    {
      className: "potion-route",
    },
    h(
      "div",
      {
        className: "potion-route__stage",
      },
      potionState.phase === "tutorial"
        ? h(PotionTutorialStage, {
            currentQuestion,
            now,
            potionState,
          })
        : potionState.phase === "finished"
          ? h(PotionFinishedStage, {
              onComplete,
            })
          : h(PotionQuestionStage, {
              currentQuestion,
              now,
              onAbort,
              onChoiceHover,
              onSelectChoice,
              potionState,
              questionInfo,
            }),
    ),
    showTimeoutOverlay ? h(PotionTimeoutOverlay) : null,
  );
}

function PotionTutorialStage({ potionState, currentQuestion, now }) {
  const config = potionState.session.config;
  const progressRatio = getPotionIntroProgressRatio(potionState, now);

  return h(
    "section",
    {
      className: "potion-tutorial-card",
    },
    h(
      "header",
      {
        className: "potion-tutorial-card__header",
      },
      h("span", null, "마법약 만들기"),
      h("span", {
        className: "potion-tutorial-card__divider",
      }),
      h("span", null, "실전"),
    ),
    h(
      "div",
      {
        className: "potion-tutorial-card__body",
      },
      h(
        "div",
        {
          className: "potion-tutorial-card__preview",
        },
        h("div", {
          className: "potion-tutorial-card__preview-bar",
        }),
        h(PotionIngredientMatrix, {
          combo: currentQuestion?.combo ?? null,
          compact: true,
        }),
        h(
          "div",
          {
            className: "potion-tutorial-card__preview-actions",
          },
          h(
            "span",
            {
              className: "tutorial-pill tutorial-pill--blue",
            },
            "파란약",
          ),
          h(
            "span",
            {
              className: "tutorial-pill tutorial-pill--red",
            },
            "빨간약",
          ),
        ),
      ),
      h(
        "ol",
        {
          className: "potion-tutorial-card__rules",
        },
        h("li", null, `4개의 재료 조합이 총 ${config.sessionQuestionCount}번 제시됩니다.`),
        h(
          "li",
          null,
          "4개의 재료 조합이 어떤 마법약으로 제조될지 정확히 기억하여 제조될 마법약을 선택해 주세요.",
        ),
        h(
          "li",
          null,
          "같은 재료 조합이라도 경우에 따라 결과가 달라지니 더 높은 확률로 제조될 마법약을 선택해 주세요.",
        ),
        h(
          "li",
          null,
          `각 문항은 ${config.questionTimeLimitSec}초 안에 응답해야 합니다.`,
        ),
      ),
    ),
    h(
      "div",
      {
        className: "potion-tutorial-card__footer",
      },
      h(
        "div",
        {
          className: "tutorial-progress",
        },
        h("span", {
          className: "tutorial-progress__fill",
          style: {
            transform: `scaleX(${progressRatio})`,
          },
        }),
      ),
      h(
        "p",
        {
          className: "potion-tutorial-card__countdown",
        },
        getPotionIntroCountdownText(potionState, now),
      ),
    ),
  );
}

function PotionQuestionStage({
  potionState,
  currentQuestion,
  questionInfo,
  now,
  onAbort,
  onSelectChoice,
  onChoiceHover,
}) {
  const feedback = potionState.feedback;
  const isInlineFeedback =
    potionState.phase === "checking" && feedback && !feedback.timedOut;
  const timerRatio = getPotionQuestionTimeRatio(potionState, now);
  const timerFillClassName = joinClassNames(
    "potion-question-card__timer-fill",
    isPotionQuestionTimerDanger(potionState, now) ? "is-danger" : null,
  );

  return h(
    "section",
    {
      className: "potion-question-card",
    },
    h(PotionQuestionHeader, {
      onAbort,
      questionInfo,
    }),
    h(
      "div",
      {
        className: "potion-question-card__timer",
      },
      h("span", {
        className: timerFillClassName,
        style: {
          transform: `scaleX(${timerRatio})`,
        },
      }),
    ),
    h(
      "div",
      {
        className: "potion-question-card__content",
      },
      isInlineFeedback
        ? h(
            "div",
            {
              className: "potion-question-card__feedback-body",
            },
            h(PotionFeedbackCard, {
              feedback,
            }),
          )
        : h(
            React.Fragment,
            null,
            h(
              "div",
              {
                className: "potion-question-card__body",
              },
              h(PotionIngredientMatrix, {
                combo: getPotionDisplayedCombo(potionState, currentQuestion),
              }),
            ),
            h(
              "div",
              {
                className: "potion-question-card__actions",
              },
              h(PotionChoiceButtons, {
                hoveredChoiceColor:
                  potionState.phase === "playing"
                    ? potionState.hoveredChoiceColor
                    : null,
                isPlaying: potionState.phase === "playing",
                onChoiceHover,
                onSelectChoice,
              }),
            ),
          ),
    ),
  );
}

function PotionQuestionHeader({ questionInfo, onAbort }) {
  return h(
    "header",
    {
      className: "potion-question-card__header",
    },
    h(
      "div",
      {
        className: "potion-question-card__prompt",
      },
      h("strong", null, String(questionInfo.questionNumber)),
      h("span", {
        className: "potion-question-card__separator",
      }),
      h(
        "span",
        null,
        "제시되는 재료의 조합으로 어떤 마법약이 제조될지 예측해 보세요.",
      ),
    ),
    h(
      "div",
      {
        className: "potion-question-card__side",
      },
      h(
        "div",
        {
          className: "potion-question-card__meta",
        },
        h(
          "span",
          {
            className: "potion-question-card__remaining",
          },
          `남은 문항 ${questionInfo.remainingQuestions}`,
        ),
        h(
          "span",
          {
            className: "potion-question-card__countdown",
          },
          String(questionInfo.timerValue),
        ),
      ),
      h(
        "button",
        {
          className: "potion-question-card__reset",
          onClick: onAbort,
          type: "button",
        },
        "리셋",
      ),
    ),
  );
}

function PotionIngredientMatrix({ combo, compact = false }) {
  const activeIngredientIds = new Set(combo?.ingredientIds ?? []);

  return h(
    "div",
    {
      className: joinClassNames(
        "potion-ingredient-matrix",
        compact ? "is-compact" : null,
      ),
    },
    DEFAULT_POTION_INGREDIENTS.map((ingredient) =>
      h(PotionIngredientSlot, {
        compact,
        ingredient,
        isActive: activeIngredientIds.has(ingredient.id),
        key: ingredient.id,
      }),
    ),
  );
}

function PotionIngredientSlot({ ingredient, isActive, compact }) {
  return h(
    "article",
    {
      className: joinClassNames(
        "potion-ingredient-slot",
        isActive ? "is-active" : "is-idle",
        compact ? "is-compact" : null,
      ),
    },
    isActive
      ? h(PotionIngredientArt, {
          art: ingredient.art,
        })
      : h(PotionPlaceholderArt),
  );
}

function PotionIngredientArt({ art }) {
  switch (art) {
    case "seed":
      return h(
        "svg",
        {
          "aria-hidden": true,
          className: "ingredient-art ingredient-art--seed",
          viewBox: "0 0 96 96",
        },
        h("ellipse", { cx: 46, cy: 52, rx: 16, ry: 24 }),
        h("ellipse", { cx: 58, cy: 40, rx: 10, ry: 18 }),
        h("path", { d: "M35 40c-9-4-14-12-15-22c10 4 16 11 19 21" }),
      );
    case "grass":
      return h(
        "svg",
        {
          "aria-hidden": true,
          className: "ingredient-art ingredient-art--grass",
          viewBox: "0 0 96 96",
        },
        h("path", { d: "M24 74c5-18 6-33 4-47" }),
        h("path", { d: "M38 78c3-22 3-40-1-55" }),
        h("path", { d: "M52 80c4-25 5-45 9-61" }),
        h("path", { d: "M67 77c-3-18-2-34 5-49" }),
      );
    case "wing":
      return h(
        "svg",
        {
          "aria-hidden": true,
          className: "ingredient-art ingredient-art--wing",
          viewBox: "0 0 96 96",
        },
        h("path", {
          d: "M24 54c10-20 27-29 50-29c-3 10-10 18-20 24c7 4 12 10 15 18c-21 1-36-4-45-13",
        }),
      );
    case "mint":
    default:
      return h(
        "svg",
        {
          "aria-hidden": true,
          className: "ingredient-art ingredient-art--mint",
          viewBox: "0 0 96 96",
        },
        h("ellipse", { cx: 49, cy: 30, rx: 12, ry: 20 }),
        h("ellipse", {
          cx: 30,
          cy: 46,
          rx: 12,
          ry: 18,
          transform: "rotate(-28 30 46)",
        }),
        h("ellipse", { cx: 48, cy: 50, rx: 13, ry: 19 }),
        h("ellipse", {
          cx: 65,
          cy: 46,
          rx: 12,
          ry: 18,
          transform: "rotate(28 65 46)",
        }),
        h("path", { d: "M47 68c1-18 1-34-2-50" }),
      );
  }
}

function PotionPlaceholderArt() {
  return h(
    "svg",
    {
      "aria-hidden": true,
      className: "ingredient-placeholder",
      viewBox: "0 0 160 108",
    },
    h("path", {
      d: "M0 78c26-18 52-18 78 0c20 14 48 12 82-2v32H0z",
      fill: "#c7ccd3",
    }),
    h("path", {
      d: "M0 90c25-11 47-8 68 4c18 10 48 8 92-3v17H0z",
      fill: "#d7dbe0",
    }),
  );
}

function PotionChoiceButtons({
  isPlaying,
  hoveredChoiceColor,
  onChoiceHover,
  onSelectChoice,
}) {
  return h(
    "div",
    {
      className: "potion-choice-row",
    },
    h(PotionChoiceButton, {
      color: "blue",
      hoveredChoiceColor,
      isPlaying,
      label: "파란약",
      onChoiceHover,
      onSelectChoice,
    }),
    h(PotionChoiceButton, {
      color: "red",
      hoveredChoiceColor,
      isPlaying,
      label: "빨간약",
      onChoiceHover,
      onSelectChoice,
    }),
  );
}

function PotionChoiceButton({
  color,
  label,
  isPlaying,
  hoveredChoiceColor,
  onChoiceHover,
  onSelectChoice,
}) {
  return h(
    "button",
    {
      className: joinClassNames(
        "potion-choice-button",
        `potion-choice-button--${color}`,
        hoveredChoiceColor === color ? "is-hovered" : null,
      ),
      disabled: !isPlaying,
      onClick: () => onSelectChoice(color),
      onMouseEnter: () => onChoiceHover(color),
      onMouseLeave: () => onChoiceHover(null),
      type: "button",
    },
    label,
  );
}

function PotionFeedbackCard({ feedback }) {
  if (!feedback) {
    return null;
  }

  const isSuccess = feedback.visibleResult === "success";
  const actualColorLabel =
    feedback.actualColor === "blue" ? "파란약" : "빨간약";
  const title = feedback.timedOut
    ? "시간 초과"
    : isSuccess
      ? "예측 성공"
      : "예측 실패";

  return h(
    "article",
    {
      className: joinClassNames(
        "potion-feedback-card",
        isSuccess ? "is-success" : "is-failure",
      ),
    },
    h(
      "div",
      {
        className: "potion-feedback-card__art",
      },
      h(PotionFlaskArt, {
        color: feedback.actualColor,
        isSuccess,
      }),
    ),
    h(
      "div",
      {
        className: "potion-feedback-card__copy",
      },
      h("h2", null, title),
      h("p", null, `${actualColorLabel}이 제조되었습니다.`),
    ),
  );
}

function PotionFlaskArt({ color, isSuccess }) {
  return h(
    "svg",
    {
      "aria-hidden": true,
      className: joinClassNames(
        "potion-flask",
        color === "blue" ? "is-blue" : "is-red",
      ),
      viewBox: "0 0 180 120",
    },
    h(
      "g",
      {
        className: joinClassNames(
          "potion-flask__spark",
          isSuccess ? "is-visible" : null,
        ),
      },
      h("path", { d: "M132 24v12" }),
      h("path", { d: "M146 30h12" }),
      h("path", { d: "M142 18l8-8" }),
      h("path", { d: "M142 42l8 8" }),
    ),
    h(
      "g",
      {
        transform: "translate(52 12)",
      },
      h("rect", { x: 22, y: 0, width: 18, height: 24, rx: 8 }),
      h("path", {
        d: "M18 18h26l-4 14l28 34c12 15 2 38-17 38H11C-8 102-18 79-6 64l28-32z",
      }),
      h("path", {
        className: "potion-flask__liquid",
        d: "M4 74c10-6 22-4 35 4c9 6 19 7 32 3c1 12-8 23-22 23H18C6 104-1 89 4 74z",
      }),
    ),
  );
}

function PotionTimeoutOverlay() {
  return h(
    "div",
    {
      "aria-live": "assertive",
      className: "potion-page-overlay",
    },
    h(
      "article",
      {
        className: "potion-timeout-card",
        role: "alert",
      },
      h(
        "div",
        {
          "aria-hidden": true,
          className: "potion-timeout-card__icon",
        },
        h(PotionInfoIcon),
      ),
      h("p", null, "제한 시간이 지나 응답이 저장되지 않았습니다."),
      h("p", null, "제한 시간 내 '파란약' 또는 '빨간약' 버튼을 클릭해 주세요."),
    ),
  );
}

function PotionInfoIcon() {
  return h(
    "svg",
    {
      "aria-hidden": true,
      className: "potion-info-icon",
      viewBox: "0 0 48 48",
    },
    h("circle", { cx: 24, cy: 24, r: 20 }),
    h("path", { d: "M24 20v12" }),
    h("circle", { cx: 24, cy: 14, r: 2 }),
  );
}

function PotionFinishedStage({ onComplete }) {
  return h(
    "section",
    {
      className: "potion-finished-card",
    },
    h(
      "div",
      {
        className: "potion-finished-card__icon",
      },
      h(PotionFinishBadge),
    ),
    h("h1", null, "수고하셨어요!"),
    h("p", null, "마법약 만들기 과제를 완료했어요."),
    h(
      "p",
      {
        className: "potion-finished-card__hint",
      },
      "잠시 후 연습 기록으로 이동합니다.",
    ),
    h(
      "button",
      {
        "aria-label": "연습 기록 보기",
        className: "potion-finished-card__button",
        onClick: onComplete,
        type: "button",
      },
      "연습 기록 보기",
    ),
  );
}

function PotionFinishBadge() {
  return h(
    "svg",
    {
      "aria-hidden": true,
      className: "potion-finish-badge",
      viewBox: "0 0 80 80",
    },
    h("rect", { x: 8, y: 8, width: 64, height: 64, rx: 18 }),
    h("path", { d: "M43 20h8v10h-8z" }),
    h("path", {
      d: "M28 30h24l-4 11l14 16c6 7 1 17-8 17H26c-9 0-14-10-8-17l14-16z",
    }),
    h("path", {
      className: "potion-finish-badge__liquid",
      d: "M22 57c7-4 14-3 23 3c5 3 11 4 19 1c0 7-5 13-12 13H28c-6 0-10-7-6-17z",
    }),
  );
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

function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(" ");
}
