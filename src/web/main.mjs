import {
  DEFAULT_POTION_GAME_CONFIG,
  DEFAULT_POTION_INGREDIENTS,
  buildPotionComboCatalog,
  createPotionSession,
  getPotionCurrentQuestion,
  submitPotionAnswer,
  timeoutPotionQuestion,
} from "./potion-engine.mjs";
import {
  clearPracticeResults,
  loadPracticeResults,
  savePracticeResult,
  summarizeResultsByGame,
} from "./storage.mjs";

const GAME_META = {
  potion: {
    id: "potion",
    title: "마법약 만들기",
    description:
      "반복되는 재료 조합의 결과 경향을 학습해 더 높은 확률의 약 색을 고르는 과제",
    category: "학습능력",
    route: "/games/potion",
    implemented: true,
  },
  sequence: {
    id: "sequence",
    title: "도형 순서 기억하기",
    description: "2-back / 3-back 규칙을 기반으로 판단하는 작업기억 과제",
    category: "작업기억",
    route: "/games/sequence",
    implemented: false,
  },
};

const ASSESSMENT_STAGE_GAMES = [
  {
    id: "rps",
    title: "가위바위보",
    category: "인지능력",
    duration: "3분",
    difficulty: "난이도 하",
    icon: "rps",
  },
  {
    id: "rotation",
    title: "도형 회전하기",
    category: "공간능력",
    duration: "6분",
    difficulty: "난이도 중",
    icon: "rotation",
  },
  {
    id: "schedule",
    title: "약속 정하기",
    category: "작업기억",
    duration: "4분",
    difficulty: "난이도 중",
    icon: "calendar",
  },
  {
    id: "route",
    title: "길 만들기",
    category: "계획능력",
    duration: "3분",
    difficulty: "난이도 중",
    icon: "road",
  },
  {
    id: "potion-stage",
    title: "마법약 만들기",
    category: "학습능력",
    duration: "6분",
    difficulty: "난이도 상",
    icon: "potion",
    route: "/games/potion",
    detailSummary:
      "반복되는 재료 조합의 결과를 빠르게 학습하고, 어떤 색의 마법약이 더 높은 확률로 제조될지 예측하는 과제",
    detailMeta: ["학습능력", "총 1 라운드", "총 6분 소요", "난이도 상"],
    detailTabs: [
      {
        id: "overview",
        label: "게임 소개",
        title: "어떤 게임인지 먼저 파악합니다",
        paragraphs: [
          "같은 재료 조합이라도 결과가 달라질 수 있기 때문에, 한 번의 결과보다 반복되는 경향을 빠르게 읽어내는 것이 핵심입니다.",
          "즉시 피드백을 보며 어떤 조합이 어느 색으로 더 자주 이어지는지 학습하고, 다음 선택에 반영해야 합니다.",
        ],
      },
      {
        id: "flow",
        label: "진행 방식",
        title: "실전에서는 이렇게 진행됩니다",
        bullets: [
          "총 100문항이 순차적으로 제시됩니다.",
          "각 문항은 3초 안에 응답해야 합니다.",
          "문항마다 즉시 결과 피드백이 제공됩니다.",
          "반복 조합의 누적 경향을 학습하는 것이 가장 중요합니다.",
        ],
      },
    ],
  },
  {
    id: "numbers",
    title: "숫자 누르기",
    category: "인지제어",
    duration: "3분",
    difficulty: "난이도 하",
    icon: "number",
  },
  {
    id: "sequence-stage",
    title: "도형 순서 기억하기",
    category: "작업기억",
    duration: "3분",
    difficulty: "난이도 상",
    icon: "sequence",
  },
  {
    id: "cat",
    title: "고양이 술래잡기",
    category: "작업기억",
    duration: "4분",
    difficulty: "난이도 상",
    icon: "cat",
  },
  {
    id: "compare",
    title: "개수 비교하기",
    category: "인지능력",
    duration: "3분",
    difficulty: "난이도 하",
    icon: "balance",
  },
];

const POTION_FACTS = [
  "4개의 재료 조합이 총 100번 제시됩니다.",
  "현재 조합에서 더 높은 확률로 제조될 약 색을 선택합니다.",
  "같은 조합이라도 실제 결과는 달라질 수 있습니다.",
  "같은 조합의 누적 결과가 동점이면 그 문항은 연습 점수 집계에서 제외됩니다.",
  "문항마다 즉시 결과 피드백이 표시됩니다.",
  "문항당 응답 제한시간은 3초입니다.",
];

const POTION_UNVERIFIED = [
  "조합별 실제 확률표는 공개 근거가 없어 MVP 가정값으로 처리합니다.",
  "아래 결과는 공식 점수가 아니라 연습 점수입니다.",
];

const POTION_TIMER_DANGER_THRESHOLD_SEC = 1;
const POTION_FEEDBACK_STAGE_DURATION_MS = 1200;
const DEFAULT_HOME_STAGE_DETAIL_TAB_ID = "overview";

const state = {
  route: getCurrentRoute(),
  results: loadPracticeResults(),
  home: createHomeViewState(),
  potion: createPotionViewState(),
};

const timers = {
  introAnimationFrame: null,
  introAutoStart: null,
  questionAnimationFrame: null,
  questionTimeout: null,
  feedbackAdvance: null,
};

const pointerState = {
  x: null,
  y: null,
  isInsideRoot: false,
};

let rootElement = null;

export function initApp() {
  if (typeof document === "undefined") {
    return;
  }

  rootElement = document.getElementById("app");
  if (!rootElement) {
    throw new Error('Expected an element with id "app".');
  }

  rootElement.addEventListener("click", handleRootClick);
  rootElement.addEventListener("pointermove", handleRootPointerMove);
  rootElement.addEventListener("pointerleave", handleRootPointerLeave);
  window.addEventListener("hashchange", handleRouteChange);
  window.addEventListener("storage", handleStorageChange);

  ensurePotionLoopForCurrentState();
  renderApp();
}

function createHomeViewState() {
  return {
    selectedStageGameId: null,
    selectedStageDetailTabId: DEFAULT_HOME_STAGE_DETAIL_TAB_ID,
  };
}

function createPotionViewState() {
  return {
    phase: "tutorial",
    session: createFreshPotionSession(),
    introEndsAtMs:
      Date.now() + DEFAULT_POTION_GAME_CONFIG.introAutoStartSec * 1000,
    questionStartedAtMs: null,
    checkingEndsAtMs: null,
    feedback: null,
    hoveredChoiceColor: null,
    savedResultId: null,
  };
}

