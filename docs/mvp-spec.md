# MVP Spec

## 1. Product Goal

이 프로젝트의 1차 목표는 `마법약 만들기`, `도형 순서 기억하기` 두 게임을 중심으로, 현재 공개적으로 관찰 가능한 Jobda 게임 흐름을 최대한 정확하게 재현하는 연습용 반응형 웹을 만드는 것이다.

배포 대상은 정적 호스팅 기반의 GitHub Pages다.

## 2. Evidence Standard

이번 문서는 임의 규칙을 제안하지 않는다.

- 게임 규칙, 라운드 구성, 입력 방식, 피드백 방식은 공개적으로 검증 가능한 근거만 반영한다.
- 공개 근거가 없는 항목은 `미확인`으로 남긴다.
- 특히 `점수 계산식`, `가중치`, `정규화 방식`, `숨겨진 패턴 분석 로직`은 공개 자료만으로는 확정하지 않는다.

즉, 이 문서는 `정확한 동일성 목표`를 유지하되, 현재 시점에서 공개적으로 확인 가능한 사실과 아직 확보되지 않은 사실을 분리한 스펙이다.

## 3. Current Public Facts

현재 공개 자료에서 확인되는 사실은 아래와 같다.

- Jobda 측 튜토리얼/게이트 페이지는 연습 환경을 실전과 동일한 환경으로 안내한다.
- Jobda 계열 공개 자료와 연계 페이지에서는 전략게임이 총 9종으로 안내된다.
- 공개 자료 기준 전략게임은 각 게임당 `4분` 제한으로 소개된다.
- `마법약 만들기`는 `학습능력` 계열 게임으로 분류된다.
- `도형 순서 기억하기`는 `작업기억` 계열 게임으로 분류된다.
- 공식/준공식 설명에서는 게임 평가지표가 단순 정오답만이 아니라 `반응 시간`, `집중 유지`, `실수 후 회복`, `학습 속도`, `응시 패턴`까지 포함된다고 안내한다.

## 4. Product Scope

MVP는 아래 범위까지만 포함한다.

- `/` 홈
- `/games/potion` 마법약 만들기
- `/games/sequence` 도형 순서 기억하기
- `/results` 연습 기록

GitHub Pages 호환성을 위해 `HashRouter`를 사용한다.

## 5. Product Guardrails

이 프로젝트는 아래 원칙을 유지한다.

- 공식 서비스로 오인될 수 있는 브랜딩, 문구, 자산은 사용하지 않는다.
- 공개적으로 확인되지 않은 규칙을 임의로 만들어 `Jobda와 동일`하다고 표기하지 않는다.
- `공식 점수`가 아닌 경우 반드시 `연습 기록` 또는 `연습 지표`로 구분한다.

## 6. Shared UX Flow

### Home

- 메인 페이지는 밝은 회백색 배경 위에 큰 흰색 보드 1장을 중심으로 배치한다.
- 보드 좌측에는 `성향파악`, `게임`, `영상면접` 섹션 라벨이 세로로 놓이고, 현재 위치인 `게임`만 진하게 표시한다.
- 보드 우측 `게임` 영역에는 총 `9개` 게임 카드가 `3 x 3` 그리드로 노출된다.
- 카드에는 게임명, 역량 분류, 제한 시간, 난이도를 함께 표시한다.
- 현재 연습 웹에서는 사용자 요청에 따라 `마법약 만들기`만 활성화하고, 나머지 8개 카드는 소개용 비활성 상태로 유지한다.

### Game Flow

1. 게임 소개
2. 현재 확인된 규칙 요약
3. 플레이 시작
4. 라운드 또는 시도 진행
5. 결과 요약
6. 다시 하기 또는 홈 이동

### Results

- 게임별 최근 기록
- 게임별 최고 연습 기록
- 마지막 플레이 시각

## 7. Shared Technical Framework

### Shared Components

- `GameShell`
- `GameHeader`
- `StartOverlay`
- `CountdownTimer`
- `ResultSummary`
- `useGameSession`
- `localStorage` 저장 유틸

### Shared Session State

- `idle`
- `tutorial`
- `ready`
- `playing`
- `checking`
- `finished`

### Shared Session Data

- `gameId`
- `startedAt`
- `endedAt`
- `durationMs`
- `practiceScore`
- `practiceAccuracy`
- `roundsCompleted`

