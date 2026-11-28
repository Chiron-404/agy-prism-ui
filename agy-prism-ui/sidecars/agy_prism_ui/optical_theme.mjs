export function createOpticalThemeEngine() {
  const DEFAULT_OPTICAL = Object.freeze({
    opticalLightTheme: 'crystal',
    opticalDarkTheme: 'obsidian',
    opticalPrismRim: true,
    opticalGlass: true,
    opticalMotion: true,
    opticalCodeTools: true,
  });

  const LIGHT_PALETTES = {
    crystal: {
      sidebar: '#EBF1F8',
      sidebarMuted: 'rgba(30, 64, 130, 0.068)',
      background: '#F5F8FC',
      content: '#F5F8FC',
      card: '#FFFFFF',
      glass: 'rgba(255, 255, 255, 0.94)',
      cardBorder: 'rgba(25, 45, 85, 0.085)',
      border: 'rgba(25, 45, 85, 0.07)',
      glassBorder: 'rgba(25, 45, 85, 0.09)',
      foreground: '#0D1321',
      secondary: '#334155',
      muted: '#64748B',
      primary: '#2563EB',
    },
    alabaster: {
      sidebar: '#ECE6DC',
      sidebarMuted: 'rgba(68, 52, 32, 0.068)',
      background: '#F7F4EE',
      content: '#F7F4EE',
      card: '#FDFBF7',
      glass: 'rgba(253, 251, 247, 0.95)',
      cardBorder: 'rgba(54, 42, 26, 0.09)',
      border: 'rgba(54, 42, 26, 0.075)',
      glassBorder: 'rgba(54, 42, 26, 0.095)',
      foreground: '#1C1917',
      secondary: '#44403C',
      muted: '#78716C',
      primary: '#B45309',
    },
  };

  const DARK_PALETTES = {
    obsidian: {
      sidebar: '#090A0E',
      sidebarMuted: 'rgba(148, 179, 255, 0.075)',
      background: '#0E1016',
      content: '#0E1016',
      card: '#141721',
      glass: 'rgba(20, 23, 33, 0.94)',
      cardBorder: 'rgba(200, 220, 255, 0.09)',
      border: 'rgba(200, 220, 255, 0.075)',
      glassBorder: 'rgba(200, 220, 255, 0.10)',
      foreground: '#F1F5F9',
      secondary: '#CBD5E1',
      muted: '#8B97AD',
      primary: '#5BA4FF',
    },
    warm: {
      sidebar: '#11100F',
      sidebarMuted: 'rgba(235, 200, 160, 0.07)',
      background: '#161513',
      content: '#161513',
      card: '#1D1B18',
      glass: 'rgba(29, 27, 24, 0.94)',
      cardBorder: 'rgba(235, 215, 190, 0.09)',
      border: 'rgba(235, 215, 190, 0.075)',
      glassBorder: 'rgba(235, 215, 190, 0.10)',
      foreground: '#F5F1EB',
      secondary: '#D6CFC5',
      muted: '#9A9185',
      primary: '#E09145',
    },
  };

  function paletteBlock(p) {
    return [
      `--sidebar: ${p.sidebar} !important;`,
      `--sidebar-muted: ${p.sidebarMuted} !important;`,
      `--background: ${p.background} !important;`,
      `--content: ${p.content} !important;`,
      `--card: ${p.card} !important;`,
      `--glass: ${p.glass} !important;`,
      `--card-border: ${p.cardBorder} !important;`,
      `--border: ${p.border} !important;`,
      `--glass-border: ${p.glassBorder} !important;`,
      `--foreground: ${p.foreground} !important;`,
      `--secondary-foreground: ${p.secondary} !important;`,
      `--muted-foreground: ${p.muted} !important;`,
      `--primary: ${p.primary} !important;`,
      `--body-background: ${p.background};`,
    ].join(' ');
  }

  function buildCss() {
    const lightSelector = (name) =>
      `html[data-agy-opt-light="${name}"]:has(> body.theme-light), html[data-agy-opt-light="${name}"][style*="color-scheme: light"], html[data-agy-opt-light="${name}"]:has(> body.theme-light) > body`;
    const darkSelector = (name) =>
      `html[data-agy-opt-dark="${name}"]:has(> body.theme-dark), html[data-agy-opt-dark="${name}"][style*="color-scheme: dark"], html[data-agy-opt-dark="${name}"]:has(> body.theme-dark) > body`;

    return `
/* Agy Prism UI — Optical UI (clean-room macOS Smoked Glass + Gemini Prism) */
html[data-agy-opt-any="1"] body:not([data-has-browser-hole="true"]) {
  background-color: var(--body-background, var(--background)) !important;
  color: var(--foreground) !important;
  -webkit-font-smoothing: antialiased;
}
html[data-agy-opt-any="1"] body[data-has-browser-hole="true"] {
  --body-background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
}
html[data-agy-opt-any="1"] div:has(+ .agy-inset-shell),
html[data-agy-opt-any="1"] div:has(+ .agy-inset-shell) > div {
  background-color: var(--shell, var(--background)) !important;
}
html[data-agy-opt-any="1"]:not([data-agy-hm-open="1"]) [data-testid="conversation-row-sidebar"][data-selected="true"],
html[data-agy-opt-any="1"]:not([data-agy-hm-open="1"]) .agy-sidebar-row.bg-sidebar-secondary,
html[data-agy-opt-any="1"]:not([data-agy-hm-open="1"]) [data-testid="sidebar-navigation-items"] :is(a, button).bg-sidebar-secondary:not(#agy-heatmap-nav-btn),
html[data-agy-opt-any="1"] #agy-heatmap-nav-btn[data-active="true"] {
  background-color: var(--background) !important;
  --row-bg: var(--background) !important;
  color: var(--foreground) !important;
  box-shadow: inset 0 0 0 1px var(--border) !important;
}
html[data-agy-hm-open="1"] [data-testid="sidebar-navigation-items"] :is(a, button).bg-sidebar-secondary:not(#agy-heatmap-nav-btn) {
  background-color: transparent !important;
  color: var(--secondary-foreground) !important;
  box-shadow: none !important;
}
html[data-agy-hm-open="1"] [data-testid="sidebar-navigation-items"] :is(a, button).bg-sidebar-secondary:not(#agy-heatmap-nav-btn):hover {
  background-color: var(--sidebar-muted) !important;
  color: var(--foreground) !important;
}
html[data-agy-hm-open="1"] [data-testid="conversation-row-sidebar"][data-selected="true"],
html[data-agy-hm-open="1"] .agy-sidebar-row.bg-sidebar-secondary {
  background-color: transparent !important;
  --row-bg: transparent !important;
  box-shadow: none !important;
}
html[data-agy-hm-open="1"] [data-testid="conversation-row-sidebar"][data-selected="true"]:hover,
html[data-agy-hm-open="1"] .agy-sidebar-row.bg-sidebar-secondary:hover {
  background-color: var(--sidebar-muted) !important;
  --row-bg: var(--sidebar-muted) !important;
}
html[data-agy-hm-open="1"] [data-testid="new-conversation-button"].bg-card {
  background-color: var(--background) !important;
}
html[data-agy-hm-open="1"] [data-testid="new-conversation-button"].bg-card:hover {
  background-color: var(--card) !important;
}

${lightSelector('crystal')} { ${paletteBlock(LIGHT_PALETTES.crystal)} --agy-opt-spec: rgba(255, 255, 255, 0.92); --agy-opt-elev: 0 1px 2px rgba(15, 23, 42, 0.045), 0 10px 26px -10px rgba(15, 35, 75, 0.10); --agy-opt-menu-elev: 0 4px 12px -2px rgba(15, 23, 42, 0.07), 0 18px 38px -10px rgba(15, 35, 75, 0.16); --agy-opt-bubble-bg: color-mix(in srgb, #EBF1F8 64%, #FFFFFF); --agy-opt-rim-hover: 0.26; --agy-opt-rim-focus: 0.36; --agy-opt-bloom-hover: 0.34; --agy-opt-bloom-focus: 0.46; --agy-opt-rim-halo: rgba(37, 99, 235, 0.14); }
${lightSelector('alabaster')} { ${paletteBlock(LIGHT_PALETTES.alabaster)} --agy-opt-spec: rgba(255, 255, 255, 0.88); --agy-opt-elev: 0 1px 2px rgba(42, 32, 20, 0.05), 0 10px 26px -10px rgba(68, 52, 32, 0.11); --agy-opt-menu-elev: 0 4px 12px -2px rgba(42, 32, 20, 0.08), 0 18px 38px -10px rgba(68, 52, 32, 0.16); --agy-opt-bubble-bg: color-mix(in srgb, #ECE6DC 64%, #FDFBF7); --agy-opt-rim-hover: 0.24; --agy-opt-rim-focus: 0.34; --agy-opt-bloom-hover: 0.32; --agy-opt-bloom-focus: 0.44; --agy-opt-rim-halo: rgba(180, 83, 9, 0.12); }
${darkSelector('obsidian')} { ${paletteBlock(DARK_PALETTES.obsidian)} --agy-opt-spec: rgba(255, 255, 255, 0.085); --agy-opt-elev: 0 1px 2px rgba(0, 0, 0, 0.42), 0 14px 32px -12px rgba(0, 0, 0, 0.56); --agy-opt-menu-elev: 0 4px 14px -2px rgba(0, 0, 0, 0.48), 0 22px 44px -10px rgba(0, 0, 0, 0.68); --agy-opt-bubble-bg: color-mix(in srgb, #141721 82%, #1E2436); --agy-opt-rim-hover: 0.32; --agy-opt-rim-focus: 0.42; --agy-opt-bloom-hover: 0.40; --agy-opt-bloom-focus: 0.54; --agy-opt-rim-halo: rgba(91, 164, 255, 0.18); }
${darkSelector('warm')} { ${paletteBlock(DARK_PALETTES.warm)} --agy-opt-spec: rgba(255, 245, 230, 0.075); --agy-opt-elev: 0 1px 2px rgba(0, 0, 0, 0.42), 0 14px 32px -12px rgba(0, 0, 0, 0.56); --agy-opt-menu-elev: 0 4px 14px -2px rgba(0, 0, 0, 0.48), 0 22px 44px -10px rgba(0, 0, 0, 0.68); --agy-opt-bubble-bg: color-mix(in srgb, #1D1B18 82%, #292520); --agy-opt-rim-hover: 0.30; --agy-opt-rim-focus: 0.40; --agy-opt-bloom-hover: 0.38; --agy-opt-bloom-focus: 0.50; --agy-opt-rim-halo: rgba(224, 145, 69, 0.16); }

/* 1. Gemini Prism-Spectrum Halo Marquee (whisper 1px hairline + tight restrained halo aura; Queued takes priority over Composer) */
@property --agy-prism-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}
@keyframes agy-opt-prism-spin {
  from { --agy-prism-angle: 0deg; }
  to { --agy-prism-angle: 360deg; }
}
html[data-agy-opt-prism="1"] .surface-composer {
  transition: box-shadow 420ms cubic-bezier(0.22, 1, 0.36, 1) !important;
}
html[data-agy-opt-prism="1"] .surface-composer::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 1px;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 420ms cubic-bezier(0.22, 1, 0.36, 1);
  background: radial-gradient(280px circle at var(--agy-px, 50%) var(--agy-py, 50%), rgba(56, 189, 248, 0.45), rgba(66, 133, 244, 0.34) 40%, rgba(155, 114, 203, 0.24) 70%, transparent 88%);
}
html[data-agy-opt-prism="1"] .surface-composer::after {
  content: '';
  position: absolute;
  inset: -3.5px;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
  filter: blur(9px);
  opacity: 0;
  transition: opacity 420ms cubic-bezier(0.22, 1, 0.36, 1);
  background: radial-gradient(260px circle at var(--agy-px, 50%) var(--agy-py, 50%), rgba(56, 189, 248, 0.42), rgba(66, 133, 244, 0.32) 40%, rgba(155, 114, 203, 0.22) 70%, transparent 90%);
}
html[data-agy-opt-prism="1"] .surface-composer[data-agy-opt-near="1"]::before {
  opacity: calc(var(--agy-near-alpha, 0) * var(--agy-opt-rim-hover, 0.26));
  transition: opacity 160ms ease-out;
}
html[data-agy-opt-prism="1"] .surface-composer[data-agy-opt-near="1"]::after {
  opacity: calc(var(--agy-near-alpha, 0) * var(--agy-opt-bloom-hover, 0.34));
  transition: opacity 160ms ease-out;
}
html[data-agy-opt-prism="1"]:not([data-agy-opt-has-queue="1"]) .surface-composer[data-agy-opt-typing="1"],
html[data-agy-opt-prism="1"][data-agy-opt-running="1"]:not([data-agy-opt-has-queue="1"]) .surface-composer {
  box-shadow: 0 10px 28px -12px var(--agy-opt-rim-halo, rgba(66, 133, 244, 0.14)) !important;
}
html[data-agy-opt-prism="1"]:not([data-agy-opt-has-queue="1"]) .surface-composer[data-agy-opt-typing="1"]::before,
html[data-agy-opt-prism="1"][data-agy-opt-running="1"]:not([data-agy-opt-has-queue="1"]) .surface-composer::before {
  opacity: var(--agy-opt-rim-focus, 0.36);
  transition: opacity 480ms cubic-bezier(0.22, 1, 0.36, 1);
  background: conic-gradient(from var(--agy-prism-angle), transparent 0deg, transparent 150deg, rgba(56, 189, 248, 0.36) 210deg, rgba(66, 133, 244, 0.56) 268deg, rgba(155, 114, 203, 0.46) 318deg, rgba(255, 255, 255, 0.45) 348deg, transparent 360deg);
  animation: agy-opt-prism-spin 4.2s linear infinite;
}
html[data-agy-opt-prism="1"]:not([data-agy-opt-has-queue="1"]) .surface-composer[data-agy-opt-typing="1"]::after,
html[data-agy-opt-prism="1"][data-agy-opt-running="1"]:not([data-agy-opt-has-queue="1"]) .surface-composer::after {
  opacity: var(--agy-opt-bloom-focus, 0.46);
  transition: opacity 480ms cubic-bezier(0.22, 1, 0.36, 1);
  background: conic-gradient(from var(--agy-prism-angle), transparent 0deg, transparent 175deg, rgba(56, 189, 248, 0.36) 225deg, rgba(66, 133, 244, 0.56) 275deg, rgba(155, 114, 203, 0.46) 322deg, rgba(56, 189, 248, 0.16) 348deg, transparent 360deg);
  animation: agy-opt-prism-spin 4.2s linear infinite;
}
html[data-agy-opt-prism="1"]:not([data-agy-opt-has-queue="1"]) .surface-composer[data-agy-opt-typing="1"]::before,
html[data-agy-opt-prism="1"]:not([data-agy-opt-has-queue="1"]) .surface-composer[data-agy-opt-typing-box="1"]:not([data-agy-opt-near="1"])::before {
  top: calc(var(--agy-card-top, 1px) - 1px);
}
html[data-agy-opt-prism="1"]:not([data-agy-opt-has-queue="1"]) .surface-composer[data-agy-opt-typing="1"]::after,
html[data-agy-opt-prism="1"]:not([data-agy-opt-has-queue="1"]) .surface-composer[data-agy-opt-typing-box="1"]:not([data-agy-opt-near="1"])::after {
  top: calc(var(--agy-card-top, 1px) - 4.5px);
}

/* 2. macOS Smoked Glass Specular Surfaces + Queued Messages Card (Priority Marquee Owner) */
html[data-agy-opt-glass="1"] .surface-composer-card {
  box-shadow: inset 0 1px 0 var(--agy-opt-spec, rgba(255, 255, 255, 0.10)), var(--agy-opt-elev, 0 8px 24px -8px rgba(0, 0, 0, 0.14)) !important;
}
html[data-agy-opt-glass="1"] [data-testid="queued-messages-card"] {
  position: relative !important;
  z-index: 1 !important;
  backdrop-filter: blur(18px) saturate(1.2);
  box-shadow: inset 0 1px 0 var(--agy-opt-spec, rgba(255, 255, 255, 0.85)), var(--agy-opt-elev, 0 10px 26px -10px rgba(15, 35, 75, 0.12)) !important;
  transition: box-shadow 380ms cubic-bezier(0.22, 1, 0.36, 1) !important;
}
html[data-agy-opt-prism="1"] [data-testid="queued-messages-card"] {
  position: relative !important;
  z-index: 1 !important;
}
html[data-agy-opt-prism="1"] [data-testid="queued-messages-card"]::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 1px;
  border-radius: inherit;
  pointer-events: none;
  z-index: 1;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 380ms cubic-bezier(0.22, 1, 0.36, 1);
  background: radial-gradient(280px circle at var(--agy-px, 50%) var(--agy-py, 50%), rgba(56, 189, 248, 0.45), rgba(66, 133, 244, 0.34) 40%, rgba(155, 114, 203, 0.24) 70%, transparent 88%);
}
html[data-agy-opt-prism="1"] [data-testid="queued-messages-card"][data-agy-opt-near="1"]::before {
  opacity: calc(var(--agy-near-alpha, 0) * var(--agy-opt-rim-hover, 0.26));
  transition: opacity 160ms ease-out;
}
html[data-agy-opt-prism="1"][data-agy-opt-running="1"] [data-testid="queued-messages-card"]::before {
  opacity: var(--agy-opt-rim-focus, 0.36);
  transition: opacity 420ms cubic-bezier(0.22, 1, 0.36, 1);
  background: conic-gradient(from var(--agy-prism-angle), transparent 0deg, transparent 150deg, rgba(56, 189, 248, 0.36) 210deg, rgba(66, 133, 244, 0.56) 268deg, rgba(155, 114, 203, 0.46) 318deg, rgba(255, 255, 255, 0.45) 348deg, transparent 360deg);
  animation: agy-opt-prism-spin 4.2s linear infinite;
}
html[data-agy-opt-prism="1"] .hidden-if-empty:has(> [data-testid="queued-messages-card"])::after {
  content: '';
  position: absolute;
  inset: -3.5px;
  border-radius: 20px;
  pointer-events: none;
  z-index: 0;
  filter: blur(9px);
  opacity: 0;
  transition: opacity 420ms cubic-bezier(0.22, 1, 0.36, 1);
  background: radial-gradient(260px circle at var(--agy-px, 50%) var(--agy-py, 50%), rgba(56, 189, 248, 0.42), rgba(66, 133, 244, 0.32) 40%, rgba(155, 114, 203, 0.22) 70%, transparent 90%);
}
html[data-agy-opt-prism="1"] .hidden-if-empty:has(> [data-testid="queued-messages-card"][data-agy-opt-near="1"])::after {
  opacity: calc(var(--agy-near-alpha, 0) * var(--agy-opt-bloom-hover, 0.34));
  transition: opacity 160ms ease-out;
}
html[data-agy-opt-prism="1"][data-agy-opt-running="1"] .hidden-if-empty:has(> [data-testid="queued-messages-card"])::after {
  opacity: var(--agy-opt-bloom-focus, 0.46);
  transition: opacity 480ms cubic-bezier(0.22, 1, 0.36, 1);
  background: conic-gradient(from var(--agy-prism-angle), transparent 0deg, transparent 175deg, rgba(56, 189, 248, 0.36) 225deg, rgba(66, 133, 244, 0.56) 275deg, rgba(155, 114, 203, 0.46) 322deg, rgba(56, 189, 248, 0.16) 348deg, transparent 360deg);
  animation: agy-opt-prism-spin 4.2s linear infinite;
}
html[data-agy-opt-glass="1"] .agy-user-bubble-frame {
  box-shadow: var(--agy-opt-elev, 0 4px 14px -4px rgba(0, 0, 0, 0.10)) !important;
}
html[data-agy-opt-glass="1"] .agy-user-bubble {
  background: var(--agy-opt-bubble-bg, var(--card)) !important;
  box-shadow: inset 0 1px 0 var(--agy-opt-spec, rgba(255, 255, 255, 0.10)) !important;
}
html[data-agy-opt-glass="1"] pre {
  box-shadow: inset 0 1px 0 var(--agy-opt-spec, rgba(255, 255, 255, 0.06)) !important;
  border-radius: 10px;
}
html[data-agy-opt-glass="1"] :is(.surface-glass, [role="menu"], [role="listbox"], [data-slot="popover-content"], [data-slot="dropdown-menu-content"]) {
  box-shadow: inset 0 1px 0 var(--agy-opt-spec, rgba(255, 255, 255, 0.85)), var(--agy-opt-menu-elev, 0 16px 36px -10px rgba(0, 0, 0, 0.22)) !important;
  backdrop-filter: blur(18px) saturate(1.2);
}
html[data-agy-opt-prism="1"] :is(.surface-glass, [role="menu"], [role="listbox"], [data-slot="popover-content"], [data-slot="dropdown-menu-content"]) {
  box-shadow: inset 0 1px 0 var(--agy-opt-spec, rgba(255, 255, 255, 0.85)), 0 0 22px -6px var(--agy-opt-rim-halo, rgba(66, 133, 244, 0.20)), var(--agy-opt-menu-elev, 0 16px 36px -10px rgba(0, 0, 0, 0.22)) !important;
  transition: box-shadow 280ms cubic-bezier(0.22, 1, 0.36, 1) !important;
}
html[data-agy-opt-prism="1"] :is(.surface-glass, [role="menu"], [role="listbox"], [data-slot="popover-content"], [data-slot="dropdown-menu-content"]):hover {
  box-shadow: inset 0 1px 0 var(--agy-opt-spec, rgba(255, 255, 255, 0.85)), 0 0 28px -4px var(--agy-opt-rim-halo, rgba(66, 133, 244, 0.28)), var(--agy-opt-menu-elev, 0 16px 36px -10px rgba(0, 0, 0, 0.22)) !important;
}
html[data-agy-opt-prism="1"] :is(.surface-glass, [role="menu"], [role="listbox"], [data-slot="popover-content"], [data-slot="dropdown-menu-content"])::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 1px;
  border-radius: inherit;
  pointer-events: none;
  z-index: 1;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  opacity: 0.24;
  transition: opacity 280ms cubic-bezier(0.22, 1, 0.36, 1);
  background: radial-gradient(260px circle at var(--agy-mx, 50%) var(--agy-my, 10%), rgba(56, 189, 248, 0.45), rgba(66, 133, 244, 0.34) 38%, rgba(155, 114, 203, 0.22) 70%, transparent 90%);
}
html[data-agy-opt-prism="1"] :is(.surface-glass, [role="menu"], [role="listbox"], [data-slot="popover-content"], [data-slot="dropdown-menu-content"]):hover::before {
  opacity: 0.38;
}

/* 3. Zero-DOM CSS.highlights Streaming Ink Fade + Damped Spring Micro-motion */
html[data-agy-opt-motion="1"]::highlight(agy-ink-1) {
  color: color-mix(in srgb, var(--foreground, currentColor) 34%, transparent);
}
html[data-agy-opt-motion="1"]::highlight(agy-ink-2) {
  color: color-mix(in srgb, var(--foreground, currentColor) 64%, transparent);
}
html[data-agy-opt-motion="1"]::highlight(agy-ink-3) {
  color: color-mix(in srgb, var(--foreground, currentColor) 86%, transparent);
}
html[data-agy-opt-motion="1"] .agy-button {
  transition: background-color 140ms ease, color 140ms ease, border-color 140ms ease, transform 160ms cubic-bezier(0.22, 1.08, 0.36, 1) !important;
}
html[data-agy-opt-motion="1"] .agy-button:active:not(:disabled) {
  transform: scale(0.985);
}

/* 4. Sticky Code Header & Manual Long-Code Fold */
html[data-agy-opt-code="1"] [data-agy-opt-sticky-head="1"] {
  position: sticky;
  top: 0;
  z-index: 6;
  background: color-mix(in srgb, var(--card, #141721) 88%, transparent);
  backdrop-filter: blur(8px);
}
html[data-agy-opt-code="1"] pre[data-agy-opt-folded="1"] {
  max-height: 240px !important;
  overflow: hidden !important;
  -webkit-mask-image: linear-gradient(to bottom, #000 72%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 72%, transparent 100%);
}
.agy-opt-fold-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--border, rgba(128, 128, 140, 0.22));
  background: color-mix(in srgb, var(--card, #ffffff) 75%, transparent);
  color: var(--muted-foreground, #71717a);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
  cursor: pointer;
  margin-left: 6px;
  flex-shrink: 0;
  transition: color 120ms ease, border-color 120ms ease;
}
.agy-opt-fold-btn:hover {
  color: var(--primary, #2563eb);
  border-color: color-mix(in srgb, var(--primary, #2563eb) 45%, transparent);
}
.agy-opt-fold-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

@media (prefers-reduced-motion: reduce) {
  html[data-agy-opt-prism="1"] .surface-composer[data-agy-opt-typing="1"]::before,
  html[data-agy-opt-prism="1"] .surface-composer[data-agy-opt-typing="1"]::after,
  html[data-agy-opt-prism="1"][data-agy-opt-running="1"] .surface-composer::before,
  html[data-agy-opt-prism="1"][data-agy-opt-running="1"] .surface-composer::after,
  html[data-agy-opt-prism="1"][data-agy-opt-running="1"] [data-testid="queued-messages-card"]::before,
  html[data-agy-opt-prism="1"][data-agy-opt-running="1"] .hidden-if-empty:has(> [data-testid="queued-messages-card"])::after {
    animation: none !important;
  }
  html[data-agy-opt-motion="1"] .agy-button {
    transition: none !important;
  }
}
`;
  }

  let currentPrefs = { ...DEFAULT_OPTICAL };
  let active = false;
  let pointerBound = false;
  let lastPointer = null;
  let onDocPointerMove = null;
  let onDocPointerLeave = null;
  let onDocInput = null;
  let typingTimer = 0;
  let typingBoxTimer = 0;
  let seenTextLengths = new WeakMap();
  let inkWaves = []; // { range, stage: 1..3 }
  let inkTimer = 0;
  let codeObserver = null;
  let codeTimer = 0;

  function ensureStyle() {
    if (typeof document === 'undefined' || !document.head) return null;
    const css = buildCss();
    let el = document.getElementById('agy-optical-style');
    if (!el) {
      el = document.createElement('style');
      el.id = 'agy-optical-style';
      el.textContent = css;
      document.head.appendChild(el);
    } else if (el.textContent !== css) {
      el.textContent = css;
    }
    return el;
  }

  function removeStyle() {
    if (typeof document === 'undefined') return;
    document.getElementById('agy-optical-style')?.remove();
  }

  function clearNearState(cardEl) {
    if (!cardEl) return;
    cardEl.style.setProperty('--agy-near-alpha', '0');
    cardEl.style.removeProperty('--agy-px');
    cardEl.style.removeProperty('--agy-py');
    cardEl.removeAttribute('data-agy-opt-near');
    if (cardEl.matches?.('[data-testid="queued-messages-card"]') && cardEl.parentElement) {
      cardEl.parentElement.style.setProperty('--agy-near-alpha', '0');
      cardEl.parentElement.style.removeProperty('--agy-px');
      cardEl.parentElement.style.removeProperty('--agy-py');
    }
  }

  function updateTrackedNear(clientX, clientY) {
    if (typeof document === 'undefined') return;
    const trackedSelector = '.surface-composer, [data-testid="queued-messages-card"]';
    const PROXIMITY_RADIUS = 120;
    const setIfChanged = (el, prop, val) => {
      if (el.style.getPropertyValue(prop) !== val) el.style.setProperty(prop, val);
    };
    for (const cardEl of document.querySelectorAll(trackedSelector)) {
      const r = cardEl.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) {
        if (cardEl.hasAttribute('data-agy-opt-near')) clearNearState(cardEl);
        continue;
      }
      const dx = Math.max(r.left - clientX, 0, clientX - r.right);
      const dy = Math.max(r.top - clientY, 0, clientY - r.bottom);
      const dist = Math.hypot(dx, dy);
      if (dist < PROXIMITY_RADIUS) {
        const alpha = Math.pow(1 - dist / PROXIMITY_RADIUS, 1.35);
        const px = Math.round(clientX - r.left) + 'px';
        const py = Math.round(clientY - r.top) + 'px';
        const aStr = alpha.toFixed(3);
        setIfChanged(cardEl, '--agy-px', px);
        setIfChanged(cardEl, '--agy-py', py);
        setIfChanged(cardEl, '--agy-near-alpha', aStr);
        if (cardEl.matches?.('[data-testid="queued-messages-card"]') && cardEl.parentElement) {
          setIfChanged(cardEl.parentElement, '--agy-px', px);
          setIfChanged(cardEl.parentElement, '--agy-py', py);
          setIfChanged(cardEl.parentElement, '--agy-near-alpha', aStr);
        }
        if (cardEl.getAttribute('data-agy-opt-near') !== '1') {
          cardEl.setAttribute('data-agy-opt-near', '1');
        }
      } else if (cardEl.hasAttribute('data-agy-opt-near')) {
        clearNearState(cardEl);
      }
    }
  }

  function refreshPointer(pt) {
    if (!pointerBound || typeof document === 'undefined') return;
    if (pt && Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
      lastPointer = { x: pt.x, y: pt.y };
    }
    if (lastPointer) {
      updateTrackedNear(lastPointer.x, lastPointer.y);
    }
  }

  function syncPointerTracker(enabled) {
    if (typeof document === 'undefined') return;
    const trackedSelector = '.surface-composer, [data-testid="queued-messages-card"]';
    if (!enabled) {
      if (pointerBound) {
        document.removeEventListener('pointermove', onDocPointerMove);
        document.removeEventListener('pointerleave', onDocPointerLeave);
        globalThis.removeEventListener?.('blur', onDocPointerLeave);
        document.removeEventListener('input', onDocInput, true);
        pointerBound = false;
      }
      lastPointer = null;
      if (typingTimer) {
        clearTimeout(typingTimer);
        typingTimer = 0;
      }
      if (typingBoxTimer) {
        clearTimeout(typingBoxTimer);
        typingBoxTimer = 0;
      }
      for (const el of document.querySelectorAll(trackedSelector)) {
        clearNearState(el);
        el.removeAttribute('data-agy-opt-typing');
        el.removeAttribute('data-agy-opt-typing-box');
      }
      return;
    }
    if (pointerBound) return;
    pointerBound = true;

    onDocPointerMove = (e) => {
      lastPointer = { x: e.clientX, y: e.clientY };
      const menu = e.target?.closest?.('.surface-glass, [role="menu"], [role="listbox"], [data-slot="popover-content"], [data-slot="dropdown-menu-content"]');
      if (menu) {
        const mr = menu.getBoundingClientRect();
        if (mr.width > 0 && mr.height > 0) {
          menu.style.setProperty('--agy-mx', Math.round(e.clientX - mr.left) + 'px');
          menu.style.setProperty('--agy-my', Math.round(e.clientY - mr.top) + 'px');
        }
      }
      updateTrackedNear(e.clientX, e.clientY);
    };

    onDocPointerLeave = () => {
      lastPointer = null;
      for (const cardEl of document.querySelectorAll(trackedSelector)) {
        if (cardEl.hasAttribute('data-agy-opt-near')) {
          clearNearState(cardEl);
        }
      }
    };

    onDocInput = (e) => {
      const composer = e.target?.closest?.('.surface-composer');
      if (!composer) return;
      const card = composer.querySelector('.surface-composer-card');
      if (card) {
        const topOff = Math.max(1, Math.round(card.getBoundingClientRect().top - composer.getBoundingClientRect().top));
        composer.style.setProperty('--agy-card-top', topOff + 'px');
      }
      if (composer.getAttribute('data-agy-opt-typing') !== '1') {
        composer.setAttribute('data-agy-opt-typing', '1');
      }
      if (composer.getAttribute('data-agy-opt-typing-box') !== '1') {
        composer.setAttribute('data-agy-opt-typing-box', '1');
      }
      if (typingTimer) clearTimeout(typingTimer);
      if (typingBoxTimer) {
        clearTimeout(typingBoxTimer);
        typingBoxTimer = 0;
      }
      typingTimer = setTimeout(() => {
        typingTimer = 0;
        for (const el of document.querySelectorAll('.surface-composer[data-agy-opt-typing="1"]')) {
          el.removeAttribute('data-agy-opt-typing');
        }
        typingBoxTimer = setTimeout(() => {
          typingBoxTimer = 0;
          for (const el of document.querySelectorAll('.surface-composer[data-agy-opt-typing-box="1"]')) {
            el.removeAttribute('data-agy-opt-typing-box');
          }
        }, 460);
      }, 2200);
    };

    document.addEventListener('pointermove', onDocPointerMove, { passive: true });
    document.addEventListener('pointerleave', onDocPointerLeave, { passive: true });
    globalThis.addEventListener?.('blur', onDocPointerLeave, { passive: true });
    document.addEventListener('input', onDocInput, { passive: true, capture: true });
  }

  function clearInkHighlights() {
    if (inkTimer) {
      clearTimeout(inkTimer);
      inkTimer = 0;
    }
    inkWaves = [];
    try {
      globalThis.CSS?.highlights?.delete('agy-ink-1');
      globalThis.CSS?.highlights?.delete('agy-ink-2');
      globalThis.CSS?.highlights?.delete('agy-ink-3');
    } catch {}
  }

  function paintInkHighlights() {
    const css = globalThis.CSS;
    const HighlightCtor = globalThis.Highlight;
    if (!css?.highlights || typeof HighlightCtor !== 'function') return;
    const b1 = [];
    const b2 = [];
    const b3 = [];
    for (const w of inkWaves) {
      if (w.stage === 1) b1.push(w.range);
      else if (w.stage === 2) b2.push(w.range);
      else if (w.stage === 3) b3.push(w.range);
    }
    if (b1.length) css.highlights.set('agy-ink-1', new HighlightCtor(...b1));
    else css.highlights.delete('agy-ink-1');
    if (b2.length) css.highlights.set('agy-ink-2', new HighlightCtor(...b2));
    else css.highlights.delete('agy-ink-2');
    if (b3.length) css.highlights.set('agy-ink-3', new HighlightCtor(...b3));
    else css.highlights.delete('agy-ink-3');
  }

  function scanStreamingInk(isRunning) {
    if (!currentPrefs.opticalMotion || !isRunning || typeof document === 'undefined' || !globalThis.CSS?.highlights || typeof globalThis.Highlight !== 'function') {
      if (!isRunning && inkWaves.length === 0) clearInkHighlights();
      return;
    }
    const responses = document.querySelectorAll('[data-testid="agent-response"], [data-testid="planner-response-text"]');
    const last = responses[responses.length - 1];
    if (!last) return;
    const walker = document.createTreeWalker(last, NodeFilter.SHOW_TEXT);
    let node;
    let added = false;
    while ((node = walker.nextNode())) {
      const len = node.nodeValue?.length || 0;
      if (len === 0) continue;
      const prev = seenTextLengths.get(node) ?? 0;
      if (len > prev) {
        seenTextLengths.set(node, len);
        try {
          const range = document.createRange();
          range.setStart(node, prev);
          range.setEnd(node, len);
          inkWaves.push({ range, stage: 1 });
          added = true;
        } catch {}
      }
    }
    if (added) {
      paintInkHighlights();
      if (!inkTimer) {
        const step = () => {
          inkTimer = 0;
          inkWaves = inkWaves.map(w => ({ range: w.range, stage: w.stage + 1 })).filter(w => w.stage <= 3);
          paintInkHighlights();
          if (inkWaves.length > 0) inkTimer = setTimeout(step, 85);
        };
        inkTimer = setTimeout(step, 85);
      }
    }
  }

  function clearCodeEnhancements() {
    if (typeof document === 'undefined') return;
    for (const btn of document.querySelectorAll('.agy-opt-fold-btn')) btn.remove();
    for (const bar of document.querySelectorAll('.agy-opt-fold-bar')) bar.remove();
    for (const el of document.querySelectorAll('[data-agy-opt-sticky-head]')) el.removeAttribute('data-agy-opt-sticky-head');
    for (const pre of document.querySelectorAll('pre[data-agy-opt-folded]')) pre.removeAttribute('data-agy-opt-folded');
    for (const pre of document.querySelectorAll('pre[data-agy-opt-code-bound]')) pre.removeAttribute('data-agy-opt-code-bound');
  }

  function formatFoldLabel(folded, lines, lang = 'zh-CN') {
    if (lang === 'en') return `${folded ? 'Expand' : 'Fold'} · ${lines} lines`;
    if (lang === 'ja') return `${folded ? '展開' : '折りたたむ'} · ${lines} 行`;
    if (lang === 'zh-TW') return `${folded ? '展開' : '摺疊'} · ${lines} 行`;
    return `${folded ? '展开' : '折叠'} · ${lines} 行`;
  }

  function enhanceCodeBlocks(isRunning) {
    if (typeof document === 'undefined' || !currentPrefs.opticalCodeTools) {
      clearCodeEnhancements();
      return;
    }
    const lang = ['en', 'zh-CN', 'zh-TW', 'ja'].includes(currentPrefs.language) ? currentPrefs.language : 'zh-CN';
    const pres = document.querySelectorAll('pre');
    if (!pres.length) return;
    const activeContainer = isRunning
      ? [...document.querySelectorAll('[data-testid="agent-response"], [data-testid="planner-response-text"]')].at(-1)
      : null;
    for (const pre of pres) {
      if (activeContainer && activeContainer.contains(pre)) continue;
      if (pre.closest('#agy-heatmap-page-host, #agy-heatmap-home-host, #agy-prism-host, #agy-capsule-host')) continue;
      const lines = (pre.textContent || '').split('\n').length;
      const prevSib = pre.previousElementSibling;
      const hasHead = prevSib && !prevSib.classList.contains('agy-opt-fold-bar') && prevSib.getBoundingClientRect().height > 16 && prevSib.getBoundingClientRect().height < 64;
      if (hasHead && !prevSib.hasAttribute('data-agy-opt-sticky-head')) {
        prevSib.setAttribute('data-agy-opt-sticky-head', '1');
      }
      if (lines < 36 || pre.hasAttribute('data-agy-opt-code-bound')) continue;
      pre.setAttribute('data-agy-opt-code-bound', '1');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'agy-opt-fold-btn';
      btn.dataset.agyOptLines = String(lines);
      btn.textContent = formatFoldLabel(false, lines, lang);
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const activeLang = ['en', 'zh-CN', 'zh-TW', 'ja'].includes(currentPrefs.language) ? currentPrefs.language : 'zh-CN';
        const isFolded = pre.getAttribute('data-agy-opt-folded') === '1';
        if (isFolded) {
          pre.removeAttribute('data-agy-opt-folded');
          btn.textContent = formatFoldLabel(false, lines, activeLang);
        } else {
          const topBefore = pre.getBoundingClientRect().top;
          pre.setAttribute('data-agy-opt-folded', '1');
          btn.textContent = formatFoldLabel(true, lines, activeLang);
          const delta = pre.getBoundingClientRect().top - topBefore;
          if (Math.abs(delta) > 4) pre.scrollIntoView?.({ block: 'nearest' });
        }
      });
      if (hasHead) {
        prevSib.appendChild(btn);
      } else {
        const bar = document.createElement('div');
        bar.className = 'agy-opt-fold-bar';
        bar.appendChild(btn);
        pre.insertAdjacentElement('afterend', bar);
      }
    }
  }

  function apply(prefs = {}) {
    currentPrefs = {
      opticalLightTheme: ['crystal', 'alabaster', 'native'].includes(prefs.opticalLightTheme) ? prefs.opticalLightTheme : DEFAULT_OPTICAL.opticalLightTheme,
      opticalDarkTheme: ['obsidian', 'warm', 'native'].includes(prefs.opticalDarkTheme) ? prefs.opticalDarkTheme : DEFAULT_OPTICAL.opticalDarkTheme,
      opticalPrismRim: typeof prefs.opticalPrismRim === 'boolean' ? prefs.opticalPrismRim : DEFAULT_OPTICAL.opticalPrismRim,
      opticalGlass: typeof prefs.opticalGlass === 'boolean' ? prefs.opticalGlass : DEFAULT_OPTICAL.opticalGlass,
      opticalMotion: typeof prefs.opticalMotion === 'boolean' ? prefs.opticalMotion : DEFAULT_OPTICAL.opticalMotion,
      opticalCodeTools: typeof prefs.opticalCodeTools === 'boolean' ? prefs.opticalCodeTools : DEFAULT_OPTICAL.opticalCodeTools,
      language: ['en', 'zh-CN', 'zh-TW', 'ja'].includes(prefs.language) ? prefs.language : (currentPrefs.language || 'zh-CN'),
    };

    const anyEnabled = currentPrefs.opticalLightTheme !== 'native'
      || currentPrefs.opticalDarkTheme !== 'native'
      || currentPrefs.opticalPrismRim
      || currentPrefs.opticalGlass
      || currentPrefs.opticalMotion
      || currentPrefs.opticalCodeTools;

    if (typeof document === 'undefined') return currentPrefs;
    const html = document.documentElement;
    if (!anyEnabled) {
      dispose();
      return currentPrefs;
    }

    active = true;
    ensureStyle();
    html.dataset.agyOptAny = '1';
    html.dataset.agyOptLight = currentPrefs.opticalLightTheme;
    html.dataset.agyOptDark = currentPrefs.opticalDarkTheme;
    html.dataset.agyOptPrism = currentPrefs.opticalPrismRim ? '1' : '0';
    html.dataset.agyOptGlass = currentPrefs.opticalGlass ? '1' : '0';
    html.dataset.agyOptMotion = currentPrefs.opticalMotion ? '1' : '0';
    html.dataset.agyOptCode = currentPrefs.opticalCodeTools ? '1' : '0';

    const isRunning = !!document.querySelector('[data-testid="input-cancel-button"]');
    html.dataset.agyOptRunning = isRunning ? '1' : '0';
    html.dataset.agyOptHasQueue = document.querySelector('[data-testid="queued-messages-card"]') ? '1' : '0';

    syncPointerTracker(currentPrefs.opticalPrismRim);
    scanStreamingInk(isRunning);
    enhanceCodeBlocks(isRunning);
    for (const foldBtn of document.querySelectorAll('.agy-opt-fold-btn[data-agy-opt-lines]')) {
      const pre = foldBtn.closest('.agy-opt-fold-bar')?.previousElementSibling || foldBtn.parentElement?.nextElementSibling;
      const isFolded = pre?.getAttribute?.('data-agy-opt-folded') === '1';
      const n = Number(foldBtn.dataset.agyOptLines) || 0;
      const nextText = formatFoldLabel(isFolded, n, currentPrefs.language);
      if (foldBtn.textContent !== nextText) foldBtn.textContent = nextText;
    }

    if ((currentPrefs.opticalPrismRim || currentPrefs.opticalMotion || currentPrefs.opticalCodeTools) && !codeObserver && document.body) {
      codeObserver = new MutationObserver(() => {
        const runningNow = !!document.querySelector('[data-testid="input-cancel-button"]');
        html.dataset.agyOptRunning = runningNow ? '1' : '0';
        html.dataset.agyOptHasQueue = document.querySelector('[data-testid="queued-messages-card"]') ? '1' : '0';
        if (currentPrefs.opticalMotion && runningNow) scanStreamingInk(true);
        if (currentPrefs.opticalCodeTools && !codeTimer) {
          codeTimer = setTimeout(() => {
            codeTimer = 0;
            enhanceCodeBlocks(!!document.querySelector('[data-testid="input-cancel-button"]'));
          }, 300);
        }
      });
      codeObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    } else if (!currentPrefs.opticalPrismRim && !currentPrefs.opticalMotion && !currentPrefs.opticalCodeTools && codeObserver) {
      codeObserver.disconnect();
      codeObserver = null;
    }

    return currentPrefs;
  }

  function dispose() {
    active = false;
    syncPointerTracker(false);
    clearInkHighlights();
    clearCodeEnhancements();
    if (codeTimer) {
      clearTimeout(codeTimer);
      codeTimer = 0;
    }
    if (codeObserver) {
      codeObserver.disconnect();
      codeObserver = null;
    }
    seenTextLengths = new WeakMap();
    removeStyle();
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      for (const attr of ['agyOptAny', 'agyOptLight', 'agyOptDark', 'agyOptPrism', 'agyOptGlass', 'agyOptMotion', 'agyOptCode', 'agyOptRunning', 'agyOptHasQueue']) {
        delete html.dataset[attr];
      }
    }
  }

  return {
    version: 14,
    DEFAULT_OPTICAL,
    LIGHT_PALETTES,
    DARK_PALETTES,
    buildCss,
    apply,
    dispose,
    refreshPointer,
    isActive: () => active,
  };
}

export const getOpticalThemeScript = () => `if (globalThis.__agyPrismOptical?.version !== 14) globalThis.__agyPrismOptical = (${createOpticalThemeEngine.toString()})();`;