function createFreshPotionSession() {
  return createPotionSession({
    comboCatalog: buildPotionComboCatalog(
      DEFAULT_POTION_INGREDIENTS,
      DEFAULT_POTION_GAME_CONFIG,
    ),
    createdAt: new Date().toISOString(),
  });
}

function handleRouteChange() {
  state.route = getCurrentRoute();
  if (state.route !== "/") {
    state.home.selectedStageGameId = null;
    state.home.selectedStageDetailTabId = DEFAULT_HOME_STAGE_DETAIL_TAB_ID;
  }
  ensurePotionLoopForCurrentState();
  renderApp();
}

function handleStorageChange() {
  state.results = loadPracticeResults();
  renderApp();
}

function handleRootPointerMove(event) {
  if (event.pointerType && event.pointerType !== "mouse") {
    clearTrackedPointerState();
    return;
  }

  pointerState.x = event.clientX;
  pointerState.y = event.clientY;
  pointerState.isInsideRoot = true;
  syncPotionChoiceHoverFromPointer();
}

function handleRootPointerLeave() {
  clearTrackedPointerState();
}

function clearTrackedPointerState() {
  pointerState.x = null;
  pointerState.y = null;
  pointerState.isInsideRoot = false;
  syncPotionChoiceHoverFromPointer();
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
        navigate(route);
      }
      break;
    }
    case "open-stage-detail": {
      const gameId = actionElement.dataset.gameId;
      if (gameId) {
        openHomeStageDetail(gameId);
      }
      break;
    }
    case "close-stage-detail": {
      closeHomeStageDetail();
      break;
    }
    case "select-stage-detail-tab": {
      const tabId = actionElement.dataset.tabId;
      if (tabId) {
        setHomeStageDetailTab(tabId);
      }
      break;
    }
    case "start-stage-route": {
      const route = actionElement.dataset.route;
      if (route) {
        closeHomeStageDetail({ shouldRender: false });
        navigate(route);
      }
      break;
    }
    case "start-potion-now": {
      startPotionGame();
      break;
    }
    case "restart-potion": {
      resetPotionExperience();
      break;
    }
    case "abort-potion-session": {
      abortPotionSession();
      break;
    }
    case "complete-potion": {
      completePotionExperience();
      break;
    }
    case "potion-answer": {
      const color = actionElement.dataset.color;
      submitPotionChoice(color);
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

function syncPotionChoiceHoverFromPointer() {
  setPotionHoveredChoiceColor(getPotionHoveredChoiceColorFromPointer());
}

function getAssessmentStageGameById(gameId) {
  return ASSESSMENT_STAGE_GAMES.find((game) => game.id === gameId) ?? null;
}

function getSelectedAssessmentStageGame() {
  return getAssessmentStageGameById(state.home.selectedStageGameId);
}

function openHomeStageDetail(gameId) {
  const game = getAssessmentStageGameById(gameId);
  if (!game?.route) {
    return;
  }

  state.home.selectedStageGameId = game.id;
  state.home.selectedStageDetailTabId =
    game.detailTabs?.[0]?.id ?? DEFAULT_HOME_STAGE_DETAIL_TAB_ID;
  renderApp();
}

function closeHomeStageDetail({ shouldRender = true } = {}) {
  if (!state.home.selectedStageGameId) {
    return;
  }

  state.home.selectedStageGameId = null;
  state.home.selectedStageDetailTabId = DEFAULT_HOME_STAGE_DETAIL_TAB_ID;

  if (shouldRender) {
    renderApp();
  }
}

function setHomeStageDetailTab(tabId) {
  const selectedGame = getSelectedAssessmentStageGame();
  const matchingTab = selectedGame?.detailTabs?.find((tab) => tab.id === tabId);

  if (!matchingTab || state.home.selectedStageDetailTabId === tabId) {
    return;
  }

  state.home.selectedStageDetailTabId = matchingTab.id;
  if (!syncHomeStageDetailTabUi()) {
    renderApp();
  }
}

function syncHomeStageDetailTabUi() {
  if (!rootElement || state.route !== "/" || !state.home.selectedStageGameId) {
    return false;
  }

  const selectedGame = getSelectedAssessmentStageGame();
  const selectedTab =
    selectedGame?.detailTabs?.find(
      (tab) => tab.id === state.home.selectedStageDetailTabId,
    ) ?? selectedGame?.detailTabs?.[0];
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

    const isActive =
      tabButton.getAttribute("data-tab-id") === selectedTab.id;
    tabButton.classList.toggle("is-active", isActive);
    tabButton.setAttribute("aria-pressed", isActive ? "true" : "false");
  }

  panelSlotElement.innerHTML = renderAssessmentStageDetailTabPanel(selectedTab);
  return true;
}

function getPotionHoveredChoiceColorFromPointer() {
  if (
    typeof document === "undefined" ||
    !pointerState.isInsideRoot ||
    pointerState.x == null ||
    pointerState.y == null ||
    state.route !== "/games/potion" ||
    state.potion.phase !== "playing"
  ) {
    return null;
  }

  const hoveredElement = document.elementFromPoint(
    pointerState.x,
    pointerState.y,
  );
  if (!(hoveredElement instanceof Element)) {
    return null;
  }

  const hoveredButton = hoveredElement.closest(
    ".potion-choice-button[data-action='potion-answer']",
  );
  if (
    !(hoveredButton instanceof Element) ||
    hoveredButton.hasAttribute("disabled")
  ) {
    return null;
  }

  const hoveredColor = hoveredButton.getAttribute("data-color");
  return hoveredColor === "blue" || hoveredColor === "red"
    ? hoveredColor
    : null;
}

function setPotionHoveredChoiceColor(color) {
  const nextHoveredChoiceColor =
    color === "blue" || color === "red" ? color : null;
  if (state.potion.hoveredChoiceColor === nextHoveredChoiceColor) {
    return;
  }

  state.potion.hoveredChoiceColor = nextHoveredChoiceColor;
  syncPotionChoiceHoverUi();
}

function syncPotionChoiceHoverUi() {
  if (!rootElement) {
    return;
  }

  const choiceButtons = rootElement.querySelectorAll(
    ".potion-choice-button[data-action='potion-answer']",
  );
  for (const button of choiceButtons) {
    if (!(button instanceof Element)) {
      continue;
    }

    button.classList.toggle(
      "is-hovered",
      !button.hasAttribute("disabled") &&
        button.getAttribute("data-color") === state.potion.hoveredChoiceColor,
    );
  }
}

function navigate(route) {
  if (typeof window === "undefined") {
    return;
  }

  window.location.hash = route;
}

