# React Migration Plan

## Purpose

이 문서는 현재 정적 JS 기반 프론트엔드를 단계적으로 React 구조로 전환하기 위한 기준 계획서다.

목표는 한 번에 전면 재작성하지 않고, 현재 동작을 최대한 유지한 채 파일 구조와 책임 경계를 먼저 정리한 뒤 React를 도입하는 것이다.

다음 세션에서는 전체 코드를 다시 훑기 전에 이 문서를 먼저 읽는다.

## Status Note

- `2026-04-21` 기준 `Phase 8` 까지 완료됐다.
- React 앱이 현재 유일한 실행 경로이며 legacy `main.mjs` 와 문자열 renderer/runtime 파일들은 제거됐다.
- 아래 phase 설명은 어떤 순서로 여기까지 왔는지 보여주는 기준 기록으로 유지한다.

## Primary Files

- [index.html](/Users/namucy/Develop/ai-test-mocking/index.html)
- [src/app/boot.js](/Users/namucy/Develop/ai-test-mocking/src/app/boot.js)
- [src/app/App.js](/Users/namucy/Develop/ai-test-mocking/src/app/App.js)
- [src/app/components/TopNav.js](/Users/namucy/Develop/ai-test-mocking/src/app/components/TopNav.js)
- [src/app/pages/HomeRoute.js](/Users/namucy/Develop/ai-test-mocking/src/app/pages/HomeRoute.js)
- [src/app/pages/ResultsRoute.js](/Users/namucy/Develop/ai-test-mocking/src/app/pages/ResultsRoute.js)
- [src/app/pages/SequenceRoute.js](/Users/namucy/Develop/ai-test-mocking/src/app/pages/SequenceRoute.js)
- [src/app/pages/PotionRoute.js](/Users/namucy/Develop/ai-test-mocking/src/app/pages/PotionRoute.js)
- [src/app/features/potion/PotionGame.js](/Users/namucy/Develop/ai-test-mocking/src/app/features/potion/PotionGame.js)
- [src/app/features/potion/state-utils.js](/Users/namucy/Develop/ai-test-mocking/src/app/features/potion/state-utils.js)
- [src/web/styles.css](/Users/namucy/Develop/ai-test-mocking/src/web/styles.css)
- [src/web/storage.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/storage.mjs)
- [src/web/potion-engine.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion-engine.mjs)
- [src/web/potion/state.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion/state.mjs)
- [src/web/potion/timers.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion/timers.mjs)
- [src/games/potion/index.js](/Users/namucy/Develop/ai-test-mocking/src/games/potion/index.js)
- [src/games/potion/config.js](/Users/namucy/Develop/ai-test-mocking/src/games/potion/config.js)
- [src/games/potion/combo.js](/Users/namucy/Develop/ai-test-mocking/src/games/potion/combo.js)
- [src/games/potion/session.js](/Users/namucy/Develop/ai-test-mocking/src/games/potion/session.js)
- [src/games/potion/scoring.js](/Users/namucy/Develop/ai-test-mocking/src/games/potion/scoring.js)

## Related Docs

- [mvp-spec.md](/Users/namucy/Develop/ai-test-mocking/docs/mvp-spec.md)
- [potion-ui-reference.md](/Users/namucy/Develop/ai-test-mocking/docs/potion-ui-reference.md)
- [potion-ui-diff.md](/Users/namucy/Develop/ai-test-mocking/docs/potion-ui-diff.md)
- [react-migration-log.md](/Users/namucy/Develop/ai-test-mocking/docs/react-migration-log.md)

## Migration Goal

최종 목표는 아래 상태다.

- 프론트엔드 진입점은 React 앱으로 바뀐다.
- 라우팅은 React Router 기반으로 관리한다.
- 화면 단위와 컴포넌트 단위 파일이 분리된다.
- 포션 게임 도메인 로직은 브라우저/테스트가 같은 단일 소스를 사용한다.
- 현재 전역 `innerHTML` 렌더링과 `data-action` 이벤트 위임 구조는 제거된다.
- 현재 UX와 CSS 톤은 초기 전환 단계에서는 최대한 유지한다.

## Non-Goals

이번 전환의 1차 목표는 아래 항목이 아니다.

- UI 전면 리디자인
- CSS 전면 재작성
- 상태 관리 라이브러리 도입
- TypeScript 전면 전환
- 새 게임 동시 구현
- 포션 규칙/점수 로직의 의미 변경

즉, 이번 작업은 우선 `구조 전환`이 핵심이고 `기능 확장`은 뒤로 미룬다.

## Current Architecture Snapshot

