// Deck injector: mounts a compact metrics strip into the Antigravity composer
// footer (next to the model selector) via the local DevTools (CDP) endpoint.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { createPresentation, getPresentationScript } from './ui.mjs';
import { getHeatmapRendererScript } from './heatmap_ui.mjs';
import { getOpticalThemeScript } from './optical_theme.mjs';
import { getOverviewRendererScript } from './overview_ui.mjs';

const { escapeHtml, formatTokens, appearance, formatReset, cacheView } = createPresentation();

const INTERVAL_MS = 1000;
const INSTANCE_TS = Date.now();
const PORT_FILE =
  process.platform === 'darwin'
    ? join(homedir(), 'Library', 'Application Support', 'Antigravity', 'DevToolsActivePort')
    : process.platform === 'win32'
      ? join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), 'Antigravity', 'DevToolsActivePort')
      : join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'Antigravity', 'DevToolsActivePort');

// Self-contained function executed inside the Antigravity renderer page.
function pageMount(d) {
  if (window.__deckOwnerTs && d.instanceTs && d.instanceTs < window.__deckOwnerTs) {
    return 'superseded';
  }
  if (d.instanceTs) {
    window.__deckOwnerTs = d.instanceTs;
  }
  const footerLeft = document.querySelector('.agy-composer-footer > div:first-child');
  if (!footerLeft) {
    window.__agyPrismCleanup?.();
    return 'no-footer';
  }
  const presentation = globalThis.__agyPrismPresentation;

  const release = (node) => {
    if (!node) return;
    if (Array.isArray(node._elevatedAncestors)) {
      for (const el of node._elevatedAncestors) {
        el?.removeAttribute?.('data-agy-dk-elevated');
        el?.removeAttribute?.('data-agy-dk-elevated-pos');
      }
      node._elevatedAncestors = [];
    }
    document.removeEventListener('click', node._onOutsideClick);
    document.removeEventListener('keydown', node._onEscape);
    if (node._onResize) window.removeEventListener('resize', node._onResize);
    node._modelObserver?.disconnect();
    node._resizeObserver?.disconnect();
    if (node._layoutRaf) cancelAnimationFrame(node._layoutRaf);
    node._layoutRaf = 0;
    node._turboTarget?.removeAttribute('data-deck-turbo-collapsed');
    const classes = ['dk-fl-squeezed', 'dk-model-squeezed', 'dk-model-squeezed-hard', 'dk-squeeze-box', 'dk-squeeze-item'];
    for (const footer of new Set([node._observedFooterLeft, document.querySelector('.agy-composer-footer > div:first-child')])) {
      if (!footer) continue;
      for (const element of [footer, ...footer.querySelectorAll(classes.map(c => '.' + c).join(','))]) element.classList.remove(...classes);
    }
  };
  // A late legacy injector may recreate its light-DOM strip after migration.
  // Remove it on every pass, not only when initializing the shadow host.
  const legacy = document.getElementById('deck-metrics-strip');
  if (legacy) { release(legacy); legacy.remove(); }
  let host = document.getElementById('agy-prism-host');
  let root = host?.shadowRoot?.getElementById('deck-metrics-strip');
  if (!root) {
    window.__agyPrismCleanup?.();
    host?.remove();
    host = document.createElement('div');
    host.id = 'agy-prism-host';
    host.style.display = 'contents';
    const shadow = host.attachShadow({ mode: 'open' });
    root = document.createElement('div');
    root.id = 'deck-metrics-strip';
    shadow.appendChild(root);
  }

  // Upgrade or initialize DOM structure in-place
  if (root.getAttribute('data-deck-ver') !== '122') {
    release(root);
    root._pinnedGroup = null;
    root.removeAttribute('data-pinned');
    root.setAttribute('data-deck-ver', '122');
    root._speedActivity = null;
    root._motionPrev = null;
    root.style.cssText = [
      'display: inline-flex',
      'align-items: center',
      'flex-shrink: 0',
      'gap: 0px',
      'margin-left: 4px',
      'margin-right: 4px',
      'font-size: 12.5px',
      // Match Antigravity's native Google Sans typography.
      'font-family: "Google Sans Flex", "Google Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      'font-weight: 400',
      'font-variation-settings: normal',
      'font-variant-ligatures: normal',
      'line-height: normal',
      'color: var(--secondary-foreground, var(--foreground, #3f3f46))',
      'user-select: none',
      'position: relative',
      '-webkit-font-smoothing: antialiased',
    ].join(';');

    root.innerHTML = `
      <style>
        #deck-metrics-strip, #deck-metrics-strip * { box-sizing: border-box; }
        #deck-metrics-strip .dk-grp {
          display: inline-flex;
          align-items: center;
          /* Popovers are placed by JS relative to their group: context and
             quota start at the strip's left edge but always reach their own
             capsule's right edge; the error panel right-aligns to its capsule. */
          position: relative;
        }
        #deck-metrics-strip .dk-pill {
          font: inherit;
          color: inherit;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 5px;
          border-radius: 6px;
          cursor: default;
          position: relative;
          background: transparent;
          border: none;
          white-space: nowrap;
          transition: background 0.12s ease, color 0.12s ease;
        }
        #deck-metrics-strip .dk-grp:hover .dk-pill,
        #deck-metrics-strip .dk-grp[data-pinned="true"] .dk-pill {
          background: var(--secondary, rgba(128, 128, 128, 0.12));
          color: var(--foreground, #0a0a0c);
        }
        #deck-metrics-strip .dk-grp:hover .dk-val,
        #deck-metrics-strip .dk-grp:hover .dk-svg,
        #deck-metrics-strip .dk-grp[data-pinned="true"] .dk-val,
        #deck-metrics-strip .dk-grp[data-pinned="true"] .dk-svg {
          color: var(--foreground, #0a0a0c);
        }
        #deck-metrics-strip .dk-pill-quota {
          gap: 10px;
        }
        #deck-metrics-strip .dk-q-pair[hidden] { display: none; }
        #deck-metrics-strip .dk-grp[hidden] { display: none; }
        #deck-metrics-strip [data-el="grpError"] .dk-pill,
        #deck-metrics-strip [data-el="grpError"] .dk-val,
        #deck-metrics-strip [data-el="grpError"] .dk-svg { color: #e06c75; }
        #deck-metrics-strip .dk-error-pop { width: 240px; }
        #deck-metrics-strip .dk-error-heading { font-weight: 600; margin-bottom: 8px; color: var(--foreground, #ddd); }
        #deck-metrics-strip .dk-error-diagnostic { margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--border, #444); white-space: pre-wrap; }
        #deck-metrics-strip .dk-error-diagnostic:empty { display: none; }
        #deck-metrics-strip.dk-hide-error-label [data-el="grpError"] .dk-val,
        #deck-metrics-strip.dk-hide-ctx [data-el="grpCtx"] { display: none; }
        #deck-metrics-strip[data-context-tone="warning"] [data-k="pillCtx"] { color: #d4940a !important; }
        #deck-metrics-strip[data-context-tone="error"] [data-k="pillCtx"] { color: #e06c75 !important; }
        #deck-metrics-strip .dk-speed { padding-left: 2px; font-variant-numeric: tabular-nums; }
        #deck-metrics-strip .dk-speed-dot { display: none; }
        #deck-metrics-strip .dk-speed[data-motion] { display: inline-flex; align-items: center; gap: 4px; transition: color .35s ease; }
        #deck-metrics-strip .dk-speed[data-motion] .dk-speed-dot { display: inline-block; width: 5px; height: 5px; flex-shrink: 0; border-radius: 50%; background: currentColor; }
        #deck-metrics-strip .dk-speed[data-tier="green"] { color: light-dark(#16a34a, #4ea84e); }
        #deck-metrics-strip .dk-speed[data-tier="yellow"] { color: light-dark(#d97706, #d4940a); }
        #deck-metrics-strip .dk-speed[data-tier="red"] { color: light-dark(#dc2626, #e06c75); }
        #deck-metrics-strip .dk-speed[data-motion="idle"] { color: var(--muted-foreground, #8e8e93); }
        #deck-metrics-strip .dk-pill:hover .dk-speed[data-motion="idle"],
        #deck-metrics-strip .dk-grp[data-pinned="true"] .dk-speed[data-motion="idle"] { color: var(--foreground, #ebebeb); }
        #deck-metrics-strip .dk-speed[data-motion="active"] .dk-speed-dot { animation: dk-speed-breathe 1.2s ease-in-out infinite; }
        #deck-metrics-strip .dk-speed[data-motion="recent"] .dk-speed-dot { opacity: .9; }
        #deck-metrics-strip .dk-speed[data-motion="idle"] .dk-speed-dot { opacity: .48; }
        /* Same motion language as the settings previews: colors ease over .18s. */
        #deck-metrics-strip [data-k="pillCtx"], #deck-metrics-strip [data-el="ctxIconSvg"],
        #deck-metrics-strip .dk-cache-pct, #deck-metrics-strip .dk-cache-k { transition: color .18s ease, opacity .18s ease; }
        @keyframes dk-speed-breathe { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.78); } }
        @media (prefers-reduced-motion: reduce) {
          #deck-metrics-strip .dk-speed[data-motion="active"] .dk-speed-dot { animation: none; }
          #deck-metrics-strip .dk-speed[data-motion] { transition: none; }
          #deck-metrics-strip [data-k="pillCtx"], #deck-metrics-strip [data-el="ctxIconSvg"],
          #deck-metrics-strip .dk-cache-pct, #deck-metrics-strip .dk-cache-k, #deck-metrics-strip .dk-q-group, #deck-metrics-strip .dk-q-active { transition: none; }
        }
        #deck-metrics-strip .dk-speed[hidden],
        #deck-metrics-strip.dk-hide-speed .dk-speed,
        #deck-metrics-strip.dk-hide-model [data-el="grpModel"] { display: none; }
        #deck-metrics-strip .dk-pill-model { gap: 5px; }
        #deck-metrics-strip .dk-model-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; background: var(--muted-foreground, #8e8e93); }
        #deck-metrics-strip [data-el="grpModel"][data-phase="plan"] .dk-model-dot { background: #6366f1; }
        #deck-metrics-strip [data-el="grpModel"][data-phase="execute"] .dk-model-dot { background: #10b981; }
        #deck-metrics-strip [data-el="grpModel"][data-live="true"] .dk-model-dot { animation: dk-speed-breathe 1.2s ease-in-out infinite; }
        #deck-metrics-strip [data-el="grpModel"][data-phase="plan"] [data-k="pillModel"] { color: light-dark(#4f46e5, #818cf8); }
        #deck-metrics-strip [data-el="grpModel"][data-phase="execute"] [data-k="pillModel"] { color: light-dark(#059669, #34d399); }
        #deck-metrics-strip .dk-model-effort { font-size: 11px; font-weight: 500; padding: 0 5px; line-height: 17px; border-radius: 4px; background: color-mix(in srgb, var(--foreground, currentColor) 8%, transparent); color: var(--muted-foreground, #8e8e93); font-variant-numeric: tabular-nums; }
        #deck-metrics-strip .dk-model-effort:empty { display: none; }
        #deck-metrics-strip .dk-model-effort[data-effort="XHigh"] { background: rgba(168, 85, 247, 0.16); color: light-dark(#7e22ce, #c084fc); }
        #deck-metrics-strip .dk-model-effort[data-effort="High"] { background: rgba(56, 139, 253, 0.16); color: light-dark(#2563eb, #60a5fa); }
        #deck-metrics-strip .dk-model-effort[data-effort="Medium"] { background: rgba(20, 184, 166, 0.16); color: light-dark(#0f766e, #2dd4bf); }
        #deck-metrics-strip .dk-model-effort[data-effort="Low"] { background: rgba(113, 113, 122, 0.16); color: light-dark(#52525b, #a1a1aa); }
        #deck-metrics-strip .dk-model-effort[data-effort="auto"] { background: rgba(212, 148, 10, 0.16); color: light-dark(#b45309, #f59e0b); }
        #deck-metrics-strip .dk-model-pop { width: 256px; font-variant-numeric: tabular-nums; }
        #deck-metrics-strip .dk-model-head { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
        #deck-metrics-strip .dk-model-phase { flex-shrink: 0; font-size: 11px; font-weight: 600; padding: 1px 6px; border-radius: 99px; background: color-mix(in srgb, var(--foreground, currentColor) 10%, transparent); color: var(--muted-foreground, #8e8e93); }
        #deck-metrics-strip .dk-model-phase[data-phase="plan"] { background: rgba(99, 102, 241, 0.18); color: light-dark(#4f46e5, #818cf8); }
        #deck-metrics-strip .dk-model-phase[data-phase="execute"] { background: rgba(16, 185, 129, 0.18); color: light-dark(#059669, #34d399); }
        #deck-metrics-strip .dk-model-name { font-size: 13px; font-weight: 600; color: var(--foreground, #ebebeb); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        #deck-metrics-strip .dk-model-slug { font-size: 11px; color: var(--muted-foreground, #8e8e93); margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        #deck-metrics-strip .dk-model-kv { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; font-size: 12.5px; color: var(--muted-foreground, #8e8e93); margin-bottom: 4px; }
        #deck-metrics-strip .dk-model-val { font-weight: 500; color: var(--foreground, #ebebeb); white-space: nowrap; }
        #deck-metrics-strip .dk-model-val[data-effort="auto"] { color: light-dark(#b45309, #f59e0b); }
        #deck-metrics-strip .dk-model-val[data-effort="XHigh"] { color: light-dark(#7e22ce, #c084fc); }
        #deck-metrics-strip .dk-model-bar { height: 4px; border-radius: 99px; overflow: hidden; background: rgba(232, 106, 36, 0.25); margin: 4px 0 6px; }
        #deck-metrics-strip .dk-model-bar > span { display: block; height: 100%; background: #00b386; border-radius: inherit; }
        #deck-metrics-strip .dk-model-note { font-size: 11.5px; line-height: 1.35; color: var(--muted-foreground, #8e8e93); margin-top: 4px; }
        #deck-metrics-strip .dk-model-sep { height: 1px; background: var(--border, rgba(142,142,147,.24)); margin: 8px 0 6px; }
        #deck-metrics-strip .dk-model-sec { font-size: 11.5px; font-weight: 500; color: var(--muted-foreground, #8e8e93); margin-bottom: 4px; }
        #deck-metrics-strip .dk-model-brow { display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 12px; margin-bottom: 3px; }
        #deck-metrics-strip .dk-model-brow:last-child { margin-bottom: 0; }
        #deck-metrics-strip .dk-model-btag { padding: 1px 5px; border-radius: 4px; font-size: 11px; font-weight: 500; background: color-mix(in srgb, var(--foreground, currentColor) 8%, transparent); color: var(--foreground, #ebebeb); }
        #deck-metrics-strip .dk-model-btag[data-phase="plan"] { background: rgba(99, 102, 241, 0.16); color: light-dark(#4f46e5, #818cf8); }
        #deck-metrics-strip .dk-model-btag[data-phase="execute"] { background: rgba(16, 185, 129, 0.16); color: light-dark(#059669, #34d399); }
        #deck-metrics-strip .dk-model-bmeta { font-size: 11.5px; color: var(--muted-foreground, #8e8e93); white-space: nowrap; }
        #deck-metrics-strip .dk-generation { margin-top: 10px; padding-top: 9px; border-top: 1px solid var(--border, rgba(142,142,147,.24)); font-variant-numeric: tabular-nums; }
        #deck-metrics-strip .generation-grid { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--agy-row-gap, 5px) 10px; align-items: baseline; }
        #deck-metrics-strip .generation-row { display: inline-flex; align-items: baseline; gap: 4px; min-width: 0; font-size: 13.5px; font-weight: 400; color: var(--muted-foreground, #8e8e93); }
        #deck-metrics-strip [data-generation-row="speed"] { justify-self: end; }
        #deck-metrics-strip .generation-row > :first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        #deck-metrics-strip .generation-row > :last-child { flex-shrink: 0; white-space: nowrap; font-weight: 500; color: var(--foreground, #18181b); color: color-mix(in srgb, var(--foreground, #18181b) 88%, transparent); }
        #deck-metrics-strip [data-generation-row="timing"] > :last-child { font-weight: 400; color: var(--muted-foreground, #8e8e93); }
        #deck-metrics-strip .generation-heading { margin-bottom: 8px; font-size: 13.5px; font-weight: 500; color: var(--foreground, #18181b); color: color-mix(in srgb, var(--foreground, #18181b) 88%, transparent); }
        #deck-metrics-strip .generation-row[hidden], #deck-metrics-strip [data-generation-group][hidden] { display: none; }
        #deck-metrics-strip.dk-hide-wk [data-el="pairWk"],
        #deck-metrics-strip.dk-hide-5h [data-el="pair5h"] {
          display: none;
        }
        #deck-metrics-strip.dk-hide-wk .dk-pill-quota,
        #deck-metrics-strip.dk-hide-5h .dk-pill-quota {
          gap: 0;
        }
        #deck-metrics-strip.dk-hide-qval [data-el="grpQuota"] .dk-val {
          display: none;
        }
        #deck-metrics-strip.dk-hide-qval [data-el="grpQuota"] .dk-q-pair {
          gap: 0;
        }
        #deck-metrics-strip.dk-hide-cval [data-el="grpCtx"] .dk-val {
          display: none;
        }
        #deck-metrics-strip.dk-hide-cval [data-el="grpCtx"] .dk-pill {
          gap: 0;
        }
        #deck-metrics-strip.dk-hide-ctx-metric [data-el="ctxIconSvg"],
        #deck-metrics-strip.dk-hide-ctx-metric [data-k="pillCtx"] {
          display: none;
        }
        #deck-metrics-strip.dk-hide-ctx-metric [data-el="grpCtx"] .dk-pill {
          gap: 0;
        }
        #deck-metrics-strip.dk-hide-ctx-metric [data-el="grpCtx"] .dk-speed {
          padding-left: 0;
        }
        #deck-metrics-strip.dk-hide-quota [data-el="grpQuota"] {
          display: none;
        }
        #deck-metrics-strip.dk-hide-all {
          display: none !important;
        }
        #deck-metrics-strip .dk-q-pair {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        #deck-metrics-strip .dk-svg {
          width: 13px;
          height: 13px;
          color: var(--muted-foreground, rgba(142, 142, 147, 0.85));
          flex-shrink: 0;
          transition: color 0.12s ease;
        }
        #deck-metrics-strip .dk-val {
          font-weight: 500;
          color: var(--muted-foreground, #71717a);
          font-variant-numeric: tabular-nums;
          transition: color 0.12s ease;
        }
        #deck-metrics-strip .dk-pop {
          display: none;
          position: absolute;
          bottom: calc(100% + 8px);
          left: 0;
          background: var(--glass, var(--card, rgba(20, 20, 22, 0.96)));
          -webkit-backdrop-filter: blur(20px) saturate(1.25);
          backdrop-filter: blur(20px) saturate(1.25);
          border: 1px solid var(--glass-border, var(--border, rgba(128, 128, 128, 0.18)));
          border-radius: 14px;
          padding: var(--agy-pad-y, 10px) var(--agy-pad-x, 12px);
          max-width: var(--dk-pop-max-width, calc(100vw - 16px));
          overflow-wrap: anywhere;
          box-shadow: inset 0 1px 0 var(--agy-opt-spec, rgba(255, 255, 255, 0.85)), 0 0 24px -6px var(--agy-opt-rim-halo, rgba(66, 133, 244, 0.20)), var(--agy-opt-menu-elev, 0 4px 14px -2px rgba(15, 23, 42, 0.08), 0 18px 38px -10px rgba(15, 35, 75, 0.16));
          z-index: 999999;
          color: var(--muted-foreground, #8e8e93);
          font-size: 13.5px;
          line-height: 1.35;
          pointer-events: none;
        }
        #deck-metrics-strip .dk-pop::before {
          content: '';
          position: absolute;
          inset: 0;
          padding: 1px;
          border-radius: inherit;
          pointer-events: none;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          opacity: 0.26;
          transition: opacity 260ms cubic-bezier(0.22, 1, 0.36, 1);
          background: radial-gradient(240px circle at var(--dk-px, 50%) var(--dk-py, 0%), rgba(56, 189, 248, 0.45), rgba(66, 133, 244, 0.34) 38%, rgba(155, 114, 203, 0.22) 68%, transparent 88%);
        }
        #deck-metrics-strip .dk-pop:hover::before { opacity: 0.40; }
        #deck-metrics-strip .dk-grp:hover .dk-pop {
          display: block;
        }
        #deck-metrics-strip .dk-grp[data-pinned="true"] .dk-pop { display: block; pointer-events: auto; }
        #deck-metrics-strip[data-pinned] .dk-grp:not([data-pinned="true"]):hover .dk-pop { display: none; }
        #deck-metrics-strip .dk-grp[data-dismissed="true"] .dk-pop { display: none; }
        /* Context Popover (matches plugin UI) */
        #deck-metrics-strip .dk-ctx-pop {
          width: 228px;
        }
        #deck-metrics-strip .dk-cache-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          font-size: 13.5px;
          line-height: 1.35;
          padding-bottom: 5px;
          margin-bottom: 7.5px;
          border-bottom: 1px solid var(--border, rgba(142, 142, 147, 0.24));
        }
        #deck-metrics-strip .dk-cache-left {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-weight: 500;
          color: var(--foreground, #18181b);
          color: color-mix(in srgb, var(--foreground, #18181b) 88%, transparent);
          white-space: nowrap;
        }
        #deck-metrics-strip .dk-cache-left > .dk-dot {
          width: 10px;
          height: 10px;
          flex-shrink: 0;
        }
        #deck-metrics-strip .dk-cache-pct {
          margin-left: 0;
          font-variant-numeric: tabular-nums;
          font-size: 13.5px;
          white-space: nowrap;
        }
        #deck-metrics-strip .dk-cache-k {
          text-align: right;
          color: var(--muted-foreground, #8e8e93);
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
          font-size: 13.5px;
          font-weight: 400;
        }
        #deck-metrics-strip .dk-cache-k:empty {
          display: none;
        }
        #deck-metrics-strip .dk-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 6px;
          margin-bottom: 6.5px;
        }
        #deck-metrics-strip .dk-used-pct {
          font-size: 13.5px;
          font-weight: 400;
          color: var(--muted-foreground, #8e8e93);
        }
        #deck-metrics-strip .dk-used-pct > [data-k="usedPctText"] {
          font-weight: 500;
          color: var(--foreground, #18181b);
          color: color-mix(in srgb, var(--foreground, #18181b) 88%, transparent);
        }
        #deck-metrics-strip .dk-used-frac {
          font-size: 13.5px;
          font-weight: 400;
          color: var(--muted-foreground, #8e8e93);
          font-variant-numeric: tabular-nums;
        }
        #deck-metrics-strip .dk-track {
          position: relative;
          width: 100%;
          height: 4px;
          background: rgba(142, 142, 147, 0.24);
          border-radius: 999px;
          display: flex;
          gap: 1.5px;
          overflow: hidden;
          margin-bottom: 8.5px;
        }
        #deck-metrics-strip .dk-seg {
          height: 100%;
          border-radius: 999px;
          transition: width 0.25s ease;
        }
        #deck-metrics-strip .dk-list,
        #deck-metrics-strip .turn-bar-list {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: start;
          gap: 4px;
        }
        #deck-metrics-strip .turn-bar-list {
          grid-template-columns: minmax(calc((100% - 12px) / 4), max-content) minmax(0, 1fr) calc((100% - 12px) / 4) calc((100% - 12px) / 4);
        }
        #deck-metrics-strip .dk-item-row,
        #deck-metrics-strip .turn-bar-item {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          column-gap: 5px;
          row-gap: 2px;
          min-width: 0;
        }
        #deck-metrics-strip .dk-item-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        #deck-metrics-strip .dk-item-label,
        #deck-metrics-strip .turn-bar-label,
        #deck-metrics-strip .turn-bar-short {
          color: var(--muted-foreground, #8e8e93);
          font-size: 13.5px;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        #deck-metrics-strip .turn-bar-item[data-turn-row="requests"] {
          container-type: inline-size;
        }
        #deck-metrics-strip .turn-bar-short {
          display: none;
        }
        @container (max-width: 39px) {
          #deck-metrics-strip .turn-bar-item[data-turn-row="requests"] .turn-bar-label {
            display: none;
          }
          #deck-metrics-strip .turn-bar-item[data-turn-row="requests"] .turn-bar-short {
            display: block;
          }
        }
        #deck-metrics-strip .dk-item-row > .dk-dot,
        #deck-metrics-strip .turn-bar-line {
          grid-row: 1 / span 2;
          align-self: stretch;
          width: 2.5px;
          margin: 2px 0;
          border-radius: 99px;
          flex-shrink: 0;
        }
        #deck-metrics-strip .turn-bar-line {
          background: rgba(142, 142, 147, 0.42);
          background: color-mix(in srgb, var(--muted-foreground, #8e8e93) 55%, transparent);
        }
        #deck-metrics-strip .dk-item-row > .dk-dot { grid-row: 1; }
        #deck-metrics-strip .dk-item-k,
        #deck-metrics-strip .dk-item-pct,
        #deck-metrics-strip .turn-bar-val {
          grid-column: 2;
          color: var(--muted-foreground, #8e8e93);
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
          font-size: 13.5px;
          font-weight: 400;
          line-height: 1.25;
        }
        /* Quota Popover (matches plugin UI) */
        #deck-metrics-strip .dk-quota-pop {
          width: max-content;
        }
        #deck-metrics-strip[data-quota-indicator="bar"] .dk-quota-pop {
          min-width: min(228px, var(--dk-pop-max-width, calc(100vw - 16px)));
        }
        /* One grid for the whole popover; groups, rows and the pct+indicator
           cell are subgrids, so every column lines up across all groups. */
        #deck-metrics-strip .dk-quota-pop > .dk-panel-content {
          display: grid;
          grid-template-columns: minmax(54px, max-content) max-content max-content minmax(0, max-content);
          column-gap: 8px;
          align-content: start;
        }
        #deck-metrics-strip[data-quota-indicator="bar"] .dk-quota-pop > .dk-panel-content {
          grid-template-columns: minmax(54px, max-content) max-content minmax(48px, 1fr) minmax(0, max-content);
        }
        #deck-metrics-strip[data-language^="zh"] .dk-quota-pop > .dk-panel-content {
          grid-template-columns: minmax(42px, max-content) max-content max-content minmax(0, max-content);
        }
        #deck-metrics-strip[data-language^="zh"][data-quota-indicator="bar"] .dk-quota-pop > .dk-panel-content {
          grid-template-columns: minmax(42px, max-content) max-content minmax(48px, 1fr) minmax(0, max-content);
        }
        #deck-metrics-strip .dk-q-group,
        #deck-metrics-strip .dk-q-row {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: subgrid;
          align-items: center;
        }
        #deck-metrics-strip .dk-q-title {
          grid-column: 1 / -1;
          font-size: 13.5px;
          font-weight: 500;
          line-height: 1.25;
          color: var(--foreground, #18181b);
          color: color-mix(in srgb, var(--foreground, #18181b) 88%, transparent);
        }
        #deck-metrics-strip .dk-q-row {
          font-size: 13.5px;
          font-variant-numeric: tabular-nums;
        }
        #deck-metrics-strip .dk-q-label {
          color: var(--muted-foreground, #8e8e93);
        }
        #deck-metrics-strip .dk-q-mid {
          grid-column: 4;
          text-align: left;
          color: var(--muted-foreground, #8e8e93);
        }
        #deck-metrics-strip .dk-q-right {
          grid-column: 2 / 4;
          display: grid;
          grid-template-columns: subgrid;
          align-items: center;
          column-gap: 5px;
          color: var(--muted-foreground, #8e8e93);
          white-space: nowrap;
        }
        /* Optional presentation inspired by z21100644/agy-capsule PR #1.
           Both styles use the existing four-category telemetry, unchanged. */
        #deck-metrics-strip .dk-q-group { transition: opacity .2s ease; }
        #deck-metrics-strip[data-highlight-active-model="true"] .dk-q-group[data-active="false"] { opacity: .7; }
        #deck-metrics-strip .dk-q-pct { justify-self: end; }
        #deck-metrics-strip .dk-q-meter { min-width: 24px; height: 4px; border-radius: 99px; overflow: hidden; background: rgba(142,142,147,.24); }
        #deck-metrics-strip .dk-q-meter > span { display: block; height: 100%; border-radius: inherit; }
        #deck-metrics-strip .dk-q-active { display: inline-block; width: 0; height: 4px; flex-shrink: 0; border-radius: 50%; background: currentColor; margin-left: 0; vertical-align: middle; align-self: center; opacity: 0; transform: scale(.5); transition: opacity .2s ease, transform .2s ease, width .2s ease, margin-left .2s ease; }
        #deck-metrics-strip[data-highlight-active-model="true"] .dk-q-group[data-active="true"] .dk-q-active { width: 4px; margin-left: 4px; opacity: 1; transform: scale(1); }
        /* Shared spacing rules; indicator and marker are independent. */
        #deck-metrics-strip .dk-list { row-gap: var(--agy-row-gap); }
        #deck-metrics-strip .dk-cache-bar { padding-bottom: var(--agy-section-gap); margin-bottom: var(--agy-section-gap); }
        #deck-metrics-strip .dk-generation { margin-top: var(--agy-section-gap); padding-top: var(--agy-section-gap); }
        #deck-metrics-strip [data-generation-block]:not([hidden]) + [data-turn-metrics-block] { border-top: 0; padding-top: 0; margin-top: var(--agy-section-gap); }
        #deck-metrics-strip .dk-spark-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; margin-top: 4px; }
        #deck-metrics-strip .dk-spark-cell { min-width: 0; overflow: hidden; }
        #deck-metrics-strip .generation-heading { margin-bottom: var(--agy-row-gap); }
        #deck-metrics-strip .dk-q-group { margin: 0; }
        #deck-metrics-strip .dk-q-group + .dk-q-group { margin-top: calc(var(--agy-section-gap) + 4px); padding-top: 0; border-top: 0; }
        #deck-metrics-strip .dk-q-title { margin-bottom: var(--agy-row-gap); }
        #deck-metrics-strip .dk-q-row { margin-bottom: var(--agy-row-gap); }
        #deck-metrics-strip .dk-q-row:last-child { margin-bottom: 0; }
        #deck-metrics-strip[data-panel-layout="matched"] .dk-ctx-pop > .dk-panel-content { height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
        #deck-metrics-strip[data-panel-layout="matched"] .dk-quota-pop > .dk-panel-content { height: 100%; align-content: space-between; }
        #deck-metrics-strip[data-label-case="lowercase"] .dk-cache-left,
        #deck-metrics-strip[data-label-case="lowercase"] .dk-used-pct,
        #deck-metrics-strip[data-label-case="lowercase"] .dk-item-label,
        #deck-metrics-strip[data-label-case="lowercase"] .turn-bar-label,
        #deck-metrics-strip[data-label-case="lowercase"] .turn-bar-short,
        #deck-metrics-strip[data-label-case="lowercase"] .dk-q-label { text-transform: lowercase; }
        /* Context breakdown / turn metrics: columns (vertical lines) or rows (marker + label + values). */
        #deck-metrics-strip:not([data-context-layout="rows"]) .dk-item-pct { display: none; }
        #deck-metrics-strip[data-column-percent="true"]:not([data-context-layout="rows"]) .dk-item-pct { display: block; }
        #deck-metrics-strip[data-column-label="false"]:not([data-context-layout="rows"]) .dk-item-label,
        #deck-metrics-strip[data-column-value="false"]:not([data-context-layout="rows"]) .dk-item-k { display: none; }
        #deck-metrics-strip[data-context-layout="rows"] .dk-list { grid-template-columns: auto minmax(0, 1fr) auto auto; column-gap: 8px; align-items: center; }
        #deck-metrics-strip[data-context-layout="rows"] .dk-item-row,
        #deck-metrics-strip[data-turn-layout="rows"] .turn-bar-item { grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; align-items: center; }
        #deck-metrics-strip[data-context-layout="rows"] .dk-item-body { grid-column: 2 / -1; display: grid; grid-template-columns: subgrid; align-items: center; }
        #deck-metrics-strip[data-context-layout="rows"] .dk-item-label { grid-column: 1; grid-row: 1; }
        #deck-metrics-strip[data-context-layout="rows"] .dk-item-pct { grid-column: 2; grid-row: 1; justify-self: end; }
        #deck-metrics-strip[data-context-layout="rows"] .dk-item-k { grid-column: 3; grid-row: 1; justify-self: end; }
        #deck-metrics-strip[data-turn-layout="rows"] .turn-bar-list { grid-template-columns: auto minmax(0, 1fr) auto; column-gap: 8px; row-gap: var(--agy-row-gap); align-items: center; }
        #deck-metrics-strip[data-turn-layout="rows"] .turn-bar-label { grid-column: 2; grid-row: 1; display: block; }
        #deck-metrics-strip[data-turn-layout="rows"] .turn-bar-short { display: none; }
        #deck-metrics-strip[data-turn-layout="rows"] .turn-bar-item[data-turn-row="requests"] { container-type: normal; }
        #deck-metrics-strip[data-context-layout="rows"] .dk-item-pct { margin-right: 4px; }
        #deck-metrics-strip[data-turn-layout="rows"] .turn-bar-val { grid-column: 3; grid-row: 1; justify-self: end; }
        #deck-metrics-strip[data-context-layout="rows"] .dk-item-row > .dk-dot,
        #deck-metrics-strip[data-turn-layout="rows"] .turn-bar-line { grid-column: 1; grid-row: 1; align-self: center; width: 10px; height: 10px; margin: 0; border-radius: 3px; }
        #deck-metrics-strip[data-context-marker="dot"][data-context-layout="rows"] .dk-item-row > .dk-dot,
        #deck-metrics-strip[data-turn-marker="dot"][data-turn-layout="rows"] .turn-bar-line { border-radius: 50%; }
        #deck-metrics-strip[data-show-context-breakdown="false"] .dk-list { display: none; }
        #deck-metrics-strip .dk-item-label { order: var(--agy-order-label, 0); }
        #deck-metrics-strip .dk-item-k { order: var(--agy-order-value, 1); }
        #deck-metrics-strip .dk-item-pct { order: var(--agy-order-percent, 2); }
      </style>

      <!-- Step Model & Thinking Effort Capsule + Popover -->
      <div class="dk-grp" data-el="grpModel" hidden>
        <button type="button" class="dk-pill dk-pill-model" aria-expanded="false">
          <span class="dk-model-dot" data-el="modelDot" aria-hidden="true"></span>
          <span class="dk-val" data-k="pillModel"></span>
          <span class="dk-model-effort" data-k="pillEffort" data-el="pillEffortEl"></span>
        </button>
        <div class="dk-pop dk-model-pop" data-el="modelPop"></div>
      </div>

      <!-- Context Capsule + Popover -->
      <div class="dk-grp" data-el="grpCtx">
        <button type="button" class="dk-pill" aria-expanded="false">
          <svg class="dk-svg" data-el="ctxIconSvg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>
          <span class="dk-val" data-k="pillCtx">--%</span>
          <span class="dk-speed" data-el="pillSpeed" hidden><span class="dk-speed-dot" aria-hidden="true"></span><span data-generation="speed"></span></span>
        </button>
        <div class="dk-pop dk-ctx-pop">
          <div class="dk-panel-content">
          <div class="dk-cache-bar" data-el="rowCacheHit">
            <div class="dk-cache-left"><span data-i18n="cache">Cache</span><span class="dk-cache-pct" data-k="valCacheHit" data-el="valCacheHitEl">0%</span><span class="dk-dot" data-el="dotCached" style="display:inline-flex;align-items:center;justify-content:center;background:transparent"></span></div>
            <div class="dk-cache-k" data-k="valCacheHitK"></div>
          </div>
          <div class="dk-summary-row">
            <div class="dk-used-pct" data-context-tip="overview"><span data-k="usedPctText">0%</span> <span data-i18n="used">used</span></div>
            <div class="dk-used-frac" data-k="usedFrac" data-context-tip="overview">0 / --</div>
          </div>
          <div class="dk-track" data-context-tip="overview">
            <div class="dk-seg" data-el="segTurn0" style="width: 0%; background: #d4940a"></div>
            <div class="dk-seg" data-el="segRead" style="width: 0%; background: #388bfd"></div>
            <div class="dk-seg" data-el="segThink" style="width: 0%; background: #00b386"></div>
            <div class="dk-seg" data-el="segOut" style="width: 0%; background: #e86a24"></div>
          </div>
          <div class="dk-list">
            <div class="dk-item-row" data-context-tip="turn0">
              <span class="dk-dot" style="background:#d4940a"></span>
              <div class="dk-item-body"><span class="dk-item-label" data-i18n="turn0">Turn0</span><span class="dk-item-k" data-k="valTurn0K">0</span><span class="dk-item-pct" data-k="valTurn0Pct">0%</span></div>
            </div>
            <div class="dk-item-row" data-context-tip="read">
              <span class="dk-dot" style="background:#388bfd"></span>
              <div class="dk-item-body"><span class="dk-item-label" data-i18n="read">Read</span><span class="dk-item-k" data-k="valReadK">0</span><span class="dk-item-pct" data-k="valReadPct">0%</span></div>
            </div>
            <div class="dk-item-row" data-context-tip="think">
              <span class="dk-dot" style="background:#00b386"></span>
              <div class="dk-item-body"><span class="dk-item-label" data-i18n="think">Think</span><span class="dk-item-k" data-k="valThinkK">0</span><span class="dk-item-pct" data-k="valThinkPct">0%</span></div>
            </div>
            <div class="dk-item-row" data-context-tip="write">
              <span class="dk-dot" style="background:#e86a24"></span>
              <div class="dk-item-body"><span class="dk-item-label" data-i18n="write">Write</span><span class="dk-item-k" data-k="valOutK">0</span><span class="dk-item-pct" data-k="valOutPct">0%</span></div>
            </div>
          </div>
          <div class="dk-generation" data-generation-block>
            ${presentation.generationMarkup()}
          </div>
          ${presentation.turnMetricsMarkup('dk-generation')}
          ${presentation.historyMarkup('dk-generation')}
          </div>
        </div>
      </div>

      <!-- Merged Quota Capsule (5h + Weekly) + Popover -->
      <div class="dk-grp" data-el="grpQuota">
        <button type="button" class="dk-pill dk-pill-quota" aria-expanded="false">
          <span class="dk-q-pair" data-el="pair5h">
            <svg class="dk-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>
            <span class="dk-val" data-k="pill5h">--%</span>
          </span>
          <span class="dk-q-pair" data-el="pairWk">
            <svg class="dk-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span class="dk-val" data-k="pillWk">--%</span>
          </span>
        </button>
        <div class="dk-pop dk-quota-pop" data-el="quotaPop"></div>
      </div>
      <div class="dk-grp" data-el="grpError" hidden>
        <button type="button" class="dk-pill" aria-expanded="false">
          <svg class="dk-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg>
          <span class="dk-val" data-request-error="label"></span>
        </button>
        <div class="dk-pop dk-error-pop">
          <div class="dk-error-heading" data-request-error="label"></div>
          <div data-request-error="detail"></div>
          <div class="dk-error-diagnostic" data-request-error="diagnostic"></div>
        </div>
      </div>
    `;

    // Only native layout integration stays outside the shadow boundary.
    let nativeStyle = document.getElementById('agy-prism-native-layout');
    if (!nativeStyle) {
      nativeStyle = document.createElement('style');
      nativeStyle.id = 'agy-prism-native-layout';
      document.head.appendChild(nativeStyle);
    }
    nativeStyle.textContent = `
        .agy-composer-footer button[data-deck-turbo-collapsed="true"] {
          width: 28px !important; min-width: 28px !important; max-width: 28px !important;
          padding: 6px !important; gap: 0 !important; justify-content: center !important;
        }
        .agy-composer-footer button[data-deck-turbo-collapsed="true"] > :not(:first-child) { display: none !important; }
        .agy-composer-footer button[data-deck-turbo-collapsed="true"] > svg:first-child { width: 16px !important; height: 16px !important; flex-shrink: 0 !important; }
        .agy-composer-footer .dk-fl-squeezed {
          min-width: 0 !important;
          flex-shrink: 1 !important;
        }
        .agy-composer-footer .dk-model-squeezed {
          min-width: 0 !important;
          flex: 0 1 auto !important;
          overflow: hidden !important;
          max-width: 100% !important;
        }
        .agy-composer-footer .dk-model-squeezed .dk-squeeze-box,
        .agy-composer-footer .dk-model-squeezed .dk-squeeze-item {
          min-width: 0 !important;
          max-width: 100% !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        .agy-composer-footer .dk-model-squeezed .dk-squeeze-box,
        .agy-composer-footer .dk-model-squeezed-hard .dk-squeeze-item {
          flex-shrink: 1 !important;
        }
        .agy-composer-footer .dk-model-squeezed svg {
          flex-shrink: 0 !important;
        }
        [data-agy-dk-elevated="1"] {
          z-index: 9999 !important;
        }
        [data-agy-dk-elevated-pos="1"] {
          position: relative !important;
        }
    `;
    root._dispose = () => {
      release(root);
      nativeStyle.remove();
      host.remove();
      if (window.__agyPrismCleanup === root._dispose) delete window.__agyPrismCleanup;
    };
    window.__agyPrismCleanup = root._dispose;

    const clearElevation = () => {
      if (!Array.isArray(root._elevatedAncestors)) return;
      for (const el of root._elevatedAncestors) {
        el?.removeAttribute?.('data-agy-dk-elevated');
        el?.removeAttribute?.('data-agy-dk-elevated-pos');
      }
      root._elevatedAncestors = [];
    };
    const syncElevation = (forceOpen = null) => {
      const open = forceOpen !== null
        ? Boolean(forceOpen)
        : Boolean(root._pinnedGroup || root.querySelector('.dk-grp:hover:not([data-dismissed="true"])'));
      clearElevation();
      if (!open) return;
      const list = [];
      let el = host.parentElement;
      while (el && el !== document.body && el !== document.documentElement) {
        if (el.classList?.contains('agy-inset-shell') || el.tagName === 'MAIN') break;
        const rect = el.getBoundingClientRect?.();
        if (window.innerHeight > 0 && rect && rect.height > window.innerHeight * 0.58) break;
        el.setAttribute('data-agy-dk-elevated', '1');
        if (getComputedStyle(el).position === 'static') {
          el.setAttribute('data-agy-dk-elevated-pos', '1');
        }
        list.push(el);
        el = el.parentElement;
      }
      root._elevatedAncestors = list;
    };

    const closePinned = (dismiss = false) => {
      const pinned = root._pinnedGroup;
      if (pinned) {
        pinned.removeAttribute('data-pinned');
        if (dismiss) pinned.dataset.dismissed = 'true';
        pinned.querySelector('.dk-pill').setAttribute('aria-expanded', 'false');
      }
      root._pinnedGroup = null;
      root.removeAttribute('data-pinned');
      syncElevation(false);
    };
    root._layoutPopovers = (grp = root._pinnedGroup || root.querySelector('.dk-grp:hover')) => {
      const pop = grp?.querySelector('.dk-pop');
      if (!pop && root.dataset.panelLayout !== 'matched') {
        root._fitPanelHeights?.();
        return;
      }
      // Constrain width before measuring heights or positioning; moving a panel
      // alone cannot make it fit inside a narrower clipping ancestor.
      let minLeft = 8;
      let maxRight = window.innerWidth - 8;
      for (let el = root; el && el !== document.documentElement; el = el.parentElement || el.getRootNode().host) {
        const cs = getComputedStyle(el);
        if (cs.overflowX === 'visible' && !/paint|strict|content/.test(cs.contain)) continue;
        const innerLeft = el.getBoundingClientRect().left + el.clientLeft;
        minLeft = Math.max(minLeft, innerLeft + 4);
        maxRight = Math.min(maxRight, innerLeft + el.clientWidth - 4);
      }
      const limit = `${Math.max(0, maxRight - minLeft)}px`;
      if (root.style.getPropertyValue('--dk-pop-max-width') !== limit) root.style.setProperty('--dk-pop-max-width', limit);
      root._fitPanelHeights?.();
      const width = pop?.getBoundingClientRect().width;
      if (!width) return;
      const pill = grp.querySelector('.dk-pill').getBoundingClientRect();
      const stripLeft = root.getBoundingClientRect().left;
      let left = Math.max(stripLeft, pill.right - width);
      left = Math.max(minLeft, Math.min(left, maxRight - width));
      pop.style.left = (left - grp.getBoundingClientRect().left) + 'px';
    };
    for (const grp of root.querySelectorAll('.dk-grp')) {
      const pop = grp.querySelector('.dk-pop');
      pop?.addEventListener('pointermove', (ev) => {
        const r = pop.getBoundingClientRect();
        pop.style.setProperty('--dk-px', Math.round(ev.clientX - r.left) + 'px');
        pop.style.setProperty('--dk-py', Math.round(ev.clientY - r.top) + 'px');
      }, { passive: true });
      grp.addEventListener('mouseenter', () => {
        root._refreshCacheTooltip?.();
        grp.removeAttribute('data-dismissed');
        if (!root._pinnedGroup || root._pinnedGroup === grp) {
          grp.querySelector('.dk-pill').setAttribute('aria-expanded', 'true');
          syncElevation(true);
        }
        root._layoutPopovers(root._pinnedGroup || grp);
      });
      grp.addEventListener('mouseleave', () => {
        grp.removeAttribute('data-dismissed');
        if (root._pinnedGroup === grp) return;
        grp.querySelector('.dk-pill').setAttribute('aria-expanded', 'false');
        const pop = grp.querySelector('.dk-pop');
        if (pop) pop.style.left = '';
        syncElevation();
      });
      grp.querySelector('.dk-pill').addEventListener('click', (event) => {
        event.stopPropagation();
        root._refreshCacheTooltip?.();
        if (grp.dataset.el === 'grpCtx') {
          closePinned();
          grp.dataset.dismissed = 'true';
          grp.querySelector('.dk-pill').setAttribute('aria-expanded', 'false');
          syncElevation(false);
          if (globalThis.__agyPrismDeck?.openOverviewTelemetry?.()) return;
        }
        const wasPinned = root._pinnedGroup === grp;
        closePinned();
        if (wasPinned) {
          grp.dataset.dismissed = 'true';
          syncElevation(false);
        } else {
          grp.removeAttribute('data-dismissed');
          grp.dataset.pinned = 'true';
          root.dataset.pinned = 'true';
          root._pinnedGroup = grp;
          grp.querySelector('.dk-pill').setAttribute('aria-expanded', 'true');
          syncElevation(true);
          root._layoutPopovers(grp);
        }
      });
    }
    root._onOutsideClick = (event) => { if (!event.composedPath().includes(root)) closePinned(); };
    root._onEscape = (event) => {
      if (event.key !== 'Escape') return;
      closePinned(true);
      clearElevation();
      for (const grp of root.querySelectorAll('.dk-grp')) {
        grp.dataset.dismissed = 'true';
        grp.querySelector('.dk-pill').setAttribute('aria-expanded', 'false');
      }
    };
    document.addEventListener('click', root._onOutsideClick);
    document.addEventListener('keydown', root._onEscape);
    root._onResize = () => root._scheduleLayout?.();
    window.addEventListener('resize', root._onResize);
    root.querySelector('[data-el="rowCacheHit"]').addEventListener('mouseenter', () => root._refreshCacheTooltip?.());
  }

  if (!footerLeft.contains(host)) {
    footerLeft.appendChild(host);
  }
  const labels = presentation.apply(root, d.prefs);
  presentation.renderContextTooltips(root, d.contextData, labels);
  const alerts = presentation.renderAlerts(root, { ...d.contextData, requestError: d.requestError }, d.prefs, labels);
  root.querySelector('[data-el="grpQuota"]').hidden = d.cloudPaygo;
  if (root._pinnedGroup?.hidden) {
    root._pinnedGroup.removeAttribute('data-pinned');
    root._pinnedGroup.querySelector('.dk-pill').setAttribute('aria-expanded', 'false');
    root._pinnedGroup = null;
    root.removeAttribute('data-pinned');
  }
  root._refreshCacheTooltip = () => {
    root.querySelector('[data-el="rowCacheHit"]').title = presentation.cacheTooltip(d.cache, labels, Date.now(), d.prefs);
  };
  root._refreshCacheTooltip();
  presentation.renderGeneration(root.querySelector('.dk-ctx-pop'), d.generation, labels, d.prefs);
  presentation.renderTurnMetrics(root, d.turnMetrics, labels, d.prefs);
  presentation.renderHistory(root, d.history, labels, d.contextData?.maxContextTokens || 0, Date.now());
  const grpModel = root.querySelector('[data-el="grpModel"]');
  const pillSpeed = root.querySelector('[data-el="pillSpeed"]');
  const tps = d.turnSpeed?.generation?.tps;
  // Turn scope comes from persisted USER_INPUT, not cancel-button appearance.
  // Activity and the last completed request's speed are independent signals.
  const now = Date.now();
  const turnKey = location.pathname + ':' + (d.turnSpeed?.userStepIndex ?? 'none');
  const requestIndex = d.turnSpeed?.generation?.requestIndex ?? null;
  const running = !!d.turnSpeed?.hasActiveStep || !!footerLeft.parentElement.querySelector('[data-testid="input-cancel-button"]');
  const hasSpeed = Number.isFinite(tps) && tps >= 0;
  const motionEnabled = d.prefs?.speedAnimation === true;
  pillSpeed.hidden = d.prefs?.showSpeed === false || (!d.turnSpeed && !running);
  const speedValue = pillSpeed.querySelector('[data-generation="speed"]');
  const speedText = hasSpeed ? tps.toFixed(1) + ' tok/s' : '—';
  if (speedValue.textContent !== speedText) speedValue.textContent = speedText;
  let activity = root._speedActivity;
  if (!activity || activity.turnKey !== turnKey) {
    activity = root._speedActivity = { turnKey, running: false, requestIndex: null, coolUntil: 0 };
  }
  if (running) activity.coolUntil = 0;
  else if (activity.running) activity.coolUntil = now + 15000;
  else if (requestIndex !== null && requestIndex !== activity.requestIndex) {
    // Use response completion time, not unrelated tool activity.
    const recordedAt = d.turnSpeed?.completedAtMs || 0;
    if (recordedAt > 0 && recordedAt <= now) activity.coolUntil = Math.max(activity.coolUntil, recordedAt + 15000);
  }
  activity.running = running;
  activity.requestIndex = requestIndex;
  if (motionEnabled && !pillSpeed.hidden) {
    pillSpeed.dataset.motion = running ? 'active' : activity.coolUntil > now ? 'recent' : 'idle';
    pillSpeed.dataset.tier = hasSpeed ? (tps >= 25 ? 'green' : tps >= 10 ? 'yellow' : 'red') : 'unknown';
  } else {
    pillSpeed.removeAttribute('data-motion');
    pillSpeed.removeAttribute('data-tier');
  }
  const contextPill = root.querySelector('[data-el="grpCtx"] .dk-pill');
  contextPill.setAttribute('aria-label', labels.context);
  for (const node of [contextPill, ...contextPill.querySelectorAll('[title]')]) node.removeAttribute('title');
  root.querySelector('[data-el="grpQuota"] .dk-pill').setAttribute('aria-label', labels.quota);

  const setK = (k, val) => {
    const el = root.querySelector(`[data-k="${k}"]`);
    if (el && el.textContent !== val) el.textContent = val;
  };

  setK('pillCtx', d.pillCtx);
  setK('usedPctText', d.pillCtx);
  setK('usedFrac', d.usedFrac);
  setK('valCacheHit', d.valCacheHit);
  setK('valCacheHitK', d.valCacheHitK || '');
  setK('valTurn0K', d.valTurn0K);
  setK('valReadK', d.valReadK);
  setK('valThinkK', d.valThinkK);
  setK('valOutK', d.valOutK);
  setK('valTurn0Pct', d.valTurn0Pct);
  setK('valReadPct', d.valReadPct);
  setK('valThinkPct', d.valThinkPct);
  setK('valOutPct', d.valOutPct);

  // Match active model to quota pills & live Orchestrator capsule
  root._deckQuotas = d;
  root._deckLabels = labels;
  const readFooterModelText = () => {
    let raw = '';
    for (const child of footerLeft.children) {
      if (child !== host && child.textContent) raw += ' ' + child.textContent.trim();
    }
    return raw.trim();
  };
  const applyModelCapsule = () => {
    if (!grpModel) return;
    const q = root._deckQuotas || d;
    const curLabels = root._deckLabels || labels;
    const rawFooter = readFooterModelText();
    const activeOrch = presentation.resolveActiveOrchestratorModel(q.stepModel, rawFooter);
    const mv = presentation.stepModelView(activeOrch, curLabels);
    grpModel.hidden = !mv;
    if (!mv) {
      if (root._pinnedGroup === grpModel) {
        grpModel.removeAttribute('data-pinned');
        grpModel.querySelector('.dk-pill')?.setAttribute('aria-expanded', 'false');
        root._pinnedGroup = null;
        root.removeAttribute('data-pinned');
      }
      setK('pillModel', '');
      setK('pillEffort', '');
      return;
    }
    grpModel.dataset.phase = mv.phase;
    const isLive = !mv.readyPending && (!!q.turnSpeed?.hasActiveStep || !!mv.liveRunning || !!footerLeft.parentElement?.querySelector('[data-testid="input-cancel-button"]'));
    grpModel.dataset.live = String(isLive);
    const modelPill = grpModel.querySelector('.dk-pill');
    if (modelPill) modelPill.setAttribute('aria-label', `${curLabels.stepModel}: ${mv.displayName}`);
    const effEl = grpModel.querySelector('[data-el="pillEffortEl"]');
    if (effEl) effEl.dataset.effort = mv.effort || '';
    setK('pillModel', mv.pillMain);
    setK('pillEffort', mv.pillEffort);
    presentation.renderStepModelPopover(grpModel.querySelector('[data-el="modelPop"]'), activeOrch, curLabels);
  };
  root._applyModelCapsule = applyModelCapsule;
  applyModelCapsule();
  // Reveals reserve their final width before fitting the footer. Animating layout
  // width from zero lets the fit check pass too early and overlap native buttons.
  // Leaving items may shrink; they never need more room than the fitted layout.
  const motion = (key, el, restore) => {
    const state = root._motionPrev || (root._motionPrev = {});
    // Still collapsing: a later re-render hiding it again must not cut the animation short.
    if (el._leaving) {
      if (el.hidden) { el.hidden = false; return; }
      el._leaving.cancel(); el._leaving = null;
    }
    const visible = !el.hidden;
    const text = el.textContent;
    const width = visible ? el.getBoundingClientRect().width : 0;
    const p = state[key];
    state[key] = { visible, text, width };
    if (!p || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (visible === p.visible && (!visible || text === p.text)) return;
    for (const a of el.getAnimations()) a.cancel();
    const gap = parseFloat(getComputedStyle(el.parentElement).columnGap) || 0;
    // Cancel the gap on the side that has a neighbour, so a leading item doesn't slide outside its capsule.
    const prevSib = el.previousElementSibling;
    const side = prevSib && !prevSib.hidden && getComputedStyle(prevSib).display !== 'none' ? 'marginLeft' : 'marginRight';
    const box = (w, o, m) => ({ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: w + 'px', minWidth: Math.min(w, width || w) + 'px', opacity: o, [side]: m + 'px' });
    const timing = { duration: 220, easing: 'ease' };
    if (visible && !p.visible) {
      el.animate([{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, clipPath: 'inset(0)' }], timing);
    } else if (!visible && p.visible) {
      el.hidden = false;
      restore?.(p.text); // collapse what was shown, not the cleared value
      const out = el.animate([{ ...box(p.width, 1, 0), minWidth: '0px' }, { ...box(0, 0, -gap), minWidth: '0px' }], { ...timing, fill: 'forwards' });
      el._leaving = out;
      out.onfinish = () => { el._leaving = null; el.hidden = true; out.cancel(); root._scheduleLayout?.(); };
    } else if (Math.abs(width - p.width) > 0.5) {
      el.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 180, easing: 'ease' });
    }
  };
  const applyModelQuota = () => {
    let mt = '';
    for (const child of footerLeft.children) {
      if (child !== host && child.textContent) {
        mt += ' ' + child.textContent.trim();
      }
    }
    mt = mt.trim().toLowerCase();
    const q = root._deckQuotas || d;
    const groups = q.quotaSummaryGroups || [];

    let matched = null;
    // 1. Match specific non-generic group titles (e.g. "Gemini 4 Argon", "Gemini 4 Carbon", "Claude and GPT models")
    for (const g of groups) {
      if (g.title === 'Gemini') continue;
      if (
        (g.rawName.includes('claude') || g.rawName.includes('gpt')) &&
        (mt.includes('claude') || mt.includes('sonnet') || mt.includes('opus') || mt.includes('gpt'))
      ) {
        matched = g;
        break;
      }
      const tokens = g.rawName
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length >= 3 && !['gemini', 'model', 'models', 'and', 'the', 'for'].includes(t));
      if (tokens.some((t) => mt.includes(t))) {
        matched = g;
        break;
      }
    }

    // 2. Match explicit "Models within this group: ..." description list
    if (!matched) {
      const modelKeys = ['carbon', 'argon', 'hydrogen', 'flash', 'claude', 'sonnet', 'opus', 'gpt'];
      const activeKeys = modelKeys.filter((k) => mt.includes(k));
      if (activeKeys.length > 0) {
        matched = groups.find((g) => activeKeys.some((k) => g.modelsInGroup && g.modelsInGroup.includes(k))) || null;
      }
    }

    // 3. Fallback to main Gemini group (handles Ultra where Argon is part of Gemini Models)
    if (!matched) {
      matched = groups.find((g) => g.title === 'Gemini') || groups[0] || null;
    }
    for (const group of root.querySelectorAll('.dk-q-group')) {
      group.dataset.active = group.dataset.pool === matched?.rawName ? 'true' : 'false';
    }

    const q5hVal = matched ? matched.q5h || '--%' : '--%';
    const qWkVal = matched ? matched.qWk || '--%' : '--%';
    setK('pill5h', q5hVal);
    setK('pillWk', qWkVal);
    const hideAbsent = q.prefs?.hideUnavailableQuota === true;
    const pair5h = root.querySelector('[data-el="pair5h"]');
    const pairWk = root.querySelector('[data-el="pairWk"]');
    pair5h.hidden = hideAbsent && q5hVal === '--%' && qWkVal !== '--%';
    pairWk.hidden = hideAbsent && qWkVal === '--%' && q5hVal !== '--%';
    motion('pair5h', pair5h);
    motion('pairWk', pairWk);
    root.dataset.preferWkOnly = q5hVal === '--%' && qWkVal !== '--%' ? '1' : '0';
    return mt;
  };
  root._applyModelQuota = applyModelQuota;
  const modelText = applyModelQuota();

  const getNativeVisualInfo = (el) => {
    let maxR = -Infinity;
    let svgClipped = false;
    const walk = (node, parentClip) => {
      const cs = getComputedStyle(node);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (cs.display === 'contents') {
        for (const child of node.children) walk(child, parentClip);
        return;
      }
      const tag = node.tagName ? node.tagName.toLowerCase() : '';
      const r = node.getBoundingClientRect();
      if (r.width > 0 || r.height > 0) {
        if (tag === 'svg') {
          if (parentClip < Infinity && r.width > 0 && r.right > parentClip + 1) {
            svgClipped = true;
          }
          const visR = Math.min(r.right, parentClip);
          if (visR > maxR) maxR = visR;
          return;
        }
        const visR = Math.min(r.right, parentClip);
        if (visR > maxR) maxR = visR;
        const ownClip = cs.overflowX === 'hidden' || cs.overflowX === 'clip' ? r.right : Infinity;
        const nextClip = Math.min(parentClip, ownClip);
        if (cs.overflowX === 'visible' && node.scrollWidth > node.clientWidth + 1) {
          const overflowR = Math.min(r.left + node.scrollWidth, parentClip);
          if (overflowR > maxR) maxR = overflowR;
        }
        for (const child of node.children) walk(child, nextClip);
      } else {
        for (const child of node.children) walk(child, parentClip);
      }
    };
    walk(el, Infinity);
    return { maxR, svgClipped };
  };

  const adjustLayout = () => {
    if (root._adjustingLayout) return;
    root._adjustingLayout = true;
    try {
    const footer = footerLeft.parentElement;
    if (!footer || footer.getBoundingClientRect().width <= 0) return;
    const visible = el => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const children = Array.from(footerLeft.children);
    const nativeChildren = children.slice(0, children.indexOf(host)).filter(el => visible(el) || el.classList.contains('dk-model-squeezed'));
    const modelTargets = nativeChildren.filter((c) => c.textContent && c.textContent.trim().length > 0);
    const turbo = footer.querySelector('[data-testid="permissions-selector-trigger"]');
    if (root._turboTarget && root._turboTarget !== turbo) root._turboTarget.removeAttribute('data-deck-turbo-collapsed');
    root._turboTarget = turbo;

    const isClippedEl = (el) => {
      if (el instanceof SVGElement) return false;
      const overflow = getComputedStyle(el).overflowX;
      if (overflow !== 'hidden' && overflow !== 'clip') return false;
      if (el.scrollWidth <= el.clientWidth + 2) return false;
      const r = el.getBoundingClientRect();
      return r.height > 0 && el.getClientRects().length > 0;
    };

    const isNativeSqueezed = () => {
      for (const c of nativeChildren) {
        if (isClippedEl(c)) return true;
        for (const node of c.querySelectorAll('*')) {
          if (isClippedEl(node)) return true;
        }
      }
      return false;
    };

    const syncSqueezeClasses = (compress) => {
      footerLeft.classList.toggle('dk-fl-squeezed', !!compress);
      for (const mt of modelTargets) {
        mt.classList.toggle('dk-model-squeezed', !!compress);
        mt.classList.toggle('dk-model-squeezed-hard', compress === 'hard');
        if (!compress) {
          mt.classList.remove('dk-squeeze-box', 'dk-squeeze-item');
          for (const el of mt.querySelectorAll('.dk-squeeze-box, .dk-squeeze-item')) {
            el.classList.remove('dk-squeeze-box', 'dk-squeeze-item');
          }
          continue;
        }
        const tag = (el) => {
          const txt = el.textContent ? el.textContent.trim() : '';
          if (!txt) {
            el.classList.remove('dk-squeeze-box', 'dk-squeeze-item');
            return;
          }
          const isBoxOrLong = el.children.length > 0 || txt.length > 5;
          el.classList.toggle('dk-squeeze-box', isBoxOrLong);
          el.classList.toggle('dk-squeeze-item', !isBoxOrLong);
        };
        tag(mt);
        for (const el of mt.querySelectorAll('div, span, button, a, p, label')) tag(el);
      }
    };

    const compactCls = root.dataset.preferWkOnly === '1' ? 'dk-hide-5h' : 'dk-hide-wk';
    const ctxHideCls = !pillSpeed.hidden ? 'dk-hide-ctx-metric' : 'dk-hide-cval';
    const modeClasses = ['dk-hide-speed', 'dk-hide-model', 'dk-hide-wk', 'dk-hide-5h', 'dk-hide-qval', 'dk-hide-cval', 'dk-hide-ctx-metric', 'dk-hide-quota', 'dk-hide-error-label', 'dk-hide-ctx', 'dk-hide-all'];
    const modes = [
      { classes: [], compress: '' },
      // First reserve width by collapsing the native Turbo selector to its shield.
      // Keep it collapsed through ALL capsule stages, never alternate priorities.
      ...(turbo ? [{ classes: [], compress: '' }] : []),
      { classes: [ctxHideCls], compress: '' },
      { classes: [ctxHideCls, compactCls], compress: '' },
      ...(alerts.visible ? [{ classes: [ctxHideCls, compactCls, 'dk-hide-error-label'], compress: '' }] : []),
      { classes: ['dk-hide-speed', compactCls, 'dk-hide-error-label'], compress: '' },
      { classes: ['dk-hide-speed', compactCls, 'dk-hide-model', 'dk-hide-error-label'], compress: '' },
      { classes: ['dk-hide-speed', compactCls, 'dk-hide-model', 'dk-hide-qval', 'dk-hide-error-label'], compress: '' },
      { classes: ['dk-hide-speed', compactCls, 'dk-hide-model', 'dk-hide-qval', 'dk-hide-error-label', 'dk-hide-cval'], compress: '' },
      { classes: ['dk-hide-speed', compactCls, 'dk-hide-model', 'dk-hide-qval', 'dk-hide-error-label', 'dk-hide-cval'], compress: 'soft' },
      { classes: ['dk-hide-speed', compactCls, 'dk-hide-model', 'dk-hide-qval', 'dk-hide-error-label', 'dk-hide-cval'], compress: 'hard' },
      { classes: ['dk-hide-speed', 'dk-hide-model', 'dk-hide-cval', 'dk-hide-quota', 'dk-hide-error-label'], compress: 'hard' },
      ...(alerts.visible ? [{ classes: ['dk-hide-speed', 'dk-hide-model', 'dk-hide-ctx', 'dk-hide-quota', 'dk-hide-error-label'], compress: 'hard' }] : []),
      { classes: ['dk-hide-all'], compress: '' },
    ];

    for (const [modeIndex, mode] of modes.entries()) {
      if (turbo) {
        if (modeIndex > 0) turbo.setAttribute('data-deck-turbo-collapsed', 'true');
        else turbo.removeAttribute('data-deck-turbo-collapsed');
      }
      const classes = mode.classes;
      for (const cls of modeClasses) {
        root.classList.toggle(cls, classes.includes(cls));
      }
      syncSqueezeClasses(mode.compress);
      if (mode.classes.includes('dk-hide-all')) break;

      const rootRect = root.getBoundingClientRect();
      if (rootRect.width <= 0) continue;

      const rightControls = footer
        ? Array.from(footer.children).filter((el) => {
            if (el === footerLeft || !visible(el) || !(el.textContent.trim() || el.querySelector('button, svg, img, input, a, [role="button"]'))) return false;
            const rect = el.getBoundingClientRect();
            const left = footerLeft.getBoundingClientRect();
            return rect.bottom > left.top + 2 && rect.top < left.bottom - 2;
          })
        : [];
      const rightMinLeft =
        rightControls.length > 0
          ? Math.min(...rightControls.map((el) => el.getBoundingClientRect().left))
          : Infinity;
      const footerCs = footer ? getComputedStyle(footer) : null;
      const footerRightEdge = footer
        ? footer.getBoundingClientRect().right - (parseFloat(footerCs.paddingRight) || 0)
        : Infinity;
      const flCs = getComputedStyle(footerLeft);
      const flClipRight = flCs.overflowX !== 'visible' ? footerLeft.getBoundingClientRect().right + 1 : Infinity;
      const minRightBound = Math.min(rightMinLeft, footerRightEdge, flClipRight);

      let nativeMaxRight = -Infinity;
      let anySvgClipped = false;
      for (const c of nativeChildren) {
        const info = getNativeVisualInfo(c);
        if (info.maxR > nativeMaxRight) nativeMaxRight = info.maxR;
        if (info.svgClipped) anySvgClipped = true;
      }

      const fitsRight =
        rootRect.right <= rightMinLeft - 4 &&
        rootRect.right <= footerRightEdge + 1 &&
        rootRect.right <= flClipRight;
      const fitsLeft = nativeMaxRight === -Infinity || rootRect.left >= nativeMaxRight + 1;
      const crowdedModel = !mode.compress && minRightBound - rootRect.right < 24 && isNativeSqueezed();
      if (fitsRight && fitsLeft && !(mode.compress && anySvgClipped) && !crowdedModel) break;
    }
    } finally {
      root._adjustingLayout = false;
    }
  };
  root._adjustLayout = () => {
    adjustLayout();
    root._layoutPopovers();
  };
  root._scheduleLayout = () => {
    if (root._layoutRaf) return;
    root._layoutRaf = requestAnimationFrame(() => {
      root._layoutRaf = 0;
      if (root.isConnected) root._adjustLayout();
    });
  };

  if (root._observedFooterLeft !== footerLeft) {
    if (root._modelObserver) root._modelObserver.disconnect();
    if (root._resizeObserver) root._resizeObserver.disconnect();
    root._observedFooterLeft = footerLeft;

    const obs = new MutationObserver((mutations) => {
      if (mutations.every((m) => root.contains(m.target))) return;
      const lateLegacy = document.getElementById('deck-metrics-strip');
      if (lateLegacy) {
        release(lateLegacy);
        lateLegacy.remove();
        if (globalThis.__agyPrismDeck) window.__deckOwnerTs = globalThis.__agyPrismDeck.owner;
      }
      if (root._applyModelQuota) root._applyModelQuota();
      if (root._applyModelCapsule) root._applyModelCapsule();
      root._scheduleLayout?.();
    });
    obs.observe(footerLeft, { subtree: true, characterData: true, childList: true });
    root._modelObserver = obs;

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        root._scheduleLayout?.();
      });
      if (footerLeft.parentElement) ro.observe(footerLeft.parentElement);
      ro.observe(footerLeft);
      root._resizeObserver = ro;
    }
  }

  // Update progress bar & cache cooling indicator
  const segRead = root.querySelector('[data-el="segRead"]');
  const segOut = root.querySelector('[data-el="segOut"]');
  const segThink = root.querySelector('[data-el="segThink"]');
  const segTurn0 = root.querySelector('[data-el="segTurn0"]');
  const dotCached = root.querySelector('[data-el="dotCached"]');
  const ctxIconSvg = root.querySelector('[data-el="ctxIconSvg"]');

  if (segRead) segRead.style.width = d.segReadW;
  if (segOut) segOut.style.width = d.segOutW;
  if (segThink) segThink.style.width = d.segThinkW;
  if (segTurn0) segTurn0.style.width = d.segTurn0W;
  if (ctxIconSvg) ctxIconSvg.style.color = d.ctxIconColor || '';
  if (dotCached && dotCached.innerHTML !== d.cacheIconSvg) {
    dotCached.innerHTML = d.cacheIconSvg;
  }
  const valCacheHitEl = root.querySelector('[data-el="valCacheHitEl"]');
  if (valCacheHitEl) {
    valCacheHitEl.style.color = d.cacheValColor;
    valCacheHitEl.style.textDecoration = d.cacheValDeco;
    valCacheHitEl.style.opacity = d.cacheValOp;
  }
  const valCacheHitKEl = root.querySelector('[data-k="valCacheHitK"]');
  if (valCacheHitKEl) {
    valCacheHitKEl.style.color = d.cacheValColor;
  }

  motion('speed', pillSpeed, text => { speedValue.textContent = text.trim(); });
  motion('error', root.querySelector('[data-el="grpError"]'));

  // Update Quota Popover HTML
  const quotaPop = root.querySelector('[data-el="quotaPop"]');
  if (quotaPop && quotaPop.innerHTML !== d.quotaHtml) {
    quotaPop.innerHTML = d.quotaHtml;
  }
  presentation.apply(root, d.prefs);
  applyModelQuota();

  root._fitPanelHeights = () => {
    // Only visible capsules participate in matched panel height.
    const errorPop = root.querySelector('.dk-error-pop');
    const pops = [root.querySelector('.dk-ctx-pop')];
    if (!quotaPop.closest('.dk-grp').hidden) pops.push(quotaPop);
    else quotaPop.style.height = '';
    if (errorPop && !errorPop.closest('.dk-grp').hidden) pops.push(errorPop);
    else if (errorPop) errorPop.style.height = '';
    if (root.dataset.panelLayout !== 'matched') {
      for (const pop of pops) pop.style.height = '';
      root._heightKey = '';
      return;
    }
    const key = JSON.stringify(d.prefs) + pops.map(pop => pop.textContent).join('|') + root.style.getPropertyValue('--dk-pop-max-width');
    if (key === root._heightKey) return;
    const previous = pops.map(pop => ({ display: pop.style.display, visibility: pop.style.visibility }));
    root.dataset.panelLayout = 'natural';
    for (const pop of pops) { pop.style.height = ''; pop.style.display = 'block'; pop.style.visibility = 'hidden'; }
    const heights = pops.map(pop => pop.getBoundingClientRect().height);
    root.dataset.panelLayout = 'matched';
    for (const [index, pop] of pops.entries()) {
      pop.style.display = previous[index].display;
      pop.style.visibility = previous[index].visibility;
      if (heights.every(height => height > 0)) pop.style.height = Math.max(...heights) + 'px';
    }
    if (heights.every(height => height > 0)) root._heightKey = key;
  };
  root._adjustLayout();

  return 'ok:' + modelText;
}