function ensurePotionLoopForCurrentState() {
  const { potion } = state;
  const isPotionRoute = state.route === "/games/potion";

  if (!isPotionRoute) {
    clearIntroTimers();
    clearQuestionTimers();
    clearFeedbackTimer();
    return;
  }

  if (potion.phase === "tutorial") {
    if (potion.introEndsAtMs <= Date.now()) {
      state.potion.introEndsAtMs =
        Date.now() + state.potion.session.config.introAutoStartSec * 1000;
    }
    scheduleIntroCountdown();
    return;
  }

  clearIntroTimers();

  if (potion.phase === "playing") {
    scheduleQuestionCountdown();
    return;
  }

  clearQuestionTimers();

  if (potion.phase === "checking") {
    scheduleFeedbackAdvance();
    return;
  }

  clearFeedbackTimer();
}

function scheduleIntroCountdown() {
  clearIntroTimers();

  const remainingMs = getPotionIntroRemainingMs();
  if (remainingMs <= 0) {
    startPotionGame();
    return;
  }

  timers.introAutoStart = window.setTimeout(() => {
    startPotionGame();
  }, remainingMs);

  syncPotionIntroUi();
  schedulePotionIntroAnimation();
}

function clearIntroTimers() {
  if (timers.introAnimationFrame) {
    window.cancelAnimationFrame(timers.introAnimationFrame);
    timers.introAnimationFrame = null;
  }

  if (timers.introAutoStart) {
    window.clearTimeout(timers.introAutoStart);
    timers.introAutoStart = null;
  }
}

function startPotionGame() {
  if (state.potion.phase === "playing") {
    return;
  }

  clearIntroTimers();
  clearFeedbackTimer();

  state.potion.phase = "playing";
  state.potion.feedback = null;
  state.potion.checkingEndsAtMs = null;
  state.potion.questionStartedAtMs = Date.now();

  ensurePotionLoopForCurrentState();
  renderApp();
}

function scheduleQuestionCountdown() {
  clearQuestionTimers();

  const timeLimitMs = state.potion.session.config.questionTimeLimitSec * 1000;
  const elapsedMs = Date.now() - state.potion.questionStartedAtMs;
  const remainingMs = timeLimitMs - elapsedMs;

  if (remainingMs <= 0) {
    handlePotionTimeout();
    return;
  }

  timers.questionTimeout = window.setTimeout(() => {
    handlePotionTimeout();
  }, remainingMs);

  syncPotionQuestionTimerUi();
  schedulePotionQuestionTimerAnimation();
}

function clearQuestionTimers() {
  if (timers.questionAnimationFrame) {
    window.cancelAnimationFrame(timers.questionAnimationFrame);
    timers.questionAnimationFrame = null;
  }

  if (timers.questionTimeout) {
    window.clearTimeout(timers.questionTimeout);
    timers.questionTimeout = null;
  }
}

function submitPotionChoice(color) {
  if (state.potion.phase !== "playing") {
    return;
  }

  const questionStartedAtMs = state.potion.questionStartedAtMs ?? Date.now();
  const responseTimeMs = Math.max(Date.now() - questionStartedAtMs, 0);

  const turn = submitPotionAnswer(
    state.potion.session,
    {
      selectedColor: color,
      responseTimeMs,
    },
    {
      answeredAt: new Date().toISOString(),
    },
  );

  commitPotionTurn(turn, responseTimeMs);
}

function handlePotionTimeout() {
  if (state.potion.phase !== "playing") {
    return;
  }

  const turn = timeoutPotionQuestion(state.potion.session, {
    answeredAt: new Date().toISOString(),
  });

  commitPotionTurn(
    turn,
    state.potion.session.config.questionTimeLimitSec * 1000,
  );
}

function commitPotionTurn(turn, responseTimeMs) {
  clearQuestionTimers();

  state.potion.session = turn.session;
  state.potion.feedback = {
    questionNumber: turn.question.questionNumber,
    comboId: turn.question.comboId,
    selectedColor: turn.questionResult.selectedColor,
    actualColor: turn.questionResult.actualColor,
    timedOut: turn.questionResult.timedOut,
    visibleResult: turn.visibleResult,
    responseTimeMs,
    speedBandScore: turn.speedBandScore,
  };

  if (turn.isFinished) {
    state.potion.phase = "finished";
    state.potion.questionStartedAtMs = null;
    state.potion.checkingEndsAtMs = null;
    persistPotionResult();
  } else {
    state.potion.phase = "checking";
    state.potion.questionStartedAtMs = null;
    state.potion.checkingEndsAtMs =
      Date.now() + POTION_FEEDBACK_STAGE_DURATION_MS;
  }

  ensurePotionLoopForCurrentState();
  renderApp();
}

function scheduleFeedbackAdvance() {
  clearFeedbackTimer();

  const remainingMs = Math.max(
    (state.potion.checkingEndsAtMs ?? Date.now()) - Date.now(),
    0,
  );
  timers.feedbackAdvance = window.setTimeout(() => {
    advancePotionQuestion();
  }, remainingMs);
}

function clearFeedbackTimer() {
  if (timers.feedbackAdvance) {
    window.clearTimeout(timers.feedbackAdvance);
    timers.feedbackAdvance = null;
  }
}

function advancePotionQuestion() {
  if (state.potion.phase !== "checking") {
    return;
  }

  state.potion.phase = "playing";
  state.potion.feedback = null;
  state.potion.questionStartedAtMs = Date.now();
  state.potion.checkingEndsAtMs = null;

  ensurePotionLoopForCurrentState();
  renderApp();
}

function persistPotionResult() {
  const { session, savedResultId } = state.potion;
  if (!session.summary || savedResultId === session.id) {
    return;
  }

  const durationMs = computeDurationMs(session);
  const practiceResult = {
    id: session.id,
    gameId: "potion",
    playedAt: session.endedAt ?? new Date().toISOString(),
    practiceScore: roundNumber(session.summary.practiceScore, 2),
    practiceAccuracy: roundNumber(session.summary.practiceAccuracy, 4),
    roundsCompleted: session.completedQuestionCount,
    durationMs,
  };

  state.results = savePracticeResult(practiceResult);
  state.potion.savedResultId = session.id;
}

function resetPotionExperience() {
  clearIntroTimers();
  clearQuestionTimers();
  clearFeedbackTimer();

  state.potion = createPotionViewState();

  ensurePotionLoopForCurrentState();
  renderApp();
}

function abortPotionSession() {
  if (typeof window !== "undefined") {
    const shouldAbort = window.confirm(
      "현재 진행 중인 게임은 저장되지 않고 메인 화면으로 돌아갑니다. 계속할까요?",
    );
    if (!shouldAbort) {
      return;
    }
  }

  clearIntroTimers();
  clearQuestionTimers();
  clearFeedbackTimer();
  state.potion = createPotionViewState();
  navigate("/");
}

