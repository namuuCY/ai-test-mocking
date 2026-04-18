export type PotionColor = "blue" | "red";

export type PotionComboSizeKey = "single" | "pair" | "triple";

export type PotionIngredient = {
  id: string;
  label: string;
};

export type PotionCombo = {
  id: string;
  size: number;
  sizeKey?: PotionComboSizeKey;
  ingredientIds?: string[];
  ingredientLabels?: string[];
};

export type PotionGameConfig = {
  introAutoStartSec: number;
  sessionQuestionCount: number;
  questionTimeLimitSec: number;
  ingredientCount: number;
  comboCountTotal: number;
  comboCountBySize: {
    single: number;
    pair: number;
    triple: number;
  };
  dominantColorProbability: number;
  dominantColorAssignment: "per-session";
  feedbackMode: "immediate";
  timeoutVisibleResult: "failure";
  timeoutSpeedScore: number;
  responseOptions: ["blue", "red"] | ["red", "blue"];
  timeScoreBands: Array<{
    remainingRatioMin: number;
    scoreRatio: number;
  }>;
  scoreWeights: {
    normalizedHitRate: number;
    dominantChoiceRate: number;
    responseSpeedScore: number;
    learningSpeed: number;
    recoveryRate: number;
  };
  learningExposureScoreMap: Record<number, number>;
};

export type PotionQuestionResult = {
  comboId: string;
  dominantColor: PotionColor;
  actualColor: PotionColor;
  selectedColor: PotionColor | null;
  timedOut?: boolean;
  responseTimeMs?: number;
  remainingTimeRatio?: number;
};

export type PotionPracticeMetrics = {
  actualHitRate: number;
  normalizedHitRate: number;
  dominantChoiceRate: number;
  responseSpeedScore: number;
  learningSpeed: number;
  recoveryRate: number;
};

export type PotionPracticeComboBreakdown = {
  comboId: string;
  exposureCount: number;
  dominantChoiceCount: number;
  visibleSuccessCount: number;
  visibleFailureCount: number;
  learnedAtExposure: number | null;
  learningScore: number;
  recoveryOpportunities: number;
  recoverySuccesses: number;
  recoveryFailures: number;
  hasPendingRecovery: boolean;
};

export type PotionPracticeQuestionBreakdown = {
  questionNumber: number;
  comboId: string;
  comboExposureNumber: number;
  selectedColor: PotionColor | null;
  actualColor: PotionColor;
  dominantColor: PotionColor;
  timedOut: boolean;
  selectedDominant: boolean;
  visibleResult: "success" | "failure";
  speedBandScore: number;
  recoveryResolvedAs: "success" | "failure" | null;
  recoveryOpportunityCreated: boolean;
};

export type PotionPracticeSummary = {
  questionCount: number;
  expectedQuestionCount: number;
  practiceAccuracy: number;
  practiceScore: number;
  visibleSuccessCount: number;
  dominantChoiceCount: number;
  recoveryOpportunities: number;
  recoverySuccesses: number;
  metrics: PotionPracticeMetrics;
  comboBreakdown: PotionPracticeComboBreakdown[];
  questionBreakdown: PotionPracticeQuestionBreakdown[];
};

export type PotionQuestionPlanEntry = {
  questionNumber: number;
  comboId: string;
};

export type PotionSession = {
  id: string;
  gameId: "potion";
  status: "ready" | "playing" | "finished";
  createdAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  config: PotionGameConfig;
  comboCatalog: PotionCombo[];
  dominantColorByComboId: Record<string, PotionColor>;
  questionPlan: PotionQuestionPlanEntry[];
  currentQuestionIndex: number;
  completedQuestionCount: number;
  questionResults: PotionQuestionResult[];
  practiceScore: number | null;
  practiceAccuracy: number | null;
  summary: PotionPracticeSummary | null;
};

export type PotionCurrentQuestion = {
  questionNumber: number;
  comboId: string;
  combo: PotionCombo | null;
  timeLimitSec: number;
  questionsRemainingIncludingCurrent: number;
};
