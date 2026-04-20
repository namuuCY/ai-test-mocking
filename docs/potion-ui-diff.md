# Potion UI Diff

## Purpose

이 문서는 `현재 구현`과 영상 기준 UI 사이의 차이를 정리한 작업 문서다.

reference 사실은 [potion-ui-reference.md](/Users/namucy/Develop/ai-test-mocking/docs/potion-ui-reference.md)를 기준으로 하고, 이 문서는 `이미 맞춘 것`, `부분적으로 맞춘 것`, `아직 남은 것`, `코드 정리 이슈`를 빠르게 확인하기 위한 용도로 사용한다.

## Primary Files

- [main.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/main.mjs)
- [styles.css](/Users/namucy/Develop/ai-test-mocking/src/web/styles.css)
- [potion-engine.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion-engine.mjs)

## Current Implementation Summary

현재 구현은 이전 상태보다 영상 기준에 훨씬 가까워졌다.

- `마법약 만들기` route 전용 레이아웃이 따로 있다.
- 글로벌 상단 네비게이션은 potion route에서 숨겨진다.
- 좌상단 공지 카드와 우상단 dark pill이 구현되어 있다.
- 튜토리얼, 문항, 완료 화면이 각각 전용 마크업으로 구현되어 있다.
- answer 후 피드백은 기존 question card 안의 독립 본문으로 표시되고, timeout만 별도 오버레이로 표시된다.
- question/play 재료 타일은 현재 app 전용의 상세 SVG 약초 4종을 사용한다.
- 완료 화면도 단일 카드 형태로 단순화됐다.

즉, 큰 구조는 이미 `시험 화면` 방향으로 전환됐다.  
이제 남은 일은 `세부 UI parity`와 `구 코드 정리` 쪽이 더 크다.

## User-Directed Divergence

### 2026-04-18 Input Feedback Flow

이번 세션의 사용자 요청으로, 색상 선택 후 피드백 장면과
시간 초과 안내 장면을 서로 다른 UI로 분리한다.

- answered feedback는 기존 `potion-question-card` 안에서 결과 카드만 단독으로 보이게 한다.
- answered feedback에서는 암전 배경과 뒤쪽 재료 4칸 이력을 제거한다.
- timeout은 blue alert 오버레이를 유지하되, 카드 내부가 아니라 페이지 전체를 암전시킨다.

### 2026-04-18 Selected Answer Visibility

이번 세션의 사용자 요청으로, feedback 단계에서는
사용자가 방금 선택한 색을 텍스트나 버튼 채움으로 다시 보여주지 않는다.

- current app은 `예측 성공 / 예측 실패 + 실제 제조 색상`만 표시한다.
- timeout 시에는 파란 안내 오버레이를 사용한다.
- 따라서 answered feedback에서 선택 버튼이 채워진 채 남는 reference와는 의도적으로 다르다.

### 2026-04-18 HUD Removal

이번 세션의 사용자 요청으로, game 중 상단에 뜨던 아래 HUD 요소를 모두 제거한다.

- `응시 중에는 다른 화면으로 이동하지 마세요` notice
- 좌상단 3색 점 orb
- `담당자 영상을 확인할 수 있어요` dark pill

reference 문서는 `상단 공지 2개`를 영상 기준 사실로 계속 유지하고,
current app은 이번 사용자 지시에 따라 이를 의도적으로 숨긴다.

### 2026-04-18 Home Screen Focus

이번 세션의 사용자 요청으로, `00:00` 메인 페이지에서는 중앙 `게임` 보드만 재현한다.

- 원본에 보이는 좌상단/우상단 notice, `남은 과제 / 선택 시간`, 진행률 bar, `잠시 쉴게요` 버튼은 현재 app에서 숨긴다.
- 메인 보드 안에는 `9개` 게임 소개 카드를 유지한다.
- 카드 중 `마법약 만들기`만 활성화하고 나머지는 소개용 비활성 카드로 둔다.

### 2026-04-21 Home Stage Detail Drawer