현재 상태는 아래처럼 정리된다.

### 1. Entry / Runtime

- `index.html`에서 `#app` 하나를 두고 `src/app/boot.js`를 로드한다.
- React 앱은 `createRoot`로 마운트된다.
- `package.json` 기준 `vite` dev/build/preview 흐름이 기본이다.

### 2. Frontend Composition

- 최상위 route shell 은 [src/app/App.js](/Users/namucy/Develop/ai-test-mocking/src/app/App.js:1) 가 관리한다.
- 화면 단위는 `src/app/pages/*`, 포션 전용 UI 흐름은 `src/app/features/potion/PotionGame.js` 로 분리돼 있다.
- 문자열 템플릿 기반 legacy renderer 는 제거됐고 현재 렌더는 전부 React 컴포넌트 기준이다.

### 3. Routing

- 라우팅은 `react-router-dom` 의 `HashRouter` 로 관리한다.
- 실제 route는 `/`, `/games/potion`, `/games/sequence`, `/results` 다.
- GitHub Pages 호환성 때문에 `HashRouter` 유지가 기본값이다.

### 4. State and Effects

- 앱 수준 상태는 `App.js` 가 결과 목록과 포션 설정을 보유한다.
- 포션 게임은 React state/effect 로 `tutorial -> playing -> checking -> finished` 흐름을 관리한다.
- 포션 전용 상태 생성과 타이머 계산 helper 는 [src/web/potion/state.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion/state.mjs:1), [src/web/potion/timers.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion/timers.mjs:1) 에 남겨 재사용한다.

### 5. Styling

- `src/web/styles.css` 단일 전역 CSS 파일이 전 페이지 스타일을 모두 가진다.
- React 전환 이후에도 CSS 구조는 크게 바꾸지 않고 재사용하고 있다.

### 6. Domain Logic

- 포션 규칙/세션/채점 로직의 단일 소스는 `src/games/potion/*` 다.
- [src/web/potion-engine.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion-engine.mjs:1) 는 브라우저 import 안정성을 위한 thin wrapper만 유지한다.

## Migration Principles

전환 중 아래 원칙을 지킨다.

- 한 번에 하나의 축만 바꾼다.
- UI 구조 변경과 도메인 로직 변경을 같은 단계에서 같이 하지 않는다.
- 초기 단계에서는 CSS를 최대한 유지한다.
- 각 단계는 완료 조건이 있어야 한다.
- 각 단계는 되돌릴 수 있을 정도로 작아야 한다.
- `main.mjs`는 계속 줄어들어야 하며, 새 책임을 다시 흡수하면 안 된다.
- 브라우저용 포션 로직과 테스트용 포션 로직의 이중 유지 상태를 장기적으로 방치하지 않는다.

## Target Architecture

최종적으로는 아래 정도의 구조를 목표로 한다.

```text
src/
  app/
    App.jsx
    routes.jsx
    boot.jsx
  web/
    legacy/
      main.mjs
    shared/
      game-meta.js
      routes.js
      formatters.js
      storage.js
  pages/
    HomePage.jsx
    ResultsPage.jsx
    SequencePage.jsx
    PotionPage.jsx
  features/
    potion/
      components/
      hooks/
      utils/
  games/
    potion/
      index.js
      config.js
      combo.js
      session.js
      scoring.js
```

위 경로명은 예시다. 다만 아래 방향성은 유지한다.

- `app/`: 진입점, 라우터, 최상위 shell
- `pages/`: route 단위 화면
- `features/potion/`: 포션 화면 전용 UI와 hook
- `games/potion/`: UI와 무관한 도메인 로직
- `web/shared/`: 라우트, 메타, 포맷터, 저장소 같은 브라우저 공통 유틸

## Phased Plan

### Phase 0. Planning Baseline

#### Goal

- 세션이 바뀌어도 이어갈 수 있는 계획 문서와 진행 로그를 확보한다.

#### Deliverables

- `docs/react-migration-plan.md`
- `docs/react-migration-log.md`

#### Exit Criteria

- 계획 문서에 단계, 완료 조건, 위험요소가 정리돼 있다.
- 진행 문서에 현재 상태와 다음 작업이 기록돼 있다.

### Phase 1. Pre-React Extraction of Shared Web Modules

#### Goal

- React 없이도 `main.mjs`의 비핵심 책임을 먼저 분리한다.

#### Scope

- 게임 메타 상수
- 라우트 상수/헬퍼
- 날짜/점수/퍼센트 포맷터
- 공용 UI copy 상수
- 저장소 helper import 위치 정리

#### Candidate Modules

