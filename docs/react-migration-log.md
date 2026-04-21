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
- Current phase: `Phase 5 - React runtime shell 도입`
- Overall status: `Phase 3 close-out과 Phase 4 단일 소스 정리 완료; main.mjs는 289줄까지 축소됐고 potion-engine은 src/games/potion thin wrapper로 정리됨`
- Immediate next action: `Vite + React + React Router DOM(HashRouter) 셸을 추가하고 legacy route markup을 React 앱 바깥으로 밀어내기 시작`

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
- [ ] Phase 5. React runtime shell 도입
- [ ] Phase 6. Home / Results / Sequence React 전환
- [ ] Phase 7. Potion React 전환
- [ ] Phase 8. Legacy renderer 정리

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
- [ ] Phase 5 React runtime shell scaffold (`package.json`, `src/app/*`, boot entry) 착수

## Current Decisions

- React 전환 전 `main.mjs`를 먼저 분해한다.
- 초기 단계에서는 [src/web/styles.css](/Users/namucy/Develop/ai-test-mocking/src/web/styles.css:1) 를 유지한다.
- 라우터는 최종적으로 `HashRouter` 유지가 기본값이다.
- 포션 로직은 장기적으로 [src/games/potion/index.js](/Users/namucy/Develop/ai-test-mocking/src/games/potion/index.js:1) 계열을 단일 소스로 삼는 방향이 우선이다.
- [src/web/potion-engine.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion-engine.mjs:1) 는 당분간 브라우저 import 안정성을 위한 thin wrapper만 유지한다.
- 새 게임 추가보다 구조 안정화가 우선이다.

## Current Technical Debt To Resolve

### 1. Legacy Boot Shell

- [src/web/main.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/main.mjs:1) 는 많이 줄었지만 여전히 legacy 앱 부트스트랩, 전역 이벤트 위임, 문자열 route dispatch를 담당한다.

### 2. React Runtime Missing

- 아직 React / Vite / React Router DOM 기반 앱 셸이 없다.

### 3. Global CSS Coupling

- [src/web/styles.css](/Users/namucy/Develop/ai-test-mocking/src/web/styles.css:1) 의 전역 selector가 많아 마크업 변경 시 회귀 위험이 크다.

## Next Action Candidates

다음 세션에서 바로 시작할 수 있는 후보는 아래 2개다.

### Option A. Phase 5 runtime shell

목표:

- React 앱 셸을 추가하고 기존 해시 라우트를 React 쪽으로 넘길 최소 부트스트랩을 만든다.

대상:

- `package.json`
- `index.html`
- `src/app/*` 또는 이에 준하는 새 앱 진입점
- `src/web/main.mjs`

장점:

- 이후 Home / Results / Sequence를 React route로 옮길 기반이 바로 생긴다.
- legacy 렌더러와 새 React 셸의 공존 전략을 초기에 명확히 할 수 있다.

### Option B. Phase 6 static route spike

목표:

- Home / Results / Sequence 중 하나를 먼저 React 컴포넌트로 옮길 최소 실험을 설계한다.

대상:

- `src/web/pages/home-page.mjs`
- `src/web/pages/results-page.mjs`
- `src/web/pages/sequence-page.mjs`
- 새 React page/component 파일

장점:

- React 셸 도입 직후 바로 low-risk route를 옮기는 기준을 선행 검토할 수 있다.
- 정적 페이지를 먼저 전환할 때 필요한 prop/data 경계가 보인다.

## Recommended Next Action

현재 기준 추천은 `Option A를 먼저 시작`하는 것이다.

즉, 다음 세션 첫 작업은 아래다.

1. React/Vite/HashRouter 셸을 추가한다.
2. legacy `main.mjs`가 React 부트스트랩 또는 fallback renderer만 담당하도록 첫 경계를 만든다.

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

- Last stable stopping point: `Phase 4 complete; main.mjs reduced to 289 lines and potion engine unified behind src/games/potion`
- Next file(s) to open:
  [react-migration-plan.md](/Users/namucy/Develop/ai-test-mocking/docs/react-migration-plan.md),
  [react-migration-log.md](/Users/namucy/Develop/ai-test-mocking/docs/react-migration-log.md),
  [package.json](/Users/namucy/Develop/ai-test-mocking/package.json:1),
  [main.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/main.mjs:1),
  [src/web/potion-engine.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion-engine.mjs:1),
  [src/games/potion/index.js](/Users/namucy/Develop/ai-test-mocking/src/games/potion/index.js:1),
  [src/web/pages/home-controller.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/pages/home-controller.mjs:1)
- Next first action: `React/Vite/HashRouter 런타임 셸을 추가하고 legacy main.mjs와의 공존 부트 경계를 잡기`
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