이번 세션의 사용자 요청으로, `마법약 만들기` 카드를 클릭했을 때
바로 `10초 대기 페이지`로 이동하지 않고 중간 설명 단계를 둔다.

- 메인 흰 보드 영역만 어둡게 dim 처리한다.
- 우측에서 detail drawer가 슬라이드 인된다.
- drawer shell은 영상의 `뒤로`, 메타 정보, 하단 CTA 구조를 따르되 상단 `9 / 18` pager는 현재 app에서 생략한다.
- 다만 본문은 사용자 요청에 따라 `게임 소개` / `진행 방식` 탭으로 재구성한다.
- 우측 primary CTA를 눌렀을 때만 실제 `/games/potion` 튜토리얼로 진입한다.

### 2026-04-18 Ingredient Art Replacement

이번 세션의 사용자 요청으로, 재료 이미지는 더 이상 원본 영상 프레임을
직접 따서 맞추지 않는다.

- current app은 question/tutorial 공통으로 상세 SVG 약초 4종을 카드 `1, 2, 3, 4` 순서대로 사용한다.
- 각 약초는 슬롯 배경 위에 단독 실루엣으로 올라가도록 렌더링한다.

### 2026-04-18 In-game Reset

이번 세션의 사용자 요청으로, question/play 화면 헤더에
현재 세션만 폐기하고 메인 화면으로 돌아가는 `리셋` 버튼을 추가한다.

- confirm 경고창에서 승인되면 진행 중 세션 데이터만 버린다.
- localStorage에 저장된 이전 완료 세션 기록은 유지한다.

## Resolved Since Last Diff

아래 항목은 기존 diff 대비 해결된 것으로 본다.

### 1. Global App Chrome

해결됨.

- potion route에서는 `renderTopNav()`가 렌더되지 않는다.
- `body[data-route="potion"]`와 `app-shell--potion` 전용 레이아웃이 적용된다.

### 2. Side Panel Removal

해결됨.

- 기존 `game-main + game-side` 2열 구조는 potion route에서 더 이상 사용되지 않는다.
- 게임 중 우측 규칙 패널과 최근 기록 패널이 제거됐다.

### 3. Tutorial Screen Structure

대체로 해결됨.

- standalone 카드 구조로 바뀌었다.
- `마법약 만들기 | 실전` 헤더가 있다.
- 예시 UI, 규칙 텍스트, 하단 진행바, 자동 시작 카운트다운이 있다.
- 기존 `지금 시작` 버튼은 potion route의 실제 튜토리얼 화면에서 제거됐다.

### 4. Feedback Placement

해결됨.

- answered feedback가 별도 페이지가 아니라 question card 안의 독립 `potion-feedback-card`로 표시된다.
- answered feedback에서는 질문 카드 뒤 배경을 어둡게 덮지 않는다.
- 핵심 문구도 `예측 성공` / `예측 실패` 형태로 단순화됐다.

### 5. Timeout Alert Fidelity

해결됨.

- timeout 상태는 파란 안내 오버레이로 분리돼 있다.
- current app은 최신 사용자 지시에 따라 question card 내부가 아니라 페이지 전체를 암전시킨다.

### 6. Finished State Simplification

대체로 해결됨.

- 대시보드형 결과 화면이 아니라 단일 완료 카드가 표시된다.
- `수고하셨어요!`, `마법약 만들기 과제를 완료했어요.` 문구가 들어간다.
- 하단 초록 버튼도 있다.

### 7. On-screen Notices

해결됨.

- 좌상단 경고 카드 구현
- 우상단 dark pill 구현

## Partial Matches

아래 항목은 방향은 맞지만 아직 영상과 1:1 parity는 아니다.

### 1. Overall Visual Tone

부분 해결.

현재:

- potion route 배경은 밝은 회색 계열로 바뀌었다.
- 카드 UI도 흰색 기반으로 정리됐다.

남은 차이:

- 카드 그림자와 glow가 영상보다 여전히 강하다.
- HUD와 카드가 약간 더 `디자인된 제품 UI`처럼 보인다.
- 시험 화면 특유의 건조하고 평평한 느낌은 아직 완전히 아니다.

