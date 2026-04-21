import React from "react";

const h = React.createElement;

export function AssessmentStageDrawerArtwork({ icon }) {
  if (icon !== "potion") {
    return h(
      "div",
      {
        className: "assessment-stage-drawer__artwork-fallback",
      },
      h(AssessmentStageIcon, { icon }),
    );
  }

  return h(
    "svg",
    {
      className: "assessment-stage-drawer-artwork",
      viewBox: "0 0 320 160",
    },
    h("rect", {
      className: "assessment-stage-drawer-artwork__bg",
      x: "0",
      y: "0",
      width: "320",
      height: "160",
      rx: "20",
    }),
    h("path", {
      className: "assessment-stage-drawer-artwork__line",
      d: "M18 52c38-24 94-28 150-4c39 16 84 20 132-2",
    }),
    h("path", {
      className: "assessment-stage-drawer-artwork__line",
      d: "M20 122c45-18 96-16 156 6c42 15 86 13 124-4",
    }),
    h(
      "g",
      {
        className: "assessment-stage-drawer-artwork__cauldron",
      },
      h("ellipse", { cx: "92", cy: "119", rx: "44", ry: "14" }),
      h("path", { d: "M52 82h80l-8 40H60z" }),
      h("path", { d: "M60 82c0-10 8-18 18-18h28c10 0 18 8 18 18" }),
      h("path", { d: "M56 121c-10 0-18 8-18 18" }),
    ),
    h(
      "g",
      {
        className: "assessment-stage-drawer-artwork__brew",
      },
      h("circle", { cx: "80", cy: "74", r: "18" }),
      h("circle", { cx: "100", cy: "69", r: "12" }),
      h("circle", { cx: "117", cy: "76", r: "16" }),
      h("circle", { cx: "137", cy: "88", r: "12" }),
    ),
    h(
      "g",
      {
        className: "assessment-stage-drawer-artwork__hand",
      },
      h("path", { d: "M48 74c-10-2-21 3-28 13l22 9z" }),
      h("path", {
        d: "M83 32c-6-2-12 2-13 8l-8 40l19 5l13-37c2-7-3-14-11-16z",
      }),
    ),
    h(
      "g",
      {
        className: "assessment-stage-drawer-artwork__flask",
      },
      h("path", { d: "M218 26h28v20h-28z" }),
      h("path", {
        d: "M204 46h56l-8 24l25 32c12 15 1 38-18 38h-54c-19 0-30-23-18-38l25-32z",
      }),
      h("path", {
        d: "M207 113c13-8 28-6 43 5c13 10 28 13 43 7c0 12-10 21-24 21h-44c-14 0-24-15-18-33z",
      }),
      h(
        "text",
        {
          x: "232",
          y: "112",
        },
        "?",
      ),
    ),
    h("circle", {
      className: "assessment-stage-drawer-artwork__dot is-green",
      cx: "188",
      cy: "58",
      r: "4",
    }),
    h("circle", {
      className: "assessment-stage-drawer-artwork__dot is-red",
      cx: "166",
      cy: "88",
      r: "4",
    }),
    h("circle", {
      className: "assessment-stage-drawer-artwork__dot is-yellow",
      cx: "284",
      cy: "82",
      r: "5",
    }),
    h("circle", {
      className: "assessment-stage-drawer-artwork__dot is-green",
      cx: "176",
      cy: "112",
      r: "6",
    }),
  );
}

