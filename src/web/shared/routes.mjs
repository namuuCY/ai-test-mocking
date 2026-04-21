export const ROUTES = Object.freeze({
  home: "/",
  potion: "/games/potion",
  sequence: "/games/sequence",
  results: "/results",
});

export function getCurrentRoute() {
  if (typeof window === "undefined") {
    return ROUTES.home;
  }

  const hash = window.location.hash.replace(/^#/, "");
  return hash || ROUTES.home;
}

export function navigate(route) {
  if (typeof window === "undefined") {
    return;
  }

  window.location.hash = route;
}