function fmtK(n) {
  return formatTokens(n);
}

function fmtColK(n) {
  return formatTokens(n);
}

function quotaColor(frac) {
  const clamped = Math.max(0, Math.min(1, Number(frac || 0)));
  const pctLeft = Math.round(clamped * 100);
  return pctLeft <= 10 ? '#ef4444' : pctLeft <= 25 ? '#f59e0b' : '#4ea84e';
}

function makeRingSvg(frac) {
  const clamped = Math.max(0, Math.min(1, Number(frac || 0)));
  const r = 6.5;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);
  const color = quotaColor(clamped);
  return (
    '<svg width="16" height="16" viewBox="0 0 18 18" style="transform: rotate(-90deg); flex-shrink: 0;">' +
    '<circle cx="9" cy="9" r="' + r + '" fill="none" stroke="rgba(142,142,147,0.28)" stroke-width="2.2"/>' +
    '<circle cx="9" cy="9" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linecap="round" ' +
    'stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + offset.toFixed(2) + '"/>' +
    '</svg>'
  );
}

function formatGroupTitle(raw) {
  const s = String(raw || '').trim();
  if (s === 'Gemini Models') return 'Gemini';
  if (s.toLowerCase().startsWith('claude')) return 'Claude';
  return s;
}

function toView(d) {
  const maxCtx = d.maxContextTokens || 0;
  const ctx = d.contextTokens || 0;
  const cached = d.cachedIn || 0;
  const out = d.totalOutputTokens || 0;
  const think = d.totalThinkingTokens || 0;
  const turn0 = d.turn0Tokens || 0;
  const read = Math.max(0, ctx - turn0 - out - think);

  const hasMax = maxCtx > 0;
  const usedPctRound = hasMax ? Math.round((ctx / maxCtx) * 100) : 0;
  const usedPctExact = hasMax ? Math.min(100, (ctx / maxCtx) * 100) : 0;
  const compSum = read + out + think + turn0;
  const scale = compSum > 0 ? usedPctExact / compSum : 0;

  const segReadW = (read * scale).toFixed(2) + '%';
  const segOutW = (out * scale).toFixed(2) + '%';
  const segThinkW = (think * scale).toFixed(2) + '%';
  const segTurn0W = (turn0 * scale).toFixed(2) + '%';

  const pctStr = (val) => (hasMax ? Math.round((val / maxCtx) * 100) + '%' : (ctx === 0 ? '0%' : '--%'));
  const readPct = pctStr(read);
  const outPct = pctStr(out);
  const thinkPct = pctStr(think);
  const turn0Pct = pctStr(turn0);
  const cache = cacheView(d, d.prefs);
  const { iconSvg: cacheIconSvg, valColor: cacheValColor, valDeco: cacheValDeco, valOp: cacheValOp, text: valCacheHit, countdown: valCacheHitK, ctxIconColor } = cache;

  const quotaSummaryGroups = [];
  let quotaHtml = '<div class="dk-panel-content">';
  const windowOrder = { '5h': 0, weekly: 1 };
  for (const g of d.quotaGroups || []) {
    const rawName = String(g.displayName || '').trim().toLowerCase();
    const title = formatGroupTitle(g.displayName);
    const descMatch = String(g.description || '').match(/models within this group:\s*([^\n.]+)/i);
    const modelsInGroup = descMatch ? descMatch[1].toLowerCase() : '';
    let q5h = '--%';
    let qWk = '--%';

    // Weekly exhaustion overrides 5h; zero is not a missing window.
    const knownBuckets = (g.buckets || []).filter(b => Number.isFinite(b.remainingFraction));
    const weeklyBucket = knownBuckets.find(b => b.window === 'weekly');
    const activeBucket = knownBuckets.find(b => b.window === '5h') || weeklyBucket;
    const activeFraction = weeklyBucket && Math.round(weeklyBucket.remainingFraction * 100) <= 0 ? 0 : activeBucket?.remainingFraction;
    const activeColor = activeBucket
      ? quotaColor(activeFraction)
      : 'var(--muted-foreground, #8e8e93)';
    quotaHtml += '<div class="dk-q-group" data-pool="' + escapeHtml(rawName) + '">';
    quotaHtml += '<div class="dk-q-title">' + escapeHtml(title) + '<span class="dk-q-active" style="color:' + activeColor + '" aria-hidden="true"></span></div>';
    const buckets = [...(g.buckets || [])].sort(
      (a, b) => (windowOrder[a.window] ?? 2) - (windowOrder[b.window] ?? 2)
    );
    for (const b of buckets) {
      const baseLabel =
        b.window === 'weekly'
          ? 'Weekly'
          : b.window === '5h'
            ? '5 Hours'
            : String(b.displayName || b.window || '')
                .replace(/\s*limit\b/gi, '')
                .replace(/\b5h(?:ours)?\b/gi, '5 Hours')
                .trim();
      const resetShort = formatReset(b.resetTime, d.prefs);
      const hasFrac = Number.isFinite(b.remainingFraction);
      const pctLeft = hasFrac ? Math.round(b.remainingFraction * 100) : null;
      const pctStr = hasFrac ? pctLeft + '%' : '--%';

      if (hasFrac && b.window === '5h') q5h = pctStr;
      if (hasFrac && b.window === 'weekly') qWk = pctStr;

      quotaHtml += '<div class="dk-q-row" data-quota-tooltip="' + escapeHtml(JSON.stringify({ pool: title, window: b.window, displayName: b.displayName, remainingFraction: b.remainingFraction, resetTime: b.resetTime })) + '">';
      const labelKey = b.window === 'weekly' ? 'weekly' : b.window === '5h' ? 'fiveHours' : '';
      const color = hasFrac ? quotaColor(pctLeft / 100) : 'var(--muted-foreground, #8e8e93)';
      const indicator = !hasFrac
        ? (appearance(d.prefs).quotaIndicator === 'bar'
            ? '<span class="dk-q-meter"><span style="width:0%;background:' + color + '"></span></span>'
            : makeRingSvg(null))
        : appearance(d.prefs).quotaIndicator === 'bar'
          ? '<span class="dk-q-meter"><span style="width:' + Math.max(0, Math.min(100, pctLeft)) + '%;background:' + color + '"></span></span>'
          : makeRingSvg(b.remainingFraction);
      quotaHtml += '  <span class="dk-q-label"' + (labelKey ? ' data-i18n="' + labelKey + '"' : '') + '>' + escapeHtml(baseLabel) + '</span>';
      quotaHtml += '  <span class="dk-q-right"><span class="dk-q-pct notranslate" translate="no">' + pctStr + '</span>' + indicator + '</span>';
      quotaHtml += '  <span class="dk-q-mid notranslate" translate="no">' + escapeHtml(resetShort) + '</span>';
      quotaHtml += '</div>';
    }
    quotaHtml += '</div>';
    quotaSummaryGroups.push({ title, rawName, modelsInGroup, q5h, qWk });
  }

  quotaHtml += '</div>';
  return {
    prefs: d.prefs || { language: 'en' },
    generation: d.generation || null,
    turnSpeed: d.turnSpeed || null,
    turnMetrics: d.turnMetrics || null,
    history: d.history || null,
    stepModel: d.stepModel || null,
    requestError: d.requestError || { kind: 'none' },
    cloudPaygo: d.cloudPaygo === true,
    cache: { contextTokens: ctx, cachedIn: cached, lastStepEpochMs: d.lastStepEpochMs || 0 },
    contextData: { contextTokens: ctx, maxContextTokens: maxCtx, compactionThresholdTokens: d.compactionThresholdTokens || 0, cachedIn: cached, uncachedIn: d.uncachedIn, turn0Tokens: turn0, totalOutputTokens: out, totalThinkingTokens: think },
    pillCtx: hasMax ? usedPctRound + '%' : (ctx === 0 ? '0%' : '--%'),
    ctxIconColor,
    usedFrac: fmtK(ctx) + ' / ' + (hasMax ? fmtK(maxCtx) : '--'),
    segReadW,
    segOutW,
    segThinkW,
    segTurn0W,
    cacheIconSvg,
    cacheValColor,
    cacheValDeco,
    cacheValOp,
    valCacheHit,
    valCacheHitK,
    valTurn0Pct: turn0Pct,
    valTurn0K: fmtColK(turn0),
    valReadPct: readPct,
    valReadK: fmtColK(read),
    valThinkPct: thinkPct,
    valThinkK: fmtColK(think),
    valOutPct: outPct,
    valOutK: fmtColK(out),
    quotaSummaryGroups,
    quotaHtml,
    instanceTs: INSTANCE_TS,
  };
}