`practiceScore`는 실제 Jobda 공식 점수와 동일하다고 가정하지 않는다.

## 8. Game Spec: 마법약 만들기

### 8.1 Publicly Verified or Repeatedly Observed

공개 자료와 다수의 후기/분석 글에서 교집합으로 확인되는 내용은 아래와 같다.

- 이 게임은 `학습능력` 계열로 분류된다.
- 제한 시간은 `4분`으로 소개된다.
- 재료는 기본적으로 `4종` 조합을 기반으로 설명된다.
- 사용자 제공 실제 플레이 영상에서는 시작 전 안내 화면이 존재하고, 약 `9초` 후 자동 시작된다.
- 사용자 제공 실제 플레이 영상의 안내 문구에는 `4개의 재료 조합이 총 100번 제시됩니다`라고 표시된다.
- 사용자는 현재 제시된 재료 조합을 보고 `빨간 약`과 `파란 약` 중 어느 쪽이 더 높은 확률인지 판단하는 구조로 알려져 있다.
- 사용자 제공 실제 플레이 영상의 안내 문구에는 `같은 재료 조합이라도 경우에 따라 결과가 달라지니 더 높은 확률로 제조될 마법약을 선택`하라고 표시된다.
- 공개 후기들에서는 가능한 재료 조합이 총 `14개`라고 반복적으로 설명한다.
- 이 14개는 보통 `1개 조합 4종`, `2개 조합 6종`, `3개 조합 4종`으로 해석된다.
- 사용자는 반복해서 등장하는 조합과 결과 피드백을 통해 어떤 조합이 어느 색으로 더 잘 나오는지 학습해야 하는 게임으로 설명된다.
- 즉, 핵심은 `순서 조합`보다 `조합별 결과 경향 학습`에 더 가깝게 묘사된다.
- 사용자 제공 실제 플레이 영상에서는 정답/오답 피드백이 문항마다 즉시 노출된다.
- 사용자 제공 실제 플레이 영상에서는 `문항 번호 + 남은 문항 수 = 100`이 일관되게 확인된다.
- 사용자 피드백 기준 각 문항의 응답 제한시간은 `3초`다.
- 우측 상단의 `1 / 2 / 3` 숫자는 단계 표시가 아니라 현재 문항의 `잔여 응답 시간`이다.
- 사용자 제공 실제 플레이 영상에서는 종료 시 `마법약 만들기 과제를 완료했어요` 완료 화면이 표시된다.

### 8.2 Officially Unverified Items

현재 공개 자료만으로는 아래 항목을 확정할 수 없다.

- 공식 서비스가 실제로도 조합별 우세 색상 확률을 `80%`로 쓰는지
- 각 조합의 우세 색상이 세션마다 어떤 방식으로 재배치되는지
- 공식 점수 계산에 정확도 외에 반응 시간이 어떻게 반영되는지
- 공식 서비스가 실수 후 회복이나 학습 속도를 어떤 방식으로 계량하는지

### 8.3 MVP Configurable Parameters

MVP에서는 아래 수치형 값을 모두 설정값으로 분리한다.

- `introAutoStartSec = 9`
- `sessionQuestionCount = 100`
- `questionTimeLimitSec = 3`
- `ingredientCount = 4`
- `comboCountTotal = 14`
- `comboCountBySize = { single: 4, pair: 6, triple: 4 }`
- `responseOptions = ["blue", "red"]`
- `feedbackMode = "immediate"`
- `dominantColorProbability = 0.8`
- `dominantColorAssignment = "per-session"`
- `timeoutVisibleResult = "failure"`
- `timeoutSpeedScore = 0`
- `timeScoreBands = [{ remainingRatioMin: 0.4, scoreRatio: 1.0 }, { remainingRatioMin: 0.2, scoreRatio: 0.6 }, { remainingRatioMin: 0.1, scoreRatio: 0.3 }, { remainingRatioMin: 0.0, scoreRatio: 0.1 }]`
- `scoreWeights = { normalizedHitRate: 35, dominantChoiceRate: 25, responseSpeedScore: 20, learningSpeed: 10, recoveryRate: 10 }`
- `learningExposureScoreMap = { 2: 1.0, 3: 0.8, 4: 0.6, 5: 0.4, 6: 0.2 }`

