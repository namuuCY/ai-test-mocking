import React from "react";
import { useNavigate } from "react-router-dom";

import { GAME_META } from "../../web/shared/game-meta.mjs";
import { ROUTES } from "../../web/shared/routes.mjs";

const h = React.createElement;

const NAV_ITEMS = Object.freeze([
  {
    label: "홈",
    route: ROUTES.home,
  },
  {
    label: GAME_META.potion.title,
    route: GAME_META.potion.route,
  },
  {
    label: "연습 기록",
    route: ROUTES.results,
  },
]);

export function TopNav({ currentRoute }) {
  const navigate = useNavigate();

  return h(
    "header",
    {
      className: "top-nav",
    },
    h(
      "button",
      {
        className: "brand-mark",
        onClick: () => navigate(ROUTES.home),
        type: "button",
      },
      h("span", {
        "aria-hidden": "true",
        className: "brand-mark__dot",
      }),
      h("span", null, "AI 전략게임 연습"),
    ),
    h(
      "nav",
      {
        "aria-label": "주요 탐색",
        className: "top-nav__links",
      },
      NAV_ITEMS.map((item) =>
        h(
          "button",
          {
            className: `nav-link ${currentRoute === item.route ? "is-active" : ""}`.trim(),
            key: item.route,
            onClick: () => navigate(item.route),
            type: "button",
          },
          item.label,
        ),
      ),
    ),
  );
}