function computeDurationMs(session) {
  if (session.startedAt && session.endedAt) {
    const durationMs =
      Date.parse(session.endedAt) - Date.parse(session.startedAt);
    return Number.isFinite(durationMs) && durationMs > 0
      ? durationMs
      : session.completedQuestionCount *
          session.config.questionTimeLimitSec *
          1000;
  }

  return (
    session.completedQuestionCount * session.config.questionTimeLimitSec * 1000
  );
}

function renderApp() {
  if (!rootElement) {
    return;
  }

  const resultsSummary = summarizeResultsByGame(state.results);
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
    syncPotionChoiceHoverFromPointer();
    return;
  }

  rootElement.innerHTML = `
    <div class="app-shell">
      ${renderTopNav()}
      <main class="page-frame">
        ${pageMarkup}
      </main>
    </div>
  `;
  syncPotionChoiceHoverFromPointer();
}

function getRouteMarkup(route, resultsSummary) {
  switch (route) {
    case "/games/potion":
      return renderPotionPage(resultsSummary.potion);
    case "/games/sequence":
      return renderSequencePage(resultsSummary.sequence);
    case "/results":
      return renderResultsPage(resultsSummary);
    default:
      return renderHomePage();
  }
}

function renderTopNav() {
  return `
    <header class="top-nav">
      <button class="brand-mark" data-action="navigate" data-route="/">
        <span class="brand-mark__dot"></span>
        <span>AI 전략게임 연습</span>
      </button>
      <nav class="top-nav__links" aria-label="주요 탐색">
        ${renderNavLink("/", "홈")}
        ${renderNavLink("/games/potion", "마법약 만들기")}
        ${renderNavLink("/results", "연습 기록")}
      </nav>
    </header>
  `;
}

function renderNavLink(route, label) {
  const isActive = state.route === route;
  return `
    <button
      class="nav-link ${isActive ? "is-active" : ""}"
      data-action="navigate"
      data-route="${route}"
    >
      ${label}
    </button>
  `;
}

