import { GAME_META } from "./game-meta.mjs";

export const POTION_FACTS = [
  "4개의 재료 조합이 총 100번 제시됩니다.",
  "현재 조합에서 더 높은 확률로 제조될 약 색을 선택합니다.",
  "같은 조합이라도 실제 결과는 달라질 수 있습니다.",
  "같은 조합의 누적 결과가 동점이면 그 문항은 연습 점수 집계에서 제외됩니다.",
  "문항마다 즉시 결과 피드백이 표시됩니다.",
  "문항당 응답 제한시간은 3초입니다.",
];

export const POTION_UNVERIFIED = [
  "조합별 실제 확률표는 공개 근거가 없어 MVP 가정값으로 처리합니다.",
  "아래 결과는 공식 점수가 아니라 연습 점수입니다.",
];

export const DEFAULT_HOME_STAGE_DETAIL_TAB_ID = "overview";

export const POTION_SETTING_DEFINITIONS = Object.freeze({
  sessionQuestionCount: Object.freeze({
    label: "문항 수",
    min: 40,
    max: 100,
    step: 1,
    unit: "문항",
    description: "문항 수가 많을 수록 난이도가 더 어려워 집니다.",
  }),
  questionTimeLimitSec: Object.freeze({
    label: "응답 시간",
    min: 3,
    max: 10,
    step: 1,
    unit: "초",
    description: "속도 점수 구간도 남은 시간 비율에 맞춰 함께 늘어납니다.",
  }),
});

export function getPotionStageDetailContent(config) {
  return {
    meta: [
      GAME_META.potion.category,
      `총 ${config.sessionQuestionCount}문항`,
      `문항당 ${config.questionTimeLimitSec}초`,
    ],
    tabs: [
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
          `총 ${config.sessionQuestionCount}문항이 순차적으로 제시됩니다.`,
          `각 문항은 ${config.questionTimeLimitSec}초 안에 응답해야 합니다.`,
          "문항마다 즉시 결과 피드백이 제공됩니다.",
          "반복 조합의 누적 경향을 학습하는 것이 가장 중요합니다.",
        ],
      },
      {
        id: "settings",
        label: "게임 설정",
        title: "연습할 세션 길이와 제한 시간을 조정합니다",
        kind: "settings",
        paragraphs: [
          "설정이 달라지면 연습 점수 비교는 같은 문항 수와 같은 제한 시간 기록끼리만 묶입니다.",
        ],
      },
    ],
  };
}
