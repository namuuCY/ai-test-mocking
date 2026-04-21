# React Migration Log

## Purpose

이 문서는 React 전환 작업의 현재 위치, 완료 항목, 다음 작업, 세션 간 handoff 메모를 저장하는 진행 로그다.

계획 자체는 [react-migration-plan.md](/Users/namucy/Develop/ai-test-mocking/docs/react-migration-plan.md)를 기준으로 하고, 이 문서는 `지금 어디까지 왔는지`를 기록한다.

## Usage Rule

- 다음 세션에서는 먼저 계획 문서를 읽고, 바로 이 로그를 읽는다.
- 작업이 끝날 때마다 최소한 `현재 phase`, `완료 항목`, `다음 작업`을 갱신한다.
- 긴 세션 메모를 채팅 히스토리에만 남기지 말고 이 문서에 압축해서 적는다.
- 작업이 중간에 막히면 `Blocked / Deferred Items` 섹션에 원인과 다음 재개 조건을 남긴다.
- 작업을 다음 세션으로 넘기면 `Handoff Snapshot` 섹션에 `어디까지 했는지`, `다음 파일`, `다음 첫 액션`을 남긴다.
- phase 체크리스트 외에 세부 작업이 생기면 `Working Checklist` 섹션에 하위 체크리스트를 추가한다.

## Current Status

- Last updated: `2026-04-21`
- Current phase: `Phase 8 완료`
- Overall status: `React 앱이 유일한 실행 경로가 되었고 legacy main/runtime/string renderer 경로 제거, PotionGame 1차 분리, 초반 legacy CSS dead code 정리까지 마쳤다`
- Immediate next action: `PotionGameView를 stage 파일 단위로 더 쪼개거나 남은 CSS 구간의 세부 dead selector를 계속 줄인다`

## Read Order For Future Sessions

1. [react-migration-plan.md](/Users/namucy/Develop/ai-test-mocking/docs/react-migration-plan.md)
2. 이 문서
3. 실제 수정 대상 파일만 좁게 읽기

## Migration Checklist

- [x] Phase 0. 계획 문서와 진행 로그 추가
- [x] Phase 1. `main.mjs`에서 메타/라우트/포맷터/공용 상수 분리
- [x] Phase 2. 홈/결과/시퀀스 문자열 렌더 함수 파일 분리
- [x] Phase 3. 포션 web controller/state/render/timer 모듈 분리
- [x] Phase 4. 포션 엔진 단일 소스 정리
- [x] Phase 5. React runtime shell 도입
- [x] Phase 6. Home / Results / Sequence React 전환
- [x] Phase 7. Potion React 전환
- [x] Phase 8. Legacy renderer 정리

## Working Checklist

이 섹션은 phase 체크리스트보다 더 작은 작업 단위를 누적하는 곳이다.

현재 활성 작업:

- [x] Phase 1 shared module 경계 확정
- [x] `GAME_META` / `ASSESSMENT_STAGE_GAMES` 분리
- [x] format 함수 묶음 분리
- [x] 포션 안내 copy / 설정 상수 분리
- [x] `main.mjs`에서 첫 extraction 대상 줄 범위 확정
- [x] `top-nav` / `home-page` / `results-page` / `sequence-page` 분리
- [x] Phase 3 potion state / controller / timer 경계 확정
- [x] potion route render helper 묶음 분리 순서 확정
- [x] Phase 3 후보 모듈(`controller`, `state`, `timers`, `view`) 설계
- [x] `src/web/potion/state.mjs` 추가
- [x] `src/web/potion/controller.mjs` 추가
- [x] `src/web/potion/timers.mjs` 추가
- [x] `src/web/potion/renderers.mjs` 추가
- [x] `main.mjs` 잔여 home/detail glue 범위 점검 후 Phase 3 종료 판단
- [x] `src/web/pages/home-controller.mjs` 추가
- [x] home stage icon / artwork 렌더러를 공용 컴포넌트로 분리
- [x] potion pointer hover glue를 `src/web/potion/controller.mjs`로 이동
- [x] `src/games/potion/*.js`를 ESM 단일 소스로 정리
- [x] `src/web/potion-engine.mjs`를 thin wrapper로 축소
- [x] Phase 5 React runtime shell scaffold (`package.json`, `src/app/*`, boot entry) 착수
- [x] React entry (`index.html` -> `src/app/boot.js`) 전환
- [x] `HashRouter` 기반 route shell / top nav 추가
- [x] `home` / `results` / `sequence` React route wrapper 추가
- [x] potion legacy runtime bridge (`src/web/potion/runtime.mjs`) 추가
- [x] wrapper 기반 static routes를 native React markup으로 치환 시작
- [x] home route drawer/settings를 native React markup으로 치환
- [x] results route를 native React markup으로 치환
- [x] sequence route를 native React markup으로 치환
- [x] `LegacyMarkupPage` 제거
- [x] `PotionRoute` legacy runtime bridge 제거
- [x] potion tutorial / playing / checking / finished UI를 native React markup으로 전환
- [x] potion phase 전환 helper를 `src/app/features/potion/state-utils.js` 로 분리
- [x] `tests/app/potion-state-utils.test.mjs` 추가
- [x] legacy potion/runtime import graph 재확인
- [x] `src/web/main.mjs` 및 legacy 문자열 renderer/runtime 파일 제거
- [x] `tests/web/potion-copy.test.mjs` import를 `src/web/potion/state.mjs` 로 전환
- [x] `npm run check:web`를 React runtime 기준 build 검증으로 단순화
- [x] `PotionGame.js` 를 hook 조립자 수준으로 축소
- [x] `usePotionGame.js` / `PotionGameView.js` 로 potion state/effect 와 view 트리 분리
- [x] `src/web/styles.css` 초반 legacy generic layout selector 정리
- [x] 미사용 potion choice `is-selected` selector 제거