### 2. Tutorial Screen Fidelity

부분 해결.

현재:

- 카드 구조와 카피 흐름은 영상과 상당히 가깝다.
- 좌측 preview, 우측 규칙 목록, 하단 진행바가 구현되어 있다.

남은 차이:

- 카드 폭이 영상보다 작다.
- preview 타일/버튼/간격이 영상보다 약간 stylized 되어 있다.
- preview 안 재료 아트가 실제 이미지가 아니라 근사 SVG다.

### 3. Question Card Layout

부분 해결.

현재:

- 질문 헤더, 남은 문항, 우측 숫자 타이머, 상단 얇은 타이머 바가 구현돼 있다.
- 2x2 타일과 하단 색상 버튼도 영상 구조에 맞게 재구성됐다.

남은 차이:

- 전체 카드 폭이 영상보다 좁다.
- 내부 여백과 타일 크기가 영상보다 약간 컴팩트하다.
- 헤더 텍스트 크기와 박스 비율이 약간 다르다.

### 4. Ingredient Grid

부분 해결.

현재:

- 2x2 타일 구조
- 비활성 placeholder
- 활성 타일의 연두빛 glow
- 서로 다른 상세 SVG 약초 4종 사용

남은 차이:

- placeholder 물결 모양은 여전히 근사치다.
- 질문 카드 전체 폭과 슬롯 간격은 원본과 아직 약간 다를 수 있다.

### 5. Buttons

부분 해결.

현재:

- outline 기반 rounded button
- feedback 단계에서도 outline 형태를 유지한다.

남은 차이:

- 버튼 높이와 폭이 영상보다 약간 작다.
- hover/box-shadow 흔적이 아직 일부 남아 있다.

### 6. Finished Card

부분 해결.

현재:

- 단일 완료 카드 구조는 맞다.
- 아이콘, 문구, 초록 버튼도 존재한다.

남은 차이:

- 그림자와 아이콘 스타일이 영상보다 더 장식적이다.
- 버튼 폭과 세로 비율이 약간 다르다.
- 버튼 동작은 `/results` 이동인데, 원본은 단순 확인 동작일 가능성이 있다.

## Remaining UI Gaps

현재 기준으로 우선순위가 높은 차이는 아래다.

### 1. Timer Bar Color Behavior

아직 남아 있다.

- 영상 기준으로 타이머 바는 종료 직전에 빨간 계열로 바뀐다.
- 현재 `potion-question-card__timer-fill`은 기본적으로 파란색 하나만 사용한다.

### 2. Failure Feedback Color Tone

아직 남아 있다.

- reference 기준 실패 카드는 연노랑 경고 톤에 가깝다.
- 현재 `potion-feedback-card.is-failure`는 분홍/연빨강 계열이다.

### 3. HUD Copy Fidelity

작지만 남아 있다.

- 우상단 문구가 현재 `담당자 영상을 확인할 수 있어요.`인데
- reference는 `담당자가 영상을 확인할 수 있어요.`에 더 가깝다.

### 4. Card Scale And Spacing

남아 있다.

- 튜토리얼 카드와 질문 카드가 데스크톱 기준 영상보다 작다.
- 실제 화면처럼 넓고 여백 큰 시험 레이아웃으로 더 키울 필요가 있다.

### 5. Shadow / Polish Level

남아 있다.

- 영상은 더 flat 하다.
- 현재는 HUD, question card, feedback card, finished card 모두 그림자가 조금 강하다.

### 6. Art Asset Fidelity

부분 해결.

- 재료 아트는 current app 전용 SVG 잎 자산으로 교체됐다.
- 완료 아이콘은 여전히 근사 SVG다.
- exact parity가 목표라면 다시 reference 자산 방향으로 돌아가야 한다.

## Codebase Reality Check

현재 코드에는 `새 potion route 구현`과 `이전 generic potion UI 구현`이 동시에 남아 있다.