설계 의도는 아래와 같다.

- 각 조합은 해당 세션 안에서 `우세 색상` 하나를 가진다.
- 사용자는 실제 결과와 별개로 `우세 색상`을 학습해야 한다.
- 실제 결과는 우세 색상 기준 `80%` 확률로 발생한다.
- 나머지 `20%`는 소수 결과로 발생한다.

### 8.4 MVP Planning Rule

이 게임은 아래 기준으로만 설계한다.

- `4개 재료`
- `14개 조합`
- `100문항 고정 세션`
- `빨간 약 vs 파란 약 확률 판단`
- `피드백을 통한 조합 학습`
- `사전 안내 후 자동 시작`
- `문항별 즉시 피드백`
- `문항당 3초 제한시간`
- `4분 내외 세션`
- `세션별 우세 색상 확률 80%`

아래 항목은 구현 전에 반드시 추가 증거를 확보해야 한다.

- 조합별 확률 테이블
- 공식 결과 화면에 노출되는 게임 내 지표

### 8.5 UI Requirements

- 4개 재료를 명확히 구분하는 카드 또는 아이콘
- 현재 제시 조합 표시 영역
- `빨간 약` / `파란 약` 선택 버튼
- 현재까지의 진행 상태 표시
- 정답/오답 또는 결과 피드백 표시 영역

### 8.6 Practice Scoring Model

아래 점수식은 `공식 점수식`이 아니라 MVP용 `연습 점수`다.

#### Visible Question Result

- 사용자가 선택한 색과 실제 제조된 색이 같으면 `visible success`
- 다르면 `visible failure`
- 제한시간 초과면 `visible failure`

#### Speed Band Score

- 잔여 시간 비율이 `0.4` 이상이면 `1.0`
- 잔여 시간 비율이 `0.2` 이상이면 `0.6`
- 잔여 시간 비율이 `0.1` 이상이면 `0.3`
- 잔여 시간 비율이 `0` 초과이면 `0.1`
- 시간 초과면 `0`

#### Derived Metrics

- `actualHitRate = visibleSuccessCount / sessionQuestionCount`
- `normalizedHitRate = min(actualHitRate / dominantColorProbability, 1)`
- `dominantChoiceRate = dominantChoiceCount / sessionQuestionCount`
- `responseSpeedScore = average(speedBandScore)`
- `learningSpeed = average(comboLearningScore)`
- `recoveryRate = recoverySuccesses / max(recoveryOpportunities, 1)`

#### Learning Speed Definition

- 각 조합별로 사용자가 처음 `우세 색상`을 선택한 등장 차수를 기록한다.
- 첫 등장에서 맞힌 경우는 학습 점수에 포함하지 않고 `0`으로 둔다.
- 둘째 등장부터의 점수는 `learningExposureScoreMap`을 사용한다.
- 예: 어떤 조합에서 둘째 등장부터 우세 색상을 고르면 `1.0`, 셋째면 `0.8`, 넷째면 `0.6`
- 세션 종료까지 우세 색상 선택이 없으면 `0`

#### Recovery Definition

- 어떤 조합에서 `visible failure`가 발생하면 `recovery opportunity`가 1회 생성된다.
- 그 다음 같은 조합이 다시 등장했을 때 사용자가 `우세 색상`을 선택하면 `recovery success`로 본다.
- 다시 비우세 색상을 고르면 회복 실패로 본다.

#### Final Practice Score

```ts
practiceScore =
  35 * normalizedHitRate +
  25 * dominantChoiceRate +
  20 * responseSpeedScore +
  10 * learningSpeed +
  10 * recoveryRate;
```

이 점수는 `0~100` 범위의 연습 점수로 사용한다.

### 8.7 Engineering Note

이 게임은 단순 규칙 퍼즐 엔진보다 `조합-결과 매핑`과 `반복 학습 루프`가 핵심이다.

따라서 구현 우선순위는 아래와 같다.

1. 조합 생성기
2. 세션 내 확률 매핑 테이블
3. 답안 제출 및 피드백
4. 연습 점수 계산기
5. 연습 기록 저장

## 9. Game Spec: 도형 순서 기억하기

### 9.1 Publicly Verified or Repeatedly Observed

