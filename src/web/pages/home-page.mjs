import { ASSESSMENT_STAGE_GAMES } from "../shared/game-meta.mjs";
import { formatPotionConfigLabel } from "../shared/formatters.mjs";
import { POTION_SETTING_DEFINITIONS } from "../shared/potion-content.mjs";
import {
  renderAssessmentStageDrawerArtwork,
  renderAssessmentStageIcon,
} from "../components/assessment-stage-art.mjs";

export function renderHomePage({
  selectedGame,
  selectedStageGameId,
  selectedStageDetailTabId,
  selectedStageDetailMeta,
  selectedStageDetailTabs,
  potionSessionConfig,
  potionSettings,
}) {
  const hasStageDetail = Boolean(selectedGame);

  return `
    <section class="assessment-home">
      <div class="assessment-home__board ${hasStageDetail ? "has-stage-detail" : ""}">
        <aside class="assessment-home__sidebar" aria-label="평가 영역">
          <nav class="assessment-home__menu">
            <span class="assessment-home__menu-item is-muted">성향파악</span>
            <span class="assessment-home__menu-item is-active">게임</span>
            <span class="assessment-home__menu-item is-muted">영상면접</span>
          </nav>
        </aside>
        <section class="assessment-home__content" aria-labelledby="assessment-home-title">
          <div class="assessment-home__content-scroll">
            <h1 id="assessment-home-title" class="assessment-home__title">게임</h1>
            <div class="assessment-home__grid">
              ${ASSESSMENT_STAGE_GAMES.map((game) =>
                renderAssessmentStageCard(game, {
                  selectedStageGameId,
                  renderAssessmentStageIcon,
                }),
              ).join("")}
            </div>
          </div>
        </section>
        ${
          selectedGame
            ? renderAssessmentStageDetailDrawer(selectedGame, {
                selectedStageDetailTabId,
                selectedStageDetailMeta,
                selectedStageDetailTabs,
                potionSessionConfig,
                potionSettings,
              })
            : ""
        }
      </div>
    </section>
  `;
}

export function renderAssessmentStageDetailTabPanel({
  tab,
  potionSessionConfig,
  potionSettings,
}) {
  if (!tab) {
    return "";
  }

  if (tab.kind === "settings") {
    return renderPotionSettingsPanel({
      tab,
      potionSessionConfig,
      potionSettings,
    });
  }

  return `
    <section class="assessment-stage-drawer__panel">
      <p class="assessment-stage-drawer__panel-eyebrow">${tab.label}</p>
      <h3>${tab.title}</h3>
      ${(tab.paragraphs ?? [])
        .map((paragraph) => `<p>${paragraph}</p>`)
        .join("")}
      ${
        tab.bullets?.length
          ? `
            <ul class="assessment-stage-drawer__panel-list">
              ${tab.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}
            </ul>
          `
          : ""
      }
    </section>
  `;
}

function renderAssessmentStageCard(
  game,
  { selectedStageGameId, renderAssessmentStageIcon },
) {
  const cardInnerMarkup = `
    <div class="assessment-stage-card__copy">
      <h2>${game.title}</h2>
      <div class="assessment-stage-card__meta">
        <span class="assessment-stage-card__trait">${game.category}</span>
        <span class="assessment-stage-card__divider"></span>
        <span>${game.duration}</span>
        <span class="assessment-stage-card__divider"></span>
        <span>${game.difficulty}</span>
      </div>
    </div>
    <div class="assessment-stage-card__icon" aria-hidden="true">
      ${renderAssessmentStageIcon(game.icon)}
    </div>
  `;

  if (game.route) {
    return `
      <button
        type="button"
        class="assessment-stage-card is-active"
        data-action="open-stage-detail"
        data-game-id="${game.id}"
        aria-haspopup="dialog"
        aria-expanded="${selectedStageGameId === game.id ? "true" : "false"}"
        aria-label="${game.title} 상세 정보 열기"
      >
        ${cardInnerMarkup}
      </button>
    `;
  }

  return `
    <article class="assessment-stage-card is-disabled" aria-label="${game.title} 소개 카드">
      ${cardInnerMarkup}
    </article>
  `;
}