export function AssessmentStageIcon({ icon }) {
  switch (icon) {
    case "rps":
      return h(
        "svg",
        { className: "assessment-stage-icon", viewBox: "0 0 64 64" },
        h("path", {
          d: "M25 45l4-18c1-4 6-5 8-2l7 11c2 3 1 7-2 9l-5 4c-3 2-7 2-10 1z",
        }),
        h("path", { d: "M24 30l2-11c1-3 5-4 7-2c1 1 2 3 1 5l-2 9" }),
        h("path", { d: "M32 28l2-12c1-3 5-4 7-2c2 1 3 3 2 5l-2 11" }),
      );
    case "rotation":
      return h(
        "svg",
        { className: "assessment-stage-icon", viewBox: "0 0 64 64" },
        h("rect", { x: "26", y: "22", width: "14", height: "14", rx: "3" }),
        h("path", { d: "M16 31c0-9 7-16 16-16c6 0 11 3 14 8" }),
        h("path", { d: "M45 15l2 8l-8-1" }),
        h("path", { d: "M48 33c0 9-7 16-16 16c-6 0-11-3-14-8" }),
        h("path", { d: "M19 49l-2-8l8 1" }),
      );
    case "calendar":
      return h(
        "svg",
        { className: "assessment-stage-icon", viewBox: "0 0 64 64" },
        h("rect", { x: "16", y: "18", width: "32", height: "28", rx: "5" }),
        h("path", { d: "M16 26h32" }),
        h("path", { d: "M24 14v8" }),
        h("path", { d: "M40 14v8" }),
        h("path", { d: "M24 36l5 5l11-12" }),
      );
    case "road":
      return h(
        "svg",
        { className: "assessment-stage-icon", viewBox: "0 0 64 64" },
        h("circle", { cx: "32", cy: "18", r: "7" }),
        h("path", { d: "M18 46c6-10 10-21 14-32" }),
        h("path", { d: "M46 46c-6-10-10-21-14-32" }),
        h("path", { d: "M32 28v4" }),
        h("path", { d: "M32 38v4" }),
      );
    case "potion":
      return h(
        "svg",
        { className: "assessment-stage-icon", viewBox: "0 0 64 64" },
        h("path", { d: "M29 12h10v8h-10z" }),
        h("path", {
          d: "M24 18h20l-3 9l11 13c5 6 1 14-7 14H19c-8 0-12-8-7-14l11-13z",
        }),
        h("path", {
          d: "M18 41c5-3 11-2 17 3c5 4 10 5 15 3c0 5-4 9-9 9H23c-6 0-9-7-5-15z",
        }),
        h("circle", { cx: "20", cy: "18", r: "3" }),
        h("circle", { cx: "48", cy: "20", r: "2" }),
      );
    case "number":
      return h(
        "svg",
        { className: "assessment-stage-icon", viewBox: "0 0 64 64" },
        h("rect", { x: "18", y: "14", width: "28", height: "36", rx: "5" }),
        h("path", { d: "M22 20h20" }),
        h("circle", { cx: "26", cy: "31", r: "2" }),
        h("circle", { cx: "38", cy: "31", r: "2" }),
        h("circle", { cx: "26", cy: "41", r: "2" }),
        h("circle", { cx: "38", cy: "41", r: "2" }),
      );
    case "sequence":
      return h(
        "svg",
        { className: "assessment-stage-icon", viewBox: "0 0 64 64" },
        h("rect", { x: "17", y: "22", width: "18", height: "18", rx: "3" }),
        h("rect", { x: "29", y: "14", width: "18", height: "18", rx: "3" }),
        h("rect", { x: "31", y: "30", width: "18", height: "18", rx: "3" }),
      );
    case "cat":
      return h(
        "svg",
        { className: "assessment-stage-icon", viewBox: "0 0 64 64" },
        h("circle", { cx: "22", cy: "24", r: "4" }),
        h("circle", { cx: "42", cy: "24", r: "4" }),
        h("circle", { cx: "16", cy: "34", r: "4" }),
        h("circle", { cx: "48", cy: "34", r: "4" }),
        h("path", { d: "M23 46c0-6 4-10 9-10s9 4 9 10c0 4-4 7-9 7s-9-3-9-7z" }),
      );
    case "balance":
    default:
      return h(
        "svg",
        { className: "assessment-stage-icon", viewBox: "0 0 64 64" },
        h("path", { d: "M32 16v28" }),
        h("path", { d: "M20 24h24" }),
        h("path", { d: "M14 26l6 10H8z" }),
        h("path", { d: "M44 26l6 10H38z" }),
        h("path", { d: "M26 48h12" }),
      );
  }
}
