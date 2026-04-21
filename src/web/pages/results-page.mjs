import {
  filterComparablePracticeResults,
  getPotionResultConfigSignature,
} from "../storage.mjs";
import { GAME_META } from "../shared/game-meta.mjs";
import {
  formatDateTime,
  formatDuration,
  formatPercent,
  formatPotionConfigLabel,
  formatScore,
} from "../shared/formatters.mjs";
import { ROUTES } from "../shared/routes.mjs";
import { renderAssessmentStageIcon } from "../components/assessment-stage-art.mjs";

export function renderResultsPage({
  resultsSummary,
  results,
  potionSettings,
  potionSessionConfig,
}) {
  const comparableResults = filterComparablePracticeResults(results, {
    potionConfig: potionSettings,
  });
  const latestResult = results[0] ?? null;
  const bestResult = getBestPracticeResult(comparableResults);

  return `
    <section class="results-stage">
      <div class="results-stage__board">
        <aside class="results-stage__sidebar" aria-labelledby="results-stage-title">
          <div class="results-stage__intro">
            <p class="results-stage__eyebrow">Practice Result</p>
            <h1 id="results-stage-title">연습 기록</h1>
            <p>
              게임 화면에서 이어진 연습 결과를 확인할 수 있습니다.
            </p>
          </div>
          <div class="results-stage__sidebar-panel">
            ${renderResultsSidebarStat("저장된 세션", `${results.length}개`)}
            ${renderResultsSidebarStat(
              "최근 플레이",
              latestResult ? formatDateTime(latestResult.playedAt) : "-",
            )}
            ${renderResultsSidebarStat(
              "현재 설정 최고 연습 점수",
              bestResult
                ? `${GAME_META[bestResult.gameId]?.title ?? bestResult.gameId} ${formatScore(bestResult.practiceScore)}`
                : "-",
            )}
          </div>
          <div class="results-stage__sidebar-actions">
            <button
              type="button"
              class="results-stage__primary-action"
              data-action="navigate"
              data-route="${GAME_META.potion.route}"
            >
              마법약 만들기
            </button>
            <button
              type="button"
              class="results-stage__secondary-action"
              data-action="navigate"
              data-route="${ROUTES.home}"
            >
              메인으로
            </button>
            <button
              type="button"
              class="results-stage__ghost-action"
              data-action="clear-results"
              ${results.length > 0 ? "" : "disabled"}
            >
              기록 초기화
            </button>
          </div>
        </aside>

        <section class="results-stage__content" aria-label="저장된 기록">
          <div class="results-stage__content-header">
            <div>
              <p class="results-stage__eyebrow">Saved Sessions</p>
              <h2>게임별 요약</h2>
              <p>현재 선택된 설정과 같은 기록끼리만 최근 점수와 최고 점수를 비교합니다.</p>
            </div>
          </div>
          <div class="results-stage__grid">
            ${renderResultsStageCard(GAME_META.potion, resultsSummary.potion, {
              results,
              potionSessionConfig,
              renderAssessmentStageIcon,
            })}
            ${renderResultsStageCard(GAME_META.sequence, resultsSummary.sequence, {
              results,
              potionSessionConfig,
              renderAssessmentStageIcon,
            })}
          </div>
          <section class="results-log" aria-labelledby="results-log-title">
            <div class="results-log__header">
              <div>
                <p class="results-stage__eyebrow">Recent Sessions</p>
                <h2 id="results-log-title">최근 저장 기록</h2>
              </div>
              <span class="results-log__count">${results.length}건</span>
            </div>
            ${
              results.length > 0
                ? `
                  <div class="results-log__list">
                    ${results
                      .map((result, index) =>
                        renderResultsLogRow(result, index, {
                          potionSettings,
                        }),
                      )
                      .join("")}
                  </div>
                `
                : `
                  <div class="results-log__empty">
                    <p>아직 저장된 연습 기록이 없습니다.</p>
                    <p>마법약 만들기를 한 번 완료하면 최근 기록이 이곳에 순서대로 쌓입니다.</p>
                  </div>
                `
            }
          </section>
        </section>
      </div>
    </section>
  `;
}