function renderHomePage() {
  const selectedGame = getSelectedAssessmentStageGame();
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
              ${ASSESSMENT_STAGE_GAMES.map((game) => renderAssessmentStageCard(game)).join("")}
            </div>
          </div>
        </section>
        ${selectedGame ? renderAssessmentStageDetailDrawer(selectedGame) : ""}
      </div>
    </section>
  `;
}

function renderAssessmentStageCard(game) {
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
        aria-expanded="${state.home.selectedStageGameId === game.id ? "true" : "false"}"
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

function renderAssessmentStageDetailDrawer(game) {
  const tab =
    game.detailTabs?.find(
      (detailTab) => detailTab.id === state.home.selectedStageDetailTabId,
    ) ?? game.detailTabs?.[0];

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
            ${(game.detailMeta ?? []).map((item) => `<span>${item}</span>`).join("")}
          </div>
          <div class="assessment-stage-drawer__artwork" aria-hidden="true">
            ${renderAssessmentStageDrawerArtwork(game.icon)}
          </div>
          <nav class="assessment-stage-drawer__tabs" aria-label="${game.title} 안내 탭">
            ${(game.detailTabs ?? [])
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
            ${renderAssessmentStageDetailTabPanel(tab)}
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

function renderAssessmentStageDetailTabPanel(tab) {
  if (!tab) {
    return "";
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

function renderAssessmentStageDrawerArtwork(icon) {
  if (icon !== "potion") {
    return `
      <div class="assessment-stage-drawer__artwork-fallback">
        ${renderAssessmentStageIcon(icon)}
      </div>
    `;
  }

  return `
    <svg class="assessment-stage-drawer-artwork" viewBox="0 0 320 160">
      <rect class="assessment-stage-drawer-artwork__bg" x="0" y="0" width="320" height="160" rx="20"></rect>
      <path class="assessment-stage-drawer-artwork__line" d="M18 52c38-24 94-28 150-4c39 16 84 20 132-2"></path>
      <path class="assessment-stage-drawer-artwork__line" d="M20 122c45-18 96-16 156 6c42 15 86 13 124-4"></path>
      <g class="assessment-stage-drawer-artwork__cauldron">
        <ellipse cx="92" cy="119" rx="44" ry="14"></ellipse>
        <path d="M52 82h80l-8 40H60z"></path>
        <path d="M60 82c0-10 8-18 18-18h28c10 0 18 8 18 18"></path>
        <path d="M56 121c-10 0-18 8-18 18"></path>
      </g>
      <g class="assessment-stage-drawer-artwork__brew">
        <circle cx="80" cy="74" r="18"></circle>
        <circle cx="100" cy="69" r="12"></circle>
        <circle cx="117" cy="76" r="16"></circle>
        <circle cx="137" cy="88" r="12"></circle>
      </g>
      <g class="assessment-stage-drawer-artwork__hand">
        <path d="M48 74c-10-2-21 3-28 13l22 9z"></path>
        <path d="M83 32c-6-2-12 2-13 8l-8 40l19 5l13-37c2-7-3-14-11-16z"></path>
      </g>
      <g class="assessment-stage-drawer-artwork__flask">
        <path d="M218 26h28v20h-28z"></path>
        <path d="M204 46h56l-8 24l25 32c12 15 1 38-18 38h-54c-19 0-30-23-18-38l25-32z"></path>
        <path d="M207 113c13-8 28-6 43 5c13 10 28 13 43 7c0 12-10 21-24 21h-44c-14 0-24-15-18-33z"></path>
        <text x="232" y="112">?</text>
      </g>
      <circle class="assessment-stage-drawer-artwork__dot is-green" cx="188" cy="58" r="4"></circle>
      <circle class="assessment-stage-drawer-artwork__dot is-red" cx="166" cy="88" r="4"></circle>
      <circle class="assessment-stage-drawer-artwork__dot is-yellow" cx="284" cy="82" r="5"></circle>
      <circle class="assessment-stage-drawer-artwork__dot is-green" cx="176" cy="112" r="6"></circle>
    </svg>
  `;
}

function renderAssessmentStageIcon(icon) {
  switch (icon) {
    case "rps":
      return `
        <svg class="assessment-stage-icon" viewBox="0 0 64 64">
          <path d="M25 45l4-18c1-4 6-5 8-2l7 11c2 3 1 7-2 9l-5 4c-3 2-7 2-10 1z"></path>
          <path d="M24 30l2-11c1-3 5-4 7-2c1 1 2 3 1 5l-2 9"></path>
          <path d="M32 28l2-12c1-3 5-4 7-2c2 1 3 3 2 5l-2 11"></path>
        </svg>
      `;
    case "rotation":
      return `
        <svg class="assessment-stage-icon" viewBox="0 0 64 64">
          <rect x="26" y="22" width="14" height="14" rx="3"></rect>
          <path d="M16 31c0-9 7-16 16-16c6 0 11 3 14 8"></path>
          <path d="M45 15l2 8l-8-1"></path>
          <path d="M48 33c0 9-7 16-16 16c-6 0-11-3-14-8"></path>
          <path d="M19 49l-2-8l8 1"></path>
        </svg>
      `;
    case "calendar":
      return `
        <svg class="assessment-stage-icon" viewBox="0 0 64 64">
          <rect x="16" y="18" width="32" height="28" rx="5"></rect>
          <path d="M16 26h32"></path>
          <path d="M24 14v8"></path>
          <path d="M40 14v8"></path>
          <path d="M24 36l5 5l11-12"></path>
        </svg>
      `;
    case "road":
      return `
        <svg class="assessment-stage-icon" viewBox="0 0 64 64">
          <circle cx="32" cy="18" r="7"></circle>
          <path d="M18 46c6-10 10-21 14-32"></path>
          <path d="M46 46c-6-10-10-21-14-32"></path>
          <path d="M32 28v4"></path>
          <path d="M32 38v4"></path>
        </svg>
      `;
    case "potion":
      return `
        <svg class="assessment-stage-icon" viewBox="0 0 64 64">
          <path d="M29 12h10v8h-10z"></path>
          <path d="M24 18h20l-3 9l11 13c5 6 1 14-7 14H19c-8 0-12-8-7-14l11-13z"></path>
          <path d="M18 41c5-3 11-2 17 3c5 4 10 5 15 3c0 5-4 9-9 9H23c-6 0-9-7-5-15z"></path>
          <circle cx="20" cy="18" r="3"></circle>
          <circle cx="48" cy="20" r="2"></circle>
        </svg>
      `;
    case "number":
      return `
        <svg class="assessment-stage-icon" viewBox="0 0 64 64">
          <rect x="18" y="14" width="28" height="36" rx="5"></rect>
          <path d="M22 20h20"></path>
          <circle cx="26" cy="31" r="2"></circle>
          <circle cx="38" cy="31" r="2"></circle>
          <circle cx="26" cy="41" r="2"></circle>
          <circle cx="38" cy="41" r="2"></circle>
        </svg>
      `;
    case "sequence":
      return `
        <svg class="assessment-stage-icon" viewBox="0 0 64 64">
          <rect x="17" y="22" width="18" height="18" rx="3"></rect>
          <rect x="29" y="14" width="18" height="18" rx="3"></rect>
          <rect x="31" y="30" width="18" height="18" rx="3"></rect>
        </svg>
      `;
    case "cat":
      return `
        <svg class="assessment-stage-icon" viewBox="0 0 64 64">
          <circle cx="22" cy="24" r="4"></circle>
          <circle cx="42" cy="24" r="4"></circle>
          <circle cx="16" cy="34" r="4"></circle>
          <circle cx="48" cy="34" r="4"></circle>
          <path d="M23 46c0-6 4-10 9-10s9 4 9 10c0 4-4 7-9 7s-9-3-9-7z"></path>
        </svg>
      `;
    case "balance":
    default:
      return `
        <svg class="assessment-stage-icon" viewBox="0 0 64 64">
          <path d="M32 16v28"></path>
          <path d="M20 24h24"></path>
          <path d="M14 26l6 10H8z"></path>
          <path d="M44 26l6 10H38z"></path>
          <path d="M26 48h12"></path>
        </svg>
      `;
  }
}

function renderPotionPage(resultSummary) {
  const { potion } = state;
  const currentQuestion = getPotionCurrentQuestion(potion.session);
  const questionInfo = getPotionDisplayQuestionInfo(currentQuestion);

  return `
    <section class="potion-route">
      <div class="potion-route__stage">
        ${
          potion.phase === "tutorial"
            ? renderPotionTutorialStage(currentQuestion)
            : potion.phase === "finished"
              ? renderPotionFinishedStage()
              : renderPotionQuestionStage(questionInfo, currentQuestion)
        }
      </div>
      ${renderPotionTimeoutOverlay()}
    </section>
  `;
}

function renderPotionTutorialStage(currentQuestion) {
  const progressRatio = getPotionIntroProgressRatio();

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
          <li>4개의 재료 조합이 총 100번 제시됩니다.</li>
          <li>4개의 재료 조합이 어떤 마법약으로 제조될지 정확히 기억하여 제조될 마법약을 선택해 주세요.</li>
          <li>같은 재료 조합이라도 경우에 따라 결과가 달라지니 더 높은 확률로 제조될 마법약을 선택해 주세요.</li>
        </ol>
      </div>
      <div class="potion-tutorial-card__footer">
        <div class="tutorial-progress">
          <span class="tutorial-progress__fill" style="transform:scaleX(${progressRatio})"></span>
        </div>
        <p class="potion-tutorial-card__countdown">${getPotionIntroCountdownText()}</p>
      </div>
    </section>
  `;
}

function renderPotionQuestionStage(questionInfo, currentQuestion) {
  const feedback = state.potion.feedback;
  const isInlineFeedback =
    state.potion.phase === "checking" && feedback && !feedback.timedOut;
  const displayedCombo = getPotionDisplayedCombo(currentQuestion);
  const timerRatio = getPotionQuestionTimeRatio();
  const timerDangerClass = isPotionQuestionTimerDanger() ? " is-danger" : "";

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
            ? renderPotionAnsweredFeedbackBody()
            : `
              <div class="potion-question-card__body">
                ${renderPotionIngredientMatrix(displayedCombo)}
              </div>
              <div class="potion-question-card__actions">
                ${renderPotionChoiceButtons()}
              </div>
            `
        }
      </div>
    </section>
  `;
}

function renderPotionAnsweredFeedbackBody() {
  const feedback = state.potion.feedback;
  if (!feedback || feedback.timedOut) {
    return "";
  }

  return `
    <div class="potion-question-card__feedback-body">
      ${renderPotionFeedbackCard()}
    </div>
  `;
}

function renderPotionTimeoutOverlay() {
  const feedback = state.potion.feedback;
  if (state.potion.phase !== "checking" || !feedback || !feedback.timedOut) {
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

function getPotionDisplayedCombo(currentQuestion) {
  if (state.potion.phase !== "checking" || !state.potion.feedback) {
    return currentQuestion?.combo ?? null;
  }

  return (
    state.potion.session.comboCatalog.find(
      (combo) => combo.id === state.potion.feedback.comboId,
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

function renderPotionChoiceButtons() {
  const isPlaying = state.potion.phase === "playing";
  const hoveredChoiceColor = isPlaying ? state.potion.hoveredChoiceColor : null;
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

function renderPotionFeedbackCard() {
  const feedback = state.potion.feedback;
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
  const message = feedback.timedOut
    ? `${actualColorLabel}이 제조되었습니다.`
    : `${actualColorLabel}이 제조되었습니다.`;

  return `
    <article class="potion-feedback-card ${isSuccess ? "is-success" : "is-failure"}">
      <div class="potion-feedback-card__art">
        ${renderPotionFlaskArt(feedback.actualColor, isSuccess)}
      </div>
      <div class="potion-feedback-card__copy">
        <h2>${title}</h2>
        <p>${message}</p>
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
      <button class="potion-finished-card__button" data-action="complete-potion" aria-label="연습 기록 보기">
        <span>✓</span>
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

