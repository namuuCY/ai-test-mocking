import test from "node:test";
import assert from "node:assert/strict";

import {
  POTION_SETTING_DEFINITIONS,
  getPotionStageDetailContent,
} from "../../src/web/shared/potion-content.mjs";
import { shouldResetPotionStateOnEntry } from "../../src/web/main.mjs";

test("potion stage drawer copy hides dominant-probability wording", () => {
  const detailContent = getPotionStageDetailContent({
    sessionQuestionCount: 70,
    questionTimeLimitSec: 8,
  });

  assert.deepEqual(detailContent.meta, ["학습능력", "총 70문항", "문항당 8초"]);

  const flowTab = detailContent.tabs.find((tab) => tab.id === "flow");
  const settingsTab = detailContent.tabs.find((tab) => tab.id === "settings");

  assert.deepEqual(flowTab.bullets, [
    "총 70문항이 순차적으로 제시됩니다.",
    "각 문항은 8초 안에 응답해야 합니다.",
    "문항마다 즉시 결과 피드백이 제공됩니다.",
    "반복 조합의 누적 경향을 학습하는 것이 가장 중요합니다.",
  ]);
  assert.equal(
    settingsTab.paragraphs[0],
    "설정이 달라지면 연습 점수 비교는 같은 문항 수와 같은 제한 시간 기록끼리만 묶입니다.",
  );
  assert.equal(
    POTION_SETTING_DEFINITIONS.sessionQuestionCount.description,
    "문항 수가 많을 수록 난이도가 더 어려워 집니다.",
  );

  const drawerText = JSON.stringify(detailContent);
  assert.equal(drawerText.includes("우세 확률"), false);
  assert.equal(drawerText.includes("현재 문항 수 기준"), false);
});

test("potion entry resets finished sessions but preserves active sessions unless explicitly restarted", () => {
  assert.equal(shouldResetPotionStateOnEntry(undefined, "finished"), true);
  assert.equal(shouldResetPotionStateOnEntry("auto", "finished"), true);
  assert.equal(shouldResetPotionStateOnEntry("auto", "tutorial"), false);
  assert.equal(shouldResetPotionStateOnEntry("auto", "playing"), false);
  assert.equal(shouldResetPotionStateOnEntry("auto", "checking"), false);
  assert.equal(shouldResetPotionStateOnEntry("fresh", "playing"), true);
});
