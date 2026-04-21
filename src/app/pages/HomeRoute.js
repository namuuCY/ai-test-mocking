import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { normalizePotionSettingValue } from "../../web/potion/state.mjs";
import { ASSESSMENT_STAGE_GAMES } from "../../web/shared/game-meta.mjs";
import { formatPotionConfigLabel } from "../../web/shared/formatters.mjs";
import {
  DEFAULT_HOME_STAGE_DETAIL_TAB_ID,
  getPotionStageDetailContent,
  POTION_SETTING_DEFINITIONS,
} from "../../web/shared/potion-content.mjs";
import {
  AssessmentStageDrawerArtwork,
  AssessmentStageIcon,
} from "../components/AssessmentStageArt.js";

const h = React.createElement;

export function HomeRoute({ potionSettings, onPotionSettingsChange }) {
  const navigate = useNavigate();
  const [selectedStageGameId, setSelectedStageGameId] = useState(null);
  const [selectedStageDetailTabId, setSelectedStageDetailTabId] = useState(
    DEFAULT_HOME_STAGE_DETAIL_TAB_ID,
  );
  const selectedGame = getAssessmentStageGameById(selectedStageGameId);
  const selectedStageDetailTabs = getAssessmentStageDetailTabs(
    selectedGame,
    potionSettings,
  );
  const resolvedStageDetailTabId =
    selectedStageDetailTabs.find((tab) => tab.id === selectedStageDetailTabId)
      ?.id ??
    selectedStageDetailTabs[0]?.id ??
    DEFAULT_HOME_STAGE_DETAIL_TAB_ID;
  const selectedStageDetailMeta = getAssessmentStageDetailMeta(
    selectedGame,
    potionSettings,
  );

  function closeStageDetail() {
    setSelectedStageGameId(null);
    setSelectedStageDetailTabId(DEFAULT_HOME_STAGE_DETAIL_TAB_ID);
  }

  function handleOpenStageDetail(gameId) {
    const game = getAssessmentStageGameById(gameId);
    if (!game?.route) {
      return;
    }

    setSelectedStageGameId(game.id);
    setSelectedStageDetailTabId(
      getAssessmentStageDetailTabs(game, potionSettings)[0]?.id ??
        DEFAULT_HOME_STAGE_DETAIL_TAB_ID,
    );
  }

  function handlePotionSettingChange(settingKey, nextValue) {
    onPotionSettingsChange({
      ...potionSettings,
      [settingKey]: normalizePotionSettingValue(
        settingKey,
        nextValue,
        potionSettings[settingKey],
      ),
    });
  }

  return h(
    "section",
    {
      className: "assessment-home",
    },
    h(
      "div",
      {
        className: `assessment-home__board${selectedGame ? " has-stage-detail" : ""}`,
      },
      h(
        "aside",
        {
          className: "assessment-home__sidebar",
          "aria-label": "평가 영역",
        },
        h(
          "nav",
          {
            className: "assessment-home__menu",
          },
          h(
            "span",
            {
              className: "assessment-home__menu-item is-muted",
            },
            "성향파악",
          ),
          h(
            "span",
            {
              className: "assessment-home__menu-item is-active",
            },
            "게임",
          ),
          h(
            "span",
            {
              className: "assessment-home__menu-item is-muted",
            },
            "영상면접",
          ),
        ),
      ),
      h(
        "section",
        {
          className: "assessment-home__content",
          "aria-labelledby": "assessment-home-title",
        },
        h(
          "div",
          {
            className: "assessment-home__content-scroll",
          },
          h(
            "h1",
            {
              className: "assessment-home__title",
              id: "assessment-home-title",
            },
            "게임",
          ),
          h(
            "div",
            {
              className: "assessment-home__grid",
            },
            ASSESSMENT_STAGE_GAMES.map((game) =>
              h(AssessmentStageCard, {
                game,
                isSelected: selectedStageGameId === game.id,
                key: game.id,
                onOpen: handleOpenStageDetail,
              }),
            ),
          ),
        ),
      ),
      selectedGame
        ? h(AssessmentStageDetailDrawer, {
            detailMeta: selectedStageDetailMeta,
            detailTabs: selectedStageDetailTabs,
            game: selectedGame,
            onClose: closeStageDetail,
            onPotionSettingChange: handlePotionSettingChange,
            onSelectTab: setSelectedStageDetailTabId,
            onStart() {
              closeStageDetail();
              navigate(selectedGame.route);
            },
            potionSettings,
            selectedStageDetailTabId: resolvedStageDetailTabId,
          })
        : null,
    ),
  );
}

function getAssessmentStageGameById(gameId) {
  return ASSESSMENT_STAGE_GAMES.find((game) => game.id === gameId) ?? null;
}

function getAssessmentStageDetailTabs(game, potionSettings) {
  if (game?.id !== "potion-stage") {
    return game?.detailTabs ?? [];
  }

  return getPotionStageDetailContent(potionSettings).tabs;
}