function renderResultsSidebarStat(label, value) {
  return `
    <div class="results-stage__sidebar-stat">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function renderResultsStageCard(
  game,
  summary,
  { results, potionSessionConfig, renderAssessmentStageIcon },
) {
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
  const actionMarkup = game.route
    ? `
      <button
        type="button"
        class="results-stage-card__action"
        data-action="navigate"
        data-route="${game.route}"
      >
        ${summary ? "다시 플레이" : "첫 플레이 시작"}
      </button>
    `
    : `<span class="results-stage-card__action is-disabled">준비 중</span>`;

  if (!summary) {
    return `
      <article class="results-stage-card is-empty">
        <div class="results-stage-card__copy">
          <div class="results-stage-card__header">
            <p class="results-stage__eyebrow">Game Summary</p>
            <span class="results-stage-card__status${statusClass}">${statusLabel}</span>
          </div>
          <h3>${game.title}</h3>
          <p class="results-stage-card__description">
            ${
              game.id === "potion"
                ? results.some((result) => result.gameId === "potion")
                  ? `현재 설정(${formatPotionConfigLabel(potionSessionConfig)})과 같은 기록이 없습니다. 다른 설정 기록은 아래 최근 저장 기록에서 확인할 수 있습니다.`
                  : "아직 저장된 기록이 없습니다. 첫 플레이를 완료하면 최근 점수와 마지막 플레이가 여기에 정리됩니다."
                : "이 게임은 아직 구현 전입니다. 추후 구현되면 같은 보드 톤 안에서 결과 카드가 연결됩니다."
            }
          </p>
          <div class="results-stage-card__footer">
            ${actionMarkup}
          </div>
        </div>
        <div class="results-stage-card__icon" aria-hidden="true">
          ${renderAssessmentStageIcon(game.id === "potion" ? "potion" : "sequence")}
        </div>
      </article>
    `;
  }

  return `
    <article class="results-stage-card">
      <div class="results-stage-card__copy">
        <div class="results-stage-card__header">
          <p class="results-stage__eyebrow">Game Summary</p>
          <span class="results-stage-card__status${statusClass}">${statusLabel}</span>
        </div>
        <h3>${game.title}</h3>
        ${
          game.id === "potion"
            ? `<p class="results-stage-card__description">비교 기준: ${formatPotionConfigLabel(potionSessionConfig)}</p>`
            : ""
        }
        <div class="results-stage-card__stats">
          <div class="results-stage-card__stat">
            <span>최근 점수</span>
            <strong>${formatScore(summary.latest.practiceScore)}</strong>
          </div>
          <div class="results-stage-card__stat">
            <span>최고 점수</span>
            <strong>${formatScore(summary.best.practiceScore)}</strong>
          </div>
          <div class="results-stage-card__stat">
            <span>마지막 플레이</span>
            <strong>${formatDateTime(summary.latest.playedAt)}</strong>
          </div>
        </div>
        <div class="results-stage-card__footer">
          ${actionMarkup}
        </div>
      </div>
      <div class="results-stage-card__icon" aria-hidden="true">
        ${renderAssessmentStageIcon(game.id === "potion" ? "potion" : "sequence")}
      </div>
    </article>
  `;
}

function renderResultsLogRow(result, index, { potionSettings }) {
  const configLabel =
    result.gameId === "potion"
      ? formatPotionConfigLabel(result.configSnapshot)
      : "";
  const isComparable =
    result.gameId !== "potion" ||
    getPotionResultConfigSignature(result) ===
      getPotionResultConfigSignature(potionSettings);

  return `
    <article class="results-log-row">
      <div class="results-log-row__primary">
        <span class="results-log-row__index">${String(index + 1).padStart(2, "0")}</span>
        <div>
          <p class="results-log-row__title">${GAME_META[result.gameId]?.title ?? result.gameId}</p>
          <p class="results-log-row__time">${formatDateTime(result.playedAt)}</p>
          ${
            configLabel
              ? `<p class="results-log-row__config ${isComparable ? "is-comparable" : "is-different"}">${configLabel}${isComparable ? " · 현재 설정과 비교 가능" : " · 다른 설정"}</p>`
              : ""
          }
        </div>
      </div>
      <div class="results-log-row__metrics">
        <span><strong>${formatScore(result.practiceScore)}</strong><em>연습 점수</em></span>
        <span><strong>${formatPercent(result.practiceAccuracy)}</strong><em>정확도</em></span>
        <span><strong>${result.roundsCompleted}</strong><em>문항</em></span>
        <span><strong>${formatDuration(result.durationMs)}</strong><em>플레이 시간</em></span>
      </div>
    </article>
  `;
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