function renderAssessmentStageDetailDrawer(
  game,
  {
    selectedStageDetailTabId,
    selectedStageDetailMeta,
    selectedStageDetailTabs,
    potionSessionConfig,
    potionSettings,
  },
) {
  const detailTabs = selectedStageDetailTabs ?? [];
  const tab =
    detailTabs.find((detailTab) => detailTab.id === selectedStageDetailTabId) ??
    detailTabs[0];
  const detailMeta = selectedStageDetailMeta ?? [];

  return `
    <div class="assessment-home__detail-layer">
      <button
        type="button"
        class="assessment-home__detail-backdrop"
        data-action="close-stage-detail"
        aria-label="${game.title} 상세 패널 닫기"
      ></button>
      <aside
        class="assessment-stage-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assessment-stage-drawer-title"
      >
        <header class="assessment-stage-drawer__header">
          <button
            type="button"
            class="assessment-stage-drawer__back"
            data-action="close-stage-detail"
          >
            <span aria-hidden="true">‹</span>
            <span>뒤로</span>
          </button>
        </header>
        <div class="assessment-stage-drawer__body">
          <div class="assessment-stage-drawer__title-row">
            <div>
              <h2 id="assessment-stage-drawer-title">${game.title}</h2>
              <p class="assessment-stage-drawer__summary">${game.detailSummary ?? ""}</p>
            </div>
            <div class="assessment-stage-drawer__badge" aria-hidden="true">
              ${renderAssessmentStageIcon(game.icon)}
            </div>
          </div>
          <div class="assessment-stage-drawer__meta">
            ${detailMeta.map((item) => `<span>${item}</span>`).join("")}
          </div>
          <div class="assessment-stage-drawer__artwork" aria-hidden="true">
            ${renderAssessmentStageDrawerArtwork(game.icon)}
          </div>
          <nav class="assessment-stage-drawer__tabs" aria-label="${game.title} 안내 탭">
            ${detailTabs
              .map(
                (detailTab) => `
                  <button
                    type="button"
                    class="assessment-stage-drawer__tab ${detailTab.id === tab?.id ? "is-active" : ""}"
                    data-action="select-stage-detail-tab"
                    data-tab-id="${detailTab.id}"
                    aria-pressed="${detailTab.id === tab?.id ? "true" : "false"}"
                  >
                    ${detailTab.label}
                  </button>
                `,
              )
              .join("")}
          </nav>
          <div class="assessment-stage-drawer__panel-slot">
            ${renderAssessmentStageDetailTabPanel({
              tab,
              potionSessionConfig,
              potionSettings,
            })}
          </div>
        </div>
        <footer class="assessment-stage-drawer__footer">
          <button
            type="button"
            class="assessment-stage-drawer__action assessment-stage-drawer__action--secondary"
            data-action="close-stage-detail"
          >
            닫기
          </button>
          <button
            type="button"
            class="assessment-stage-drawer__action assessment-stage-drawer__action--primary"
            data-action="start-stage-route"
            data-route="${game.route ?? ""}"
          >
            실전 시작
          </button>
        </footer>
      </aside>
    </div>
  `;
}

function renderPotionSettingsPanel({ tab, potionSessionConfig, potionSettings }) {
  return `
    <section class="assessment-stage-drawer__panel assessment-stage-drawer__panel--settings">
      <p class="assessment-stage-drawer__panel-eyebrow">${tab.label}</p>
      <h3>${tab.title}</h3>
      ${(tab.paragraphs ?? []).map((paragraph) => `<p>${paragraph}</p>`).join("")}
      <div class="assessment-stage-settings">
        ${renderPotionSettingField("sessionQuestionCount", potionSettings)}
        ${renderPotionSettingField("questionTimeLimitSec", potionSettings)}
      </div>
      <div class="assessment-stage-settings__summary">
        <span>현재 설정</span>
        <strong>${formatPotionConfigLabel(potionSessionConfig)}</strong>
      </div>
    </section>
  `;
}

function renderPotionSettingField(settingKey, potionSettings) {
  const definition = POTION_SETTING_DEFINITIONS[settingKey];
  if (!definition) {
    return "";
  }

  const value = potionSettings[settingKey];

  return `
    <div class="assessment-stage-setting">
      <div class="assessment-stage-setting__copy">
        <label class="assessment-stage-setting__label" for="potion-setting-${settingKey}">
          ${definition.label}
        </label>
        <p class="assessment-stage-setting__description">${definition.description}</p>
      </div>
      <div class="assessment-stage-setting__control-row">
        <input
          id="potion-setting-${settingKey}"
          class="assessment-stage-setting__slider"
          type="range"
          min="${definition.min}"
          max="${definition.max}"
          step="${definition.step}"
          value="${value}"
          data-action="update-potion-setting"
          data-setting-key="${settingKey}"
          aria-label="${definition.label} 슬라이더"
        />
        <div class="assessment-stage-setting__number-wrap">
          <input
            class="assessment-stage-setting__number"
            type="number"
            min="${definition.min}"
            max="${definition.max}"
            step="${definition.step}"
            value="${value}"
            data-action="update-potion-setting"
            data-setting-key="${settingKey}"
            aria-label="${definition.label} 숫자 입력"
          />
          <span class="assessment-stage-setting__unit">${definition.unit}</span>
        </div>
      </div>
    </div>
  `;
}