function getPotionDisplayQuestionInfo(currentQuestion) {
  const questionNumber =
    state.potion.phase === "checking"
      ? (state.potion.feedback?.questionNumber ??
        state.potion.session.completedQuestionCount)
      : (currentQuestion?.questionNumber ??
        state.potion.session.completedQuestionCount);
  const remainingQuestions =
    state.potion.session.config.sessionQuestionCount - questionNumber;

  return {
    questionNumber,
    remainingQuestions,
    timerValue: getPotionTimerDisplayValue(),
  };
}

function getPotionTimerDisplayValue() {
  const timeLimitMs = state.potion.session.config.questionTimeLimitSec * 1000;

  if (state.potion.phase === "checking" && state.potion.feedback) {
    const remainingMs = state.potion.feedback.timedOut
      ? 0
      : Math.max(timeLimitMs - state.potion.feedback.responseTimeMs, 0);
    return Math.max(Math.ceil(remainingMs / 1000), 1);
  }

  if (state.potion.phase === "playing" && state.potion.questionStartedAtMs) {
    const remainingMs = Math.max(
      timeLimitMs - (Date.now() - state.potion.questionStartedAtMs),
      0,
    );
    return Math.max(Math.ceil(remainingMs / 1000), 1);
  }

  return state.potion.session.config.questionTimeLimitSec;
}

function getPotionQuestionTimeRatio() {
  const timeLimitMs = state.potion.session.config.questionTimeLimitSec * 1000;

  if (state.potion.phase === "checking" && state.potion.feedback) {
    const remainingMs = state.potion.feedback.timedOut
      ? 0
      : Math.max(timeLimitMs - state.potion.feedback.responseTimeMs, 0);
    return clamp(remainingMs / timeLimitMs, 0, 1);
  }

  if (state.potion.phase === "playing" && state.potion.questionStartedAtMs) {
    const remainingMs = Math.max(
      timeLimitMs - (Date.now() - state.potion.questionStartedAtMs),
      0,
    );
    return clamp(remainingMs / timeLimitMs, 0, 1);
  }

  return 0;
}

function isPotionQuestionTimerDanger() {
  const timeLimitMs = state.potion.session.config.questionTimeLimitSec * 1000;

  if (state.potion.phase === "checking" && state.potion.feedback) {
    const remainingMs = state.potion.feedback.timedOut
      ? 0
      : Math.max(timeLimitMs - state.potion.feedback.responseTimeMs, 0);
    return (
      remainingMs > 0 && remainingMs <= POTION_TIMER_DANGER_THRESHOLD_SEC * 1000
    );
  }

  if (state.potion.phase !== "playing" || !state.potion.questionStartedAtMs) {
    return false;
  }

  const remainingMs = Math.max(
    timeLimitMs - (Date.now() - state.potion.questionStartedAtMs),
    0,
  );
  return (
    remainingMs > 0 && remainingMs <= POTION_TIMER_DANGER_THRESHOLD_SEC * 1000
  );
}

function syncPotionQuestionTimerUi() {
  if (
    !rootElement ||
    state.route !== "/games/potion" ||
    state.potion.phase !== "playing"
  ) {
    return;
  }

  const timerFillElement = rootElement.querySelector(
    ".potion-question-card__timer-fill",
  );
  if (timerFillElement) {
    timerFillElement.style.transform = `scaleX(${getPotionQuestionTimeRatio()})`;
    timerFillElement.classList.toggle(
      "is-danger",
      isPotionQuestionTimerDanger(),
    );
  }

  const countdownElement = rootElement.querySelector(
    ".potion-question-card__countdown",
  );
  if (countdownElement) {
    countdownElement.textContent = String(getPotionTimerDisplayValue());
  }
}

function syncPotionIntroUi() {
  if (
    !rootElement ||
    state.route !== "/games/potion" ||
    state.potion.phase !== "tutorial"
  ) {
    return;
  }

  const progressFillElement = rootElement.querySelector(
    ".tutorial-progress__fill",
  );
  if (progressFillElement) {
    progressFillElement.style.transform = `scaleX(${getPotionIntroProgressRatio()})`;
  }

  const countdownElement = rootElement.querySelector(
    ".potion-tutorial-card__countdown",
  );
  if (countdownElement) {
    countdownElement.textContent = getPotionIntroCountdownText();
  }
}

function schedulePotionIntroAnimation() {
  if (
    !rootElement ||
    state.route !== "/games/potion" ||
    state.potion.phase !== "tutorial"
  ) {
    return;
  }

  const animate = () => {
    if (state.route !== "/games/potion" || state.potion.phase !== "tutorial") {
      timers.introAnimationFrame = null;
      return;
    }

    const remainingMs = getPotionIntroRemainingMs();
    if (remainingMs <= 0) {
      timers.introAnimationFrame = null;
      startPotionGame();
      return;
    }

    syncPotionIntroUi();
    timers.introAnimationFrame = window.requestAnimationFrame(animate);
  };

  timers.introAnimationFrame = window.requestAnimationFrame(animate);
}

function getPotionIntroRemainingMs() {
  return Math.max(state.potion.introEndsAtMs - Date.now(), 0);
}

function getPotionIntroProgressRatio() {
  const totalIntroMs = state.potion.session.config.introAutoStartSec * 1000;
  return clamp(1 - getPotionIntroRemainingMs() / totalIntroMs, 0, 1);
}

function getPotionIntroCountdownText() {
  const remainingSeconds = Math.max(
    Math.ceil(getPotionIntroRemainingMs() / 1000),
    0,
  );
  return `${remainingSeconds}초가 지나면 자동으로 시작됩니다.`;
}

function schedulePotionQuestionTimerAnimation() {
  if (
    !rootElement ||
    state.route !== "/games/potion" ||
    state.potion.phase !== "playing"
  ) {
    return;
  }

  const animate = () => {
    if (state.route !== "/games/potion" || state.potion.phase !== "playing") {
      timers.questionAnimationFrame = null;
      return;
    }

    syncPotionQuestionTimerUi();
    timers.questionAnimationFrame = window.requestAnimationFrame(animate);
  };

  timers.questionAnimationFrame = window.requestAnimationFrame(animate);
}