- `src/web/shared/game-meta.mjs`
- `src/web/shared/routes.mjs`
- `src/web/shared/formatters.mjs`
- `src/web/shared/potion-content.mjs`

#### Exit Criteria

- `main.mjs`에서 메타/포맷/상수 정의가 상당 부분 제거된다.
- 동작 변화 없이 import만 재조립된다.
- `npm test`
- `npm run check:web`

### Phase 2. Split String-Template Pages Out of main.mjs

#### Goal

- React 도입 전, 현재 문자열 렌더 방식 그대로 페이지/섹션 파일을 분리한다.

#### Scope

- 홈 화면 렌더 함수
- 결과 화면 렌더 함수
- 시퀀스 placeholder 화면
- 상단 네비게이션

#### Candidate Modules

- `src/web/pages/home-page.mjs`
- `src/web/pages/results-page.mjs`
- `src/web/pages/sequence-page.mjs`
- `src/web/components/top-nav.mjs`

#### Notes

- 이 단계에서는 여전히 `main.mjs`가 조립자 역할을 한다.
- 렌더 함수 시그니처는 `state`와 필요한 helper를 인자로 넘기는 형태가 적합하다.

#### Exit Criteria

- 홈/결과/시퀀스 관련 템플릿 함수가 `main.mjs` 밖으로 이동한다.
- 라우트 선택 로직은 그대로 유지된다.
- 포션 관련 로직은 아직 건드리지 않는다.

### Phase 3. Isolate Potion Web Controller Before React

#### Goal

- 가장 복잡한 포션 전용 로직을 `main.mjs`에서 분리한다.

#### Scope

- 포션 view state 생성
- 타이머/animation loop
- 포션 액션 처리
- 포션 렌더 함수 묶음

#### Candidate Modules

- `src/web/potion/state.mjs`
- `src/web/potion/controller.mjs`
- `src/web/potion/renderers.mjs`
- `src/web/potion/timers.mjs`

#### Notes

- 이 단계의 목적은 React 전환 자체가 아니라, React 없이도 포션 흐름을 모듈화하는 것이다.
- 이후 React 훅으로 옮길 때 이 경계가 그대로 재사용된다.

#### Exit Criteria

- `main.mjs`는 앱 부트스트랩과 route dispatch 정도만 남는다.
- 포션 화면 동작은 기존과 동일하다.
- 포션 전용 렌더/타이머/상태 함수가 별도 모듈에 존재한다.

### Phase 4. Unify Potion Engine Into One Source of Truth

#### Goal

- 브라우저/테스트가 다른 포션 엔진을 들고 있는 상태를 제거한다.

#### Scope

- `src/web/potion-engine.mjs`와 `src/games/potion/*` 중복 정리
- 브라우저에서 `src/games/potion` 계열을 직접 재사용 가능하게 import 경로 정리
- 필요하면 `esm` export wrapper 추가

#### Decision Rule

- 가능하면 `src/games/potion/*`를 도메인 기준 단일 소스로 삼는다.
- 브라우저 전용 포장 코드는 thin wrapper만 허용한다.

#### Exit Criteria

- 포션 규칙/세션/채점 로직이 한 소스 집합으로 정리된다.
- 테스트는 그 단일 로직을 직접 검증한다.
- 브라우저도 같은 로직을 사용한다.

### Phase 5. Introduce React Runtime Shell

#### Goal

- 기존 기능을 유지한 채 React 앱 셸을 올린다.

#### Scope

- React
- React DOM
- Vite
- React Router DOM
- `HashRouter`

#### Deliverables

- 새 프론트엔드 진입점
- `App` 컴포넌트
- 기본 라우트 테이블
- legacy 진입점과 병행 또는 교체 전략

#### Notes

- 처음부터 포션까지 React로 옮기지 않는다.
- 홈/결과/시퀀스부터 React 라우트로 옮기는 게 안전하다.

#### Exit Criteria

- React 앱이 뜬다.
- 최소한 홈/결과/시퀀스 중 일부가 React 라우트로 렌더된다.
- 기존 CSS를 그대로 적용해도 화면이 크게 깨지지 않는다.

### Phase 6. Migrate Static or Low-Risk Pages to React

#### Goal

- 복잡도가 낮은 화면부터 React 컴포넌트로 치환한다.

#### Migration Order

1. Home
2. Results
3. Sequence placeholder

#### Notes

- 이 단계에서 페이지 컴포넌트, 공용 버튼, 카드, drawer 같은 UI 경계가 보이기 시작해야 한다.
- 상태는 우선 `useState`와 prop drilling 정도로 충분하다.

