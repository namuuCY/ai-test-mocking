import { GAME_META } from "../shared/game-meta.mjs";
import { ROUTES } from "../shared/routes.mjs";

export function renderSequencePage({ resultSummary }) {
  return `
    <section class="placeholder-page">
      ${renderGameHeader(
        GAME_META.sequence.title,
        GAME_META.sequence.category,
        "n-back 판단형으로 설계 예정",
      )}
      <div class="placeholder-card">
        <h2>이 게임은 아직 구현 전입니다</h2>
        <p>
          문서상으로는 2라운드 구조의 시각 작업기억 과제로 정리되어 있지만, 자극 수와 노출
          규칙은 추가 근거가 더 필요합니다.
        </p>
        ${
          resultSummary
            ? `<p>저장된 기록 수: ${resultSummary.total}</p>`
            : `<p>현재는 마법약 만들기만 플레이할 수 있습니다.</p>`
        }
        <button class="primary-button" data-action="navigate" data-route="${GAME_META.potion.route}">
          마법약 만들기 열기
        </button>
      </div>
    </section>
  `;
}

function renderGameHeader(title, category, subtitle) {
  return `
    <header class="game-header">
      <div>
        <p class="eyebrow">${category}</p>
        <h1>${title}</h1>
        <p class="game-header__subtitle">${subtitle}</p>
      </div>
      <div class="game-header__actions">
        <button class="secondary-button" data-action="navigate" data-route="${ROUTES.results}">연습 기록</button>
        <button class="secondary-button" data-action="navigate" data-route="${ROUTES.home}">홈</button>
      </div>
    </header>
  `;
}
