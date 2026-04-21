import { GAME_META } from "../shared/game-meta.mjs";
import { ROUTES } from "../shared/routes.mjs";

export function renderTopNav({ currentRoute }) {
  return `
    <header class="top-nav">
      <button class="brand-mark" data-action="navigate" data-route="${ROUTES.home}">
        <span class="brand-mark__dot"></span>
        <span>AI 전략게임 연습</span>
      </button>
      <nav class="top-nav__links" aria-label="주요 탐색">
        ${renderNavLink({ currentRoute, route: ROUTES.home, label: "홈" })}
        ${renderNavLink({
          currentRoute,
          route: GAME_META.potion.route,
          label: GAME_META.potion.title,
        })}
        ${renderNavLink({
          currentRoute,
          route: ROUTES.results,
          label: "연습 기록",
        })}
      </nav>
    </header>
  `;
}

function renderNavLink({ currentRoute, route, label }) {
  const isActive = currentRoute === route;
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
