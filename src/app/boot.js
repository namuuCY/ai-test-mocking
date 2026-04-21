import React from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.js";

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error('Expected an element with id "app".');
}

createRoot(rootElement).render(React.createElement(App));