// Installed once in each renderer. Clocks/layout keep updating without a CDP
// payload, and navigation clears old data before the next server snapshot.
function installRuntime(owner, hash) {
  const previous = globalThis.__agyPrismDeck;
  if (previous?.owner > owner) return 'superseded';
  previous?.dispose();
  const optical = globalThis.__agyPrismOptical;
  const hmUiRef = globalThis.__agyPrismHeatmapUI;
  try { globalThis.__agyCapsuleDeck?.dispose?.(); } catch {}
  try { globalThis.__agyCapsuleOptical?.dispose?.(); } catch {}
  try { window.__agyCapsuleCleanup?.(); } catch {}
  delete globalThis.__agyCapsuleDeck;
  delete globalThis.__agyCapsuleOptical;
  delete globalThis.__agyCapsuleHeatmapUI;
  delete globalThis.__agyCapsulePresentation;
  delete window.__agyCapsuleCleanup;
  document.getElementById('agy-capsule-host')?.remove();
  document.getElementById('agy-capsule-native-layout')?.remove();
  window.__deckOwnerTs = owner;
  let data = null;
  let dataPath = '';
  let disposed = false;
  let heatmapData = null;
  try {
    const rawCache = localStorage.getItem('agyPrismUi.hmCacheV1') || localStorage.getItem('agyCapsule.hmCacheV1');
    if (rawCache) heatmapData = JSON.parse(rawCache);
  } catch {}
  let heatmapOpen = false;
  let heatmapOpenedPath = '';
  let heatmapForceRefresh = false;
  let heatmapLastFetchAt = 0;
  let opticalPrefs = null;
  let pendingSettingsPatch = null;
  let settingsPatchSeq = 0;
  let sidebarListenerRoot = null;
  let sidebarListener = null;
  let hoveredCascadeId = '';
  let uiSyncRaf = 0;
  let uiObserver = null;
  let overviewExpanded = false;
  let overviewScrollPending = false;

  const readFooterModelText = () => {
    const footer = document.querySelector('.agy-composer-footer > div:first-child');
    const host = document.getElementById('agy-prism-host');
    let text = '';
    if (footer) {
      for (const child of footer.children) {
        if (child !== host && child.textContent) text += ' ' + child.textContent.trim();
      }
    }
    return text.trim();
  };

  const syncOverviewTelemetry = () => {
    if (disposed) return;
    const ovUi = globalThis.__agyPrismOverviewUI;
    if (!ovUi) return;
    const ovPanel = document.querySelector('[data-testid="overview-panel"]');
    const scrollBody = ovPanel?.children?.[1];
    if (!scrollBody) return;
    let host = document.getElementById('agy-overview-telemetry-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'agy-overview-telemetry-host';
      host.className = 'p-1';
    }
    host.style.contain = 'inline-size';
    host.style.width = '100%';
    host.style.minWidth = '0';
    host.style.maxWidth = '100%';
    host.style.boxSizing = 'border-box';
    if (host.parentElement !== scrollBody || scrollBody.lastElementChild !== host) {
      scrollBody.appendChild(host);
    }
    const activeData = (data && dataPath === location.pathname) ? data : null;
    ovUi.renderOverviewTelemetry(host, activeData, {
      prefs: activeData?.prefs || opticalPrefs,
      footerModelText: readFooterModelText(),
      convPath: location.pathname,
      expanded: overviewExpanded,
      onToggle: () => {
        overviewExpanded = !overviewExpanded;
        syncOverviewTelemetry();
      },
    });
    if (overviewScrollPending && overviewExpanded) {
      overviewScrollPending = false;
      requestAnimationFrame(() => {
        host.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
      });
    }
  };

  const isHomeRoute = () => {
    const p = location.pathname || '/';
    return !p.startsWith('/c/') && !p.startsWith('/customizations') && !p.startsWith('/automations');
  };

  const syncConvHoverCard = () => {
    const popup = document.querySelector('[data-hover-card-popup]');
    if (!popup) return;
    let cid = hoveredCascadeId;
    const titleText = popup.querySelector('.text-foreground')?.textContent?.trim() || '';
    if (titleText) {
      const curRow = cid ? document.querySelector(`[data-testid="conversation-row-sidebar"][data-cascade-id="${cid}"]`) : null;
      if (!curRow || !(curRow.textContent || '').includes(titleText)) {
        const match = [...document.querySelectorAll('[data-testid="conversation-row-sidebar"][data-cascade-id]')].find(el => (el.textContent || '').includes(titleText));
        if (match) cid = match.getAttribute('data-cascade-id') || cid;
      }
    }
    const metaList = [...popup.querySelectorAll('div')].find(el => el.classList?.contains('flex-col') && el.querySelector(':scope > .text-muted-foreground'));
    if (!metaList) return;
    const existing = popup.querySelector('[data-agy-conv-tokens]');
    const stats = cid ? heatmapData?.byConversation?.[cid] : null;
    const hmUi = globalThis.__agyPrismHeatmapUI;
    if (!stats || !(stats.t > 0) || !hmUi) {
      if (existing) existing.remove();
      return;
    }
    const parts = [`${hmUi.fmtTok(stats.t)} tokens`];
    if (stats.usd > 0) parts.push(hmUi.fmtUsd(stats.usd));
    const label = parts.join(' · ');
    if (existing && existing.getAttribute('data-agy-conv-tokens') === cid && existing.textContent === label) return;
    const row = existing || document.createElement('div');
    row.className = 'flex items-center gap-1 text-sm text-muted-foreground';
    row.setAttribute('data-agy-conv-tokens', cid);
    row.innerHTML =
      '<span class="shrink-0 flex items-center">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<ellipse cx="8" cy="4.2" rx="5" ry="2.1"/>' +
      '<path d="M3 4.2v3.6c0 1.16 2.24 2.1 5 2.1s5-.94 5-2.1V4.2"/>' +
      '<path d="M3 7.8v3.8c0 1.16 2.24 2.1 5 2.1s5-.94 5-2.1V7.8"/>' +
      '</svg></span>' +
      '<span class="truncate">' + escapeHtml(label) + '</span>';
    if (!existing) metaList.appendChild(row);
  };

  const renderHeatmapViews = () => {
    const hmUi = globalThis.__agyPrismHeatmapUI;
    if (!hmUi) return;

    const pane = document.querySelector('.agy-inset-shell > div')?.children?.[2];
    let pageHost = document.getElementById('agy-heatmap-page-host');
    if (heatmapOpen && pane) {
      if (!pageHost) {
        pageHost = document.createElement('div');
        pageHost.id = 'agy-heatmap-page-host';
        pageHost.style.cssText = 'position:absolute;inset:0;z-index:45;display:block;';
        pageHost.attachShadow({ mode: 'open' });
      }
      if (pageHost.parentElement !== pane) pane.appendChild(pageHost);
      pageHost.style.display = 'block';
      hmUi.renderFullHeatmap(pageHost.shadowRoot, heatmapData, {
        showClose: true,
        prefs: opticalPrefs,
        onUpdatePrefs: (patch) => {
          opticalPrefs = { ...(opticalPrefs || {}), ...patch };
          pendingSettingsPatch = { ...(pendingSettingsPatch || {}), ...patch };
          settingsPatchSeq++;
          globalThis.__agyPrismOptical?.apply(opticalPrefs);
          ensureHeatmapChrome();
        },
        onRefresh: () => {
          heatmapForceRefresh = true;
        },
        onThemeChange: () => {
          const hh = document.getElementById('agy-heatmap-home-host')?.shadowRoot;
          if (hh) hh._hmHomeKey = '';
        },
        onClose: () => {
          heatmapOpen = false;
          ensureHeatmapChrome();
        },
      });
    } else if (pageHost) {
      pageHost.style.display = 'none';
    }

    let homeHost = document.getElementById('agy-heatmap-home-host');
    const composer = document.querySelector('.surface-composer');
    const homeParent = composer?.parentElement;
    if (isHomeRoute() && !heatmapOpen && homeParent) {
      const needsAttach = !homeHost || homeHost.parentElement !== homeParent || homeHost.nextElementSibling !== composer;
      if (!homeHost) {
        homeHost = document.createElement('div');
        homeHost.id = 'agy-heatmap-home-host';
        homeHost.style.cssText = 'width:100%;max-width:768px;margin:0 auto 14px;display:block;opacity:0;transform:translateY(6px);transition:opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1);';
        homeHost.attachShadow({ mode: 'open' });
      } else if (needsAttach) {
        homeHost.style.opacity = '0';
        homeHost.style.transform = 'translateY(6px)';
      }
      if (needsAttach) {
        composer.insertAdjacentElement('beforebegin', homeHost);
      }
      hmUi.renderHomeHeatmapCard(homeHost.shadowRoot, heatmapData, {
        onOpenFull: () => {
          heatmapOpen = true;
          heatmapOpenedPath = location.pathname;
          if (!heatmapData || Date.now() - heatmapLastFetchAt > 30000) heatmapForceRefresh = true;
          ensureHeatmapChrome();
        },
      });
      if (needsAttach) {
        requestAnimationFrame(() => {
          if (homeHost?.isConnected) {
            homeHost.style.opacity = '1';
            homeHost.style.transform = 'translateY(0)';
            setTimeout(() => {
              if (homeHost?.isConnected && homeHost.style.opacity === '1') {
                homeHost.style.transform = '';
              }
            }, 260);
          }
        });
      }
    } else if (homeHost) {
      hmUi.cleanupHeatmapRoot?.(homeHost.shadowRoot);
      homeHost.remove();
    }
  };

  const HM_NAV_BASE_CLS = 'agy-button agy-button-custom inline-flex items-center font-medium transition-colors select-none outline-none cursor-pointer disabled:opacity-50 flex-grow w-full justify-start select-none font-normal min-w-0 gap-1.5 px-2 rounded-lg py-1.5';
  const HM_NAV_IDLE_CLS = `${HM_NAV_BASE_CLS} bg-transparent text-secondary-foreground hover:bg-sidebar-muted hover:text-foreground`;
  const HM_NAV_ACTIVE_CLS = `${HM_NAV_BASE_CLS} bg-sidebar-secondary text-foreground`;

  const ensureHeatmapChrome = () => {
    if (disposed) return;
    if (heatmapOpen && location.pathname !== heatmapOpenedPath) {
      heatmapOpen = false;
    }
    if (heatmapOpen) document.documentElement.dataset.agyHmOpen = '1';
    else delete document.documentElement.dataset.agyHmOpen;

    const cust = [...document.querySelectorAll('a[href="/customizations"], a, button')].find(
      el => el.getAttribute?.('href') === '/customizations' || el.textContent?.trim() === 'Customizations',
    );
    const navParent = cust?.parentElement;
    if (navParent) {
      let navBtn = document.getElementById('agy-heatmap-nav-btn');
      if (!navBtn) {
        navBtn = document.createElement('button');
        navBtn.id = 'agy-heatmap-nav-btn';
        navBtn.type = 'button';
        navBtn.innerHTML =
          '<span class="shrink-0 flex items-center">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">' +
          '<rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.4" opacity="0.45"/>' +
          '<rect x="9" y="1.5" width="5.5" height="5.5" rx="1.4" opacity="0.75"/>' +
          '<rect x="1.5" y="9" width="5.5" height="5.5" rx="1.4" opacity="0.75"/>' +
          '<rect x="9" y="9" width="5.5" height="5.5" rx="1.4"/>' +
          '</svg></span>' +
          '<span class="truncate">Insights</span>';
        navBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          heatmapOpen = !heatmapOpen;
          heatmapOpenedPath = location.pathname;
          if (heatmapOpen && (!heatmapData || Date.now() - heatmapLastFetchAt > 30000)) {
            heatmapForceRefresh = true;
          }
          ensureHeatmapChrome();
        });
      }
      const nextCls = heatmapOpen ? HM_NAV_ACTIVE_CLS : HM_NAV_IDLE_CLS;
      if (navBtn.className !== nextCls) navBtn.className = nextCls;
      navBtn.dataset.active = heatmapOpen ? 'true' : 'false';
      if (heatmapOpen) navBtn.setAttribute('aria-current', 'page');
      else navBtn.removeAttribute('aria-current');
      if (navBtn.parentElement !== navParent || cust.nextElementSibling !== navBtn) {
        cust.insertAdjacentElement('afterend', navBtn);
      }

      const insetFirst = document.querySelector('.agy-inset-shell > div')?.children?.[0];
      const sidebarRoot = (insetFirst && insetFirst.contains(navParent))
        ? insetFirst
        : (navParent.closest('aside, nav') || navParent.parentElement?.parentElement || navParent);
      if (sidebarListenerRoot !== sidebarRoot) {
        if (sidebarListenerRoot && sidebarListener) {
          sidebarListenerRoot.removeEventListener('click', sidebarListener, true);
        }
        sidebarListenerRoot = sidebarRoot;
        sidebarListener = (ev) => {
          const hit = ev.target?.closest?.('#agy-heatmap-nav-btn');
          if (hit) return;
          if (heatmapOpen && ev.target?.closest?.('[data-testid="sidebar-navigation-items"] a, [data-testid="sidebar-navigation-items"] button, [data-testid="conversation-row-sidebar"], a[href]')) {
            heatmapOpen = false;
            ensureHeatmapChrome();
          }
        };
        sidebarListenerRoot.addEventListener('click', sidebarListener, true);
      }
    }

    renderHeatmapViews();
  };

  const scheduleUiSync = () => {
    if (disposed || uiSyncRaf) return;
    uiSyncRaf = requestAnimationFrame(() => {
      uiSyncRaf = 0;
      if (disposed) return;
      ensureHeatmapChrome();
      syncConvHoverCard();
      syncOverviewTelemetry();
    });
  };

  const onSidebarPointerOver = (ev) => {
    const row = ev.target?.closest?.('[data-testid="conversation-row-sidebar"][data-cascade-id]');
    if (row) hoveredCascadeId = row.getAttribute('data-cascade-id') || '';
  };
  document.addEventListener('pointerover', onSidebarPointerOver, { passive: true, capture: true });

  if (document.body && typeof MutationObserver === 'function') {
    uiObserver = new MutationObserver(scheduleUiSync);
    uiObserver.observe(document.body, { childList: true, subtree: true });
  }

  const onHeatmapEscape = (ev) => {
    if (ev.key === 'Escape' && heatmapOpen) {
      heatmapOpen = false;
      ensureHeatmapChrome();
    }
  };
  document.addEventListener('keydown', onHeatmapEscape);

  const run = () => {
    if (disposed) return;
    if (globalThis.__agyPrismDeck !== api) return;
    globalThis.__agyPrismOptical?.apply(opticalPrefs || {});
    ensureHeatmapChrome();
    syncConvHoverCard();
    syncOverviewTelemetry();
    if (!data) return;
    if (location.pathname !== dataPath) {
      data = null;
      dataPath = '';
      window.__agyPrismCleanup?.();
      syncOverviewTelemetry();
      return;
    }
    // Installed runtimes own the page; one-off legacy mounts must not strand
    // this runtime behind a newer timestamp while leaving two visible strips.
    window.__deckOwnerTs = owner;
    pageMount(toView(data));
  };
  const timer = setInterval(run, 1000);
  globalThis.__agyPrismOptical?.apply(opticalPrefs || {});
  ensureHeatmapChrome();
  syncOverviewTelemetry();
  const api = {
    owner, hash,
    openOverviewTelemetry() {
      if (disposed) return false;
      const ovBtn = document.querySelector('[data-testid="toggle-overview-panel"]');
      if (!ovBtn) return false;
      const isOvOpen = ovBtn.getAttribute('aria-pressed') === 'true';
      if (isOvOpen && overviewExpanded) {
        ovBtn.click();
        return true;
      }
      overviewExpanded = true;
      overviewScrollPending = true;
      if (!isOvOpen) ovBtn.click();
      syncOverviewTelemetry();
      requestAnimationFrame(syncOverviewTelemetry);
      setTimeout(syncOverviewTelemetry, 120);
      return true;
    },
    readState(caller) {
      if (caller < owner) return 'superseded';
      ensureHeatmapChrome();
      syncConvHoverCard();
      syncOverviewTelemetry();
      const footer = document.querySelector('.agy-composer-footer > div:first-child');
      const footerModelText = readFooterModelText();
      const heatmapOnHome = isHomeRoute() && !!document.getElementById('agy-heatmap-home-host');
      const wantInterval = (heatmapOpen || heatmapOnHome) ? 30000 : 60000;
      const heatmapWantData = !heatmapData || heatmapForceRefresh || Date.now() - heatmapLastFetchAt > wantInterval;
      return {
        owner,
        hash,
        path: location.pathname,
        hasFooter: !!footer,
        footerModelText,
        heatmapOpen,
        heatmapOnHome,
        heatmapWantData,
        heatmapForceRefresh,
        pendingSettingsPatch,
        settingsPatchSeq,
        needOpticalPrefs: !opticalPrefs,
      };
    },
    apply(next, path, caller) {
      if (caller < owner) return 'superseded';
      if (caller !== owner || disposed || path !== location.pathname) return false;
      data = next;
      dataPath = path;
      if (!pendingSettingsPatch && next?.prefs) opticalPrefs = next.prefs;
      run();
      return true;
    },
    applyOptical(prefs, caller, ackSeq = null) {
      if (caller < owner) return 'superseded';
      if (caller !== owner || disposed) return false;
      opticalPrefs = prefs || null;
      if (ackSeq === null || ackSeq === settingsPatchSeq) {
        pendingSettingsPatch = null;
      }
      globalThis.__agyPrismOptical?.apply(opticalPrefs || {});
      ensureHeatmapChrome();
      return true;
    },
    applyHeatmap(next, caller) {
      if (caller < owner) return 'superseded';
      if (caller !== owner || disposed) return false;
      heatmapData = next;
      heatmapForceRefresh = false;
      heatmapLastFetchAt = Date.now();
      try { localStorage.setItem('agyPrismUi.hmCacheV1', JSON.stringify(next)); } catch {}
      ensureHeatmapChrome();
      syncConvHoverCard();
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      clearInterval(timer);
      if (uiSyncRaf) cancelAnimationFrame(uiSyncRaf);
      if (uiObserver) uiObserver.disconnect();
      document.removeEventListener('pointerover', onSidebarPointerOver, true);
      document.removeEventListener('keydown', onHeatmapEscape);
      if (sidebarListenerRoot && sidebarListener) {
        sidebarListenerRoot.removeEventListener('click', sidebarListener, true);
      }
      const hmCleaner = hmUiRef?.cleanupHeatmapRoot || globalThis.__agyPrismHeatmapUI?.cleanupHeatmapRoot;
      hmCleaner?.(document.getElementById('agy-heatmap-home-host')?.shadowRoot);
      hmCleaner?.(document.getElementById('agy-heatmap-page-host')?.shadowRoot);
      optical?.dispose();
      delete document.documentElement.dataset.agyHmOpen;
      document.getElementById('agy-heatmap-nav-btn')?.remove();
      document.getElementById('agy-heatmap-page-host')?.remove();
      document.getElementById('agy-heatmap-home-host')?.remove();
      document.getElementById('agy-overview-telemetry-host')?.remove();
      if (globalThis.__agyPrismDeck === api) {
        window.__agyPrismCleanup?.();
        delete globalThis.__agyPrismDeck;
      }
    },
  };
  globalThis.__agyPrismDeck = api;
  return true;
}