공개 자료와 후기/공략 글에서 반복적으로 확인되는 내용은 아래와 같다.

- 이 게임은 `작업기억` 계열로 분류된다.
- 제한 시간은 `4분`으로 소개된다.
- 공개 후기들에서는 이 게임이 `2개 라운드` 구조라고 설명한다.
- 1라운드는 현재 카드가 `두 번째 전` 카드와 같은지 다른지 판단하는 구조로 설명된다.
- 2라운드는 현재 카드가 `두 번째 전`, `세 번째 전`, 또는 `둘 다 아님` 중 어디에 해당하는지 판단하는 구조로 설명된다.
- 공개 공략 글에서는 실제 게임이 `5쌍`의 카드 또는 자극 묶음으로 진행된다고 설명한다.
- 핵심 과제는 단순 순서 재생이 아니라 `n-back` 계열의 시각 작업기억 과제에 가깝다.

### 9.2 What Is Not Publicly Verified Yet

현재 공개 자료만으로는 아래 항목을 확정할 수 없다.

- 각 라운드의 총 자극 수
- 각 자극의 노출 시간과 간격
- 자극 위치가 고정인지 셔플되는지
- 입력 허용 시간이 따로 존재하는지
- 오답 패널티 방식
- 공식 점수에 정확도와 반응 속도가 어떤 비율로 반영되는지

### 9.3 MVP Planning Rule

이 게임은 아래 기준으로만 설계한다.

- `2라운드` 구조
- 1라운드는 `2-back same/different`
- 2라운드는 `2-back / 3-back / neither`
- `4분 세션`
- 시각 작업기억 과제 중심 UI

아래 항목은 구현 전에 반드시 추가 증거를 확보해야 한다.

- 자극 수와 노출 시간
- 입력 타이밍 규칙
- 오답 처리 방식
- 결과 화면에 노출되는 공식 지표

### 9.4 UI Requirements

- 현재 도형 카드 또는 자극 표시 영역
- 선택지 버튼 영역
- 라운드 상태 표시
- 현재 자극 진행 수 표시
- 입력 잠금/허용 상태 표시

### 9.5 Engineering Note

이 게임은 일반적인 `Simon`식 순서 기억 게임과 다르다.

핵심은 아래 두 가지다.

- 순차 재생된 전체 시퀀스를 그대로 따라 누르는 구조가 아니다.
- 현재 자극을 이전 `n`번째 자극과 비교하는 `n-back` 판단 엔진이 필요하다.

따라서 `도형 순서 기억하기` 구현은 `시퀀스 재생기`보다 `n-back rule evaluator`를 기준으로 설계해야 한다.

## 10. Scoring and Evaluation Model

### 10.1 Publicly Disclosed

공개 자료 기준으로는 아래 요소가 평가에 사용된다고 안내된다.

- 정오답
- 반응 시간
- 집중 유지
- 실수 후 회복
- 학습 속도
- 응시 패턴 또는 비인지적 반응 특성

### 10.2 Not Publicly Disclosed

현재 공개적으로 확인되지 않는 항목은 아래와 같다.

- 게임별 점수 계산식
- 요소별 가중치
- 시간 보너스/감점 방식
- 오답 패널티 공식
- 지원 직무별 정규화 또는 보정 방식
- 최종 종합 점수와의 연결 방식

### 10.3 Product Rule

이 프로젝트에서는 아래 원칙을 따른다.

- 공개 근거가 없는 공식 점수식을 임의로 만들지 않는다.
- 공식 점수와 동일성이 검증되기 전까지 결과 페이지는 `연습 지표`와 `연습 점수`만 보여준다.
- 대체 점수식이 필요한 경우 `공식 점수`가 아니라 `proxy` 또는 `practice` 점수로 명시한다.
- `정확히 동일한 점수 계산`이 목표라면 별도의 권한 있는 자료 확보가 선행되어야 한다.

## 11. Research Backlog Required for Exact Parity

정확한 동일성 목표를 유지하려면 아래 자료가 추가로 필요하다.

- 실제 Jobda 세션 전체 화면 녹화
- 각 게임의 튜토리얼 문구
- 한 세션 내 총 문제 수 또는 자극 수
- 문제별 반응 시간 허용 범위
- 피드백 노출 방식
- 결과 화면 항목
- 반복 플레이 시 난수 시드 또는 확률표 변화 여부
- 공식 점수 산출 규칙 또는 충분한 관측 데이터