## Current Decisions

- React 전환 전 `main.mjs`를 먼저 분해한다.
- 초기 단계에서는 [src/web/styles.css](/Users/namucy/Develop/ai-test-mocking/src/web/styles.css:1) 를 유지한다.
- 라우터는 최종적으로 `HashRouter` 유지가 기본값이다.
- 포션 로직은 장기적으로 [src/games/potion/index.js](/Users/namucy/Develop/ai-test-mocking/src/games/potion/index.js:1) 계열을 단일 소스로 삼는 방향이 우선이다.
- [src/web/potion-engine.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion-engine.mjs:1) 는 당분간 브라우저 import 안정성을 위한 thin wrapper만 유지한다.
- 새 게임 추가보다 구조 안정화가 우선이다.

## Current Technical Debt To Resolve

### 1. Global CSS Coupling

- [src/web/styles.css](/Users/namucy/Develop/ai-test-mocking/src/web/styles.css:1) 의 전역 selector가 많아 마크업 변경 시 회귀 위험이 크다.
- 초기 legacy renderer 전용 generic block은 걷어냈지만, 여전히 route별 전역 selector와 큰 단일 파일 구조는 남아 있다.

### 2. Potion View Granularity

- [src/app/features/potion/PotionGameView.js](/Users/namucy/Develop/ai-test-mocking/src/app/features/potion/PotionGameView.js:1) 에 tutorial/question/finished stage와 하위 시각 컴포넌트가 아직 한 파일에 모여 있다.
- 지금은 이전보다 경계가 선명하지만, 후속 수정이 많아지면 stage별 파일 분리를 한 번 더 고려할 수 있다.

## Next Action Candidates

다음 세션에서 바로 시작할 수 있는 후보는 아래 2개다.

### Option A. Potion stage component split

목표:

- 이미 분리된 potion feature view를 stage/component 파일 단위로 더 잘게 나눈다.

대상:

- `src/app/features/potion/PotionGameView.js`
- 신규 stage/component 파일들

장점:

- tutorial/question/finished stage별 수정과 테스트 포인트를 더 독립적으로 관리할 수 있다.

### Option B. CSS dead code audit continuation

목표:

- legacy renderer 제거 이후 남은 전역 CSS 중 실제 React 마크업에서 더 이상 쓰지 않는 selector 범위를 점검한다.

대상:

- `src/web/styles.css`
- `src/app/pages/*`
- `src/app/features/potion/PotionGameView.js`

장점:

- 현재 남아 있는 가장 큰 회귀 리스크를 줄일 수 있다.
- 이후 UI 수정 때 불필요한 전역 스타일 영향 범위를 좁힐 수 있다.

## Recommended Next Action

현재 기준 추천은 `Option A를 먼저 진행`하는 것이다.

즉, 다음 세션 첫 작업은 아래다.

1. `src/app/features/potion/PotionGameView.js` 내부에서 tutorial/question/finished stage를 파일 단위로 분리할 경계를 정한다.
2. 하위 아트/버튼 컴포넌트까지 같이 옮길지, stage 파일만 먼저 나눌지 결정해 작은 write scope부터 진행한다.