function completePotionExperience() {
  navigate("/results");
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
        <button class="secondary-button" data-action="navigate" data-route="/results">연습 기록</button>
        <button class="secondary-button" data-action="navigate" data-route="/">홈</button>
      </div>
    </header>
  `;
}

function renderPotionStatusBar(currentQuestion) {
  const completed = state.potion.session.completedQuestionCount;
  const total = state.potion.session.config.sessionQuestionCount;
  const progressPercent = (completed / total) * 100;
  const timeLimitMs = state.potion.session.config.questionTimeLimitSec * 1000;
  const remainingMs = getPotionVisibleRemainingMs(timeLimitMs);

  return `
    <section class="status-panel">
      <div class="status-panel__progress">
        <div class="status-panel__meta">
          <span>문항 ${Math.min(completed + 1, total)} / ${total}</span>
          <span>남은 문항 ${currentQuestion?.questionsRemainingIncludingCurrent ?? 0}</span>
        </div>
        <div class="progress-track" aria-hidden="true">
          <span class="progress-track__fill" style="width:${progressPercent}%"></span>
        </div>
      </div>
      ${renderCountdownTimer(remainingMs)}
    </section>
  `;
}

function getPotionVisibleRemainingMs(timeLimitMs) {
  if (state.potion.phase === "tutorial") {
    return Math.max(state.potion.introEndsAtMs - Date.now(), 0);
  }

  if (state.potion.phase === "checking") {
    return Math.max(
      (state.potion.checkingEndsAtMs ?? Date.now()) - Date.now(),
      0,
    );
  }

  if (state.potion.phase === "playing" && state.potion.questionStartedAtMs) {
    return Math.max(
      timeLimitMs - (Date.now() - state.potion.questionStartedAtMs),
      0,
    );
  }

  return timeLimitMs;
}

function renderCountdownTimer(remainingMs) {
  const remainingSeconds = Math.max(Math.ceil(remainingMs / 1000), 1);
  const label =
    state.potion.phase === "tutorial"
      ? "자동 시작"
      : state.potion.phase === "checking"
        ? "피드백"
        : "응답 시간";

  return `
    <div class="countdown-timer">
      <span class="countdown-timer__label">${label}</span>
      <strong class="countdown-timer__value">${remainingSeconds}</strong>
    </div>
  `;
}

function renderPotionBoard(currentQuestion) {
  const activeIngredientIds = new Set(
    currentQuestion?.combo?.ingredientIds ?? [],
  );

  return `
    <section class="alchemy-board">
      <div class="alchemy-board__header">
        <div>
          <p class="eyebrow">현재 조합</p>
          <h2>${renderComboTitle(currentQuestion)}</h2>
        </div>
        <p class="alchemy-board__hint">
          지금 보이는 조합이 어느 색으로 더 자주 제조되는지 판단하세요.
        </p>
      </div>
      <div class="ingredient-grid">
        ${DEFAULT_POTION_INGREDIENTS.map((ingredient) =>
          renderIngredientCard(
            ingredient,
            activeIngredientIds.has(ingredient.id),
          ),
        ).join("")}
      </div>
      ${renderTutorialOverlayIfNeeded()}
    </section>
  `;
}

function renderComboTitle(currentQuestion) {
  if (!currentQuestion?.combo) {
    return "세션 준비 중";
  }

  return currentQuestion.combo.ingredientLabels.join(" · ");
}

function renderIngredientCard(ingredient, isActive) {
  return `
    <article class="ingredient-card ${isActive ? "is-active" : ""} accent-${ingredient.accent}">
      <span class="ingredient-card__badge">${ingredient.label}</span>
      <div class="ingredient-card__glyph"></div>
      <strong>${isActive ? "이번 조합에 포함" : "대기 중"}</strong>
    </article>
  `;
}

function renderTutorialOverlayIfNeeded() {
  if (state.potion.phase !== "tutorial") {
    return "";
  }

  const remainingMs = Math.max(state.potion.introEndsAtMs - Date.now(), 0);
  const remainingSeconds = Math.max(Math.ceil(remainingMs / 1000), 0);

  return `
    <div class="start-overlay">
      <div class="start-overlay__panel">
        <p class="eyebrow">Start Overlay</p>
        <h3>안내를 읽은 뒤 자동으로 시작됩니다</h3>
        <p>
          같은 조합이라도 실제 결과는 달라질 수 있습니다. 더 높은 확률의 약 색을
          고르는 연습이라는 점만 유지합니다.
        </p>
        <div class="start-overlay__countdown">
          <span>자동 시작까지</span>
          <strong>${remainingSeconds}초</strong>
        </div>
        <button class="primary-button" data-action="start-potion-now">
          지금 시작
        </button>
      </div>
    </div>
  `;
}

function renderPotionActionArea() {
  const isDisabled = state.potion.phase !== "playing";

  return `
    <section class="answer-panel">
      <button
        class="answer-button answer-button--blue"
        data-action="potion-answer"
        data-color="blue"
        ${isDisabled ? "disabled" : ""}
      >
        파란 약
      </button>
      <button
        class="answer-button answer-button--red"
        data-action="potion-answer"
        data-color="red"
        ${isDisabled ? "disabled" : ""}
      >
        빨간 약
      </button>
    </section>
  `;
}

function renderPotionFeedback() {
  const { feedback, phase } = state.potion;

  if (!feedback) {
    return `
      <section class="feedback-panel">
        <p class="feedback-panel__label">즉시 피드백</p>
        <p class="feedback-panel__body">
          선택 후 실제 제조 결과 색이 바로 표시됩니다.
        </p>
      </section>
    `;
  }

  const resultTone =
    feedback.visibleResult === "success" ? "is-success" : "is-failure";
  const resultLabel = feedback.timedOut
    ? "시간 초과"
    : feedback.visibleResult === "success"
      ? "선택 성공"
      : "선택 실패";

  return `
    <section class="feedback-panel ${resultTone}">
      <p class="feedback-panel__label">즉시 피드백</p>
      <div class="feedback-panel__body">
        <strong>${resultLabel}</strong>
        <span>실제 제조 결과: ${feedback.actualColor === "blue" ? "파란 약" : "빨간 약"}</span>
        <span>
          응답 시간:
          ${feedback.timedOut ? "초과" : `${(feedback.responseTimeMs / 1000).toFixed(2)}초`}
        </span>
        <span>
          다음 문항까지 ${phase === "checking" ? "짧게" : "완료"} 대기
        </span>
      </div>
    </section>
  `;
}

function renderPotionRulesPanel(resultSummary) {
  return `
    <section class="side-panel">
      <div class="side-panel__section">
        <p class="side-panel__label">현재 확인된 규칙</p>
        <ul class="rule-list">
          ${POTION_FACTS.map((fact) => `<li>${fact}</li>`).join("")}
        </ul>
      </div>
      <div class="side-panel__section">
        <p class="side-panel__label">MVP 가정과 고지</p>
        <ul class="rule-list rule-list--muted">
          ${POTION_UNVERIFIED.map((fact) => `<li>${fact}</li>`).join("")}
        </ul>
      </div>
      <div class="side-panel__section">
        <p class="side-panel__label">최근 연습</p>
        ${
          resultSummary
            ? `
              <div class="mini-stat">
                <span>최근 점수</span>
                <strong>${formatScore(resultSummary.latest.practiceScore)}</strong>
              </div>
              <div class="mini-stat">
                <span>최고 점수</span>
                <strong>${formatScore(resultSummary.best.practiceScore)}</strong>
              </div>
              <div class="mini-stat">
                <span>마지막 플레이</span>
                <strong>${formatDateTime(resultSummary.latest.playedAt)}</strong>
              </div>
            `
            : `<p class="empty-note">아직 저장된 마법약 연습 기록이 없습니다.</p>`
        }
      </div>
    </section>
  `;
}

function renderPotionFinishedState(resultSummary) {
  const summary = state.potion.session.summary;
  const metrics = summary.metrics;

  return `
    <section class="result-summary">
      <div class="result-summary__hero">
        <p class="eyebrow">Result Summary</p>
        <h2>마법약 만들기 과제를 완료했어요</h2>
        <p>
          아래 값은 공식 점수가 아니라 연습 점수입니다. 같은 조합을 얼마나 빠르게 학습하고
          회복했는지 보기 위한 proxy 지표입니다.
        </p>
      </div>
      <div class="result-summary__grid">
        ${renderMetricCard("연습 점수", formatScore(summary.practiceScore))}
        ${renderMetricCard("정확도", formatPercent(summary.practiceAccuracy))}
        ${renderMetricCard("완료 문항", `${state.potion.session.completedQuestionCount} / ${state.potion.session.config.sessionQuestionCount}`)}
        ${renderMetricCard("플레이 시간", formatDuration(computeDurationMs(state.potion.session)))}
        ${renderMetricCard("우세 색 선택률", formatPercent(metrics.dominantChoiceRate))}
        ${renderMetricCard("반응 속도 지표", formatPercent(metrics.responseSpeedScore))}
        ${renderMetricCard("학습 속도", formatPercent(metrics.learningSpeed))}
        ${renderMetricCard("회복률", formatPercent(metrics.recoveryRate))}
      </div>
      <div class="result-summary__actions">
        <button class="primary-button" data-action="restart-potion">다시 하기</button>
        <button class="secondary-button" data-action="navigate" data-route="/results">연습 기록 보기</button>
        <button class="secondary-button" data-action="navigate" data-route="/">홈으로</button>
      </div>
      ${
        resultSummary
          ? `
            <p class="result-summary__footnote">
              이번 결과가 저장되었습니다. 마지막 기록 시각: ${formatDateTime(resultSummary.latest.playedAt)}
            </p>
          `
          : ""
      }
    </section>
  `;
}

function renderMetricCard(label, value) {
  return `
    <article class="metric-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `;
}

