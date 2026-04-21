import { getPotionCurrentQuestion } from "./potion-engine.mjs";
import { createPotionController } from "./potion/controller.mjs";
import { renderPotionPage } from "./potion/renderers.mjs";
import { createPotionViewState } from "./potion/state.mjs";
import {
  createPotionTimerController,
  createPotionTimerRegistry,
} from "./potion/timers.mjs";
import {
  clearPracticeResults,
  loadPracticeResults,
  summarizeResultsByGame,
} from "./storage.mjs";
import { renderTopNav } from "./components/top-nav.mjs";
import {
  createHomeController,
  createHomeViewState,
} from "./pages/home-controller.mjs";
import {
  renderHomePage,
} from "./pages/home-page.mjs";
import { renderResultsPage } from "./pages/results-page.mjs";
import { renderSequencePage } from "./pages/sequence-page.mjs";
import { GAME_META } from "./shared/game-meta.mjs";
import { getCurrentRoute, navigate } from "./shared/routes.mjs";

export { shouldResetPotionStateOnEntry } from "./potion/state.mjs";

const state = {
  route: getCurrentRoute(),
  results: loadPracticeResults(),
  home: createHomeViewState(),
  potion: createPotionViewState(),
};

let rootElement = null;
const potionTimers = createPotionTimerRegistry();
const potionTimerController = createPotionTimerController({
  getState: () => state,
  getRootElement: () => rootElement,
  timers: potionTimers,
  onStartPotionGame: () => potionController.startPotionGame(),
  onHandlePotionTimeout: () => potionController.handlePotionTimeout(),
  onAdvancePotionQuestion: () => potionController.advancePotionQuestion(),
  onCompletePotionExperience: () => potionController.completePotionExperience(),
});
const potionController = createPotionController({
  state,
  renderApp,
  timerController: potionTimerController,
  navigate,
  getRootElement: () => rootElement,
});
const homeController = createHomeController({
  state,
  renderApp,
  getRootElement: () => rootElement,
});

export function initApp() {
  if (typeof document === "undefined") {
    return;
  }

  rootElement = document.getElementById("app");
  if (!rootElement) {
    throw new Error('Expected an element with id "app".');
  }

  rootElement.addEventListener("click", handleRootClick);
  rootElement.addEventListener("change", handleRootChange);
  rootElement.addEventListener("pointermove", handleRootPointerMove);
  rootElement.addEventListener("pointerleave", handleRootPointerLeave);
  window.addEventListener("hashchange", handleRouteChange);
  window.addEventListener("storage", handleStorageChange);

  potionTimerController.ensurePotionLoopForCurrentState();
  renderApp();
}

function handleRouteChange() {
  state.route = getCurrentRoute();
  homeController.handleRouteChange(state.route);
  potionTimerController.ensurePotionLoopForCurrentState();
  renderApp();
}

function handleStorageChange() {
  state.results = loadPracticeResults();
  renderApp();
}

function handleRootPointerMove(event) {
  potionController.handlePotionPointerMove(event);
}

function handleRootPointerLeave() {
  potionController.handlePotionPointerLeave();
}

function handleRootChange(event) {
  const actionElement = getActionElementFromTarget(event.target);
  if (!(actionElement instanceof HTMLInputElement)) {
    return;
  }

  if (actionElement.dataset.action !== "update-potion-setting") {
    return;
  }

  const settingKey = actionElement.dataset.settingKey;
  if (settingKey) {
    potionController.setPotionPracticeSetting(settingKey, actionElement.value);
  }
}

