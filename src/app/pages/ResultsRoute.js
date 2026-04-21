import React from "react";
import { useNavigate } from "react-router-dom";

import { AssessmentStageIcon } from "../components/AssessmentStageArt.js";
import {
  filterComparablePracticeResults,
  getPotionResultConfigSignature,
} from "../../web/storage.mjs";
import { GAME_META } from "../../web/shared/game-meta.mjs";
import {
  formatDateTime,
  formatDuration,
  formatPercent,
  formatPotionConfigLabel,
  formatScore,
} from "../../web/shared/formatters.mjs";
import { ROUTES } from "../../web/shared/routes.mjs";

const h = React.createElement;

export function ResultsRoute({
  results,
  resultsSummary,
  potionSettings,
  onClearResults,
}) {
  const navigate = useNavigate();
  const comparableResults = filterComparablePracticeResults(results, {
    potionConfig: potionSettings,
  });
  const latestResult = results[0] ?? null;
  const bestResult = getBestPracticeResult(comparableResults);

  return h(
    "section",
    {
      className: "results-stage",
    },
    h(
      "div",
      {
        className: "results-stage__board",
      },
      h(
        "aside",
        {
          "aria-labelledby": "results-stage-title",
          className: "results-stage__sidebar",
        },
        h(
          "div",
          {
            className: "results-stage__intro",
          },
          h(
            "p",
            {
              className: "results-stage__eyebrow",
            },
            "Practice Result",
          ),
          h(
            "h1",
            {
              id: "results-stage-title",
            },
            "연습 기록",
          ),
          h("p", null, "게임 화면에서 이어진 연습 결과를 확인할 수 있습니다."),
        ),
        h(
          "div",
          {
            className: "results-stage__sidebar-panel",
          },
          h(ResultsSidebarStat, { label: "저장된 세션", value: `${results.length}개` }),
          h(ResultsSidebarStat, {
            label: "최근 플레이",
            value: latestResult ? formatDateTime(latestResult.playedAt) : "-",
          }),
          h(ResultsSidebarStat, {
            label: "현재 설정 최고 연습 점수",
            value: bestResult
              ? `${GAME_META[bestResult.gameId]?.title ?? bestResult.gameId} ${formatScore(bestResult.practiceScore)}`
              : "-",
          }),
        ),
        h(
          "div",
          {
            className: "results-stage__sidebar-actions",
          },
          h(
            "button",
            {
              className: "results-stage__primary-action",
              onClick: () => navigate(GAME_META.potion.route),
              type: "button",
            },
            "마법약 만들기",
          ),
          h(
            "button",
            {
              className: "results-stage__secondary-action",
              onClick: () => navigate(ROUTES.home),
              type: "button",
            },
            "메인으로",
          ),
          h(
            "button",
            {
              className: "results-stage__ghost-action",
              disabled: results.length === 0,
              onClick: onClearResults,
              type: "button",
            },
            "기록 초기화",
          ),
        ),
      ),
      h(
        "section",
        {
          "aria-label": "저장된 기록",
          className: "results-stage__content",
        },
        h(
          "div",
          {
            className: "results-stage__content-header",
          },
          h(
            "div",
            null,
            h(
              "p",
              {
                className: "results-stage__eyebrow",
              },
              "Saved Sessions",
            ),
            h("h2", null, "게임별 요약"),
            h(
              "p",
              null,
              "현재 선택된 설정과 같은 기록끼리만 최근 점수와 최고 점수를 비교합니다.",
            ),
          ),
        ),
        h(
          "div",
          {
            className: "results-stage__grid",
          },
          h(ResultsStageCard, {
            game: GAME_META.potion,
            onNavigate: navigate,
            potionSettings,
            results,
            summary: resultsSummary?.potion,
          }),
          h(ResultsStageCard, {
            game: GAME_META.sequence,
            onNavigate: navigate,
            potionSettings,
            results,
            summary: resultsSummary?.sequence,
          }),
        ),
        h(
          "section",
          {
            "aria-labelledby": "results-log-title",
            className: "results-log",
          },
          h(
            "div",
            {
              className: "results-log__header",
            },
            h(
              "div",
              null,
              h(
                "p",
                {
                  className: "results-stage__eyebrow",
                },
                "Recent Sessions",
              ),
              h(
                "h2",
                {
                  id: "results-log-title",
                },
                "최근 저장 기록",
              ),
            ),
            h(
              "span",
              {
                className: "results-log__count",
              },
              `${results.length}건`,
            ),
          ),
          results.length > 0
            ? h(
                "div",
                {
                  className: "results-log__list",
                },
                results.map((result, index) =>
                  h(ResultsLogRow, {
                    index,
                    key: result.id,
                    potionSettings,
                    result,
                  }),
                ),
              )
            : h(
                "div",
                {
                  className: "results-log__empty",
                },
                h("p", null, "아직 저장된 연습 기록이 없습니다."),
                h(
                  "p",
                  null,
                  "마법약 만들기를 한 번 완료하면 최근 기록이 이곳에 순서대로 쌓입니다.",
                ),
              ),
        ),
      ),
    ),
  );
}

function ResultsSidebarStat({ label, value }) {
  return h(
    "div",
    {
      className: "results-stage__sidebar-stat",
    },
    h("span", null, label),
    h("strong", null, value),
  );
}

