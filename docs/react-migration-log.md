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
- Current phase: `Phase 0 - Planning Baseline`
- Overall status: `planning docs added, code migration not started`
- Immediate next action: `Phase 1 시작 전 shared web module 분리 대상 확정`

## Read Order For Future Sessions

1. [react-migration-plan.md](/Users/namucy/Develop/ai-test-mocking/docs/react-migration-plan.md)
2. 이 문서
3. 실제 수정 대상 파일만 좁게 읽기

## Migration Checklist

- [x] Phase 0. 계획 문서와 진행 로그 추가
- [ ] Phase 1. `main.mjs`에서 메타/라우트/포맷터/공용 상수 분리
- [ ] Phase 2. 홈/결과/시퀀스 문자열 렌더 함수 파일 분리
- [ ] Phase 3. 포션 web controller/state/render/timer 모듈 분리
- [ ] Phase 4. 포션 엔진 단일 소스 정리
- [ ] Phase 5. React runtime shell 도입
- [ ] Phase 6. Home / Results / Sequence React 전환
- [ ] Phase 7. Potion React 전환
- [ ] Phase 8. Legacy renderer 정리

## Working Checklist

이 섹션은 phase 체크리스트보다 더 작은 작업 단위를 누적하는 곳이다.

현재 활성 작업:

- [ ] Phase 1 shared module 경계 확정
- [ ] `GAME_META` / `ASSESSMENT_STAGE_GAMES` 분리 설계
- [ ] format 함수 묶음 분리 설계
- [ ] 포션 안내 copy 상수 분리 설계
- [ ] `main.mjs`에서 첫 extraction 대상 줄 범위 확정

## Current Decisions

- React 전환 전 `main.mjs`를 먼저 분해한다.
- 초기 단계에서는 [src/web/styles.css](/Users/namucy/Develop/ai-test-mocking/src/web/styles.css:1) 를 유지한다.
- 라우터는 최종적으로 `HashRouter` 유지가 기본값이다.
- 포션 로직은 장기적으로 [src/games/potion/index.js](/Users/namucy/Develop/ai-test-mocking/src/games/potion/index.js:1) 계열을 단일 소스로 삼는 방향이 우선이다.
- 새 게임 추가보다 구조 안정화가 우선이다.

## Current Technical Debt To Resolve

### 1. main.mjs Overload

- [src/web/main.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/main.mjs:1) 가 상태, 이벤트, 라우팅, 렌더링, 타이머를 모두 가진다.

### 2. Potion Engine Duplication

- [src/web/potion-engine.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion-engine.mjs:1) 와 [src/games/potion/index.js](/Users/namucy/Develop/ai-test-mocking/src/games/potion/index.js:1) 계열이 역할 중복 상태다.

### 3. Global CSS Coupling

- [src/web/styles.css](/Users/namucy/Develop/ai-test-mocking/src/web/styles.css:1) 의 전역 selector가 많아 마크업 변경 시 회귀 위험이 크다.

## Next Action Candidates

다음 세션에서 바로 시작할 수 있는 후보는 아래 2개다.

### Option A. Phase 1 착수

목표:

- `main.mjs`에서 아래 항목을 먼저 빼낸다.

대상:

- `GAME_META`
- `ASSESSMENT_STAGE_GAMES`
- 포션 안내 copy
- 라우트 helper
- format 함수

장점:

- 동작 변화가 거의 없다.
- 안전하게 파일 분해를 시작할 수 있다.

### Option B. Phase 1 상세 설계 먼저

목표:

- shared module의 실제 파일명과 export 경계를 먼저 확정한다.

대상:

- `src/web/shared/game-meta.mjs`
- `src/web/shared/routes.mjs`
- `src/web/shared/formatters.mjs`
- `src/web/shared/potion-content.mjs`

장점:

- 다음 구현 세션의 토큰 사용량을 줄일 수 있다.
- 수정 범위를 더 좁게 가져갈 수 있다.

## Recommended Next Action

현재 기준 추천은 `Option B -> Option A` 순서다.

즉, 다음 세션 첫 작업은 아래다.

1. Phase 1용 모듈 경계 확정
2. 그 다음 `main.mjs`에서 메타/포맷/상수 분리 시작

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

- Last stable stopping point: `planning docs added, implementation not started`
- Next file(s) to open:
  [react-migration-plan.md](/Users/namucy/Develop/ai-test-mocking/docs/react-migration-plan.md),
  [react-migration-log.md](/Users/namucy/Develop/ai-test-mocking/docs/react-migration-log.md),
  [main.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/main.mjs:1)
- Next first action: `Phase 1 shared module 경계 확정`
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