### Active Path

실제로 potion route에서 쓰이는 쪽:

- `renderPotionPage`
- `renderPotionRouteHud`
- `renderPotionTutorialStage`
- `renderPotionQuestionStage`
- `renderPotionQuestionHeader`
- `renderPotionIngredientMatrix`
- `renderPotionIngredientSlot`
- `renderPotionChoiceButtons`
- `renderPotionFeedbackCard`
- `renderPotionFinishedStage`

### Legacy / Dead Path

현재 potion route에서 사실상 쓰이지 않는 이전 구현:

- `renderPotionStatusBar`
- `renderCountdownTimer`
- `renderPotionBoard`
- `renderComboTitle`
- `renderIngredientCard`
- `renderTutorialOverlayIfNeeded`
- `renderPotionActionArea`
- `renderPotionFeedback`
- `renderPotionRulesPanel`

관련 CSS도 여전히 남아 있다.

- `.status-panel`
- `.countdown-timer`
- `.alchemy-board`
- `.ingredient-grid`
- `.ingredient-card`
- `.start-overlay`
- `.answer-panel`
- `.answer-button`
- `.feedback-panel`
- `.side-panel`
- `.result-summary`

이건 다음 세션에서 중요한 포인트다.

- potion UI parity 작업은 `새 potion route path` 위에서 해야 한다.
- dead path를 실수로 수정하면 시간만 낭비한다.
- 충분히 안정화되면 legacy path 삭제를 별도 cleanup 작업으로 빼는 게 맞다.

## File-by-File Update Guidance

### [main.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/main.mjs)

지금 우선 봐야 할 함수:

- `renderPotionRouteHud`
- `renderPotionTutorialStage`
- `renderPotionQuestionStage`
- `renderPotionQuestionHeader`
- `renderPotionIngredientMatrix`
- `renderPotionChoiceButtons`
- `renderPotionFeedbackCard`
- `renderPotionFinishedStage`
- `getPotionTimerDisplayValue`
- `getPotionQuestionTimeRatio`

다음 단계:

- 헤더/카드 폭/타이머 표시/문구 parity 보정
- legacy generic potion 함수 정리 여부 결정

### [styles.css](/Users/namucy/Develop/ai-test-mocking/src/web/styles.css)

지금 우선 봐야 할 클래스:

- `.potion-route`
- `.potion-hud*`
- `.potion-tutorial-card*`
- `.potion-question-card*`
- `.potion-ingredient-matrix`
- `.potion-ingredient-slot`
- `.potion-choice-button*`
- `.potion-feedback-card*`
- `.potion-finished-card*`

다음 단계:

- timer danger state 추가
- failure card 색상 보정
- 데스크톱 카드 스케일 확대
- shadow와 border tone 평탄화

### [potion-engine.mjs](/Users/namucy/Develop/ai-test-mocking/src/web/potion-engine.mjs)

현재 우선순위는 낮다.

필요할 때만 본다:

- 피드백 유지 시간 조정
- 시간 초과/선택 상태를 UI에 더 정확히 반영해야 할 때

## Recommended Next Tasks

현재 상태 기준 우선순위는 아래가 맞다.

1. 타이머 바의 danger state 추가
2. 실패 피드백 카드 색상을 연노랑 계열로 수정
3. 질문 카드와 튜토리얼 카드 폭/간격 확대
4. HUD 문구와 버튼/박스 비율 미세 보정
5. 재료 아트 fidelity 향상 여부 결정
6. legacy potion UI 함수와 CSS 정리

## Next Session Rule

다음 세션에서는 아래 순서로 진행한다.

1. [mvp-spec.md](/Users/namucy/Develop/ai-test-mocking/docs/mvp-spec.md) 읽기
2. [potion-ui-reference.md](/Users/namucy/Develop/ai-test-mocking/docs/potion-ui-reference.md) 읽기
3. 이 문서 읽기
4. 새 potion route path만 수정하기
5. 영상 재분석은 문서에 없는 새로운 사실이 필요할 때만 하기
