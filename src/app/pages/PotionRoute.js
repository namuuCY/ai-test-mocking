import React from "react";

import { PotionGame } from "../features/potion/PotionGame.js";

const h = React.createElement;

export function PotionRoute({ potionSettings, onResultsChange }) {
  return h(PotionGame, {
    potionSettings,
    onResultsChange,
  });
}
