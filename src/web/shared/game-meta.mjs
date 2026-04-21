import { ROUTES } from "./routes.mjs";

export const GAME_META = {
  potion: {
    id: "potion",
    title: "마법약 만들기",
    description:
      "반복되는 재료 조합의 결과 경향을 학습해 더 높은 확률의 약 색을 고르는 과제",
    category: "학습능력",
    route: ROUTES.potion,
    implemented: true,
  },
  sequence: {
    id: "sequence",
    title: "도형 순서 기억하기",
    description: "2-back / 3-back 규칙을 기반으로 판단하는 작업기억 과제",
    category: "작업기억",
    route: ROUTES.sequence,
    implemented: false,
  },
};

export const ASSESSMENT_STAGE_GAMES = [
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
    route: ROUTES.potion,
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