이 중 하나도 없이 `공식 점수 동일`을 선언하는 것은 현재 기준으로 불가능하다.

## 12. Data Model

### GameMeta

```ts
type GameMeta = {
  id: "potion" | "sequence";
  title: string;
  description: string;
  category: "learning" | "working-memory";
  sourceConfidence: "public-verified" | "observed-not-official";
};
```

### PracticeResult

```ts
type PracticeResult = {
  id: string;
  gameId: "potion" | "sequence";
  playedAt: string;
  practiceScore: number;
  practiceAccuracy: number;
  roundsCompleted: number;
  durationMs: number;
};
```

### PotionGameConfig

```ts
type PotionGameConfig = {
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
  responseOptions: ["blue", "red"];
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
```

## 13. Acceptance Criteria

### Product

- 홈에서 두 게임에 진입할 수 있다.
- 각 게임은 독립적으로 플레이 가능하다.
- 종료 후 결과가 저장된다.
- 결과 페이지에서 연습 기록을 볼 수 있다.
- 모바일과 데스크톱에서 플레이 가능하다.
- GitHub Pages에 정상 배포된다.

### Spec Integrity

- 공개 근거가 없는 규칙은 `미확인`으로 남겨 둔다.
- 임의 점수 공식을 공식 점수처럼 서술하지 않는다.
- 수치형 게임 파라미터는 문서와 코드에서 모두 `config`로 분리한다.
- `마법약 만들기`와 `도형 순서 기억하기`는 현재 공개 근거에 맞게 각각 `조합 학습형`, `n-back 판단형`으로 설계된다.

## 14. Immediate Next Tasks

다음 작업은 아래 순서가 맞다.

1. 실제 플레이 영상 또는 인증 가능한 캡처 자료 수집
2. 두 게임의 세션 단위 이벤트를 프레임 단위로 기록
3. 문서의 `미확인` 항목 해소
4. 그 다음에 화면 설계와 코드 구현 시작

## 15. Source Notes

이번 문서는 아래 공개 자료를 근거로 작성했다.

- Jobda 튜토리얼/게이트 페이지: [https://www.jobda.im/acc/gate](https://www.jobda.im/acc/gate)
- Jobda 계열 소개/트렌드 리포트 PDF: [https://www.jobda.im/hubfs/%EC%97%90%EC%9D%B4%EC%B9%98%EB%8B%B7%20AI%20%EC%B1%84%EC%9A%A9%20Trend%20Report.pdf](https://www.jobda.im/hubfs/%EC%97%90%EC%9D%B4%EC%B9%98%EB%8B%B7%20AI%20%EC%B1%84%EC%9A%A9%20Trend%20Report.pdf)
- Jobaba AI 역량검사 안내: [https://www.jobaba.net/guideAI/list.do](https://www.jobaba.net/guideAI/list.do)
- H.place AI 역량검사 소개: [https://contents.h.place/acca/labnote/4/ai-competency](https://contents.h.place/acca/labnote/4/ai-competency)
- 공개 후기/공략 예시 1: [https://the-greatman.tistory.com/entry/%EC%9E%A1%EB%8B%A4-%EC%97%AD%EB%9F%89%EA%B2%80%EC%82%AC-%ED%9B%84%EA%B8%B0](https://the-greatman.tistory.com/entry/%EC%9E%A1%EB%8B%A4-%EC%97%AD%EB%9F%89%EA%B2%80%EC%82%AC-%ED%9B%84%EA%B8%B0)
- 공개 공략 예시 2: [https://www.dapuleo.com/%EB%8F%84%ED%98%95-%EC%88%9C%EC%84%9C-%EA%B8%B0%EC%96%B5%ED%95%98%EA%B8%B0-ai-%EC%97%AD%EB%9F%89-%EA%B2%80%EC%82%AC-%EA%B2%8C%EC%9E%84/](https://www.dapuleo.com/%EB%8F%84%ED%98%95-%EC%88%9C%EC%84%9C-%EA%B8%B0%EC%96%B5%ED%95%98%EA%B8%B0-ai-%EC%97%AD%EB%9F%89-%EA%B2%80%EC%82%AC-%EA%B2%8C%EC%9E%84/)