#### Exit Criteria

- 위 3개 화면이 React로 동작한다.
- 기존 route와 UX가 유지된다.
- 포션만 legacy 또는 별도 브리지 상태로 남는다.

### Phase 7. Migrate Potion Flow to React

#### Goal

- 가장 복잡한 포션 흐름을 React 컴포넌트와 hook 구조로 전환한다.

#### Suggested Split

- `PotionTutorial`
- `PotionQuestionCard`
- `PotionChoiceButtons`
- `PotionFeedbackCard`
- `PotionTimeoutOverlay`
- `PotionFinishedCard`
- `usePotionSession`
- `usePotionTimers`

#### Notes

- 핵심은 렌더 계층만 React로 바꾸고, 도메인 로직은 Phase 4 결과를 그대로 소비하는 것이다.
- 포션 타이머는 `useEffect`와 cleanup으로 옮긴다.
- 현재 pointer hover 같은 세부 효과는 React 이관 후 필요성을 다시 판단한다.

#### Exit Criteria

- 포션 전체 흐름이 React 컴포넌트로 동작한다.
- 기존 기능 회귀가 없다.
- legacy `main.mjs` 의존이 실질적으로 제거된다.

### Phase 8. Remove Legacy Renderer and Consolidate

#### Goal

- 더 이상 필요 없는 legacy 렌더러를 제거하고 구조를 정리한다.

#### Scope

- `main.mjs` 축소 또는 제거
- 더 이상 사용하지 않는 문자열 템플릿 함수 제거
- 중복 helper 제거
- CSS dead code 점검

#### Exit Criteria

- React 앱이 유일한 진입 경로가 된다.
- legacy renderer가 남아 있어도 보조/임시 수준이어야 한다.
- 유지보수 관점에서 새 게임 추가 시 page/component 단위 확장이 가능하다.

## Testing Rule Per Phase

각 phase 종료 시 아래를 기본 확인한다.

- `npm test`
- `npm run check:web`

React 도입 이후에는 필요 시 아래도 추가한다.

- 빌드 확인
- 주요 route 수동 확인
- 포션 한 세션 smoke test

## Risk Register

### 1. main.mjs Re-growth

- 새 파일로 분리한 뒤에도 임시로 다시 `main.mjs`에 로직을 추가하면 분해 효과가 사라진다.

### 2. Potion Engine Drift

- React 이관 전에 엔진 이중화를 정리하지 않으면 브라우저와 테스트가 서로 다른 동작을 낼 수 있다.

### 3. CSS Breakage

- 마크업 구조만 바뀌어도 전역 CSS 선택자 영향으로 UI가 깨질 수 있다.
- 초기 단계에서는 class 이름을 최대한 유지한다.

### 4. Route Behavior Regression

- 현재 해시 라우팅 기반 bookmark 동작을 유지해야 한다.
- GitHub Pages 배포 기준에서는 `HashRouter` 유지가 기본이다.

### 5. Scope Creep

- 새 게임 추가와 React 전환을 동시에 진행하면 일정이 급격히 늘어난다.
- 새 게임은 구조 안정화 이후에 넣는 것이 원칙이다.

## Agent Policy

이 계획은 기본적으로 단일 메인 세션만으로도 진행 가능하게 설계한다.

이유는 아래와 같다.

- 초기 단계의 병목은 병렬 처리보다 구조 분해다.
- 현재 핵심 맥락이 `main.mjs` 한 파일에 몰려 있어 초반부터 agent를 여러 개 쓰면 중복 독해가 많다.
- 계획 문서와 진행 로그가 있으면 세션 변경에 따른 컨텍스트 손실을 상당 부분 흡수할 수 있다.

단, 아래 조건이 충족되면 agent 사용 가치가 생긴다.

- write scope가 분리된 이후
- 단계가 명확히 쪼개진 이후
- 예: `정적 페이지 React 이관`, `포션 엔진 단일화`, `결과 페이지 컴포넌트화`처럼 서로 다른 파일 묶음을 독립 수정할 수 있을 때

## Resume Rule

다음 세션에서 재개할 때는 아래 순서를 따른다.

1. [react-migration-plan.md](/Users/namucy/Develop/ai-test-mocking/docs/react-migration-plan.md)를 읽는다.
2. [react-migration-log.md](/Users/namucy/Develop/ai-test-mocking/docs/react-migration-log.md)를 읽는다.
3. 현재 진행 phase와 next action을 확인한다.
4. 그 단계의 대상 파일만 좁게 읽고 작업한다.
5. 단계 종료 후 진행 로그를 갱신한다.