function ResultsStageCard({
  game,
  onNavigate,
  potionSettings,
  results,
  summary,
}) {
  const statusLabel = summary
    ? `${summary.total}회 저장`
    : game.implemented
      ? "저장 대기"
      : "구현 전";
  const statusClass = summary
    ? " has-data"
    : game.implemented
      ? ""
      : " is-muted";
  const icon = game.id === "potion" ? "potion" : "sequence";
  const description = !summary
    ? game.id === "potion"
      ? results.some((result) => result.gameId === "potion")
        ? `현재 설정(${formatPotionConfigLabel(potionSettings)})과 같은 기록이 없습니다. 다른 설정 기록은 아래 최근 저장 기록에서 확인할 수 있습니다.`
        : "아직 저장된 기록이 없습니다. 첫 플레이를 완료하면 최근 점수와 마지막 플레이가 여기에 정리됩니다."
      : "이 게임은 아직 구현 전입니다. 추후 구현되면 같은 보드 톤 안에서 결과 카드가 연결됩니다."
    : game.id === "potion"
      ? `비교 기준: ${formatPotionConfigLabel(potionSettings)}`
      : null;

  return h(
    "article",
    {
      className: `results-stage-card${summary ? "" : " is-empty"}`,
    },
    h(
      "div",
      {
        className: "results-stage-card__copy",
      },
      h(
        "div",
        {
          className: "results-stage-card__header",
        },
        h(
          "p",
          {
            className: "results-stage__eyebrow",
          },
          "Game Summary",
        ),
        h(
          "span",
          {
            className: `results-stage-card__status${statusClass}`,
          },
          statusLabel,
        ),
      ),
      h("h3", null, game.title),
      description
        ? h(
            "p",
            {
              className: "results-stage-card__description",
            },
            description,
          )
        : null,
      summary
        ? h(
            "div",
            {
              className: "results-stage-card__stats",
            },
            h(
              "div",
              {
                className: "results-stage-card__stat",
              },
              h("span", null, "최근 점수"),
              h("strong", null, formatScore(summary.latest.practiceScore)),
            ),
            h(
              "div",
              {
                className: "results-stage-card__stat",
              },
              h("span", null, "최고 점수"),
              h("strong", null, formatScore(summary.best.practiceScore)),
            ),
            h(
              "div",
              {
                className: "results-stage-card__stat",
              },
              h("span", null, "마지막 플레이"),
              h("strong", null, formatDateTime(summary.latest.playedAt)),
            ),
          )
        : null,
      h(
        "div",
        {
          className: "results-stage-card__footer",
        },
        game.route
          ? h(
              "button",
              {
                className: "results-stage-card__action",
                onClick: () => onNavigate(game.route),
                type: "button",
              },
              summary ? "다시 플레이" : "첫 플레이 시작",
            )
          : h(
              "span",
              {
                className: "results-stage-card__action is-disabled",
              },
              "준비 중",
            ),
      ),
    ),
    h(
      "div",
      {
        "aria-hidden": "true",
        className: "results-stage-card__icon",
      },
      h(AssessmentStageIcon, { icon }),
    ),
  );
}

function ResultsLogRow({ index, potionSettings, result }) {
  const configLabel =
    result.gameId === "potion"
      ? formatPotionConfigLabel(result.configSnapshot)
      : "";
  const isComparable =
    result.gameId !== "potion" ||
    getPotionResultConfigSignature(result) ===
      getPotionResultConfigSignature(potionSettings);

  return h(
    "article",
    {
      className: "results-log-row",
    },
    h(
      "div",
      {
        className: "results-log-row__primary",
      },
      h(
        "span",
        {
          className: "results-log-row__index",
        },
        String(index + 1).padStart(2, "0"),
      ),
      h(
        "div",
        null,
        h(
          "p",
          {
            className: "results-log-row__title",
          },
          GAME_META[result.gameId]?.title ?? result.gameId,
        ),
        h(
          "p",
          {
            className: "results-log-row__time",
          },
          formatDateTime(result.playedAt),
        ),
        configLabel
          ? h(
              "p",
              {
                className: `results-log-row__config ${isComparable ? "is-comparable" : "is-different"}`,
              },
              `${configLabel}${isComparable ? " · 현재 설정과 비교 가능" : " · 다른 설정"}`,
            )
          : null,
      ),
    ),
    h(
      "div",
      {
        className: "results-log-row__metrics",
      },
      h(
        "span",
        null,
        h("strong", null, formatScore(result.practiceScore)),
        h("em", null, "연습 점수"),
      ),
      h(
        "span",
        null,
        h("strong", null, formatPercent(result.practiceAccuracy)),
        h("em", null, "정확도"),
      ),
      h(
        "span",
        null,
        h("strong", null, result.roundsCompleted),
        h("em", null, "문항"),
      ),
      h(
        "span",
        null,
        h("strong", null, formatDuration(result.durationMs)),
        h("em", null, "플레이 시간"),
      ),
    ),
  );
}

function getBestPracticeResult(results) {
  return results.reduce((best, current) => {
    if (!best) {
      return current;
    }

    return (current.practiceScore ?? -Infinity) >
      (best.practiceScore ?? -Infinity)
      ? current
      : best;
  }, null);
}
