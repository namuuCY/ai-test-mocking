import React from "react";

import { PotionGameView } from "./PotionGameView.js";
import { usePotionGame } from "./usePotionGame.js";

const h = React.createElement;

export function PotionGame({ potionSettings, onResultsChange }) {
  const game = usePotionGame({ potionSettings, onResultsChange });

  return h(PotionGameView, game);
}