export function buildRuntimeBundle(owner = INSTANCE_TS) {
  const functions = [fmtK, fmtColK, quotaColor, makeRingSvg, formatGroupTitle, toView, pageMount, installRuntime].map(fn => fn.toString()).join('\n');
  const source = getPresentationScript() + '\n' + getHeatmapRendererScript() + '\n' + getOpticalThemeScript() + '\n' + getOverviewRendererScript() + '\n' + functions;
  const hash = createHash('sha256').update(source).digest('hex').slice(0, 16);
  const code = `(()=>{const INSTANCE_TS=${Number(owner)};if(globalThis.__agyPrismDeck?.owner>INSTANCE_TS)return 'superseded';if(globalThis.__agyPrismDeck){try{globalThis.__agyPrismDeck.dispose();}catch{}}${getPresentationScript()}\n${getHeatmapRendererScript()}\n${getOpticalThemeScript()}\n${getOverviewRendererScript()}\nconst {escapeHtml,formatTokens,appearance,formatReset,cacheView}=globalThis.__agyPrismPresentation;\n${functions}\nreturn installRuntime(INSTANCE_TS,${JSON.stringify(hash)});})()`;
  return { code, hash };
}

export { pageMount, toView };

export function startDeckInjector(inspect, options = {}) {
  const owner = options.instanceTs ?? INSTANCE_TS;
  const bundle = buildRuntimeBundle(owner);
  const sockets = new Map();
  let cachedPages = [];
  let lastListAt = 0;
  let lastErr = '';
  let stopped = false;
  let busy = false;
  // 'unknown' until the first lookup; the sidebar explains 'missing' / 'unreachable'.
  let cdpState = 'unknown';
  let latestFooterModelText = '';
  const logOnce = message => {
    if (lastErr !== message) { lastErr = message; console.error('[deck]', message); }
  };
  const retire = (entry, id) => {
    if (entry.closed) return;
    entry.closed = true;
    for (const callback of entry.pending.values()) callback(undefined);
    entry.pending.clear();
    try { entry.ws.close(); } catch {}
    if (sockets.get(id) === entry) sockets.delete(id);
  };
  const connect = async target => {
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    const entry = { ws, pending: new Map(), nextId: 1, lastPayload: '', lastPath: '', timeouts: 0 };
    await new Promise((resolve, reject) => {
      const fail = message => { clearTimeout(timer); retire(entry, target.id); reject(new Error(message)); };
      const timer = setTimeout(() => fail('ws timeout'), 3000);
      ws.onopen = () => { clearTimeout(timer); resolve(); };
      ws.onerror = () => fail('ws error');
    });
    if (stopped) { retire(entry, target.id); throw new Error('injector stopped'); }
    ws.onmessage = event => {
      try {
        const message = JSON.parse(event.data);
        entry.timeouts = 0;
        const callback = entry.pending.get(message.id);
        if (callback) { entry.pending.delete(message.id); callback(message); }
      } catch {}
    };
    ws.onclose = () => retire(entry, target.id);
    sockets.set(target.id, entry);
    return entry;
  };
  const evaluate = (entry, expression, id) => new Promise(resolve => {
    if (entry.ws.readyState !== 1) return resolve(undefined);
    const msgId = entry.nextId++;
    const timer = setTimeout(() => {
      entry.pending.delete(msgId);
      entry.timeouts = (entry.timeouts || 0) + 1;
      if (entry.timeouts >= 2 && id !== undefined) retire(entry, id);
      resolve(undefined);
    }, 3000);
    entry.pending.set(msgId, message => {
      clearTimeout(timer);
      entry.timeouts = 0;
      resolve(message?.result?.result?.value);
    });
    try { entry.ws.send(JSON.stringify({ id: msgId, method: 'Runtime.evaluate', params: { expression, returnByValue: true } })); }
    catch { clearTimeout(timer); entry.pending.delete(msgId); resolve(undefined); }
  });
  const pages = async () => {
    if (cachedPages.length && Date.now() - lastListAt < 4000) return cachedPages;
    let port;
    try { port = readFileSync(options.portFile || PORT_FILE, 'utf8').split(/\r?\n/)[0].trim(); }
    catch { cdpState = 'missing'; logOnce('DevToolsActivePort not found'); return []; }
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(3000) });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const targets = await response.json();
      cachedPages = targets.filter(t => t.type === 'page' && /^https?:\/\/127\.0\.0\.1:\d+\//.test(t.url || '') && t.webSocketDebuggerUrl);
      lastListAt = Date.now();
      cdpState = 'ok';
      const ids = new Set(cachedPages.map(t => t.id));
      for (const [id, entry] of sockets) if (!ids.has(id)) retire(entry, id);
      return cachedPages;
    } catch (error) {
      cdpState = 'unreachable';
      logOnce('CDP list failed: ' + error.message);
      if (lastListAt > 0 && Date.now() - lastListAt > 15000) {
        cachedPages = [];
        for (const [id, entry] of [...sockets]) retire(entry, id);
      }
      return [];
    }
  };
  const stop = async () => {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    await Promise.all([...sockets].map(async ([id, entry]) => {
      try { await evaluate(entry, `globalThis.__agyPrismDeck?.owner===${owner}&&globalThis.__agyPrismDeck.dispose()`, id); }
      finally { retire(entry, id); }
    }));
  };
  const supersede = async () => {
    await stop();
    (options.onSuperseded || (() => process.exit(0)))();
  };
  const tick = async () => {
    if (busy || stopped) return;
    busy = true;
    try {
      for (const target of await pages()) {
        if (stopped) break;
        try {
          const entry = sockets.get(target.id) || await connect(target);
          let state = await evaluate(entry, `globalThis.__agyPrismDeck?.readState(${owner})??null`, target.id);
          if (state === undefined || stopped) continue;
          if (state === 'superseded') return await supersede();
          if (state?.owner !== owner || state.hash !== bundle.hash) {
            const installed = await evaluate(entry, bundle.code, target.id);
            if (installed === 'superseded') return await supersede();
            if (!installed || stopped) continue;
            entry.lastPayload = '';
            state = await evaluate(entry, `globalThis.__agyPrismDeck?.readState(${owner})??null`, target.id);
          }
          if (state === 'superseded') return await supersede();
          if (typeof options.updateSettings === 'function' && state?.owner === owner && state.pendingSettingsPatch) {
            const saved = options.updateSettings(state.pendingSettingsPatch);
            const savedPayload = JSON.stringify(saved);
            if (!stopped) {
              const ackArg = Number.isFinite(state.settingsPatchSeq) ? `,${state.settingsPatchSeq}` : '';
              const appliedOpt = await evaluate(entry, `globalThis.__agyPrismDeck?.applyOptical(${savedPayload},${owner}${ackArg})??false`, target.id);
              if (appliedOpt === 'superseded') return await supersede();
              if (appliedOpt) entry.lastOpticalPayload = savedPayload;
            }
          } else if (typeof options.getPrefs === 'function' && state?.owner === owner) {
            const prefs = options.getPrefs();
            const prefsPayload = JSON.stringify(prefs);
            if ((state.needOpticalPrefs || entry.lastOpticalPayload !== prefsPayload) && !stopped) {
              const appliedOpt = await evaluate(entry, `globalThis.__agyPrismDeck?.applyOptical(${prefsPayload},${owner})??false`, target.id);
              if (appliedOpt === 'superseded') return await supersede();
              if (appliedOpt) entry.lastOpticalPayload = prefsPayload;
            }
          }
          if (typeof options.getHeatmap === 'function' && state?.owner === owner && state.heatmapWantData) {
            const hm = await options.getHeatmap(!!state.heatmapForceRefresh);
            if (hm && !stopped) {
              const appliedHm = await evaluate(entry, `globalThis.__agyPrismDeck?.applyHeatmap(${JSON.stringify(hm)},${owner})??false`, target.id);
              if (appliedHm === 'superseded') return await supersede();
            }
          }
          if (state?.owner !== owner || !state.path || state.hasFooter === false) continue;
          if (typeof state.footerModelText === 'string') latestFooterModelText = state.footerModelText;
          const match = state.path.match(/\/c\/([0-9a-f-]{36})/);
          const data = await inspect(match ? match[1] : '', true);
          if (!data || data.error || stopped) continue;
          const payload = JSON.stringify(data);
          if (entry.lastPayload !== payload || entry.lastPath !== state.path) {
            const applied = await evaluate(entry, `globalThis.__agyPrismDeck?.apply(${payload},${JSON.stringify(state.path)},${owner})??false`, target.id);
            if (applied === 'superseded') return await supersede();
            if (applied) { entry.lastPayload = payload; entry.lastPath = state.path; }
            else entry.lastPayload = '';
          }
          lastErr = '';
        } catch (error) {
          const entry = sockets.get(target.id);
          if (entry) retire(entry, target.id);
          logOnce('page ' + target.id + ': ' + error.message);
        }
      }
    } finally { busy = false; }
  };
  const timer = setInterval(tick, INTERVAL_MS);
  console.log('[deck] injector started, port file:', options.portFile || PORT_FILE);
  return { tick, stop, status: () => cdpState, selectedModelText: () => latestFooterModelText };
}
