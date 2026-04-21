import React from "react";
import { useNavigate } from "react-router-dom";

import { GAME_META } from "../../web/shared/game-meta.mjs";
import { ROUTES } from "../../web/shared/routes.mjs";

const h = React.createElement;

export function SequenceRoute({ resultSummary }) {
  const navigate = useNavigate();

  return h(
    "section",
    {
      className: "placeholder-page",
    },
    h(
      "header",
      {
        className: "game-header",
      },
      h(
        "div",
        null,
        h(
          "p",
          {
            className: "eyebrow",
          },
          GAME_META.sequence.category,
        ),
        h("h1", null, GAME_META.sequence.title),
        h(
          "p",
          {
            className: "game-header__subtitle",
          },
          "n-back 판단형으로 설계 예정",
        ),
      ),
      h(
        "div",
        {
          className: "game-header__actions",
        },
        h(
          "button",
          {
            className: "secondary-button",
            onClick: () => navigate(ROUTES.results),
            type: "button",
          },
          "연습 기록",
        ),
        h(
          "button",
          {
            className: "secondary-button",
            onClick: () => navigate(ROUTES.home),
            type: "button",
          },
          "홈",
        ),
      ),
    ),
    h(
      "div",
      {
        className: "placeholder-card",
      },
      h("h2", null, "이 게임은 아직 구현 전입니다"),
      h(
        "p",
        null,
        "문서상으로는 2라운드 구조의 시각 작업기억 과제로 정리되어 있지만, 자극 수와 노출 규칙은 추가 근거가 더 필요합니다.",
      ),
      h(
        "p",
        null,
        resultSummary
          ? `저장된 기록 수: ${resultSummary.total}`
          : "현재는 마법약 만들기만 플레이할 수 있습니다.",
      ),
      h(
        "button",
        {
          className: "primary-button",
          onClick: () => navigate(GAME_META.potion.route),
          type: "button",
        },
        "마법약 만들기 열기",
      ),
    ),
  );
}