function getAssessmentStageDetailMeta(game, potionSettings) {
  if (game?.id !== "potion-stage") {
    return game?.detailMeta ?? [];
  }

  return getPotionStageDetailContent(potionSettings).meta;
}

function AssessmentStageCard({ game, isSelected, onOpen }) {
  if (game.route) {
    return h(
      "button",
      {
        "aria-expanded": isSelected ? "true" : "false",
        "aria-haspopup": "dialog",
        "aria-label": `${game.title} 상세 정보 열기`,
        className: "assessment-stage-card is-active",
        onClick: () => onOpen(game.id),
        type: "button",
      },
      h(
        "div",
        {
          className: "assessment-stage-card__copy",
        },
        h("h2", null, game.title),
        h(
          "div",
          {
            className: "assessment-stage-card__meta",
          },
          h(
            "span",
            {
              className: "assessment-stage-card__trait",
            },
            game.category,
          ),
          h("span", {
            className: "assessment-stage-card__divider",
          }),
          h("span", null, game.duration),
          h("span", {
            className: "assessment-stage-card__divider",
          }),
          h("span", null, game.difficulty),
        ),
      ),
      h(
        "div",
        {
          "aria-hidden": "true",
          className: "assessment-stage-card__icon",
        },
        h(AssessmentStageIcon, { icon: game.icon }),
      ),
    );
  }

  return h(
    "article",
    {
      "aria-label": `${game.title} 소개 카드`,
      className: "assessment-stage-card is-disabled",
    },
    h(
      "div",
      {
        className: "assessment-stage-card__copy",
      },
      h("h2", null, game.title),
      h(
        "div",
        {
          className: "assessment-stage-card__meta",
        },
        h(
          "span",
          {
            className: "assessment-stage-card__trait",
          },
          game.category,
        ),
        h("span", {
          className: "assessment-stage-card__divider",
        }),
        h("span", null, game.duration),
        h("span", {
          className: "assessment-stage-card__divider",
        }),
        h("span", null, game.difficulty),
      ),
    ),
    h(
      "div",
      {
        "aria-hidden": "true",
        className: "assessment-stage-card__icon",
      },
      h(AssessmentStageIcon, { icon: game.icon }),
    ),
  );
}

function AssessmentStageDetailDrawer({
  detailMeta,
  detailTabs,
  game,
  onClose,
  onPotionSettingChange,
  onSelectTab,
  onStart,
  potionSettings,
  selectedStageDetailTabId,
}) {
  const selectedTab =
    detailTabs.find((detailTab) => detailTab.id === selectedStageDetailTabId) ??
    detailTabs[0] ??
    null;

  return h(
    "div",
    {
      className: "assessment-home__detail-layer",
    },
    h("button", {
      "aria-label": `${game.title} 상세 패널 닫기`,
      className: "assessment-home__detail-backdrop",
      onClick: onClose,
      type: "button",
    }),
    h(
      "aside",
      {
        "aria-labelledby": "assessment-stage-drawer-title",
        "aria-modal": "true",
        className: "assessment-stage-drawer",
        role: "dialog",
      },
      h(
        "header",
        {
          className: "assessment-stage-drawer__header",
        },
        h(
          "button",
          {
            className: "assessment-stage-drawer__back",
            onClick: onClose,
            type: "button",
          },
          h(
            "span",
            {
              "aria-hidden": "true",
            },
            "‹",
          ),
          h("span", null, "뒤로"),
        ),
      ),
      h(
        "div",
        {
          className: "assessment-stage-drawer__body",
        },
        h(
          "div",
          {
            className: "assessment-stage-drawer__title-row",
          },
          h(
            "div",
            null,
            h(
              "h2",
              {
                id: "assessment-stage-drawer-title",
              },
              game.title,
            ),
            h(
              "p",
              {
                className: "assessment-stage-drawer__summary",
              },
              game.detailSummary ?? "",
            ),
          ),
          h(
            "div",
            {
              "aria-hidden": "true",
              className: "assessment-stage-drawer__badge",
            },
            h(AssessmentStageIcon, { icon: game.icon }),
          ),
        ),
        h(
          "div",
          {
            className: "assessment-stage-drawer__meta",
          },
          detailMeta.map((item, index) =>
            h(
              "span",
              {
                key: `${game.id}-${index}`,
              },
              item,
            ),
          ),
        ),
        h(
          "div",
          {
            "aria-hidden": "true",
            className: "assessment-stage-drawer__artwork",
          },
          h(AssessmentStageDrawerArtwork, { icon: game.icon }),
        ),
        h(
          "nav",
          {
            "aria-label": `${game.title} 안내 탭`,
            className: "assessment-stage-drawer__tabs",
          },
          detailTabs.map((detailTab) =>
            h(
              "button",
              {
                "aria-pressed": detailTab.id === selectedTab?.id ? "true" : "false",
                className: `assessment-stage-drawer__tab${detailTab.id === selectedTab?.id ? " is-active" : ""}`,
                key: detailTab.id,
                onClick: () => onSelectTab(detailTab.id),
                type: "button",
              },
              detailTab.label,
            ),
          ),
        ),
        h(
          "div",
          {
            className: "assessment-stage-drawer__panel-slot",
          },
          h(AssessmentStageDetailPanel, {
            onPotionSettingChange,
            potionSettings,
            tab: selectedTab,
          }),
        ),
      ),
      h(
        "footer",
        {
          className: "assessment-stage-drawer__footer",
        },
        h(
          "button",
          {
            className:
              "assessment-stage-drawer__action assessment-stage-drawer__action--secondary",
            onClick: onClose,
            type: "button",
          },
          "닫기",
        ),
        h(
          "button",
          {
            className:
              "assessment-stage-drawer__action assessment-stage-drawer__action--primary",
            onClick: onStart,
            type: "button",
          },
          "실전 시작",
        ),
      ),
    ),
  );
}