## Blocked / Deferred Items

현재 없음.

이후 막히는 항목은 아래 형식으로 추가한다.

```md
### YYYY-MM-DD - short title

- Status: `blocked` | `deferred`
- Phase: `...`
- Reason: `무엇 때문에 멈췄는지`
- Last completed point: `여기까지는 끝남`
- Next unblock action: `무엇이 해결되면 다시 시작 가능한지`
- Relevant files: `...`
```

## Handoff Snapshot

- Last stable stopping point: `Phase 8 complete; React app is now the only runtime path and legacy main/runtime/string renderer files are removed`
- Next file(s) to open:
  [react-migration-plan.md](/Users/namucy/Develop/ai-test-mocking/docs/react-migration-plan.md),
  [react-migration-log.md](/Users/namucy/Develop/ai-test-mocking/docs/react-migration-log.md),
  [PotionGame.js](/Users/namucy/Develop/ai-test-mocking/src/app/features/potion/PotionGame.js:1),
  [usePotionGame.js](/Users/namucy/Develop/ai-test-mocking/src/app/features/potion/usePotionGame.js:1),
  [PotionGameView.js](/Users/namucy/Develop/ai-test-mocking/src/app/features/potion/PotionGameView.js:1),
  [styles.css](/Users/namucy/Develop/ai-test-mocking/src/web/styles.css:1)
- Next first action: `PotionGameView를 읽고 stage/component 분리 순서를 정한 뒤 가장 독립적인 stage부터 파일로 뺀다`
- If resuming after interruption:
  `Working Checklist`에서 진행 중 항목을 확인하고,
  막힌 이력이 있으면 `Blocked / Deferred Items`를 먼저 본다.

## Session Log

### 2026-04-21

