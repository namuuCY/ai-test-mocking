import { ASSESSMENT_STAGE_GAMES } from "../shared/game-meta.mjs";
import {
  DEFAULT_HOME_STAGE_DETAIL_TAB_ID,
  getPotionStageDetailContent,
} from "../shared/potion-content.mjs";
import { renderAssessmentStageDetailTabPanel } from "./home-page.mjs";

export function createHomeViewState() {
  return {
    selectedStageGameId: null,
    selectedStageDetailTabId: DEFAULT_HOME_STAGE_DETAIL_TAB_ID,
  };
}

export function createHomeController({ state, renderApp, getRootElement }) {
  function handleRouteChange(route = state.route) {
    if (route === "/") {
      return;
    }

    state.home.selectedStageGameId = null;
    state.home.selectedStageDetailTabId = DEFAULT_HOME_STAGE_DETAIL_TAB_ID;
  }

  function openStageDetail(gameId) {
    const game = getAssessmentStageGameById(gameId);
    if (!game?.route) {
      return;
    }

    state.home.selectedStageGameId = game.id;
    state.home.selectedStageDetailTabId =
      getAssessmentStageDetailTabs(game)[0]?.id ??
      DEFAULT_HOME_STAGE_DETAIL_TAB_ID;
    renderApp();
  }

  function closeStageDetail({ shouldRender = true } = {}) {
    if (!state.home.selectedStageGameId) {
      return;
    }

    state.home.selectedStageGameId = null;
    state.home.selectedStageDetailTabId = DEFAULT_HOME_STAGE_DETAIL_TAB_ID;

    if (shouldRender) {
      renderApp();
    }
  }

  function setStageDetailTab(tabId) {
    const selectedGame = getSelectedAssessmentStageGame();
    const matchingTab = getAssessmentStageDetailTabs(selectedGame).find(
      (tab) => tab.id === tabId,
    );

    if (!matchingTab || state.home.selectedStageDetailTabId === tabId) {
      return;
    }

    state.home.selectedStageDetailTabId = matchingTab.id;
    if (!syncStageDetailTabUi()) {
      renderApp();
    }
  }

  function getSelectedAssessmentStageGame() {
    return getAssessmentStageGameById(state.home.selectedStageGameId);
  }

  function getSelectedAssessmentStageDetailTabs() {
    return getAssessmentStageDetailTabs(getSelectedAssessmentStageGame());
  }

  function getSelectedAssessmentStageDetailMeta() {
    return getAssessmentStageDetailMeta(getSelectedAssessmentStageGame());
  }

  function getAssessmentStageGameById(gameId) {
    return ASSESSMENT_STAGE_GAMES.find((game) => game.id === gameId) ?? null;
  }

  function getAssessmentStageDetailTabs(game) {
    if (game?.id !== "potion-stage") {
      return game?.detailTabs ?? [];
    }

    return getPotionStageDetailContent(state.potion.session.config).tabs;
  }

  function getAssessmentStageDetailMeta(game) {
    if (game?.id !== "potion-stage") {
      return game?.detailMeta ?? [];
    }

    return getPotionStageDetailContent(state.potion.session.config).meta;
  }

  function syncStageDetailTabUi() {
    const rootElement = getRootElement();
    if (!rootElement || state.route !== "/" || !state.home.selectedStageGameId) {
      return false;
    }

    const selectedGame = getSelectedAssessmentStageGame();
    const detailTabs = getAssessmentStageDetailTabs(selectedGame);
    const selectedTab =
      detailTabs.find((tab) => tab.id === state.home.selectedStageDetailTabId) ??
      detailTabs[0];
    const panelSlotElement = rootElement.querySelector(
      ".assessment-stage-drawer__panel-slot",
    );
    const tabButtons = rootElement.querySelectorAll(
      ".assessment-stage-drawer__tab[data-tab-id]",
    );

    if (!selectedGame || !selectedTab || !(panelSlotElement instanceof Element)) {
      return false;
    }

    for (const tabButton of tabButtons) {
      if (!(tabButton instanceof Element)) {
        continue;
      }

      const isActive = tabButton.getAttribute("data-tab-id") === selectedTab.id;
      tabButton.classList.toggle("is-active", isActive);
      tabButton.setAttribute("aria-pressed", isActive ? "true" : "false");
    }

    panelSlotElement.innerHTML = renderAssessmentStageDetailTabPanel({
      tab: selectedTab,
      potionSessionConfig: state.potion.session.config,
      potionSettings: state.potion.settings,
    });
    return true;
  }

  return {
    closeStageDetail,
    getSelectedAssessmentStageDetailMeta,
    getSelectedAssessmentStageDetailTabs,
    getSelectedAssessmentStageGame,
    handleRouteChange,
    openStageDetail,
    setStageDetailTab,
  };
}