function handleRootClick(event) {
  const actionElement = getActionElementFromTarget(event.target);
  if (!actionElement) {
    return;
  }

  const { action } = actionElement.dataset;

  switch (action) {
    case "navigate": {
      const route = actionElement.dataset.route;
      if (route) {
        if (route === GAME_META.potion.route) {
          potionController.enterPotionGame(actionElement.dataset.entryMode);
        } else {
          navigate(route);
        }
      }
      break;
    }
    case "open-stage-detail": {
      const gameId = actionElement.dataset.gameId;
      if (gameId) {
        homeController.openStageDetail(gameId);
      }
      break;
    }
    case "close-stage-detail": {
      homeController.closeStageDetail();
      break;
    }
    case "select-stage-detail-tab": {
      const tabId = actionElement.dataset.tabId;
      if (tabId) {
        homeController.setStageDetailTab(tabId);
      }
      break;
    }
    case "start-stage-route": {
      const route = actionElement.dataset.route;
      if (route) {
        homeController.closeStageDetail({ shouldRender: false });
        if (route === GAME_META.potion.route) {
          potionController.enterPotionGame("fresh");
        } else {
          navigate(route);
        }
      }
      break;
    }
    case "start-potion-now": {
      potionController.startPotionGame();
      break;
    }
    case "restart-potion": {
      potionController.enterPotionGame("fresh");
      break;
    }
    case "abort-potion-session": {
      potionController.abortPotionSession();
      break;
    }
    case "complete-potion": {
      potionController.completePotionExperience();
      break;
    }
    case "potion-answer": {
      const color = actionElement.dataset.color;
      potionController.submitPotionChoice(color);
      break;
    }
    case "clear-results": {
      clearPracticeResults();
      state.results = [];
      renderApp();
      break;
    }
    default:
      break;
  }
}

function getActionElementFromTarget(target) {
  if (typeof Element !== "undefined" && target instanceof Element) {
    return target.closest("[data-action]");
  }

  if (typeof Node !== "undefined" && target instanceof Node) {
    return target.parentElement?.closest("[data-action]") ?? null;
  }

  return null;
}

function renderApp() {
  if (!rootElement) {
    return;
  }

  const resultsSummary = summarizeResultsByGame(state.results, {
    potionConfig: state.potion.settings,
  });
  const pageMarkup = getRouteMarkup(state.route, resultsSummary);
  const isPotionRoute = state.route === "/games/potion";
  const isHomeRoute = state.route === "/";
  const isResultsRoute = state.route === "/results";
  const isFramelessRoute = isPotionRoute || isHomeRoute || isResultsRoute;

  document.body.dataset.route = isPotionRoute
    ? "potion"
    : isHomeRoute
      ? "home"
      : isResultsRoute
        ? "results"
        : "default";

  if (isFramelessRoute) {
    rootElement.innerHTML = `
      <div class="app-shell ${isPotionRoute ? "app-shell--potion" : isHomeRoute ? "app-shell--home" : "app-shell--results"}">
        ${pageMarkup}
      </div>
    `;
    potionController.syncPotionChoiceHoverFromPointer();
    return;
  }

  rootElement.innerHTML = `
    <div class="app-shell">
      ${renderTopNav({ currentRoute: state.route })}
      <main class="page-frame">
        ${pageMarkup}
      </main>
    </div>
  `;
  potionController.syncPotionChoiceHoverFromPointer();
}

function getRouteMarkup(route, resultsSummary) {
  switch (route) {
    case "/games/potion":
      return renderPotionPage({
        potionState: state.potion,
        currentQuestion: getPotionCurrentQuestion(state.potion.session),
      });
    case "/games/sequence":
      return renderSequencePage({
        resultSummary: resultsSummary.sequence,
      });
    case "/results":
      return renderResultsPage({
        resultsSummary,
        results: state.results,
        potionSettings: state.potion.settings,
        potionSessionConfig: state.potion.session.config,
      });
    default:
      return renderHomePage({
        selectedGame: homeController.getSelectedAssessmentStageGame(),
        selectedStageGameId: state.home.selectedStageGameId,
        selectedStageDetailTabId: state.home.selectedStageDetailTabId,
        selectedStageDetailMeta:
          homeController.getSelectedAssessmentStageDetailMeta(),
        selectedStageDetailTabs:
          homeController.getSelectedAssessmentStageDetailTabs(),
        potionSessionConfig: state.potion.session.config,
        potionSettings: state.potion.settings,
      });
  }
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  initApp();
}
