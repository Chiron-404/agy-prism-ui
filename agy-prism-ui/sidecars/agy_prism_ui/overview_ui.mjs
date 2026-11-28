export function createOverviewRenderer() {
  const CSS = `
:host {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  contain: inline-size;
  font-family: "Google Sans Flex", "Google Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: var(--foreground, #0d1321);
  line-height: 1.32;
  user-select: none;
  -webkit-font-smoothing: antialiased;
}
*, *::before, *::after { box-sizing: border-box; }
.ov-wrap {
  --agy-row-gap: 4px;
  --agy-section-gap: 7px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
}
.ov-head {
  display: flex;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  align-items: center;
  gap: 6px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  padding: 4px 6px 4px 8px;
  color: var(--foreground, #0d1321);
  font: inherit;
  text-align: left;
  cursor: pointer;
  outline: none;
}
.ov-head:focus-visible {
  box-shadow: inset 0 0 0 1px var(--ring, #388bfd);
}
.ov-title {
  font-size: 12px;
  font-weight: 450;
  color: var(--foreground, #0d1321);
  opacity: 0.5;
  white-space: nowrap;
  transition: opacity 150ms ease;
}
.ov-head:hover .ov-title,
.ov-head:focus-visible .ov-title {
  opacity: 1;
}
.ov-badge {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--border, rgba(25, 45, 85, 0.09));
  color: var(--muted-foreground, #64748b);
  font-size: 10.5px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  opacity: 0.5;
  white-space: nowrap;
  transition: opacity 150ms ease;
}
.ov-head:hover .ov-badge,
.ov-head:focus-visible .ov-badge {
  opacity: 1;
}
.ov-badge:empty { display: none; }
.ov-chev {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--muted-foreground, #64748b);
  opacity: 1;
  transform: rotate(0deg);
  transition: color 150ms ease, opacity 150ms ease, transform 150ms ease;
}
@media (hover: hover) {
  .ov-chev { opacity: 0; }
}
.ov-head:hover .ov-chev,
.ov-head:focus-visible .ov-chev {
  opacity: 1;
  color: var(--foreground, #0d1321);
}
.ov-head[aria-expanded="true"] .ov-chev {
  transform: rotate(90deg);
}
.ov-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 6px 2px 2px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
}
.ov-body[hidden] { display: none; }
.ov-card {
  padding: 9px 10px;
  border-radius: 12px;
  border: 1px solid var(--border, rgba(25, 45, 85, 0.085));
  background: color-mix(in srgb, var(--background, #f5f8fc) 72%, var(--card, #ffffff));
  width: 100%;
  min-width: 0;
  max-width: 100%;
}
.model-step-bar {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-bottom: var(--agy-section-gap);
  margin-bottom: var(--agy-section-gap);
  border-bottom: 1px solid var(--border, rgba(142, 142, 147, 0.24));
  font-variant-numeric: tabular-nums;
}
.model-step-bar[hidden] { display: none; }
.model-step-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
}
.model-step-left {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  overflow: hidden;
}
.model-phase-pill {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 500;
  padding: 1px 5px;
  border-radius: 99px;
  background: color-mix(in srgb, var(--foreground, currentColor) 10%, transparent);
  color: var(--muted-foreground, #8e8e93);
}
.model-phase-pill[data-phase="plan"] {
  background: rgba(99, 102, 241, 0.18);
  color: light-dark(#4f46e5, #818cf8);
}
.model-phase-pill[data-phase="execute"] {
  background: rgba(16, 185, 129, 0.18);
  color: light-dark(#059669, #34d399);
}
.model-step-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--foreground, #0d1321);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.model-effort-pill {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 500;
  padding: 1px 5px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--foreground, currentColor) 8%, transparent);
  color: var(--muted-foreground, #8e8e93);
}
.model-effort-pill[data-effort="XHigh"] { background: rgba(168, 85, 247, 0.16); color: light-dark(#7e22ce, #c084fc); }
.model-effort-pill[data-effort="High"] { background: rgba(56, 139, 253, 0.16); color: light-dark(#2563eb, #60a5fa); }
.model-effort-pill[data-effort="Medium"] { background: rgba(20, 184, 166, 0.16); color: light-dark(#0f766e, #2dd4bf); }
.model-effort-pill[data-effort="Low"] { background: rgba(113, 113, 122, 0.16); color: light-dark(#52525b, #a1a1aa); }
.model-effort-pill[data-effort="auto"] { background: rgba(212, 148, 10, 0.16); color: light-dark(#b45309, #f59e0b); }
.model-step-think {
  font-size: 11px;
  color: var(--muted-foreground, #8e8e93);
  white-space: nowrap;
  flex-shrink: 0;
}
.model-routing-row { display: flex; flex-wrap: wrap; gap: 4px; }
.model-route-chip {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 5px;
  background: color-mix(in srgb, var(--foreground, currentColor) 6%, transparent);
  color: var(--muted-foreground, #8e8e93);
  white-space: nowrap;
}
.model-route-chip[data-phase="plan"] { background: rgba(99, 102, 241, 0.12); color: light-dark(#4f46e5, #a5b4fc); }
.model-route-chip[data-phase="execute"] { background: rgba(16, 185, 129, 0.12); color: light-dark(#059669, #6ee7b7); }
.model-route-chip b { font-weight: 500; color: inherit; }
.cache-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  font-size: 11.5px;
  line-height: 1.35;
  padding-bottom: var(--agy-section-gap);
  margin-bottom: var(--agy-section-gap);
  border-bottom: 1px solid var(--border, rgba(142, 142, 147, 0.24));
}
.cache-left {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
  color: color-mix(in srgb, var(--foreground, #0d1321) 88%, transparent);
  white-space: nowrap;
}
.cache-left > .dot { width: 10px; height: 10px; flex-shrink: 0; }
.cache-pct { font-variant-numeric: tabular-nums; font-size: 11.5px; white-space: nowrap; }
.cache-k {
  text-align: right;
  color: var(--muted-foreground, #8e8e93);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  font-size: 11.5px;
}
.cache-k:empty { display: none; }
.summary-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  row-gap: 4px;
  margin-bottom: 6px;
}
.used-pct {
  font-size: 11.5px;
  color: var(--muted-foreground, #8e8e93);
}
.used-pct > .used-val {
  font-weight: 500;
  color: color-mix(in srgb, var(--foreground, #0d1321) 88%, transparent);
}
.used-fraction {
  margin-left: auto;
  white-space: nowrap;
  font-size: 11.5px;
  color: var(--muted-foreground, #8e8e93);
  font-variant-numeric: tabular-nums;
}
.progress-track {
  position: relative;
  width: 100%;
  height: 4px;
  background: rgba(142, 142, 147, 0.24);
  border-radius: 999px;
  display: flex;
  gap: 1.5px;
  overflow: hidden;
  margin-bottom: 8px;
}
.seg { height: 100%; border-radius: 999px; transition: width 0.25s ease; }
.list, .turn-bar-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: start;
  gap: 6px;
  row-gap: var(--agy-row-gap);
}
.turn-bar-list {
  grid-template-columns: minmax(calc((100% - 18px) / 4), max-content) minmax(0, 1fr) calc((100% - 18px) / 4) calc((100% - 18px) / 4);
}
.item-row, .turn-bar-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  column-gap: 5px;
  row-gap: 2px;
  min-width: 0;
}
.item-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.item-label, .turn-bar-label, .turn-bar-short {
  color: var(--muted-foreground, #8e8e93);
  font-size: 11px;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.turn-bar-item[data-turn-row="requests"] { container-type: inline-size; }
.turn-bar-short { display: none; }
@container (max-width: 39px) {
  .turn-bar-item[data-turn-row="requests"] .turn-bar-label { display: none; }
  .turn-bar-item[data-turn-row="requests"] .turn-bar-short { display: block; }
}
.item-row > .dot, .turn-bar-line {
  grid-row: 1 / span 2;
  align-self: stretch;
  width: 2.5px;
  margin: 2px 0;
  border-radius: 99px;
  flex-shrink: 0;
}
.turn-bar-line { background: color-mix(in srgb, var(--muted-foreground, #8e8e93) 55%, transparent); }
.item-row > .dot { grid-row: 1; }
.item-k, .item-pct, .turn-bar-val {
  grid-column: 2;
  color: var(--muted-foreground, #8e8e93);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  font-size: 11px;
  line-height: 1.25;
}
.ov-wrap:not([data-context-layout="rows"]) .item-pct { display: none; }
.ov-wrap[data-column-percent="true"]:not([data-context-layout="rows"]) .item-pct { display: block; }
.ov-wrap[data-column-label="false"]:not([data-context-layout="rows"]) .item-label,
.ov-wrap[data-column-value="false"]:not([data-context-layout="rows"]) .item-k { display: none; }
.ov-wrap[data-context-layout="rows"] .list { grid-template-columns: auto minmax(0, 1fr) auto auto; column-gap: 8px; align-items: center; }
.ov-wrap[data-context-layout="rows"] .item-row,
.ov-wrap[data-turn-layout="rows"] .turn-bar-item { grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; align-items: center; }
.ov-wrap[data-context-layout="rows"] .item-body { grid-column: 2 / -1; display: grid; grid-template-columns: subgrid; align-items: center; }
.ov-wrap[data-context-layout="rows"] .item-label { grid-column: 1; grid-row: 1; }
.ov-wrap[data-context-layout="rows"] .item-pct { grid-column: 2; grid-row: 1; justify-self: end; margin-right: 4px; }
.ov-wrap[data-context-layout="rows"] .item-k { grid-column: 3; grid-row: 1; justify-self: end; }
.ov-wrap[data-turn-layout="rows"] .turn-bar-list { grid-template-columns: auto minmax(0, 1fr) auto; column-gap: 8px; row-gap: var(--agy-row-gap); align-items: center; }
.ov-wrap[data-turn-layout="rows"] .turn-bar-label { grid-column: 2; grid-row: 1; display: block; }
.ov-wrap[data-turn-layout="rows"] .turn-bar-short { display: none; }
.ov-wrap[data-turn-layout="rows"] .turn-bar-item[data-turn-row="requests"] { container-type: normal; }
.ov-wrap[data-turn-layout="rows"] .turn-bar-val { grid-column: 3; grid-row: 1; justify-self: end; }
.ov-wrap[data-context-layout="rows"] .item-row > .dot,
.ov-wrap[data-turn-layout="rows"] .turn-bar-line { grid-column: 1; grid-row: 1; align-self: center; width: 10px; height: 10px; margin: 0; border-radius: 3px; }
.ov-wrap[data-context-marker="dot"][data-context-layout="rows"] .item-row > .dot,
.ov-wrap[data-turn-marker="dot"][data-turn-layout="rows"] .turn-bar-line { border-radius: 50%; }
.ov-wrap[data-show-context-breakdown="false"] .list { display: none; }
.item-label { order: var(--agy-order-label, 0); }
.item-k { order: var(--agy-order-value, 1); }
.item-pct { order: var(--agy-order-percent, 2); }
.ov-wrap[data-label-case="lowercase"] .cache-left,
.ov-wrap[data-label-case="lowercase"] .used-pct,
.ov-wrap[data-label-case="lowercase"] .item-label,
.ov-wrap[data-label-case="lowercase"] .turn-bar-label,
.ov-wrap[data-label-case="lowercase"] .turn-bar-short { text-transform: lowercase; }
.generation-block {
  margin-top: var(--agy-section-gap);
  padding-top: var(--agy-section-gap);
  border-top: 1px solid var(--border, rgba(142, 142, 147, 0.24));
  color: var(--muted-foreground, #8e8e93);
  font-variant-numeric: tabular-nums;
}
.ov-wrap [data-generation-block]:not([hidden]) + [data-turn-metrics-block] {
  border-top: 0;
  padding-top: 0;
  margin-top: var(--agy-section-gap);
}
.generation-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: 5px 10px;
  row-gap: var(--agy-row-gap);
}
.generation-row {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  font-size: 11.5px;
  color: var(--muted-foreground, #8e8e93);
}
[data-generation-row="speed"] { margin-left: auto; }
.generation-row > :first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.generation-row > :last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  color: color-mix(in srgb, var(--foreground, #0d1321) 88%, transparent);
}
[data-generation-row="timing"] > :last-child { font-weight: 400; color: var(--muted-foreground, #8e8e93); }
.generation-row[hidden], [data-generation-group][hidden], [data-generation-block][hidden], [data-turn-metrics-block][hidden] { display: none; }
.stats-history {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  font-variant-numeric: tabular-nums;
}
.stats-history[hidden] { display: none; }
.hist-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: var(--agy-section-gap);
}
.quota-group-title {
  font-size: 12px;
  font-weight: 500;
  color: color-mix(in srgb, var(--foreground, #0d1321) 88%, transparent);
}
.hist-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 99px;
  background: rgba(212, 148, 10, 0.16);
  color: #d4940a;
  border: 1px solid rgba(212, 148, 10, 0.35);
}
.hist-kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px 6px;
  margin-bottom: calc(var(--agy-section-gap) + 2px);
  min-width: 0;
}
.hist-kpi-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 5px;
  align-items: stretch;
  min-width: 0;
}
.hist-kpi-line {
  width: 2.5px;
  margin: 2px 0;
  border-radius: 99px;
  background: color-mix(in srgb, var(--muted-foreground, #8e8e93) 55%, transparent);
  flex-shrink: 0;
}
.hist-kpi-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.hist-kpi-label {
  font-size: 10.5px;
  color: var(--muted-foreground, #8e8e93);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hist-kpi-val {
  font-size: 11.5px;
  color: color-mix(in srgb, var(--foreground, currentColor) 88%, transparent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hist-charts-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 7px;
  margin-bottom: calc(var(--agy-section-gap) + 2px);
  min-width: 0;
}
.hist-chart-card {
  padding: 6px 8px;
  border-radius: 9px;
  border: 1px solid color-mix(in srgb, var(--border, rgba(142, 142, 147, 0.24)) 80%, transparent);
  background: var(--card, #ffffff);
  min-width: 0;
  overflow: hidden;
}
.hist-chart-card svg {
  width: 100%;
  max-width: 100%;
  height: auto;
  display: block;
}
.hist-chart-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 11px;
  color: color-mix(in srgb, var(--foreground, currentColor) 88%, transparent);
  font-weight: 500;
}
.hist-chart-top > span:first-child {
  white-space: nowrap;
  flex-shrink: 0;
}
.hist-chart-meta {
  font-size: 10px;
  font-weight: 400;
  color: var(--muted-foreground, #8e8e93);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hist-tabs {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--foreground, currentColor) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--foreground, currentColor) 10%, transparent);
  margin-bottom: 6px;
}
.hist-tab {
  border: 0;
  border-radius: 5px;
  padding: 2.5px 7px;
  background: transparent;
  color: var(--muted-foreground, #8e8e93);
  font: inherit;
  font-size: 10.5px;
  cursor: pointer;
}
.hist-tab[data-active="true"] {
  background: var(--card, color-mix(in srgb, var(--foreground, currentColor) 14%, transparent));
  color: var(--foreground, currentColor);
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}
.hist-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 210px;
  overflow-y: auto;
  scrollbar-width: thin;
  min-width: 0;
}
.hist-turn-item {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background: color-mix(in srgb, var(--foreground, currentColor) 3.5%, transparent);
  min-width: 0;
}
.hist-row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--foreground, currentColor) 3.5%, transparent);
  font-size: 10.5px;
  color: var(--muted-foreground, #8e8e93);
  min-width: 0;
}
.hist-row-turn,
.hist-row-req {
  width: 100%;
  border: 0;
  margin: 0;
  font: inherit;
  font-size: 10.5px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  transition: background-color 120ms ease;
}
.hist-row-turn {
  grid-template-columns: 30px minmax(0, 1fr) auto;
}
.hist-row-req {
  grid-template-columns: 32px minmax(0, 1fr) auto auto;
}
.hist-row-turn:hover,
.hist-row-req:hover {
  background: color-mix(in srgb, var(--foreground, currentColor) 4%, transparent);
}
.hist-turn-chev {
  display: inline-block;
  margin-left: 3px;
  opacity: 0.55;
  font-size: 9.5px;
  transition: transform 140ms ease;
}
.hist-row-turn[aria-expanded="true"] .hist-turn-chev,
.hist-row-req[aria-expanded="true"] .hist-turn-chev {
  transform: rotate(180deg);
}
.hist-turn-detail {
  padding: 3px 6px 5px 38px;
  font-size: 10px;
  color: var(--muted-foreground, #8e8e93);
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-top: 1px solid color-mix(in srgb, var(--border, rgba(142, 142, 147, 0.24)) 55%, transparent);
}
.hist-turn-detail[hidden] { display: none; }
.hist-turn-detail-line {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  flex-wrap: wrap;
}
.hist-turn-detail-sub {
  opacity: 0.85;
  word-break: break-word;
}
.hist-id { font-weight: 500; color: var(--foreground, currentColor); white-space: nowrap; }
.hist-cell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.hist-ctx { white-space: nowrap; text-align: right; color: var(--muted-foreground, #8e8e93); font-variant-numeric: tabular-nums; }
.hist-right { font-weight: 500; color: var(--foreground, currentColor); white-space: nowrap; text-align: right; }
.hist-empty { font-size: 10.5px; color: var(--muted-foreground, #8e8e93); padding: 8px 0; text-align: center; }
.hist-mtag {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  background: color-mix(in srgb, var(--foreground, currentColor) 8%, transparent);
  color: var(--foreground, currentColor);
}
.hist-mtag[data-phase="plan"] { background: rgba(99, 102, 241, 0.16); color: light-dark(#4f46e5, #818cf8); }
.hist-mtag[data-phase="execute"] { background: rgba(16, 185, 129, 0.16); color: light-dark(#059669, #34d399); }
`;

  function fmtK(n) {
    const v = Number(n) || 0;
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e5) return Math.round(v / 1e3) + 'K';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return String(v);
  }

  function fmtColK(n) {
    const v = Number(n) || 0;
    if (v >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (v >= 1e5) return Math.round(v / 1e3) + 'K';
    if (v >= 1e4) return (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return String(v);
  }

  function ensureStructure(host, presentation) {
    let shadow = host.shadowRoot;
    if (!shadow) {
      shadow = host.attachShadow({ mode: 'open' });
    }
    let wrap = shadow.getElementById('ov-telemetry-wrap');
    if (!wrap || wrap.dataset.ovVer !== '6') {
      shadow.innerHTML = `<style>${CSS}</style>`
        + `<div class="ov-wrap" id="ov-telemetry-wrap" data-ov-ver="6">`
        + `<button type="button" class="ov-head" id="ov-toggle-btn" aria-expanded="false">`
        + `<span class="ov-title" id="ov-title">Telemetry</span>`
        + `<span class="ov-badge" id="ov-badge"></span>`
        + `<span class="ov-chev" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4l4 4-4 4"/></svg></span>`
        + `</button>`
        + `<div class="ov-body" data-ov-body hidden>`
        + `<section class="ov-card ov-context-card" id="ov-context-card">`
        + `<div id="ov-model-step-bar" class="model-step-bar" hidden></div>`
        + `<div class="cache-bar" id="ov-row-cached">`
        + `<div class="cache-left"><span data-i18n="cache">Cache</span><span class="cache-pct" id="ov-val-cache-hit">0%</span><span class="dot" id="ov-dot-cached" style="display:inline-flex;align-items:center;justify-content:center;background:transparent"></span></div>`
        + `<div class="cache-k" id="ov-val-cache-hit-k"></div>`
        + `</div>`
        + `<div class="summary-row">`
        + `<div class="used-pct" data-context-tip="overview"><span class="used-val" id="ov-used-pct">0%</span> <span data-i18n="used">used</span></div>`
        + `<div class="used-fraction" id="ov-used-fraction" data-context-tip="overview">0 / --</div>`
        + `</div>`
        + `<div class="progress-track" data-context-tip="overview">`
        + `<div class="seg" id="ov-seg-turn0" style="width:0%;background:#d4940a"></div>`
        + `<div class="seg" id="ov-seg-read" style="width:0%;background:#388bfd"></div>`
        + `<div class="seg" id="ov-seg-think" style="width:0%;background:#00b386"></div>`
        + `<div class="seg" id="ov-seg-out" style="width:0%;background:#e86a24"></div>`
        + `</div>`
        + `<div class="list">`
        + `<div class="item-row" data-context-tip="turn0"><span class="dot" style="background:#d4940a"></span><div class="item-body"><span class="item-label" data-i18n="turn0">Turn0</span><span class="item-k" id="ov-val-turn0-k">0</span><span class="item-pct" id="ov-val-turn0-pct">0%</span></div></div>`
        + `<div class="item-row" data-context-tip="read"><span class="dot" style="background:#388bfd"></span><div class="item-body"><span class="item-label" data-i18n="read">Read</span><span class="item-k" id="ov-val-read-k">0</span><span class="item-pct" id="ov-val-read-pct">0%</span></div></div>`
        + `<div class="item-row" data-context-tip="think"><span class="dot" style="background:#00b386"></span><div class="item-body"><span class="item-label" data-i18n="think">Think</span><span class="item-k" id="ov-val-think-k">0</span><span class="item-pct" id="ov-val-think-pct">0%</span></div></div>`
        + `<div class="item-row" data-context-tip="write"><span class="dot" style="background:#e86a24"></span><div class="item-body"><span class="item-label" data-i18n="write">Write</span><span class="item-k" id="ov-val-out-k">0</span><span class="item-pct" id="ov-val-out-pct">0%</span></div></div>`
        + `</div>`
        + `<div class="generation-block" data-generation-block>${presentation.generationMarkup()}</div>`
        + `${presentation.turnMetricsMarkup()}`
        + `</section>`
        + `<section class="ov-card stats-history" id="ov-history-root" hidden></section>`
        + `</div>`
        + `</div>`;
      wrap = shadow.getElementById('ov-telemetry-wrap');
      const btn = shadow.getElementById('ov-toggle-btn');
      btn.addEventListener('click', () => { host._onToggle?.(); });
      shadow.getElementById('ov-row-cached').addEventListener('mouseenter', () => {
        if (host._latestData) {
          shadow.getElementById('ov-row-cached').title = presentation.cacheTooltip(host._latestData, host._labels, Date.now(), host._prefs);
        }
      });
    }
    return { shadow, wrap };
  }

  function renderOverviewTelemetry(host, data, options = {}) {
    if (!host) return false;
    const presentation = options.presentation || globalThis.__agyPrismPresentation;
    if (!presentation) return false;

    const expanded = Boolean(options.expanded);
    const prefs = options.prefs || data?.prefs || {};
    host._onToggle = options.onToggle;
    host.dataset.expanded = expanded ? 'true' : 'false';

    const { shadow, wrap } = ensureStructure(host, presentation);
    const labels = presentation.apply(wrap, prefs);
    const d = data || {};
    host._latestData = d;
    host._labels = labels;
    host._prefs = prefs;

    const btn = shadow.getElementById('ov-toggle-btn');
    const body = shadow.querySelector('[data-ov-body]');
    const titleEl = shadow.getElementById('ov-title');
    const badgeEl = shadow.getElementById('ov-badge');

    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    body.hidden = !expanded;
    titleEl.textContent = 'Telemetry';

    const maxCtx = d.maxContextTokens || 0;
    const ctx = d.contextTokens || 0;
    const hasMax = maxCtx > 0;
    const usedPct = hasMax ? Math.round((ctx / maxCtx) * 100) : 0;
    const pctDisplay = (hasMax ? usedPct : ctx === 0 ? '0' : '--') + '%';
    const speedTps = d.turnSpeed?.generation?.tps ?? d.generation?.tps;
    const speedText = prefs.showSpeed !== false && Number.isFinite(speedTps) && speedTps > 0
      ? `${speedTps.toFixed(1)} tok/s`
      : '';
    badgeEl.textContent = [pctDisplay, speedText].filter(Boolean).join(' · ');

    if (!expanded) return true;

    const footerModelText = options.footerModelText || d.composerModelText || '';
    presentation.renderSidebarStepModel(shadow.getElementById('ov-model-step-bar'), d.stepModel, labels, footerModelText);
    presentation.renderContextTooltips(wrap, d, labels);
    presentation.renderAlerts(wrap, d, prefs, labels);
    presentation.renderGeneration(wrap, d.generation, labels, prefs);
    presentation.renderTurnMetrics(wrap, d.turnMetrics, labels, prefs);

    const out = d.totalOutputTokens || 0;
    const think = d.totalThinkingTokens || 0;
    const turn0 = d.turn0Tokens || 0;
    const read = Math.max(0, ctx - turn0 - out - think);
    const usedPctExact = hasMax ? Math.min(100, (ctx / maxCtx) * 100) : 0;
    const compSum = read + out + think + turn0;
    const scale = compSum > 0 ? usedPctExact / compSum : 0;
    const pctStr = (val) => (hasMax ? Math.round((val / maxCtx) * 100) + '%' : (ctx === 0 ? '0%' : '--%'));

    shadow.getElementById('ov-used-pct').textContent = pctDisplay;
    shadow.getElementById('ov-used-fraction').textContent = fmtK(ctx) + ' / ' + (hasMax ? fmtK(maxCtx) : '--');
    shadow.getElementById('ov-seg-turn0').style.width = (turn0 * scale).toFixed(2) + '%';
    shadow.getElementById('ov-seg-read').style.width = (read * scale).toFixed(2) + '%';
    shadow.getElementById('ov-seg-think').style.width = (think * scale).toFixed(2) + '%';
    shadow.getElementById('ov-seg-out').style.width = (out * scale).toFixed(2) + '%';

    const cache = presentation.cacheView(d, prefs);
    const valCacheHitEl = shadow.getElementById('ov-val-cache-hit');
    const valCacheHitKEl = shadow.getElementById('ov-val-cache-hit-k');
    shadow.getElementById('ov-dot-cached').innerHTML = cache.iconSvg;
    valCacheHitEl.style.color = cache.valColor;
    valCacheHitEl.style.textDecoration = cache.valDeco;
    valCacheHitEl.style.opacity = cache.valOp;
    valCacheHitEl.textContent = cache.text;
    if (valCacheHitKEl) {
      valCacheHitKEl.style.color = cache.valColor || 'var(--muted-foreground, #8e8e93)';
      valCacheHitKEl.textContent = cache.countdown;
    }
    shadow.getElementById('ov-row-cached').title = presentation.cacheTooltip(d, labels, Date.now(), prefs);

    shadow.getElementById('ov-val-turn0-k').textContent = fmtColK(turn0);
    shadow.getElementById('ov-val-read-k').textContent = fmtColK(read);
    shadow.getElementById('ov-val-think-k').textContent = fmtColK(think);
    shadow.getElementById('ov-val-out-k').textContent = fmtColK(out);
    shadow.getElementById('ov-val-turn0-pct').textContent = pctStr(turn0);
    shadow.getElementById('ov-val-read-pct').textContent = pctStr(read);
    shadow.getElementById('ov-val-think-pct').textContent = pctStr(think);
    shadow.getElementById('ov-val-out-pct').textContent = pctStr(out);

    presentation.renderSidebarHistory(shadow.getElementById('ov-history-root'), d.history, maxCtx, labels, Date.now(), options.convPath || '');
    return true;
  }

  return {
    version: 6,
    renderOverviewTelemetry,
  };
}

export const getOverviewRendererScript = () => `if (globalThis.__agyPrismOverviewUI?.version !== 6) globalThis.__agyPrismOverviewUI = (${createOverviewRenderer.toString()})();`;