function renderResultsPage(resultsSummary) {
  const latestResult = state.results[0] ?? null;
  const bestResult = getBestPracticeResult(state.results);

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
            ${renderResultsSidebarStat("저장된 세션", `${state.results.length}개`)}
            ${renderResultsSidebarStat(
              "최근 플레이",
              latestResult ? formatDateTime(latestResult.playedAt) : "-",
            )}
            ${renderResultsSidebarStat(
              "최고 연습 점수",
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
              data-route="/games/potion"
            >
              마법약 만들기
            </button>
            <button
              type="button"
              class="results-stage__secondary-action"
              data-action="navigate"
              data-route="/"
            >
              메인으로
            </button>
            <button
              type="button"
              class="results-stage__ghost-action"
              data-action="clear-results"
              ${state.results.length > 0 ? "" : "disabled"}
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
              <p>최근 점수, 최고 점수, 마지막 플레이 시각을 빠르게 비교할 수 있습니다.</p>
            </div>
          </div>
          <div class="results-stage__grid">
            ${renderResultsStageCard(GAME_META.potion, resultsSummary.potion)}
            ${renderResultsStageCard(GAME_META.sequence, resultsSummary.sequence)}
          </div>
          <section class="results-log" aria-labelledby="results-log-title">
            <div class="results-log__header">
              <div>
                <p class="results-stage__eyebrow">Recent Sessions</p>
                <h2 id="results-log-title">최근 저장 기록</h2>
              </div>
              <span class="results-log__count">${state.results.length}건</span>
            </div>
            ${
              state.results.length > 0
                ? `
                  <div class="results-log__list">
                    ${state.results.map((result, index) => renderResultsLogRow(result, index)).join("")}
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

function renderResultsStageCard(game, summary) {
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
                ? "아직 저장된 기록이 없습니다. 첫 플레이를 완료하면 최근 점수와 마지막 플레이가 여기에 정리됩니다."
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

function renderResultsLogRow(result, index) {
  return `
    <article class="results-log-row">
      <div class="results-log-row__primary">
        <span class="results-log-row__index">${String(index + 1).padStart(2, "0")}</span>
        <div>
          <p class="results-log-row__title">${GAME_META[result.gameId]?.title ?? result.gameId}</p>
          <p class="results-log-row__time">${formatDateTime(result.playedAt)}</p>
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

function renderSequencePage(resultSummary) {
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
        <button class="primary-button" data-action="navigate" data-route="/games/potion">
          마법약 만들기 열기
        </button>
      </div>
    </section>
  `;
}

function getCurrentRoute() {
  if (typeof window === "undefined") {
    return "/";
  }

  const hash = window.location.hash.replace(/^#/, "");
  return hash || "/";
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatPercent(value) {
  return `${Math.round((value ?? 0) * 100)}%`;
}

function formatScore(value) {
  return `${roundNumber(value ?? 0, 1).toFixed(1)}점`;
}

function formatDuration(durationMs) {
  const totalSeconds = Math.max(Math.round((durationMs ?? 0) / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}분 ${String(seconds).padStart(2, "0")}초`;
}

function roundNumber(value, decimals) {
  const multiplier = 10 ** decimals;
  return Math.round((value ?? 0) * multiplier) / multiplier;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  initApp();
}