- 현재 프론트엔드 구조를 조사했다.
- 핵심 병목은 코드량 자체보다 [src/web/main.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/main.mjs:1) 집중 구조라는 점을 확인했다.
- `main.mjs`는 약 `2718`줄, `styles.css`는 약 `2933`줄이다.
- 포션 게임 로직이 브라우저용과 테스트용으로 이중화돼 있다는 점을 핵심 구조 리스크로 기록했다.
- React 전환은 즉시 도입보다 `사전 분해 -> 엔진 단일화 -> React 셸 도입` 순서가 적절하다고 결정했다.
- 본 계획 문서와 진행 로그 문서를 추가했다.
- [src/web/shared/game-meta.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/shared/game-meta.mjs:1), [routes.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/shared/routes.mjs:1), [formatters.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/shared/formatters.mjs:1), [potion-content.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/shared/potion-content.mjs:1) 를 추가해 Phase 1 대상이던 메타/라우트/포맷터/포션 copy를 `main.mjs` 밖으로 이동했다.
- [src/web/components/top-nav.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/components/top-nav.mjs:1), [home-page.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/pages/home-page.mjs:1), [results-page.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/pages/results-page.mjs:1), [sequence-page.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/pages/sequence-page.mjs:1) 를 추가해 Phase 2 대상이던 문자열 page renderer를 분리했다.
- `tests/web/potion-copy.test.mjs`는 extracted potion content 모듈을 직접 보도록 갱신했다.
- `npm test`, `npm run check:web`를 통과했다.
- `main.mjs`는 현재 약 `1918`줄까지 줄었고, 남은 큰 응집 구간은 포션 route state/controller/timer/render 쪽이다.
- 포션 40문항 종료 후 결과 페이지 이동이 너무 숨겨져 오작동처럼 보이던 문제를 보정했다. 완료 카드는 유지하되 자동으로 `/results`로 이동하고, 버튼 문구도 `연습 기록 보기`로 명확하게 바꿨다.
- 마지막 문항 종료 플로우도 다시 맞췄다. 이제 마지막 답 선택 후에도 일반 문항과 동일하게 피드백 단계가 먼저 보이고, 그 다음 완료 카드가 나온 뒤 결과 페이지로 이동한다.
- [src/web/potion/state.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion/state.mjs:1), [controller.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion/controller.mjs:1), [timers.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion/timers.mjs:1), [renderers.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion/renderers.mjs:1) 를 추가해 Phase 3의 핵심 목표였던 포션 전용 state/controller/timer/render 경계를 `main.mjs` 밖으로 분리했다.
- [src/web/main.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/main.mjs:1) 는 현재 약 `633`줄까지 줄었고, 포션 로직 대부분은 새 모듈을 조립하는 역할만 남았다.
- `shouldResetPotionStateOnEntry`는 [src/web/potion/state.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion/state.mjs:1) 로 이동했고, 기존 테스트 호환을 위해 [src/web/main.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/main.mjs:1) 에서 re-export 했다.
- 다시 `npm test`, `npm run check:web`를 통과했다.
- [src/web/pages/home-controller.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/pages/home-controller.mjs:1), [src/web/components/assessment-stage-art.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/components/assessment-stage-art.mjs:1) 를 추가해 home detail drawer 상태/glue와 stage icon/artwork를 [src/web/main.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/main.mjs:1) 밖으로 이동했다.
- potion pointer hover 추적도 [src/web/potion/controller.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion/controller.mjs:1) 내부로 이동해 [src/web/main.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/main.mjs:1) 는 현재 약 `289`줄까지 줄었다.
- [package.json](/Users/namucy/Develop/ai-test-mocking/package.json:1) 에 `"type": "module"` 을 추가하고 [src/games/potion/index.js](/Users/namucy/Develop/ai-test-mocking/src/games/potion/index.js:1), [config.js](/Users/namucy/Develop/ai-test-mocking/src/games/potion/config.js:1), [combo.js](/Users/namucy/Develop/ai-test-mocking/src/games/potion/combo.js:1), [session.js](/Users/namucy/Develop/ai-test-mocking/src/games/potion/session.js:1), [scoring.js](/Users/namucy/Develop/ai-test-mocking/src/games/potion/scoring.js:1) 를 ESM 단일 소스로 정리했다.
- [src/web/potion-engine.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion-engine.mjs:1) 는 이제 [src/games/potion/index.js](/Users/namucy/Develop/ai-test-mocking/src/games/potion/index.js:1) 를 재-export하는 thin wrapper만 담당한다.
- [tests/potion/scoring.test.js](/Users/namucy/Develop/ai-test-mocking/tests/potion/scoring.test.js:1), [tests/potion/session.test.js](/Users/namucy/Develop/ai-test-mocking/tests/potion/session.test.js:1) 를 ESM import로 바꿨고, 다시 `npm test`, `npm run check:web`를 통과했다.
- `index.html` 기본 진입점을 [src/app/boot.js](/Users/namucy/Develop/ai-test-mocking/src/app/boot.js:1) 로 바꾸고, [vite.config.mjs](/Users/namucy/Develop/ai-test-mocking/vite.config.mjs:1), `dev/build/preview/check:web` 스크립트를 추가해 Vite 기반 React 런타임 셸을 올렸다.
- [src/app/App.js](/Users/namucy/Develop/ai-test-mocking/src/app/App.js:1), [TopNav.js](/Users/namucy/Develop/ai-test-mocking/src/app/components/TopNav.js:1), [HomeRoute.js](/Users/namucy/Develop/ai-test-mocking/src/app/pages/HomeRoute.js:1), [ResultsRoute.js](/Users/namucy/Develop/ai-test-mocking/src/app/pages/ResultsRoute.js:1), [SequenceRoute.js](/Users/namucy/Develop/ai-test-mocking/src/app/pages/SequenceRoute.js:1) 를 추가해 `HashRouter` 기반 React route shell을 만들었다.
- `home`, `results`, `sequence` 는 일단 legacy page renderer를 React route wrapper에서 재사용하도록 연결해 route/state/navigation은 React 쪽으로 넘겼다.
- [src/web/potion/runtime.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion/runtime.mjs:1) 를 추가해 포션 화면은 별도 legacy runtime bridge로 마운트되도록 분리했고, React 앱이 potion 설정 변경과 결과 저장 상태를 같이 들고 있게 만들었다.
- 이번 단계 이후 다시 `npm test`, `npm run check:web` 를 통과했고 Vite production build 산출물까지 생성되는 것을 확인했다.
- [src/app/components/AssessmentStageArt.js](/Users/namucy/Develop/ai-test-mocking/src/app/components/AssessmentStageArt.js:1) 를 추가해 홈/결과 화면에서 쓰는 stage icon 및 drawer artwork를 React 컴포넌트로 옮겼다.
- [HomeRoute.js](/Users/namucy/Develop/ai-test-mocking/src/app/pages/HomeRoute.js:1), [ResultsRoute.js](/Users/namucy/Develop/ai-test-mocking/src/app/pages/ResultsRoute.js:1), [SequenceRoute.js](/Users/namucy/Develop/ai-test-mocking/src/app/pages/SequenceRoute.js:1) 의 legacy string renderer 의존을 제거하고 같은 CSS class를 유지하는 native React markup으로 치환했다.
- 더 이상 필요 없어진 `src/app/components/LegacyMarkupPage.js` 를 제거했다.
- static route conversion 이후에도 다시 `npm test`, `npm run check:web` 를 통과했다.
- [src/app/features/potion/PotionGame.js](/Users/namucy/Develop/ai-test-mocking/src/app/features/potion/PotionGame.js:1), [state-utils.js](/Users/namucy/Develop/ai-test-mocking/src/app/features/potion/state-utils.js:1) 를 추가해 potion phase/state/effect/render 를 React 쪽으로 옮겼고, [src/app/pages/PotionRoute.js](/Users/namucy/Develop/ai-test-mocking/src/app/pages/PotionRoute.js:1) 는 더 이상 [src/web/potion/runtime.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion/runtime.mjs:1) 를 mount 하지 않게 바꿨다.
- 새 React potion route는 tutorial 자동 시작, playing 타이머, checking 피드백 진행, finished 자동 이동, 결과 저장(local storage + App state callback)까지 기존 UX 흐름을 그대로 유지하도록 재조립했다.
- [tests/app/potion-state-utils.test.mjs](/Users/namucy/Develop/ai-test-mocking/tests/app/potion-state-utils.test.mjs:1) 를 추가해 settings sync 와 checking/finished phase 전환 helper 를 검증했고, 다시 `npm test`, `npm run check:web` 를 통과했다.
- `src/web/main.mjs`, `src/web/potion/runtime.mjs`, `src/web/potion/controller.mjs`, `src/web/potion/renderers.mjs` 와 거기에만 연결돼 있던 legacy 문자열 page/component 파일들을 제거해 React 앱만 남겼다.
- `tests/web/potion-copy.test.mjs` 는 이제 `shouldResetPotionStateOnEntry` 를 [src/web/potion/state.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion/state.mjs:1) 에서 직접 검증한다.
- `npm run check:web` 는 legacy import smoke 대신 React runtime 기준 `vite build` 확인만 수행하도록 정리했다.
- [src/app/features/potion/usePotionGame.js](/Users/namucy/Develop/ai-test-mocking/src/app/features/potion/usePotionGame.js:1), [PotionGameView.js](/Users/namucy/Develop/ai-test-mocking/src/app/features/potion/PotionGameView.js:1) 를 추가해 potion feature 를 state/effect 와 render tree 기준으로 1차 분리했다.
- [src/web/styles.css](/Users/namucy/Develop/ai-test-mocking/src/web/styles.css:1) 에 남아 있던 초반 legacy generic layout block(`hero-panel`, `game-shell`, `results-page`, `game-card`, `answer-button`, `feedback-panel` 등) 을 제거하고 현재 React route에서 실제 쓰는 `top-nav`, `placeholder`, `game-header` 계열만 남겼다.
- 포션 choice button의 unused `is-selected` selector도 제거했고, build 결과 CSS 번들은 약 `44.8 kB` 에서 `36.1 kB` 로 줄었다.

## Agent Note

현재 단계에서는 별도 agent가 필수는 아니다.

이유:

- 초반 작업은 병렬 구현보다 구조 설계가 중요하다.
- 지금은 대부분의 맥락이 `main.mjs` 한 파일에 붙어 있어 agent를 나눠도 중복 독해가 많다.
- 이 문서와 계획 문서가 있으면 세션 변경에 따른 컨텍스트 손실을 상당 부분 줄일 수 있다.

agent 사용을 고려할 시점:

- 각 phase의 write scope가 분리된 뒤
- 예: `정적 페이지 분리`, `포션 엔진 정리`, `React 셸 도입`이 서로 다른 파일 묶음으로 나뉜 뒤

## Update Template

작업 후 아래 항목만 짧게 갱신해도 된다.

```md
- Last updated: `YYYY-MM-DD`
- Current phase: `...`
- Overall status: `...`
- Immediate next action: `...`
```

막히거나 다음 세션으로 넘길 때는 아래 템플릿을 사용한다.

```md
### Handoff - YYYY-MM-DD

- Done in this session: `...`
- Not done yet: `...`
- Next first action: `...`
- Open these files first: `...`
- Notes / blockers: `...`
```