function AssessmentStageDetailPanel({
  onPotionSettingChange,
  potionSettings,
  tab,
}) {
  if (!tab) {
    return null;
  }

  if (tab.kind === "settings") {
    return h(
      "section",
      {
        className:
          "assessment-stage-drawer__panel assessment-stage-drawer__panel--settings",
      },
      h(
        "p",
        {
          className: "assessment-stage-drawer__panel-eyebrow",
        },
        tab.label,
      ),
      h("h3", null, tab.title),
      ...(tab.paragraphs ?? []).map((paragraph, index) =>
        h(
          "p",
          {
            key: `settings-paragraph-${index}`,
          },
          paragraph,
        ),
      ),
      h(
        "div",
        {
          className: "assessment-stage-settings",
        },
        h(PotionSettingField, {
          key: "sessionQuestionCount",
          onChange: onPotionSettingChange,
          potionSettings,
          settingKey: "sessionQuestionCount",
        }),
        h(PotionSettingField, {
          key: "questionTimeLimitSec",
          onChange: onPotionSettingChange,
          potionSettings,
          settingKey: "questionTimeLimitSec",
        }),
      ),
      h(
        "div",
        {
          className: "assessment-stage-settings__summary",
        },
        h("span", null, "현재 설정"),
        h("strong", null, formatPotionConfigLabel(potionSettings)),
      ),
    );
  }

  return h(
    "section",
    {
      className: "assessment-stage-drawer__panel",
    },
    h(
      "p",
      {
        className: "assessment-stage-drawer__panel-eyebrow",
      },
      tab.label,
    ),
    h("h3", null, tab.title),
    ...(tab.paragraphs ?? []).map((paragraph, index) =>
      h(
        "p",
        {
          key: `paragraph-${index}`,
        },
        paragraph,
      ),
    ),
    tab.bullets?.length
      ? h(
          "ul",
          {
            className: "assessment-stage-drawer__panel-list",
          },
          tab.bullets.map((bullet, index) =>
            h(
              "li",
              {
                key: `bullet-${index}`,
              },
              bullet,
            ),
          ),
        )
      : null,
  );
}

function PotionSettingField({ onChange, potionSettings, settingKey }) {
  const definition = POTION_SETTING_DEFINITIONS[settingKey];
  if (!definition) {
    return null;
  }

  const fieldId = `potion-setting-${settingKey}`;
  const value = potionSettings[settingKey];

  return h(
    "div",
    {
      className: "assessment-stage-setting",
    },
    h(
      "div",
      {
        className: "assessment-stage-setting__copy",
      },
      h(
        "label",
        {
          className: "assessment-stage-setting__label",
          htmlFor: fieldId,
        },
        definition.label,
      ),
      h(
        "p",
        {
          className: "assessment-stage-setting__description",
        },
        definition.description,
      ),
    ),
    h(
      "div",
      {
        className: "assessment-stage-setting__control-row",
      },
      h("input", {
        "aria-label": `${definition.label} 슬라이더`,
        className: "assessment-stage-setting__slider",
        id: fieldId,
        max: definition.max,
        min: definition.min,
        onChange: (event) => onChange(settingKey, event.target.value),
        step: definition.step,
        type: "range",
        value,
      }),
      h(
        "div",
        {
          className: "assessment-stage-setting__number-wrap",
        },
        h("input", {
          "aria-label": `${definition.label} 숫자 입력`,
          className: "assessment-stage-setting__number",
          max: definition.max,
          min: definition.min,
          onChange: (event) => onChange(settingKey, event.target.value),
          step: definition.step,
          type: "number",
          value,
        }),
        h(
          "span",
          {
            className: "assessment-stage-setting__unit",
          },
          definition.unit,
        ),
      ),
    ),
  );
}
