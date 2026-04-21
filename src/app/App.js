import React, { useEffect, useState } from "react";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { TopNav } from "./components/TopNav.js";
import { HomeRoute } from "./pages/HomeRoute.js";
import { PotionRoute } from "./pages/PotionRoute.js";
import { ResultsRoute } from "./pages/ResultsRoute.js";
import { SequenceRoute } from "./pages/SequenceRoute.js";
import {
  clearPracticeResults,
  loadPracticeResults,
  summarizeResultsByGame,
} from "../web/storage.mjs";
import {
  createDefaultPotionSettings,
  normalizePotionSettings,
} from "../web/potion/state.mjs";
import { ROUTES } from "../web/shared/routes.mjs";

const h = React.createElement;

const FRAMELESS_ROUTE_CLASS = Object.freeze({
  [ROUTES.home]: "app-shell--home",
  [ROUTES.potion]: "app-shell--potion",
  [ROUTES.results]: "app-shell--results",
});

export function App() {
  return h(HashRouter, null, h(AppShell));
}

function AppShell() {
  const location = useLocation();
  const [results, setResults] = useState(() => loadPracticeResults());
  const [potionSettings, setPotionSettings] = useState(() =>
    createDefaultPotionSettings(),
  );
  const resultsSummary = summarizeResultsByGame(results, {
    potionConfig: potionSettings,
  });
  const framelessClass = FRAMELESS_ROUTE_CLASS[location.pathname] ?? null;

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    function handleStorage() {
      setResults(loadPracticeResults());
    }

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    document.body.dataset.route = getBodyRouteName(location.pathname);
    return () => {
      delete document.body.dataset.route;
    };
  }, [location.pathname]);

  function handlePotionSettingsChange(nextSettings) {
    setPotionSettings(normalizePotionSettings(nextSettings));
  }

  function handleResultsChange(nextResults) {
    setResults(Array.isArray(nextResults) ? nextResults : loadPracticeResults());
  }

  function handleClearResults() {
    clearPracticeResults();
    setResults([]);
  }

  const routeElements = h(
    Routes,
    null,
    h(Route, {
      path: ROUTES.home,
      element: h(HomeRoute, {
        potionSettings,
        onPotionSettingsChange: handlePotionSettingsChange,
      }),
    }),
    h(Route, {
      path: ROUTES.potion,
      element: h(PotionRoute, {
        potionSettings,
        onResultsChange: handleResultsChange,
      }),
    }),
    h(Route, {
      path: ROUTES.results,
      element: h(ResultsRoute, {
        results,
        resultsSummary,
        potionSettings,
        onClearResults: handleClearResults,
      }),
    }),
    h(Route, {
      path: ROUTES.sequence,
      element: h(SequenceRoute, {
        resultSummary: resultsSummary.sequence,
      }),
    }),
    h(Route, {
      path: "*",
      element: h(Navigate, {
        replace: true,
        to: ROUTES.home,
      }),
    }),
  );

  if (framelessClass) {
    return h(
      "div",
      {
        className: `app-shell ${framelessClass}`,
      },
      routeElements,
    );
  }

  return h(
    "div",
    {
      className: "app-shell",
    },
    h(TopNav, { currentRoute: location.pathname }),
    h(
      "main",
      {
        className: "page-frame",
      },
      routeElements,
    ),
  );
}

function getBodyRouteName(pathname) {
  if (pathname === ROUTES.home) {
    return "home";
  }

  if (pathname === ROUTES.potion) {
    return "potion";
  }

  if (pathname === ROUTES.results) {
    return "results";
  }

  return "default";
}
