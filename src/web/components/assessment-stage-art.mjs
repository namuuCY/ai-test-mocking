export function renderAssessmentStageDrawerArtwork(icon) {
  if (icon !== "potion") {
    return `
      <div class="assessment-stage-drawer__artwork-fallback">
        ${renderAssessmentStageIcon(icon)}
      </div>
    `;
  }

  return `
    <svg class="assessment-stage-drawer-artwork" viewBox="0 0 320 160">
      <rect class="assessment-stage-drawer-artwork__bg" x="0" y="0" width="320" height="160" rx="20"></rect>
      <path class="assessment-stage-drawer-artwork__line" d="M18 52c38-24 94-28 150-4c39 16 84 20 132-2"></path>
      <path class="assessment-stage-drawer-artwork__line" d="M20 122c45-18 96-16 156 6c42 15 86 13 124-4"></path>
      <g class="assessment-stage-drawer-artwork__cauldron">
        <ellipse cx="92" cy="119" rx="44" ry="14"></ellipse>
        <path d="M52 82h80l-8 40H60z"></path>
        <path d="M60 82c0-10 8-18 18-18h28c10 0 18 8 18 18"></path>
        <path d="M56 121c-10 0-18 8-18 18"></path>
      </g>
      <g class="assessment-stage-drawer-artwork__brew">
        <circle cx="80" cy="74" r="18"></circle>
        <circle cx="100" cy="69" r="12"></circle>
        <circle cx="117" cy="76" r="16"></circle>
        <circle cx="137" cy="88" r="12"></circle>
      </g>
      <g class="assessment-stage-drawer-artwork__hand">
        <path d="M48 74c-10-2-21 3-28 13l22 9z"></path>
        <path d="M83 32c-6-2-12 2-13 8l-8 40l19 5l13-37c2-7-3-14-11-16z"></path>
      </g>
      <g class="assessment-stage-drawer-artwork__flask">
        <path d="M218 26h28v20h-28z"></path>
        <path d="M204 46h56l-8 24l25 32c12 15 1 38-18 38h-54c-19 0-30-23-18-38l25-32z"></path>
        <path d="M207 113c13-8 28-6 43 5c13 10 28 13 43 7c0 12-10 21-24 21h-44c-14 0-24-15-18-33z"></path>
        <text x="232" y="112">?</text>
      </g>
      <circle class="assessment-stage-drawer-artwork__dot is-green" cx="188" cy="58" r="4"></circle>
      <circle class="assessment-stage-drawer-artwork__dot is-red" cx="166" cy="88" r="4"></circle>
      <circle class="assessment-stage-drawer-artwork__dot is-yellow" cx="284" cy="82" r="5"></circle>
      <circle class="assessment-stage-drawer-artwork__dot is-green" cx="176" cy="112" r="6"></circle>
    </svg>
  `;
}

export function renderAssessmentStageIcon(icon) {
  switch (icon) {
    case "rps":
      return `
        <svg class="assessment-stage-icon" viewBox="0 0 64 64">
          <path d="M25 45l4-18c1-4 6-5 8-2l7 11c2 3 1 7-2 9l-5 4c-3 2-7 2-10 1z"></path>
          <path d="M24 30l2-11c1-3 5-4 7-2c1 1 2 3 1 5l-2 9"></path>
          <path d="M32 28l2-12c1-3 5-4 7-2c2 1 3 3 2 5l-2 11"></path>
        </svg>
      `;
    case "rotation":
      return `
        <svg class="assessment-stage-icon" viewBox="0 0 64 64">
          <rect x="26" y="22" width="14" height="14" rx="3"></rect>
          <path d="M16 31c0-9 7-16 16-16c6 0 11 3 14 8"></path>
          <path d="M45 15l2 8l-8-1"></path>
          <path d="M48 33c0 9-7 16-16 16c-6 0-11-3-14-8"></path>
          <path d="M19 49l-2-8l8 1"></path>
        </svg>
      `;
    case "calendar":
      return `
        <svg class="assessment-stage-icon" viewBox="0 0 64 64">
          <rect x="16" y="18" width="32" height="28" rx="5"></rect>
          <path d="M16 26h32"></path>
          <path d="M24 14v8"></path>
          <path d="M40 14v8"></path>
          <path d="M24 36l5 5l11-12"></path>
        </svg>
      `;
    case "road":
      return `
        <svg class="assessment-stage-icon" viewBox="0 0 64 64">
          <circle cx="32" cy="18" r="7"></circle>
          <path d="M18 46c6-10 10-21 14-32"></path>
          <path d="M46 46c-6-10-10-21-14-32"></path>
          <path d="M32 28v4"></path>
          <path d="M32 38v4"></path>
        </svg>
      `;
    case "potion":
      return `
        <svg class="assessment-stage-icon" viewBox="0 0 64 64">
          <path d="M29 12h10v8h-10z"></path>
          <path d="M24 18h20l-3 9l11 13c5 6 1 14-7 14H19c-8 0-12-8-7-14l11-13z"></path>
          <path d="M18 41c5-3 11-2 17 3c5 4 10 5 15 3c0 5-4 9-9 9H23c-6 0-9-7-5-15z"></path>
          <circle cx="20" cy="18" r="3"></circle>
          <circle cx="48" cy="20" r="2"></circle>
        </svg>
      `;
    case "number":
      return `
        <svg class="assessment-stage-icon" viewBox="0 0 64 64">
          <rect x="18" y="14" width="28" height="36" rx="5"></rect>
          <path d="M22 20h20"></path>
          <circle cx="26" cy="31" r="2"></circle>
          <circle cx="38" cy="31" r="2"></circle>
          <circle cx="26" cy="41" r="2"></circle>
          <circle cx="38" cy="41" r="2"></circle>
        </svg>
      `;
    case "sequence":
      return `
        <svg class="assessment-stage-icon" viewBox="0 0 64 64">
          <rect x="17" y="22" width="18" height="18" rx="3"></rect>
          <rect x="29" y="14" width="18" height="18" rx="3"></rect>
          <rect x="31" y="30" width="18" height="18" rx="3"></rect>
        </svg>
      `;
    case "cat":
      return `
        <svg class="assessment-stage-icon" viewBox="0 0 64 64">
          <circle cx="22" cy="24" r="4"></circle>
          <circle cx="42" cy="24" r="4"></circle>
          <circle cx="16" cy="34" r="4"></circle>
          <circle cx="48" cy="34" r="4"></circle>
          <path d="M23 46c0-6 4-10 9-10s9 4 9 10c0 4-4 7-9 7s-9-3-9-7z"></path>
        </svg>
      `;
    case "balance":
    default:
      return `
        <svg class="assessment-stage-icon" viewBox="0 0 64 64">
          <path d="M32 16v28"></path>
          <path d="M20 24h24"></path>
          <path d="M14 26l6 10H8z"></path>
          <path d="M44 26l6 10H38z"></path>
          <path d="M26 48h12"></path>
        </svg>
      `;
  }
}
