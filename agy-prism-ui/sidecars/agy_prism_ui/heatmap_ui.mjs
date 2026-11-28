export function createHeatmapRenderer() {
  const THEMES = {
    blue: {
      label: 'Cobalt',
      swatch: 'linear-gradient(135deg, #7cbcff 0%, #2563eb 55%, #0b2f7a 100%)',
      accent: '#1d4ed8',
      accentDark: '#60a5fa',
      light: ['#eff2f6', '#c6e2ff', '#7cbcff', '#368df8', '#155bd4', '#0b2f7a'],
      dark: ['#161b26', '#0e2d52', '#124f8c', '#1e78d4', '#52a7ff', '#a8d5ff'],
      barStops: ['#7cbcff', '#2563eb', '#0b2f7a'],
      barStopsDark: ['#124f8c', '#3b82f6', '#93d2ff'],
      monthlyBar: 'rgba(54, 141, 248, 0.36)',
      monthlyBarDark: 'rgba(82, 167, 255, 0.36)',
      curve: '#155bd4',
      curveDark: '#93d2ff',
    },
    sunset: {
      label: 'Ember',
      swatch: 'linear-gradient(135deg, #fde047 0%, #fb923c 50%, #be123c 100%)',
      accent: '#ea580c',
      accentDark: '#fb923c',
      light: ['#eff2f6', '#fde68a', '#fbbf24', '#fb923c', '#f43f5e', '#9f1239'],
      dark: ['#161b26', '#452308', '#9a3412', '#ea580c', '#f43f5e', '#fda4af'],
      barStops: ['#fbbf24', '#fb923c', '#be123c'],
      barStopsDark: ['#ea580c', '#f43f5e', '#fda4af'],
      monthlyBar: 'rgba(251, 146, 60, 0.38)',
      monthlyBarDark: 'rgba(251, 146, 60, 0.38)',
      curve: '#e11d48',
      curveDark: '#fda4af',
    },
    green: {
      label: 'Emerald',
      swatch: 'linear-gradient(135deg, #86efac 0%, #16a34a 55%, #14532d 100%)',
      accent: '#15803d',
      accentDark: '#34d399',
      light: ['#eff2f6', '#bbf7d0', '#6ee7b7', '#22c55e', '#15803d', '#14532d'],
      dark: ['#161b26', '#0b3b24', '#0e6037', '#16a34a', '#34d399', '#86efac'],
      barStops: ['#6ee7b7', '#22c55e', '#14532d'],
      barStopsDark: ['#0e6037', '#22c55e', '#86efac'],
      monthlyBar: 'rgba(34, 197, 94, 0.34)',
      monthlyBarDark: 'rgba(52, 211, 153, 0.34)',
      curve: '#15803d',
      curveDark: '#86efac',
    },
    purple: {
      label: 'Nebula',
      swatch: 'linear-gradient(135deg, #d8b4fe 0%, #9333ea 55%, #3b0764 100%)',
      accent: '#7e22ce',
      accentDark: '#c084fc',
      light: ['#eff2f6', '#e9d5ff', '#c084fc', '#9333ea', '#6b21a8', '#3b0764'],
      dark: ['#161b26', '#2e1065', '#581c87', '#7e22ce', '#a855f7', '#d8b4fe'],
      barStops: ['#c084fc', '#9333ea', '#3b0764'],
      barStopsDark: ['#581c87', '#9333ea', '#e9d5ff'],
      monthlyBar: 'rgba(147, 51, 234, 0.34)',
      monthlyBarDark: 'rgba(192, 132, 252, 0.34)',
      curve: '#6b21a8',
      curveDark: '#d8b4fe',
    },
    aurora: {
      label: 'Aurora',
      swatch: 'linear-gradient(135deg, #6ee7b7 0%, #38bdf8 50%, #7e22ce 100%)',
      accent: '#4f46e5',
      accentDark: '#818cf8',
      light: ['#eff2f6', '#86efac', '#2dd4bf', '#38bdf8', '#6366f1', '#7e22ce'],
      dark: ['#161b26', '#0d4a3a', '#0f766e', '#0284c7', '#6366f1', '#c084fc'],
      barStops: ['#34d399', '#38bdf8', '#7e22ce'],
      barStopsDark: ['#10b981', '#38bdf8', '#c084fc'],
      monthlyBar: 'rgba(56, 189, 248, 0.36)',
      monthlyBarDark: 'rgba(56, 189, 248, 0.36)',
      curve: '#6366f1',
      curveDark: '#c084fc',
    },
    ocean: {
      label: 'Glacier',
      swatch: 'linear-gradient(135deg, #67e8f9 0%, #3b82f6 52%, #5b21b6 100%)',
      accent: '#2563eb',
      accentDark: '#60a5fa',
      light: ['#eff2f6', '#a5f3fc', '#60c8fa', '#3b82f6', '#4f46e5', '#5b21b6'],
      dark: ['#161b26', '#104459', '#0369a1', '#2563eb', '#6366f1', '#a78bfa'],
      barStops: ['#67e8f9', '#3b82f6', '#5b21b6'],
      barStopsDark: ['#0ea5e9', '#6366f1', '#c4b5fd'],
      monthlyBar: 'rgba(59, 130, 246, 0.36)',
      monthlyBarDark: 'rgba(99, 102, 241, 0.38)',
      curve: '#4f46e5',
      curveDark: '#a78bfa',
    },
  };

  const DEFAULT_THEME = 'blue';
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const SUPPORTED_HM_LOCALES = ['zh-CN'];
  const HM_I18N = {
    'zh-CN': {
      noActivity: '0（无活动）',
      refresh: '刷新',
      close: '关闭',
      appearance: '外观',
      updates: '更新',
    },
  };
  function resolveHmLang(prefs = null) {
    const req = String(prefs?.language || '');
    return HM_I18N[req] ? req : 'zh-CN';
  }
  function hmT(lang, key) {
    return HM_I18N[lang]?.[key] || HM_I18N['zh-CN'][key] || key;
  }

  function esc(v) {
    return String(v ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function fmtTok(n) {
    const v = Number(n) || 0;
    if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(2).replace(/\.00$/, '') + 'K';
    return String(Math.round(v));
  }

  function fmtUsd(n) {
    const v = Number(n) || 0;
    return '$' + v.toFixed(2);
  }

  function parseHexColor(hex) {
    const raw = String(hex || '').trim();
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(raw);
    if (!m) return [0, 0, 0];
    const h = m[1].length === 3 ? m[1].split('').map(c => c + c).join('') : m[1];
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255,
    ];
  }

  function srgbToLinear(c) {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function linearToSrgb(c) {
    const cl = Math.max(0, Math.min(1, c));
    return cl <= 0.0031308 ? cl * 12.92 : 1.055 * Math.pow(cl, 1 / 2.4) - 0.055;
  }

  function rgbToHex(r, g, b) {
    const ch = (v) => Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, '0');
    return `#${ch(r)}${ch(g)}${ch(b)}`;
  }

  function buildDynamicPalette(basePalette, levelCount) {
    const base = Array.isArray(basePalette) && basePalette.length >= 2 ? basePalette : THEMES[DEFAULT_THEME].light;
    const stops = base.slice(1);
    const n = Math.max(1, Math.min(12, Math.round(Number(levelCount) || stops.length)));
    if (n === stops.length) return base.slice();
    if (n === 1) return [base[0], stops[stops.length - 1]];
    const linStops = stops.map(hex => parseHexColor(hex).map(srgbToLinear));
    const sampled = [];
    for (let i = 0; i < n; i++) {
      if (i === 0) {
        sampled.push(stops[0]);
        continue;
      }
      if (i === n - 1) {
        sampled.push(stops[stops.length - 1]);
        continue;
      }
      const pos = (i / (n - 1)) * (stops.length - 1);
      const idx = Math.floor(pos);
      const frac = pos - idx;
      const a = linStops[idx];
      const b = linStops[Math.min(linStops.length - 1, idx + 1)];
      const r = linearToSrgb(a[0] + (b[0] - a[0]) * frac);
      const g = linearToSrgb(a[1] + (b[1] - a[1]) * frac);
      const bl = linearToSrgb(a[2] + (b[2] - a[2]) * frac);
      sampled.push(rgbToHex(r, g, bl));
    }
    return [base[0], ...sampled];
  }

  function getLevelColor(palette, level) {
    const idx = Math.max(0, Math.min(palette.length - 1, Number(level) || 0));
    return palette[idx] || palette[0];
  }

  function getScaleSignature(scale) {
    if (!scale) return '';
    const thr = Array.isArray(scale.thresholds) ? scale.thresholds.join(',') : '';
    return `${scale.levels || 0}:${scale.min || 0}:${scale.max || 0}:${thr}`;
  }

  function getUpdateSignature(upd) {
    if (!upd) return '';
    return [
      upd.currentVersion || '',
      upd.channel || '',
      upd.autoCheckUpdates ? 1 : 0,
      upd.state || '',
      upd.updateAvailable ? 1 : 0,
      upd.actionKind || '',
      upd.latest?.tag || '',
      upd.lastCheckedAt || 0,
      upd.error || '',
    ].join('|');
  }

  function fmtCheckTime(ms) {
    const v = Number(ms) || 0;
    if (!v) return '尚未检查';
    const d = new Date(v);
    if (!Number.isFinite(d.getTime())) return '尚未检查';
    const p = n => String(n).padStart(2, '0');
    return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  const CHANNEL_NAMES = { stable: '正式版', preview: '预览版', dev: '开发版' };

  function buildUpdatePanelHtml({ updateStatus, prefs, updOpen, hasUpdateControl }) {
    if (!hasUpdateControl) return '';
    const upd = updateStatus || {};
    const curVer = String(upd.currentVersion || '2.0.3').replace(/^v/i, '');
    const channel = ['stable', 'preview', 'dev'].includes(prefs?.updateChannel || upd.channel) ? (prefs?.updateChannel || upd.channel) : 'stable';
    const autoCheck = prefs?.autoCheckUpdates !== undefined ? prefs.autoCheckUpdates !== false : upd.autoCheckUpdates !== false;
    const latest = upd.latest || null;
    const isChecking = Boolean(upd.checking || upd.state === 'checking');
    const isApplying = Boolean(upd.applying || upd.state === 'applying');
    const isApplied = upd.state === 'applied';
    const hasBadge = Boolean(upd.updateAvailable && !isApplying && !isApplied);

    let statusTone = '';
    let statusText = '点击「立即检查」获取最新版本';
    if (isApplying) {
      statusTone = 'info';
      statusText = `正在下载并热更新 ${latest?.tag || ''}…`;
    } else if (isApplied) {
      statusTone = 'ok';
      statusText = `已更新至 ${upd.appliedVersion || latest?.tag || ''}，正在热重载…`;
    } else if (isChecking) {
      statusTone = 'info';
      statusText = `正在检查 ${CHANNEL_NAMES[channel]} 更新…`;
    } else if (upd.error) {
      statusTone = 'err';
      statusText = `检查/更新失败：${upd.error}`;
    } else if (upd.updateAvailable && latest) {
      statusTone = 'avail';
      statusText = upd.actionKind === 'switch'
        ? `可切换至${CHANNEL_NAMES[channel]} ${latest.tag}`
        : `发现新版本 ${latest.tag}`;
    } else if (upd.state === 'up-to-date' || upd.lastCheckedAt > 0) {
      statusTone = 'ok';
      statusText = `当前已是最新（${latest?.tag || ('v' + curVer)}）`;
    }

    const nextText = autoCheck ? `下次自动：${upd.nextCheckLabel || '09:00 / 19:00'}` : '已关闭自动检查';
    const metaText = `上次：${fmtCheckTime(upd.lastCheckedAt)} · ${nextText}`;
    const applyLabel = isApplying ? '更新中…' : (upd.actionKind === 'switch' ? '一键切换' : '一键更新');

    return `<div class="hm-upd-wrap">`
      + `<button type="button" class="hm-btn hm-upd-btn" data-hm-action="update-toggle" aria-expanded="${updOpen ? 'true' : 'false'}">更新${hasBadge ? '<span class="hm-upd-dot" aria-hidden="true"></span>' : ''}</button>`
      + `<div class="hm-upd-pop" data-open="${updOpen ? 'true' : 'false'}" aria-hidden="${updOpen ? 'false' : 'true'}">`
      + `  <div class="hm-upd-head"><span class="hm-upd-ver">当前 v${esc(curVer)}</span><span class="hm-upd-ch">${esc(CHANNEL_NAMES[channel] || channel)}</span></div>`
      + `  <div class="hm-opt-row"><span class="hm-opt-lbl">发行通道</span><span class="hm-opt-picks">`
      + `    <button type="button" class="hm-opt-pick" data-upd-channel="stable" data-active="${channel === 'stable'}">正式版</button>`
      + `    <button type="button" class="hm-opt-pick" data-upd-channel="preview" data-active="${channel === 'preview'}">预览版</button>`
      + `    <button type="button" class="hm-opt-pick" data-upd-channel="dev" data-active="${channel === 'dev'}">开发版</button>`
      + `  </span></div>`
      + `  <label class="hm-opt-chk"><input type="checkbox" data-upd-chk="autoCheckUpdates"${autoCheck ? ' checked' : ''}/><span>每日 09:00 / 19:00 自动检查更新</span></label>`
      + `  <div class="hm-upd-status" data-tone="${statusTone}"><div>${esc(statusText)}</div><div class="hm-upd-meta">${esc(metaText)}</div>`
      + (latest?.summary ? `<div class="hm-upd-summary">${esc(latest.summary)}</div>` : '')
      + (latest?.htmlUrl ? `<a class="hm-upd-link" href="${esc(latest.htmlUrl)}" target="_blank" rel="noopener">查看 Release 详情 ↗</a>` : '')
      + `  </div>`
      + `  <div class="hm-upd-actions">`
      + (upd.updateAvailable && !isApplied ? `<button type="button" class="hm-btn hm-btn-primary" data-hm-action="update-apply"${isApplying ? ' disabled' : ''}>${applyLabel}</button>` : '')
      + `    <button type="button" class="hm-btn" data-hm-action="update-check"${isChecking || isApplying ? ' disabled' : ''}>${isChecking ? '检查中…' : '立即检查'}</button>`
      + `  </div>`
      + `</div></div>`;
  }

  function fmtScaleBound(n) {
    const v = Number(n) || 0;
    if (v >= 1e3) return fmtTok(v);
    if (Number.isInteger(v)) return String(v);
    return String(Number(v.toPrecision(3)));
  }

  function buildLegendHtml(palette, scale) {
    const thresholds = Array.isArray(scale?.thresholds) ? scale.thresholds : null;
    const hasBounds = Boolean(thresholds && thresholds.length >= palette.length - 1 && Number(scale?.max) > 0);
    const boxes = palette.map((c, idx) => {
      let tip;
      if (idx === 0) {
        tip = '0（无活动）';
      } else if (hasBounds) {
        if (idx === 1) {
          tip = `≤ ${fmtScaleBound(thresholds[0])}`;
        } else {
          const prev = Number(thresholds[idx - 2]);
          const cur = Number(thresholds[idx - 1]);
          if (idx === palette.length - 1 && cur <= prev) {
            tip = `= ${fmtScaleBound(scale.max)}`;
          } else if (cur <= prev) {
            tip = `无（${fmtScaleBound(cur)}）`;
          } else {
            tip = `${fmtScaleBound(prev)} – ${fmtScaleBound(cur)}`;
          }
        }
      } else {
        tip = `Lv ${idx}`;
      }
      return `<i class="hm-legend-box" style="background:${c}" title="${esc(tip)}"></i>`;
    }).join('');
    return `<span class="hm-legend">少 ${boxes} 多</span>`;
  }

  function loadSavedTheme() {
    try {
      const saved = globalThis.localStorage?.getItem('agy-prism-ui-heatmap-theme')
        || globalThis.localStorage?.getItem('agy-capsule-heatmap-theme');
      if (saved && THEMES[saved]) return saved;
    } catch {}
    return DEFAULT_THEME;
  }

  function saveTheme(name) {
    if (!THEMES[name]) return;
    try { globalThis.localStorage?.setItem('agy-prism-ui-heatmap-theme', name); } catch {}
  }

  let homeCollapsedFallback = null;
  let homeCollapsedStorageFailed = false;

  function loadHomeCollapsed() {
    if (homeCollapsedStorageFailed && homeCollapsedFallback !== null) {
      return homeCollapsedFallback;
    }
    try {
      const cur = globalThis.localStorage?.getItem('agy-prism-ui-heatmap-home-collapsed');
      if (cur !== null && cur !== undefined) return cur === '1';
      const legacy = globalThis.localStorage?.getItem('agy-capsule-heatmap-home-collapsed');
      if (legacy !== null && legacy !== undefined) return legacy === '1';
      return homeCollapsedFallback ?? false;
    } catch {
      return homeCollapsedFallback ?? false;
    }
  }

  function saveHomeCollapsed(val) {
    homeCollapsedFallback = Boolean(val);
    try {
      globalThis.localStorage?.setItem('agy-prism-ui-heatmap-home-collapsed', val ? '1' : '0');
      homeCollapsedStorageFailed = false;
    } catch {
      homeCollapsedStorageFailed = true;
    }
  }

  function detectDarkMode() {
    try {
      const cs = globalThis.getComputedStyle?.(document.documentElement);
      const scheme = cs?.colorScheme || '';
      if (scheme.includes('dark') && !scheme.includes('light')) return true;
      if (scheme.includes('light') && !scheme.includes('dark')) return false;
      const bg = cs?.backgroundColor || cs?.getPropertyValue('--background') || '';
      const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(bg);
      if (m) {
        const lum = 0.2126 * Number(m[1]) + 0.7152 * Number(m[2]) + 0.0722 * Number(m[3]);
        return lum < 128;
      }
      if (bg.startsWith('#')) {
        const hex = bg.slice(1);
        const full = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
        if (full.length >= 6) {
          const r = parseInt(full.slice(0, 2), 16);
          const g = parseInt(full.slice(2, 4), 16);
          const b = parseInt(full.slice(4, 6), 16);
          return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 128;
        }
      }
      return Boolean(globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches);
    } catch {
      return false;
    }
  }

  function formatCompactDay(day) {
    if (!day || !day.d) return '点击方格查看单日详情';
    const parts = [`${day.d}`, fmtTok(day.t), `${day.n || 0} 会话`];
    if (day.usd > 0) parts.push(fmtUsd(day.usd));
    return parts.join(' · ');
  }

  const WEEKDAYS_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  function getWeekdayZh(dateStr) {
    if (!dateStr) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!m) return '';
    const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return WEEKDAYS_ZH[dt.getDay()] || '';
  }

  function getDayPopCss(accent, dark) {
    return `
        @keyframes hm-pop-in {
          from { opacity: 0; transform: scale(0.92) translateY(5px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .hm-cell[data-selected="true"] {
          stroke: ${accent};
          stroke-width: 1.75;
        }
        .hm-day-pop {
          position: absolute;
          width: 256px;
          padding: 12px 13px;
          border-radius: 14px;
          background: var(--glass, ${dark ? 'rgba(20, 23, 33, 0.94)' : 'rgba(255, 255, 255, 0.94)'});
          -webkit-backdrop-filter: blur(20px) saturate(1.25);
          backdrop-filter: blur(20px) saturate(1.25);
          border: 1px solid var(--glass-border, ${dark ? 'rgba(200, 220, 255, 0.12)' : 'rgba(25, 45, 85, 0.10)'});
          box-shadow: inset 0 1px 0 var(--agy-opt-spec, ${dark ? 'rgba(255, 255, 255, 0.085)' : 'rgba(255, 255, 255, 0.92)'}), 0 0 24px -6px var(--agy-opt-rim-halo, rgba(66, 133, 244, 0.22)), var(--agy-opt-menu-elev, 0 4px 14px -2px ${dark ? 'rgba(0, 0, 0, 0.48)' : 'rgba(15, 23, 42, 0.08)'}, 0 18px 38px -10px ${dark ? 'rgba(0, 0, 0, 0.68)' : 'rgba(15, 35, 75, 0.16)'});
          color: var(--foreground, ${dark ? '#f1f5f9' : '#0f172a'});
          z-index: 60;
          box-sizing: border-box;
          animation: hm-pop-in 210ms cubic-bezier(0.22, 1, 0.36, 1);
          font-size: 12px;
        }
        .hm-day-pop[hidden] { display: none; }
        .hm-day-pop::before {
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
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.45), rgba(66, 133, 244, 0.34) 45%, rgba(155, 114, 203, 0.28) 85%, transparent);
          opacity: 0.30;
        }
        .hm-hover-tip {
          position: absolute;
          pointer-events: none;
          z-index: 55;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 9px;
          border-radius: 9px;
          white-space: nowrap;
          font-size: 11.5px;
          font-weight: 400;
          color: var(--foreground, ${dark ? '#f1f5f9' : '#0f172a'});
          background: var(--glass, ${dark ? 'rgba(20, 23, 33, 0.94)' : 'rgba(255, 255, 255, 0.94)'});
          border: 1px solid var(--glass-border, ${dark ? 'rgba(200, 220, 255, 0.12)' : 'rgba(25, 45, 85, 0.10)'});
          -webkit-backdrop-filter: blur(18px) saturate(1.2);
          backdrop-filter: blur(18px) saturate(1.2);
          box-shadow: inset 0 1px 0 var(--agy-opt-spec, ${dark ? 'rgba(255, 255, 255, 0.085)' : 'rgba(255, 255, 255, 0.92)'}), 0 0 14px -5px var(--agy-opt-rim-halo, rgba(66, 133, 244, 0.16)), var(--agy-opt-menu-elev, 0 4px 12px -2px ${dark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(15, 23, 42, 0.08)'}, 0 16px 32px -10px ${dark ? 'rgba(0, 0, 0, 0.62)' : 'rgba(15, 35, 75, 0.15)'});
          animation: hm-pop-in 140ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .hm-hover-tip[hidden] { display: none; }
        .hm-ht-dot {
          width: 7px;
          height: 7px;
          border-radius: 2px;
          flex-shrink: 0;
        }
        .hm-ht-sep,
        .hm-ht-sub {
          color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
        }
        .hm-ht-val { font-weight: 500; }
        .hm-dp-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
        }
        .hm-dp-date-wrap {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .hm-dp-dot {
          width: 9px;
          height: 9px;
          border-radius: 2.5px;
          flex-shrink: 0;
        }
        .hm-dp-date {
          font-size: 12.5px;
          font-weight: 500;
          letter-spacing: -0.01em;
        }
        .hm-dp-wk {
          font-size: 11px;
          color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
        }
        .hm-dp-close {
          width: 20px;
          height: 20px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          line-height: 1;
          cursor: pointer;
          padding: 0;
        }
        .hm-dp-close:hover {
          background: color-mix(in srgb, ${accent} 10%, transparent);
          color: var(--foreground, ${dark ? '#f1f5f9' : '#0f172a'});
        }
        .hm-dp-hero {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
        }
        .hm-dp-total {
          font-size: 19px;
          font-weight: 500;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }
        .hm-dp-sub {
          font-size: 11.5px;
          color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
          white-space: nowrap;
        }
        .hm-dp-bar {
          display: flex;
          height: 4px;
          border-radius: 99px;
          overflow: hidden;
          gap: 1.5px;
          margin-bottom: 10px;
          background: color-mix(in srgb, var(--foreground, #0f172a) 6%, transparent);
        }
        .hm-dp-seg-in { background: ${dark ? '#60a5fa' : '#3b82f6'}; }
        .hm-dp-seg-ca { background: ${dark ? '#818cf8' : '#6366f1'}; opacity: 0.72; }
        .hm-dp-seg-out { background: ${dark ? '#34d399' : '#10b981'}; }
        .hm-dp-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px 10px;
        }
        .hm-dp-cell {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .hm-dp-k {
          font-size: 10.5px;
          color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
        }
        .hm-dp-v {
          font-size: 12px;
          font-weight: 500;
        }`;
  }

  function buildDayPopInner(day, palette) {
    const t = Math.max(0, Number(day.t) || 0);
    const i = Math.max(0, Number(day.i) || 0);
    const c = Math.max(0, Number(day.c) || 0);
    const o = Math.max(0, Number(day.o) || 0);
    const sum = Math.max(1, i + c + o);
    const hitPct = i + c > 0 ? ((c / (i + c)) * 100).toFixed(1) : '0.0';
    const dotColor = palette[Math.max(0, Math.min(palette.length - 1, day.l || 0))] || palette[0];
    const wk = getWeekdayZh(day.d);
    const convCount = Math.max(0, Number(day.n) || 0);
    const reqs = Math.max(0, Number(day.r ?? day.reqs) || 0);
    const think = Math.max(0, Number(day.th ?? day.k) || 0);
    const subParts = [`${convCount} 会话`];
    if (reqs > 0) subParts.push(`${reqs} 次`);
    const costLabel = day.usd > 0 ? fmtUsd(day.usd) : '—';
    const cacheText = c > 0 ? `${fmtTok(c)} (${hitPct}%)` : '0';
    const outText = think > 0 ? `${fmtTok(o)} (含思 ${fmtTok(think)})` : fmtTok(o);

    return `<div class="hm-dp-head">`
      + `  <div class="hm-dp-date-wrap"><span class="hm-dp-dot" style="background:${dotColor}"></span><span class="hm-dp-date">${esc(day.d)}</span>${wk ? `<span class="hm-dp-wk">${wk}</span>` : ''}</div>`
      + `  <button type="button" class="hm-dp-close" data-hm-dp-close aria-label="关闭">×</button>`
      + `</div>`
      + `<div class="hm-dp-hero"><span class="hm-dp-total">${esc(fmtTok(t))}</span><span class="hm-dp-sub">${esc(subParts.join(' · '))}</span></div>`
      + `<div class="hm-dp-bar">${t > 0 ? `<span class="hm-dp-seg-in" style="width:${(i / sum * 100).toFixed(1)}%"></span><span class="hm-dp-seg-ca" style="width:${(c / sum * 100).toFixed(1)}%"></span><span class="hm-dp-seg-out" style="width:${(o / sum * 100).toFixed(1)}%"></span>` : ''}</div>`
      + `<div class="hm-dp-grid">`
      + `  <div class="hm-dp-cell"><span class="hm-dp-k">输入 Input</span><span class="hm-dp-v">${esc(fmtTok(i))}</span></div>`
      + `  <div class="hm-dp-cell"><span class="hm-dp-k">缓存 Cache</span><span class="hm-dp-v">${esc(cacheText)}</span></div>`
      + `  <div class="hm-dp-cell"><span class="hm-dp-k">输出 Output</span><span class="hm-dp-v">${esc(outText)}</span></div>`
      + `  <div class="hm-dp-cell"><span class="hm-dp-k">估算费用</span><span class="hm-dp-v">${esc(costLabel)}</span></div>`
      + `</div>`;
  }

  function bindDayPopover(root, containerEl, cells, attrName, palette, onHover) {
    const pop = root.querySelector('[data-hm-day-pop]');
    const tip = root.querySelector('[data-hm-hover-tip]');
    if (!pop || !containerEl) return;
    let openCell = null;

    const restoreHostZ = () => {
      if (!root.host || root.host.dataset.hmOrigZ === undefined) return;
      root.host.style.zIndex = root.host.dataset.hmOrigZ;
      delete root.host.dataset.hmOrigZ;
    };
    const raiseHostZ = (minZ) => {
      if (!root.host) return;
      if (root.host.dataset.hmOrigZ === undefined) {
        root.host.dataset.hmOrigZ = root.host.style.zIndex || '';
      }
      const cur = Number(root.host.style.zIndex);
      if (!Number.isFinite(cur) || cur < minZ) {
        root.host.style.zIndex = String(minZ);
      }
    };

    const hideTip = () => {
      if (tip) {
        tip.hidden = true;
        tip.innerHTML = '';
      }
      if (pop.hidden) restoreHostZ();
    };

    const showTipForCell = (cell, day) => {
      if (!tip || !pop.hidden) return;
      raiseHostZ(20);
      const dotColor = palette[Math.max(0, Math.min(palette.length - 1, day.l || 0))] || palette[0];
      const convCount = Math.max(0, Number(day.n) || 0);
      tip.innerHTML = `<span class="hm-ht-dot" style="background:${dotColor}"></span>`
        + `<span>${esc(day.d)}</span>`
        + `<span class="hm-ht-sep">·</span>`
        + `<span class="hm-ht-val">${esc(fmtTok(day.t))}</span>`
        + `<span class="hm-ht-sub">· ${convCount} 会话</span>`;
      tip.hidden = false;
      const cRect = containerEl.getBoundingClientRect();
      const sRect = cell.getBoundingClientRect();
      const tipW = tip.offsetWidth || 180;
      const tipH = tip.offsetHeight || 28;
      let left = sRect.left - cRect.left + sRect.width / 2 - tipW / 2;
      left = Math.max(8, Math.min(Math.max(8, cRect.width - tipW - 8), left));
      let top = sRect.top - cRect.top - tipH - 7;
      if (top < 6 || sRect.top - tipH - 7 < 8) {
        top = sRect.bottom - cRect.top + 7;
      }
      tip.style.left = `${Math.round(left)}px`;
      tip.style.top = `${Math.round(top)}px`;
    };

    const closePop = () => {
      pop.hidden = true;
      pop.innerHTML = '';
      restoreHostZ();
      if (openCell) {
        openCell.removeAttribute('data-selected');
        openCell = null;
      }
    };

    const showForCell = (cell, day) => {
      hideTip();
      if (openCell === cell && !pop.hidden) {
        closePop();
        return;
      }
      if (openCell) openCell.removeAttribute('data-selected');
      openCell = cell;
      cell.setAttribute('data-selected', 'true');
      raiseHostZ(30);
      pop.innerHTML = buildDayPopInner(day, palette);
      pop.hidden = false;

      const cRect = containerEl.getBoundingClientRect();
      const sRect = cell.getBoundingClientRect();
      const popW = pop.offsetWidth || 256;
      const popH = pop.offsetHeight || 168;
      let left = sRect.left - cRect.left + sRect.width / 2 - popW / 2;
      left = Math.max(8, Math.min(Math.max(8, cRect.width - popW - 8), left));
      const preferBelow = (sRect.top - cRect.top < popH + 14) && (sRect.bottom - cRect.top + popH + 14 <= Math.max(cRect.height + 16, 220));
      let top = preferBelow ? (sRect.bottom - cRect.top + 8) : (sRect.top - cRect.top - popH - 8);
      if (sRect.top + (top - (sRect.top - cRect.top)) < 12) {
        top = sRect.bottom - cRect.top + 8;
      }
      pop.style.left = `${Math.round(left)}px`;
      pop.style.top = `${Math.round(top)}px`;

      pop.querySelector('[data-hm-dp-close]')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        closePop();
      });
    };

    for (const cell of root.querySelectorAll('.hm-cell')) {
      const idx = Number(cell.getAttribute(attrName));
      const day = cells[idx];
      if (!day || !day.d) continue;
      cell.addEventListener('mouseenter', () => {
        onHover?.(day);
        showTipForCell(cell, day);
      });
      cell.addEventListener('mouseleave', hideTip);
      cell.addEventListener('click', (ev) => {
        ev.stopPropagation();
        onHover?.(day);
        showForCell(cell, day);
      });
    }

    hideTip();
    if (!pop.hidden) closePop();
    if (!pop.dataset.hmPopClickBound) {
      pop.dataset.hmPopClickBound = '1';
      pop.addEventListener('click', (ev) => ev.stopPropagation());
    }
    if (root._hmOutsidePopHandler) {
      if (typeof document !== 'undefined') document.removeEventListener('click', root._hmOutsidePopHandler);
      root.removeEventListener('click', root._hmOutsidePopHandler);
    }
    let lastHandledClick = null;
    root._hmOutsidePopHandler = (ev) => {
      if (ev && ev === lastHandledClick) return;
      lastHandledClick = ev || null;
      if (root.host && root.host.isConnected === false) {
        cleanupHeatmapRoot(root);
        return;
      }
      hideTip();
      if (!pop.hidden) closePop();
    };
    root.addEventListener('click', root._hmOutsidePopHandler);
    if (typeof document !== 'undefined') document.addEventListener('click', root._hmOutsidePopHandler);
  }

  function cleanupHeatmapRoot(root) {
    if (!root) return;
    if (root._hmOutsidePopHandler) {
      if (typeof document !== 'undefined') document.removeEventListener('click', root._hmOutsidePopHandler);
      root.removeEventListener?.('click', root._hmOutsidePopHandler);
      root._hmOutsidePopHandler = null;
    }
    if (root._hmHomeNearCleanup) {
      root._hmHomeNearCleanup();
      root._hmHomeNearCleanup = null;
    }
    root._hmHomeShellKey = '';
    root._hmUpdateHomeData = null;
    root._hmLastPointer = null;
    if (root.host && root.host.dataset?.hmOrigZ !== undefined) {
      root.host.style.zIndex = root.host.dataset.hmOrigZ;
      delete root.host.dataset.hmOrigZ;
    }
  }

  function pickDefaultDay(bucket) {
    const days = bucket?.weeks52?.days || [];
    const active = days.filter(d => !d.f && d.t > 0);
    if (active.length > 0) return active[active.length - 1];
    return bucket?.activity?.peakDay || days.find(d => !d.f) || null;
  }

  function buildHeatmapSvg(weeks52, theme, dark, compact = false, paletteOverride = null) {
    const days = weeks52?.days || [];
    if (!days.length) return '';
    const palette = paletteOverride || buildDynamicPalette(dark ? theme.dark : theme.light, weeks52?.scale?.levels);
    const cell = compact ? 10 : 12;
    const gap = compact ? 2.6 : 3.2;
    const step = cell + gap;
    const leftPad = compact ? 26 : 30;
    const topPad = compact ? 15 : 18;
    const width = leftPad + 52 * step + 2;
    const height = topPad + 7 * step + 2;

    const monthLabels = [];
    let lastMonth = -1;
    for (let col = 0; col < 52; col++) {
      const idx = col * 7;
      const cellData = days[idx];
      if (!cellData) continue;
      const m = parseInt(cellData.d.slice(5, 7), 10) - 1;
      if (m !== lastMonth) {
        if (col === 0 || col >= 2) {
          monthLabels.push(`<text x="${leftPad + col * step}" y="${topPad - 5}" class="hm-axis">${MONTHS[m] || ''}</text>`);
        }
        lastMonth = m;
      }
    }

    const rowLabels = [
      [0, 'Sun'],
      [2, 'Tue'],
      [4, 'Thu'],
      [6, 'Sat'],
    ].map(([row, label]) => `<text x="0" y="${topPad + row * step + cell - 2}" class="hm-axis">${label}</text>`).join('');

    const rects = [];
    for (let idx = 0; idx < days.length; idx++) {
      const d = days[idx];
      const col = Math.floor(idx / 7);
      const row = idx % 7;
      const x = (leftPad + col * step).toFixed(1);
      const y = (topPad + row * step).toFixed(1);
      const fill = d.f ? 'transparent' : getLevelColor(palette, d.l);
      const op = d.f ? '0.18' : '1';
      const stroke = d.f ? (dark ? '#334155' : '#e2e8f0') : (dark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)');
      rects.push(
        `<rect class="hm-cell" data-day-idx="${idx}" x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2.5" fill="${fill}" fill-opacity="${op}" stroke="${stroke}" stroke-width="0.6" />`,
      );
    }

    return `<svg viewBox="0 0 ${width.toFixed(1)} ${height.toFixed(1)}" class="hm-svg" role="img" aria-label="52 周活跃热力图">${monthLabels.join('')}${rowLabels}${rects.join('')}</svg>`;
  }

  function buildHomeGridSvg(cells, theme, dark, scale = null, paletteOverride = null) {
    const list = Array.isArray(cells) ? cells : [];
    if (!list.length) return '';
    const palette = paletteOverride || buildDynamicPalette(dark ? theme.dark : theme.light, scale?.levels);
    const cols = 14;
    const rows = Math.max(1, Math.ceil(list.length / cols));
    const cell = 18;
    const gap = 5;
    const step = cell + gap;
    const width = cols * cell + (cols - 1) * gap + 2;
    const height = rows * cell + (rows - 1) * gap + 2;
    const rects = [];
    for (let idx = 0; idx < list.length; idx++) {
      const d = list[idx];
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = (1 + col * step).toFixed(1);
      const y = (1 + row * step).toFixed(1);
      const fill = getLevelColor(palette, d?.l);
      const stroke = dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';
      rects.push(
        `<rect class="hm-cell" data-home-idx="${idx}" x="${x}" y="${y}" width="${cell}" height="${cell}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="0.6" />`,
      );
    }
    return `<svg viewBox="0 0 ${width} ${height}" class="hm-home-svg" role="img" aria-label="Insights 活跃矩阵">${rects.join('')}</svg>`;
  }

  function build14DaySvg(last14Days, theme, dark) {
    const items = Array.isArray(last14Days) ? last14Days : [];
    if (!items.length) return '<div class="hm-empty">暂无近 14 天数据</div>';
    const W = 420;
    const H = 138;
    const padL = 6;
    const padR = 6;
    const padT = 18;
    const padB = 22;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const maxVal = Math.max(1, ...items.map(d => d.t || 0));
    const stops = dark ? theme.barStopsDark : theme.barStops;
    const slotW = plotW / items.length;
    const barW = Math.max(10, Math.min(20, slotW * 0.64));

    const bars = items.map((d, idx) => {
      const val = d.t || 0;
      const h = val > 0 ? Math.max(3, (val / maxVal) * plotH) : 2;
      const x = (padL + idx * slotW + (slotW - barW) / 2).toFixed(1);
      const y = (padT + plotH - h).toFixed(1);
      const fill = val > 0 ? 'url(#hmBarGrad)' : (dark ? '#334155' : '#cbd5e1');
      const op = val > 0 ? '0.96' : '0.3';
      return `<rect class="hm-bar14" data-b14-idx="${idx}" x="${x}" y="${y}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${fill}" fill-opacity="${op}" />`;
    }).join('');

    const first = items[0]?.label || '';
    const mid = items[Math.floor((items.length - 1) / 2)]?.label || '';
    const last = items[items.length - 1]?.label || '';
    const midX = (padL + Math.floor((items.length - 1) / 2) * slotW + slotW / 2).toFixed(1);

    return `<svg viewBox="0 0 ${W} ${H}" class="hm-chart-svg">`
      + `<defs><linearGradient id="hmBarGrad" gradientUnits="userSpaceOnUse" x1="0" y1="${padT + plotH}" x2="0" y2="${padT}">`
      + `<stop offset="0%" stop-color="${stops[0]}"/><stop offset="52%" stop-color="${stops[1]}"/><stop offset="100%" stop-color="${stops[2]}"/>`
      + `</linearGradient></defs>`
      + `<text x="${padL}" y="12" class="hm-axis">${esc(fmtTok(maxVal))}</text>`
      + `<line x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}" stroke="currentColor" stroke-opacity="0.1"/>`
      + bars
      + `<text x="${padL + slotW / 2}" y="${H - 5}" text-anchor="middle" class="hm-axis">${esc(first)}</text>`
      + `<text x="${midX}" y="${H - 5}" text-anchor="middle" class="hm-axis">${esc(mid)}</text>`
      + `<text x="${(W - padR - slotW / 2).toFixed(1)}" y="${H - 5}" text-anchor="middle" class="hm-axis">${esc(last)}</text>`
      + `</svg>`;
  }

  function buildMonthlySvg(monthly, theme, dark) {
    const items = Array.isArray(monthly) ? monthly : [];
    if (!items.length) return '<div class="hm-empty">暂无月度趋势数据</div>';
    const W = 420;
    const H = 138;
    const padL = 6;
    const padR = 8;
    const padT = 18;
    const padB = 22;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const maxCum = Math.max(1, ...items.map(m => m.cum || 0), ...items.map(m => m.t || 0));
    const maxMonth = Math.max(1, ...items.map(m => m.t || 0));
    const barColor = dark ? theme.monthlyBarDark : theme.monthlyBar;
    const lineColor = dark ? theme.curveDark : theme.curve;
    const slotW = plotW / items.length;
    const barW = Math.max(10, Math.min(20, slotW * 0.56));

    const pts = [];
    const bars = [];
    const dots = [];
    items.forEach((m, idx) => {
      const cx = padL + idx * slotW + slotW / 2;
      const barH = m.t > 0 ? Math.max(3, (m.t / maxMonth) * plotH * 0.92) : 1.5;
      const bx = (cx - barW / 2).toFixed(1);
      const by = (padT + plotH - barH).toFixed(1);
      bars.push(`<rect class="hm-barmon" data-mon-idx="${idx}" x="${bx}" y="${by}" width="${barW.toFixed(1)}" height="${barH.toFixed(1)}" rx="2.5" fill="${barColor}" />`);
      const py = (padT + plotH - (m.cum / maxCum) * plotH * 0.94).toFixed(1);
      pts.push(`${cx.toFixed(1)},${py}`);
      dots.push(`<circle class="hm-dotmon" data-mon-idx="${idx}" cx="${cx.toFixed(1)}" cy="${py}" r="2.8" fill="${lineColor}" />`);
    });

    const first = items[0]?.label || '';
    const mid = items[Math.floor((items.length - 1) / 2)]?.label || '';
    const last = items[items.length - 1]?.label || '';
    const midX = (padL + Math.floor((items.length - 1) / 2) * slotW + slotW / 2).toFixed(1);

    return `<svg viewBox="0 0 ${W} ${H}" class="hm-chart-svg">`
      + `<text x="${padL}" y="12" class="hm-axis">${esc(fmtTok(maxCum))}</text>`
      + `<line x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}" stroke="currentColor" stroke-opacity="0.1"/>`
      + bars.join('')
      + `<polyline fill="none" stroke="${lineColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${pts.join(' ')}"/>`
      + dots.join('')
      + `<text x="${padL + slotW / 2}" y="${H - 5}" text-anchor="middle" class="hm-axis">${esc(first)}</text>`
      + `<text x="${midX}" y="${H - 5}" text-anchor="middle" class="hm-axis">${esc(mid)}</text>`
      + `<text x="${(W - padR - slotW / 2).toFixed(1)}" y="${H - 5}" text-anchor="middle" class="hm-axis">${esc(last)}</text>`
      + `</svg>`;
  }

  function buildFullHtml(data, { source = 'all', themeName = loadSavedTheme(), dark = detectDarkMode(), showClose = true, prefs = null, optOpen = false, hasOpticalControl = false, updateStatus = null, updOpen = false, hasUpdateControl = false } = {}) {
    const theme = THEMES[themeName] || THEMES[DEFAULT_THEME];
    const activeSource = ['all', 'app', 'ide', 'cli'].includes(source) ? source : 'all';
    const bucket = data?.sources?.[activeSource] || data?.sources?.all;
    const palette = buildDynamicPalette(dark ? theme.dark : theme.light, bucket?.weeks52?.scale?.levels);
    const accent = dark ? theme.accentDark : theme.accent;
    const totals = bucket?.totals || { totalTokens: 0, inputTokens: 0, cacheTokens: 0, outputTokens: 0, cacheHitRate: 0, conversationCount: 0, mainCount: 0, subagentCount: 0 };
    const activity = bucket?.activity || { activeDays: 0, currentStreak: 0, longestStreak: 0, peakDay: null };
    const defaultDay = pickDefaultDay(bucket);

    const style = `
      <style>
        :host, .hm-wrap {
          display: block;
          width: 100%;
          height: 100%;
          overflow: auto;
          background: var(--background, ${dark ? '#0b1120' : '#f8fafc'});
          color: var(--foreground, ${dark ? '#f1f5f9' : '#0f172a'});
          font-family: "Google Sans Flex", "Google Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-variant-numeric: tabular-nums;
          -webkit-font-smoothing: antialiased;
          box-sizing: border-box;
        }
        .hm-wrap *, .hm-wrap *::before, .hm-wrap *::after { box-sizing: border-box; }
        .hm-container {
          max-width: 1080px;
          margin: 0 auto;
          padding: 18px 22px 28px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .hm-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .hm-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .hm-logo {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          background: color-mix(in srgb, ${accent} 14%, transparent);
          border: 1px solid color-mix(in srgb, ${accent} 30%, transparent);
          color: ${accent};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .hm-title {
          font-size: 16px;
          font-weight: 500;
          letter-spacing: -0.01em;
        }
        .hm-badge {
          font-size: 11.5px;
          padding: 2px 9px;
          border-radius: 99px;
          background: color-mix(in srgb, var(--foreground, #0f172a) 6%, transparent);
          color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
          border: 1px solid var(--border, ${dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.08)'});
        }
        .hm-actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .hm-live-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 99px;
          background: rgba(16, 185, 129, 0.12);
          color: ${dark ? '#34d399' : '#059669'};
          border: 1px solid rgba(16, 185, 129, 0.28);
        }
        .hm-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
        }
        .hm-btn {
          border: 1px solid var(--border, ${dark ? 'rgba(148,163,184,0.2)' : 'rgba(15,23,42,0.12)'});
          background: var(--card, ${dark ? '#111827' : '#ffffff'});
          color: var(--foreground, ${dark ? '#e2e8f0' : '#0f172a'});
          border-radius: 8px;
          padding: 5px 11px;
          font: inherit;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .hm-btn:hover {
          border-color: ${accent};
          background: color-mix(in srgb, ${accent} 8%, var(--card, ${dark ? '#111827' : '#ffffff'}));
        }
        .hm-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .hm-seg {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 3px;
          border-radius: 10px;
          background: var(--card, ${dark ? '#111827' : '#ffffff'});
          border: 1px solid var(--border, ${dark ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.09)'});
        }
        .hm-src-btn {
          border: 0;
          background: transparent;
          color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
          padding: 5px 12px;
          border-radius: 7px;
          font: inherit;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
        }
        .hm-src-btn[data-active="true"] {
          background: color-mix(in srgb, ${accent} 14%, transparent);
          color: ${accent};
          font-weight: 500;
        }
        .hm-palettes {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
        }
        .hm-swatch {
          width: 17px;
          height: 17px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          padding: 0;
          transition: transform 0.15s ease;
        }
        .hm-swatch:hover { transform: scale(1.1); }
        .hm-swatch[data-active="true"] {
          box-shadow: 0 0 0 2px var(--background, ${dark ? '#0b1120' : '#f8fafc'}), 0 0 0 3.6px ${accent};
        }
        .hm-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 780px) {
          .hm-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        .hm-card {
          background: var(--card, ${dark ? '#111827' : '#ffffff'});
          border: 1px solid var(--border, ${dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.08)'});
          border-radius: 12px;
          padding: 14px 16px;
          box-shadow: inset 0 1px 0 ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.88)'}, 0 1px 3px rgba(15, 23, 42, 0.05), 0 8px 20px -10px rgba(15, 35, 75, 0.08);
          transition: border-color 180ms ease, box-shadow 180ms ease;
        }
        .hm-opt-wrap, .hm-upd-wrap {
          position: relative;
        }
        .hm-upd-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .hm-upd-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${accent};
          flex-shrink: 0;
        }
        .hm-btn[aria-expanded="true"] {
          border-color: ${accent};
          color: ${accent};
          background: color-mix(in srgb, ${accent} 10%, var(--card, ${dark ? '#171c28' : '#ffffff'}));
        }
        .hm-opt-pop, .hm-upd-pop {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 288px;
          padding: 12px 14px;
          border-radius: 14px;
          background: var(--glass, ${dark ? 'rgba(20, 23, 33, 0.94)' : 'rgba(255, 255, 255, 0.94)'});
          -webkit-backdrop-filter: blur(20px) saturate(1.25);
          backdrop-filter: blur(20px) saturate(1.25);
          border: 1px solid var(--glass-border, ${dark ? 'rgba(200,220,255,0.12)' : 'rgba(25,45,85,0.10)'});
          box-shadow: inset 0 1px 0 var(--agy-opt-spec, ${dark ? 'rgba(255,255,255,0.085)' : 'rgba(255,255,255,0.92)'}), 0 0 24px -6px var(--agy-opt-rim-halo, rgba(66, 133, 244, 0.20)), var(--agy-opt-menu-elev, 0 16px 36px -10px rgba(0, 0, 0, 0.22));
          z-index: 40;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-size: 12px;
          transform-origin: top right;
          opacity: 0;
          transform: translateY(-6px) scale(0.95);
          visibility: hidden;
          pointer-events: none;
          transition: opacity 180ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 220ms;
        }
        .hm-upd-pop { width: 312px; }
        .hm-opt-pop[data-open="true"], .hm-upd-pop[data-open="true"] {
          opacity: 1;
          transform: translateY(0) scale(1);
          visibility: visible;
          pointer-events: auto;
          transition: opacity 180ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 0s;
        }
        @media (prefers-reduced-motion: reduce) {
          .hm-opt-pop, .hm-upd-pop, .hm-kpi-pop { transition: none; }
        }
        .hm-opt-pop::before, .hm-upd-pop::before {
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
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.45), rgba(66, 133, 244, 0.34) 45%, rgba(155, 114, 203, 0.28) 85%, transparent);
          opacity: 0.28;
        }
        .hm-upd-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .hm-upd-ver { font-weight: 500; font-size: 12.5px; }
        .hm-upd-ch {
          font-size: 11px;
          padding: 1px 7px;
          border-radius: 99px;
          background: color-mix(in srgb, ${accent} 14%, transparent);
          color: ${accent};
          font-weight: 500;
        }
        .hm-upd-status {
          padding: 8px 10px;
          border-radius: 9px;
          background: color-mix(in srgb, var(--foreground, #0f172a) 4%, transparent);
          border: 1px solid var(--border, ${dark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)'});
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 11.5px;
        }
        .hm-upd-status[data-tone="avail"] {
          border-color: color-mix(in srgb, ${accent} 38%, transparent);
          background: color-mix(in srgb, ${accent} 8%, transparent);
        }
        .hm-upd-status[data-tone="err"] {
          border-color: rgba(239, 68, 68, 0.4);
          background: rgba(239, 68, 68, 0.08);
          color: ${dark ? '#fca5a5' : '#b91c1c'};
        }
        .hm-upd-meta { font-size: 10.5px; color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'}); }
        .hm-upd-summary { font-size: 11px; color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'}); line-height: 1.4; }
        .hm-upd-link { font-size: 11px; color: ${accent}; text-decoration: none; align-self: flex-start; }
        .hm-upd-link:hover { text-decoration: underline; }
        .hm-upd-actions { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
        .hm-btn[disabled] { opacity: 0.55; cursor: not-allowed; }
        .hm-btn-primary {
          background: ${accent};
          border-color: ${accent};
          color: #ffffff;
        }
        .hm-btn-primary:hover:not([disabled]) {
          background: ${accent};
          filter: brightness(1.06);
        }
        .hm-opt-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .hm-opt-lbl { color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'}); font-weight: 500; }
        .hm-opt-picks { display: inline-flex; gap: 3px; background: color-mix(in srgb, var(--foreground, #0f172a) 5%, transparent); padding: 2px; border-radius: 7px; }
        .hm-opt-pick {
          border: 0;
          background: transparent;
          color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
          padding: 3px 8px;
          border-radius: 5px;
          font: inherit;
          font-size: 11.5px;
          cursor: pointer;
        }
        .hm-opt-pick[data-active="true"] {
          background: var(--card, ${dark ? '#1e2436' : '#ffffff'});
          color: ${accent};
          font-weight: 500;
          box-shadow: 0 1px 2px rgba(0,0,0,0.08);
        }
        .hm-opt-checks {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
          padding-top: 6px;
          border-top: 1px solid var(--border, ${dark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)'});
        }
        .hm-opt-chk {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          color: var(--foreground, ${dark ? '#e2e8f0' : '#0f172a'});
          font-size: 11.5px;
        }
        .hm-opt-chk input { accent-color: ${accent}; margin: 0; }
        .hm-kpi-label {
          font-size: 12.5px;
          color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
          margin-bottom: 6px;
        }
        .hm-kpi-val {
          font-size: 23px;
          font-weight: 500;
          letter-spacing: -0.02em;
          line-height: 1.15;
          margin-bottom: 6px;
        }
        .hm-kpi-sub {
          font-size: 12px;
          color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hm-kpi-hover {
          position: relative;
        }
        .hm-kpi-pop {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          min-width: 224px;
          padding: 10px 12px;
          border-radius: 12px;
          background: var(--glass, ${dark ? 'rgba(20, 23, 33, 0.96)' : 'rgba(255, 255, 255, 0.96)'});
          -webkit-backdrop-filter: blur(20px) saturate(1.25);
          backdrop-filter: blur(20px) saturate(1.25);
          border: 1px solid var(--glass-border, ${dark ? 'rgba(200,220,255,0.12)' : 'rgba(25,45,85,0.10)'});
          box-shadow: inset 0 1px 0 var(--agy-opt-spec, ${dark ? 'rgba(255,255,255,0.085)' : 'rgba(255,255,255,0.92)'}), 0 0 24px -6px var(--agy-opt-rim-halo, rgba(66, 133, 244, 0.20)), var(--agy-opt-menu-elev, 0 16px 36px -10px rgba(0, 0, 0, 0.22));
          z-index: 35;
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-size: 12px;
          transform-origin: top left;
          opacity: 0;
          transform: translateY(-4px) scale(0.96);
          visibility: hidden;
          pointer-events: none;
          transition: opacity 160ms cubic-bezier(0.22, 1, 0.36, 1), transform 200ms cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 200ms;
        }
        .hm-kpi-hover:hover .hm-kpi-pop,
        .hm-kpi-hover:focus-within .hm-kpi-pop {
          opacity: 1;
          transform: translateY(0) scale(1);
          visibility: visible;
          transition-delay: 0s;
        }
        .hm-kpi-pop-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          white-space: nowrap;
        }
        .hm-kpi-pop-row > span:first-child {
          color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
        }
        .hm-kpi-pop-row > strong {
          font-weight: 500;
          color: var(--foreground, ${dark ? '#f1f5f9' : '#0f172a'});
          font-variant-numeric: tabular-nums;
        }
        .hm-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }
        .hm-card-title {
          font-size: 14px;
          font-weight: 500;
        }
        .hm-card-meta {
          font-size: 12px;
          color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
        }
        .hm-legend {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
          color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
        }
        .hm-legend-box {
          width: 10px;
          height: 10px;
          border-radius: 2.5px;
          display: inline-block;
        }
        .hm-svg {
          width: 100%;
          height: auto;
          display: block;
          overflow: visible;
        }
        .hm-axis {
          font-size: 10px;
          fill: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
          font-family: inherit;
        }
        .hm-cell { cursor: pointer; transition: opacity 0.1s ease; }
        .hm-cell:hover { stroke: ${accent}; stroke-width: 1.5; }
        .hm-charts-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 780px) {
          .hm-charts-grid { grid-template-columns: minmax(0, 1fr); }
        }
        .hm-chart-svg {
          width: 100%;
          height: auto;
          display: block;
        }
        .hm-empty {
          font-size: 12.5px;
          color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
          padding: 24px 0;
          text-align: center;
        }
${getDayPopCss(accent, dark)}
      </style>`;

    const sources = [
      ['all', '全部'],
      ['app', 'App'],
      ['ide', 'IDE'],
      ['cli', 'CLI'],
    ];

    const iconSvg = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.4" opacity="0.45"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.4" opacity="0.75"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.4" opacity="0.75"/><rect x="9" y="9" width="5.5" height="5.5" rx="1.4"/></svg>';

    const pLight = prefs?.opticalLightTheme || 'crystal';
    const pDark = prefs?.opticalDarkTheme || 'obsidian';
    const optPanel = hasOpticalControl ? `<div class="hm-opt-wrap">`
      + `<button type="button" class="hm-btn" data-hm-action="optical-toggle" aria-expanded="${optOpen ? 'true' : 'false'}">外观</button>`
      + `<div class="hm-opt-pop" data-open="${optOpen ? 'true' : 'false'}" aria-hidden="${optOpen ? 'false' : 'true'}">`
      + `  <div class="hm-opt-row"><span class="hm-opt-lbl">浅色配色</span><span class="hm-opt-picks">`
      + `    <button type="button" class="hm-opt-pick" data-opt-key="opticalLightTheme" data-opt-val="crystal" title="Frost" data-active="${pLight === 'crystal'}">白昼</button>`
      + `    <button type="button" class="hm-opt-pick" data-opt-key="opticalLightTheme" data-opt-val="alabaster" title="Ivory" data-active="${pLight === 'alabaster'}">晨光</button>`
      + `    <button type="button" class="hm-opt-pick" data-opt-key="opticalLightTheme" data-opt-val="native" data-active="${pLight === 'native'}">原生</button>`
      + `  </span></div>`
      + `  <div class="hm-opt-row"><span class="hm-opt-lbl">深色配色</span><span class="hm-opt-picks">`
      + `    <button type="button" class="hm-opt-pick" data-opt-key="opticalDarkTheme" data-opt-val="obsidian" title="Noir" data-active="${pDark === 'obsidian'}">午夜</button>`
      + `    <button type="button" class="hm-opt-pick" data-opt-key="opticalDarkTheme" data-opt-val="warm" title="Graphite" data-active="${pDark === 'warm'}">暮色</button>`
      + `    <button type="button" class="hm-opt-pick" data-opt-key="opticalDarkTheme" data-opt-val="native" data-active="${pDark === 'native'}">原生</button>`
      + `  </span></div>`
      + `  <div class="hm-opt-checks">`
      + `    <label class="hm-opt-chk"><input type="checkbox" data-opt-chk="opticalPrismRim"${prefs?.opticalPrismRim !== false ? ' checked' : ''}/><span>棱镜流光</span></label>`
      + `    <label class="hm-opt-chk"><input type="checkbox" data-opt-chk="opticalGlass"${prefs?.opticalGlass !== false ? ' checked' : ''}/><span>玻璃质感</span></label>`
      + `    <label class="hm-opt-chk"><input type="checkbox" data-opt-chk="opticalMotion"${prefs?.opticalMotion !== false ? ' checked' : ''}/><span>渐现动效</span></label>`
      + `    <label class="hm-opt-chk"><input type="checkbox" data-opt-chk="opticalCodeTools"${prefs?.opticalCodeTools !== false ? ' checked' : ''}/><span>代码折叠</span></label>`
      + `  </div>`
      + `  <div class="hm-opt-row" style="justify-content:flex-end"><button type="button" class="hm-btn" data-hm-action="optical-reset" style="padding:3px 9px;font-size:11.5px">还原原生</button></div>`
      + `</div></div>` : '';

    const updPanel = buildUpdatePanelHtml({ updateStatus, prefs, updOpen, hasUpdateControl });

    return `${style}<div class="hm-wrap"><div class="hm-container">`
      + `<div class="hm-topbar">`
      + `  <div class="hm-brand"><span class="hm-logo">${iconSvg}</span><span class="hm-title">Insights</span><span class="hm-badge">只读 · 本地会话日志</span></div>`
      + `  <div class="hm-actions">`
      + `    <span class="hm-live-pill"><span class="hm-live-dot"></span>Live</span>`
      + updPanel
      + optPanel
      + `    <button type="button" class="hm-btn" data-hm-action="refresh">刷新</button>`
      + (showClose ? `<button type="button" class="hm-btn" data-hm-action="close">关闭</button>` : '')
      + `  </div>`
      + `</div>`
      + `<div class="hm-controls">`
      + `  <div class="hm-seg" role="tablist">${sources.map(([k, lbl]) => {
          const cnt = data?.counts?.[k] ?? 0;
          return `<button type="button" class="hm-src-btn" data-hm-src="${k}" data-active="${activeSource === k}">${lbl}${cnt > 0 && k !== 'all' ? ` (${cnt})` : ''}</button>`;
        }).join('')}</div>`
      + `  <div class="hm-palettes"><span>配色</span>${Object.entries(THEMES).map(([k, th]) => `<button type="button" class="hm-swatch" data-hm-theme="${k}" data-active="${themeName === k}" style="background:${th.swatch}" title="${esc(th.label)}"></button>`).join('')}</div>`
      + `</div>`
      + `<div class="hm-kpi-grid">`
      + `  <div class="hm-card hm-kpi-hover" tabindex="0"><div class="hm-kpi-label">累计总 Token</div><div class="hm-kpi-val">${esc(fmtTok(totals.totalTokens))}</div><div class="hm-kpi-sub">In ${esc(fmtTok(totals.inputTokens))} · Cache ${esc(fmtTok(totals.cacheTokens))} · Out ${esc(fmtTok(totals.outputTokens))}</div>`
      + `    <div class="hm-kpi-pop" role="tooltip">`
      + `      <div class="hm-kpi-pop-row"><span>总计</span><strong>${esc(fmtTok(totals.totalTokens))}</strong></div>`
      + `      <div class="hm-kpi-pop-row"><span>非缓存输入 (In)</span><strong>${esc(fmtTok(totals.inputTokens))}</strong></div>`
      + `      <div class="hm-kpi-pop-row"><span>缓存读取 (Cache)</span><strong>${esc(fmtTok(totals.cacheTokens))} (${(Number(totals.cacheHitRate) || 0).toFixed(1)}%)</strong></div>`
      + `      <div class="hm-kpi-pop-row"><span>输出 (Out)</span><strong>${esc(fmtTok(totals.outputTokens))}</strong></div>`
      + ((totals.thinkingTokens || 0) > 0 ? `<div class="hm-kpi-pop-row"><span>思考 (Think)</span><strong>${esc(fmtTok(totals.thinkingTokens))}</strong></div>` : '')
      + ((totals.totalCostUsd || 0) > 0 ? `<div class="hm-kpi-pop-row"><span>估算费用</span><strong>${esc(fmtUsd(totals.totalCostUsd))}</strong></div>` : '')
      + `    </div>`
      + `  </div>`
      + `  <div class="hm-card" title="最长连续 ${activity.longestStreak || 0} 天"><div class="hm-kpi-label">活跃天数 / 连续</div><div class="hm-kpi-val">${activity.activeDays || 0} 天</div><div class="hm-kpi-sub">当前连续 ${activity.currentStreak || 0} 天 · 最长 ${activity.longestStreak || 0} 天</div></div>`
      + `  <div class="hm-card"><div class="hm-kpi-label">总会话数</div><div class="hm-kpi-val">${totals.conversationCount || 0}</div><div class="hm-kpi-sub">主会话 ${totals.mainCount || 0} · 子智能体 ${totals.subagentCount || 0}</div></div>`
      + `  <div class="hm-card"><div class="hm-kpi-label">单日最高</div><div class="hm-kpi-val">${esc(activity.peakDay ? fmtTok(activity.peakDay.t) : '0')}</div><div class="hm-kpi-sub">全局缓存命中 ${(Number(totals.cacheHitRate) || 0).toFixed(1)}%${activity.peakDay ? ` · ${activity.peakDay.d.slice(5)}` : ''}</div></div>`
      + `</div>`
      + `<div class="hm-card" data-hm-full-card style="position:relative">`
      + `  <div class="hm-card-head"><span class="hm-card-title">52 周活跃热力图</span>${buildLegendHtml(palette, bucket?.weeks52?.scale)}</div>`
      + (bucket ? buildHeatmapSvg(bucket.weeks52, theme, dark, false, palette) : '<div class="hm-empty">正在读取本地会话数据库…</div>')
      + `  <div class="hm-hover-tip" data-hm-hover-tip hidden></div>`
      + `  <div class="hm-day-pop" data-hm-day-pop hidden></div>`
      + `</div>`
      + `<div class="hm-charts-grid">`
      + `  <div class="hm-card"><div class="hm-card-head"><span class="hm-card-title">近 14 天用量</span><span class="hm-card-meta" data-hm-meta14>${esc(bucket?.last14Days?.length ? `今日 ${fmtTok(bucket.last14Days.at(-1).t)}` : '')}</span></div>${bucket ? build14DaySvg(bucket.last14Days, theme, dark) : ''}</div>`
      + `  <div class="hm-card"><div class="hm-card-head"><span class="hm-card-title">月度趋势与累计曲线</span><span class="hm-card-meta" data-hm-meta-mon>${esc(bucket?.monthly?.length ? `累计 ${fmtTok(bucket.monthly.at(-1).cum)}` : '')}</span></div>${bucket ? buildMonthlySvg(bucket.monthly, theme, dark) : ''}</div>`
      + `</div>`
      + `</div></div>`;
  }

  function getHomeCells(bucket, collapsed) {
    const count = collapsed ? 14 : 84;
    const nonFuture = (bucket?.weeks52?.days || []).filter(d => !d.f);
    if (nonFuture.length >= count) return nonFuture.slice(-count);
    const pad = Array.from({ length: count - nonFuture.length }, () => ({ d: '', t: 0, i: 0, c: 0, o: 0, n: 0, l: 0 }));
    return pad.concat(nonFuture);
  }

  function formatHomeStatsText(data, collapsed) {
    if (!data) return '加载中…';
    const bucket = data?.sources?.all;
    const totals = bucket?.totals || { totalTokens: 0 };
    const activity = bucket?.activity || { currentStreak: 0 };
    return `${collapsed ? '近 14 天' : '近 12 周'} · 累计 ${fmtTok(totals.totalTokens)} · 连续 ${activity.currentStreak || 0} 天`;
  }

  function buildHomeBodyHtml(bucket, { themeName, dark, collapsed }) {
    const theme = THEMES[themeName] || THEMES[DEFAULT_THEME];
    const scale = bucket?.weeks52?.scale;
    const palette = buildDynamicPalette(dark ? theme.dark : theme.light, scale?.levels);
    const totals = bucket?.totals || { totalTokens: 0, cacheHitRate: 0 };
    const activity = bucket?.activity || { currentStreak: 0, activeDays: 0, peakDay: null };
    const cells = getHomeCells(bucket, collapsed);
    const defaultDay = [...cells].reverse().find(d => d.d && d.t > 0) || pickDefaultDay(bucket);

    return collapsed
      ? `<div class="hm-home-collapsed">`
        + buildHomeGridSvg(cells, theme, dark, scale, palette)
        + `  <div class="hm-home-foot"><span class="hm-home-detail" data-hm-home-detail>${esc(formatCompactDay(defaultDay))}</span>${buildLegendHtml(palette, scale)}</div>`
        + `</div>`
      : `<div class="hm-home-expanded">`
        + `  <div>${buildHomeGridSvg(cells, theme, dark, scale, palette)}</div>`
        + `  <div class="hm-home-side">`
        + `    <div class="hm-home-kpis">`
        + `      <div class="hm-home-kpi"><div class="hm-home-kpi-l">累计 Token</div><div class="hm-home-kpi-v">${esc(fmtTok(totals.totalTokens))}</div></div>`
        + `      <div class="hm-home-kpi"><div class="hm-home-kpi-l">活跃 / 连续</div><div class="hm-home-kpi-v">${activity.activeDays || 0} 天 · ${activity.currentStreak || 0} 连</div></div>`
        + `      <div class="hm-home-kpi"><div class="hm-home-kpi-l">单日峰值</div><div class="hm-home-kpi-v">${esc(activity.peakDay ? fmtTok(activity.peakDay.t) : '0')}</div></div>`
        + `      <div class="hm-home-kpi"><div class="hm-home-kpi-l">缓存命中</div><div class="hm-home-kpi-v">${(Number(totals.cacheHitRate) || 0).toFixed(1)}%</div></div>`
        + `    </div>`
        + `    <div class="hm-home-foot"><span class="hm-home-detail" data-hm-home-detail>${esc(formatCompactDay(defaultDay))}</span>${buildLegendHtml(palette, scale)}</div>`
        + `  </div>`
        + `</div>`;
  }

  function buildHomeHtml(data, { themeName = loadSavedTheme(), dark = detectDarkMode(), collapsed = loadHomeCollapsed(), updateStatus = null } = {}) {
    const theme = THEMES[themeName] || THEMES[DEFAULT_THEME];
    const accent = dark ? theme.accentDark : theme.accent;
    const bucket = data?.sources?.all;

    const style = `
      <style>
        :host { display: block; position: relative; width: 100%; max-width: 768px; margin: 0 auto 14px; font-family: "Google Sans Flex", "Google Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-variant-numeric: tabular-nums; }
        .hm-home-card {
          position: relative;
          isolation: isolate;
          width: 100%;
          border-radius: 21px;
          padding: 7px 5px 5px;
          background: ${dark ? 'color-mix(in srgb, var(--foreground, #f1f5f9) 3.5%, var(--card, #141721))' : 'color-mix(in srgb, var(--foreground, #0f172a) 2.2%, var(--card, #ffffff))'};
          border: 1px solid var(--card-border, ${dark ? 'rgba(200,220,255,0.10)' : 'rgba(25,45,85,0.085)'});
          color: var(--foreground, ${dark ? '#f1f5f9' : '#0f172a'});
          box-shadow: inset 0 1px 0 var(--agy-opt-spec, ${dark ? 'rgba(255,255,255,0.085)' : 'rgba(255,255,255,0.92)'}), var(--agy-opt-elev, 0 1px 2px rgba(15, 23, 42, 0.045), 0 10px 26px -10px rgba(15, 35, 75, 0.10));
          box-sizing: border-box;
        }
        .hm-home-card::before {
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
          transition: opacity 420ms cubic-bezier(0.22, 1, 0.36, 1);
          background: radial-gradient(280px circle at var(--hm-px, 50%) var(--hm-py, 50%), rgba(56, 189, 248, 0.45), rgba(66, 133, 244, 0.34) 40%, rgba(155, 114, 203, 0.24) 70%, transparent 88%);
        }
        .hm-home-card::after {
          content: '';
          position: absolute;
          inset: -3.5px;
          border-radius: inherit;
          pointer-events: none;
          z-index: -1;
          filter: blur(9px);
          opacity: 0;
          transition: opacity 420ms cubic-bezier(0.22, 1, 0.36, 1);
          background: radial-gradient(260px circle at var(--hm-px, 50%) var(--hm-py, 50%), rgba(56, 189, 248, 0.42), rgba(66, 133, 244, 0.32) 40%, rgba(155, 114, 203, 0.22) 70%, transparent 90%);
        }
        .hm-home-card[data-hm-near="1"]::before {
          opacity: calc(var(--hm-near-alpha, 0) * ${dark ? '0.32' : '0.26'});
          transition: opacity 160ms ease-out;
        }
        .hm-home-card[data-hm-near="1"]::after {
          opacity: calc(var(--hm-near-alpha, 0) * ${dark ? '0.40' : '0.34'});
          transition: opacity 160ms ease-out;
        }
        .hm-home-card * { box-sizing: border-box; }
        .hm-home-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 0 9px;
        }
        .hm-home-left {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .hm-home-open {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 0;
          padding: 2px 6px 2px 2px;
          margin-left: -2px;
          border-radius: 7px;
          background: transparent;
          color: inherit;
          font: inherit;
          cursor: pointer;
          transition: background 140ms ease, color 140ms ease;
        }
        .hm-home-open:hover {
          background: color-mix(in srgb, ${accent} 10%, transparent);
          color: ${accent};
        }
        .hm-home-ico {
          color: ${accent};
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
        }
        .hm-home-title {
          font-size: 13.5px;
          font-weight: 500;
          letter-spacing: -0.01em;
          white-space: nowrap;
        }
        .hm-home-stats {
          font-size: 12px;
          color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hm-home-upd {
          border: 1px solid color-mix(in srgb, ${accent} 32%, transparent);
          background: color-mix(in srgb, ${accent} 10%, transparent);
          color: ${accent};
          border-radius: 99px;
          padding: 2px 8px;
          font: inherit;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .hm-home-upd:hover { background: color-mix(in srgb, ${accent} 16%, transparent); }
        .hm-home-arrow {
          width: 26px;
          height: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          border: 1px solid var(--border, ${dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.08)'});
          background: transparent;
          color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
          cursor: pointer;
          flex-shrink: 0;
          transition: background 140ms ease, color 140ms ease, transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .hm-home-arrow:hover {
          color: ${accent};
          border-color: color-mix(in srgb, ${accent} 38%, transparent);
          background: color-mix(in srgb, ${accent} 8%, transparent);
        }
        .hm-home-arrow svg {
          transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
          transform: rotate(0deg);
        }
        .hm-home-card[data-collapsed="1"] .hm-home-arrow svg {
          transform: rotate(180deg);
        }
        @keyframes hm-home-swap {
          from { opacity: 0.35; }
          to { opacity: 1; }
        }
        .hm-home-body[data-hm-swapping="1"] > * {
          animation: hm-home-swap 180ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        @media (prefers-reduced-motion: reduce) {
          .hm-home-arrow svg { transition: none; }
          .hm-home-body[data-hm-swapping="1"] > * { animation: none; }
        }
        .hm-home-body {
          margin-top: 7px;
          padding: 10px 12px;
          border-radius: 15px;
          background: var(--card, ${dark ? '#141721' : '#ffffff'});
          border: 1px solid var(--border, ${dark ? 'rgba(200,220,255,0.08)' : 'rgba(25,45,85,0.06)'});
        }
        .hm-home-expanded {
          display: grid;
          grid-template-columns: minmax(260px, 319px) minmax(0, 1fr);
          gap: 14px;
          align-items: stretch;
        }
        @media (max-width: 620px) {
          .hm-home-expanded { grid-template-columns: minmax(0, 1fr); }
        }
        .hm-home-collapsed {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .hm-home-collapsed .hm-home-svg {
          width: 280px;
          flex-shrink: 0;
        }
        .hm-home-svg { width: 100%; height: auto; display: block; overflow: visible; }
        .hm-cell { cursor: pointer; transition: opacity 100ms ease; }
        .hm-cell:hover { stroke: ${accent}; stroke-width: 1.4; }
        .hm-home-side {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 8px;
          min-width: 0;
        }
        .hm-home-kpis {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 7px;
        }
        .hm-home-kpi {
          padding: 7px 10px;
          border-radius: 9px;
          background: color-mix(in srgb, var(--foreground, #0f172a) 3%, transparent);
          border: 1px solid var(--border, ${dark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.06)'});
        }
        .hm-home-kpi-l {
          font-size: 11px;
          color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
          margin-bottom: 2px;
        }
        .hm-home-kpi-v {
          font-size: 14.5px;
          font-weight: 500;
          letter-spacing: -0.01em;
        }
        .hm-home-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-width: 0;
          flex: 1;
          font-size: 11.5px;
          color: var(--muted-foreground, ${dark ? '#94a3b8' : '#64748b'});
        }
        .hm-home-detail {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .hm-legend { display: inline-flex; align-items: center; gap: 3px; flex-shrink: 0; }
        .hm-legend-box { width: 9px; height: 9px; border-radius: 2px; display: inline-block; }
${getDayPopCss(accent, dark)}
      </style>`;

    const iconSvg = '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.4" opacity="0.45"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.4" opacity="0.75"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.4" opacity="0.75"/><rect x="9" y="9" width="5.5" height="5.5" rx="1.4"/></svg>';
    const arrowSvg = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>';

    const bodyHtml = buildHomeBodyHtml(bucket, { themeName, dark, collapsed });
    const updPill = (updateStatus?.updateAvailable && updateStatus?.actionKind === 'upgrade' && updateStatus?.latest?.tag)
      ? `<button type="button" class="hm-home-upd" data-hm-home="update" title="查看新版本并一键更新">新版本 ${esc(updateStatus.latest.tag)}</button>`
      : '';

    return `${style}<div class="hm-home-card" data-collapsed="${collapsed ? '1' : '0'}">`
      + `<div class="hm-home-head">`
      + `  <div class="hm-home-left">`
      + `    <button type="button" class="hm-home-open" data-hm-home="open" title="打开 Insights 完整视图"><span class="hm-home-ico">${iconSvg}</span><span class="hm-home-title">Insights</span></button>`
      + `    <span class="hm-home-stats">${esc(formatHomeStatsText(data, collapsed))}</span>`
      + `  </div>`
      + `  <div style="display:inline-flex;align-items:center;gap:6px;flex-shrink:0">${updPill}<button type="button" class="hm-home-arrow" data-hm-home="toggle" title="${collapsed ? '展开近 12 周' : '收起为近 14 天'}" aria-expanded="${!collapsed}">${arrowSvg}</button></div>`
      + `</div>`
      + `<div class="hm-home-body">${bodyHtml}</div>`
      + `<div class="hm-hover-tip" data-hm-hover-tip hidden></div>`
      + `<div class="hm-day-pop" data-hm-day-pop hidden></div>`
      + `</div>`;
  }

  function renderFullHeatmap(root, data, callbacks = {}) {
    if (!root) return;
    const state = root._hmState || (root._hmState = {
      source: callbacks.source || 'all',
      theme: loadSavedTheme(),
      optOpen: false,
      updOpen: false,
    });
    if (callbacks.source) state.source = callbacks.source;
    if (typeof callbacks.updOpen === 'boolean' && callbacks.updOpen !== root._hmLastCbUpdOpen) {
      root._hmLastCbUpdOpen = callbacks.updOpen;
      state.updOpen = callbacks.updOpen;
      if (state.updOpen) state.optOpen = false;
    }
    const dark = detectDarkMode();
    const bucket = data?.sources?.[state.source] || data?.sources?.all;
    const days = bucket?.weeks52?.days || [];
    const last14 = bucket?.last14Days || [];
    const monthly = bucket?.monthly || [];
    const prefs = callbacks.prefs || null;
    const hasOpticalControl = typeof callbacks.onUpdatePrefs === 'function';
    const hasUpdateControl = typeof callbacks.onCheckUpdate === 'function' || typeof callbacks.onApplyUpdate === 'function';
    const prefSig = prefs ? [prefs.opticalLightTheme, prefs.opticalDarkTheme, prefs.opticalPrismRim, prefs.opticalGlass, prefs.opticalMotion, prefs.opticalCodeTools, prefs.updateChannel, prefs.autoCheckUpdates].join(':') : '';
    const scaleSig = getScaleSignature(bucket?.weeks52?.scale);
    const updSig = getUpdateSignature(callbacks.updateStatus);
    const renderKey = JSON.stringify([data?.generatedAt || 0, state.source, state.theme, dark, callbacks.showClose !== false, hasOpticalControl, hasUpdateControl, prefSig, scaleSig, updSig]);
    if (root._hmRenderKey === renderKey) {
      const uPop = root.querySelector('.hm-upd-pop');
      const uBtn = root.querySelector('[data-hm-action="update-toggle"]');
      const oPop = root.querySelector('.hm-opt-pop');
      const oBtn = root.querySelector('[data-hm-action="optical-toggle"]');
      if (uPop && uPop.getAttribute('data-open') !== (state.updOpen ? 'true' : 'false')) {
        uPop.setAttribute('data-open', state.updOpen ? 'true' : 'false');
        uPop.setAttribute('aria-hidden', state.updOpen ? 'false' : 'true');
        uBtn?.setAttribute('aria-expanded', state.updOpen ? 'true' : 'false');
      }
      if (oPop && oPop.getAttribute('data-open') !== (state.optOpen ? 'true' : 'false')) {
        oPop.setAttribute('data-open', state.optOpen ? 'true' : 'false');
        oPop.setAttribute('aria-hidden', state.optOpen ? 'false' : 'true');
        oBtn?.setAttribute('aria-expanded', state.optOpen ? 'true' : 'false');
      }
      return;
    }
    root._hmRenderKey = renderKey;

    root.innerHTML = buildFullHtml(data, {
      source: state.source,
      themeName: state.theme,
      dark,
      showClose: callbacks.showClose !== false,
      prefs,
      optOpen: state.optOpen,
      hasOpticalControl,
      updateStatus: callbacks.updateStatus || null,
      updOpen: state.updOpen,
      hasUpdateControl,
    });

    const fullCard = root.querySelector('[data-hm-full-card]');
    const themeObj = THEMES[state.theme] || THEMES[DEFAULT_THEME];
    const palette = buildDynamicPalette(dark ? themeObj.dark : themeObj.light, bucket?.weeks52?.scale?.levels);
    bindDayPopover(root, fullCard, days, 'data-day-idx', palette, null);

    const meta14 = root.querySelector('[data-hm-meta14]');
    for (const bar of root.querySelectorAll('.hm-bar14')) {
      const idx = Number(bar.getAttribute('data-b14-idx'));
      const d = last14[idx];
      if (d && meta14) {
        bar.addEventListener('mouseenter', () => {
          meta14.textContent = `${d.label} · ${fmtTok(d.t)} · ${d.n || 0} 会话`;
        });
      }
    }

    const metaMon = root.querySelector('[data-hm-meta-mon]');
    for (const node of root.querySelectorAll('[data-mon-idx]')) {
      const idx = Number(node.getAttribute('data-mon-idx'));
      const m = monthly[idx];
      if (m && metaMon) {
        node.addEventListener('mouseenter', () => {
          metaMon.textContent = `${m.m} · 当月 ${fmtTok(m.t)} · 累计 ${fmtTok(m.cum)}`;
        });
      }
    }

    for (const btn of root.querySelectorAll('[data-hm-src]')) {
      btn.addEventListener('click', () => {
        state.source = btn.getAttribute('data-hm-src') || 'all';
        root._hmRenderKey = '';
        renderFullHeatmap(root, data, callbacks);
      });
    }

    for (const sw of root.querySelectorAll('[data-hm-theme]')) {
      sw.addEventListener('click', () => {
        state.theme = sw.getAttribute('data-hm-theme') || DEFAULT_THEME;
        saveTheme(state.theme);
        root._hmRenderKey = '';
        renderFullHeatmap(root, data, callbacks);
        callbacks.onThemeChange?.(state.theme);
      });
    }

    const optToggleBtn = root.querySelector('[data-hm-action="optical-toggle"]');
    const optPop = root.querySelector('.hm-opt-pop');
    const updToggleBtn = root.querySelector('[data-hm-action="update-toggle"]');
    const updPop = root.querySelector('.hm-upd-pop');
    const setOptOpen = (next) => {
      state.optOpen = Boolean(next);
      if (optPop) {
        optPop.setAttribute('data-open', state.optOpen ? 'true' : 'false');
        optPop.setAttribute('aria-hidden', state.optOpen ? 'false' : 'true');
      }
      if (optToggleBtn) {
        optToggleBtn.setAttribute('aria-expanded', state.optOpen ? 'true' : 'false');
      }
    };
    const setUpdOpen = (next) => {
      state.updOpen = Boolean(next);
      if (updPop) {
        updPop.setAttribute('data-open', state.updOpen ? 'true' : 'false');
        updPop.setAttribute('aria-hidden', state.updOpen ? 'false' : 'true');
      }
      if (updToggleBtn) {
        updToggleBtn.setAttribute('aria-expanded', state.updOpen ? 'true' : 'false');
      }
      callbacks.onUpdOpenChange?.(state.updOpen);
    };
    optToggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!state.optOpen && state.updOpen) setUpdOpen(false);
      setOptOpen(!state.optOpen);
    });
    updToggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!state.updOpen && state.optOpen) setOptOpen(false);
      setUpdOpen(!state.updOpen);
    });
    optPop?.addEventListener('click', (e) => e.stopPropagation());
    updPop?.addEventListener('click', (e) => e.stopPropagation());
    root.querySelector('.hm-wrap')?.addEventListener('click', () => {
      if (state.optOpen) setOptOpen(false);
      if (state.updOpen) setUpdOpen(false);
    });
    for (const chBtn of root.querySelectorAll('[data-upd-channel]')) {
      chBtn.addEventListener('click', () => {
        const ch = chBtn.getAttribute('data-upd-channel');
        if (!ch) return;
        callbacks.onUpdatePrefs?.({ updateChannel: ch });
        if (!callbacks.updateStatus?.lastCheckedAt || callbacks.updateStatus?.state === 'error') {
          callbacks.onCheckUpdate?.(ch);
        }
      });
    }
    const updChk = root.querySelector('[data-upd-chk="autoCheckUpdates"]');
    updChk?.addEventListener('change', () => {
      callbacks.onUpdatePrefs?.({ autoCheckUpdates: updChk.checked });
    });
    root.querySelector('[data-hm-action="update-check"]')?.addEventListener('click', () => {
      callbacks.onCheckUpdate?.(prefs?.updateChannel || callbacks.updateStatus?.channel || 'stable');
    });
    root.querySelector('[data-hm-action="update-apply"]')?.addEventListener('click', () => {
      callbacks.onApplyUpdate?.(prefs?.updateChannel || callbacks.updateStatus?.channel || 'stable');
    });
    for (const btn of root.querySelectorAll('[data-opt-key]')) {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-opt-key');
        const val = btn.getAttribute('data-opt-val');
        if (key && val) callbacks.onUpdatePrefs?.({ [key]: val });
      });
    }
    for (const chk of root.querySelectorAll('[data-opt-chk]')) {
      chk.addEventListener('change', () => {
        const key = chk.getAttribute('data-opt-chk');
        if (key) callbacks.onUpdatePrefs?.({ [key]: chk.checked });
      });
    }
    root.querySelector('[data-hm-action="optical-reset"]')?.addEventListener('click', () => {
      callbacks.onUpdatePrefs?.({
        opticalLightTheme: 'native',
        opticalDarkTheme: 'native',
        opticalPrismRim: false,
        opticalGlass: false,
        opticalMotion: false,
        opticalCodeTools: false,
      });
    });

    root.querySelector('[data-hm-action="refresh"]')?.addEventListener('click', () => {
      callbacks.onRefresh?.();
    });
    root.querySelector('[data-hm-action="close"]')?.addEventListener('click', () => {
      callbacks.onClose?.();
    });
  }

  function renderHomeHeatmapCard(root, data, callbacks = {}) {
    if (!root) return;
    const themeName = loadSavedTheme();
    const dark = detectDarkMode();
    let curCollapsed = loadHomeCollapsed();
    const getHomeKey = (d, collapsedFlag, upd = callbacks.updateStatus) => JSON.stringify([
      d?.generatedAt || 0,
      themeName,
      dark,
      collapsedFlag,
      getScaleSignature(d?.sources?.all?.weeks52?.scale),
      getUpdateSignature(upd),
    ]);
    const renderKey = getHomeKey(data, curCollapsed, callbacks.updateStatus);
    if (root._hmHomeKey === renderKey) return;
    const shellKey = JSON.stringify([themeName, dark]);
    const liveCard = root.querySelector('.hm-home-card');
    if (root._hmHomeShellKey === shellKey && root._hmUpdateHomeData && liveCard && liveCard.isConnected !== false) {
      if (root._hmUpdateHomeData(data, curCollapsed, callbacks)) {
        root._hmHomeKey = renderKey;
        return;
      }
    }
    root._hmHomeKey = renderKey;
    root._hmHomeShellKey = shellKey;

    root.innerHTML = buildHomeHtml(data, { themeName, dark, collapsed: curCollapsed, updateStatus: callbacks.updateStatus || null });

    let curData = data;
    let curCallbacks = callbacks;
    const card = root.querySelector('.hm-home-card');
    const themeObj = THEMES[themeName] || THEMES[DEFAULT_THEME];
    const basePalette = dark ? themeObj.dark : themeObj.light;
    const bindHomeCells = (targetCells, targetBucket) => {
      const detailEl = root.querySelector('[data-hm-home-detail]');
      const dynamicPalette = buildDynamicPalette(basePalette, targetBucket?.weeks52?.scale?.levels);
      bindDayPopover(root, card, targetCells, 'data-home-idx', dynamicPalette, (day) => {
        if (detailEl) detailEl.textContent = formatCompactDay(day);
      });
    };
    bindHomeCells(getHomeCells(curData?.sources?.all, curCollapsed), curData?.sources?.all);

    root.querySelector('[data-hm-home="open"]')?.addEventListener('click', () => {
      curCallbacks?.onOpenFull?.();
    });
    root.querySelector('[data-hm-home="update"]')?.addEventListener('click', () => {
      curCallbacks?.onOpenUpdate?.();
    });
    if (root._hmHomeNearCleanup) {
      root._hmHomeNearCleanup();
      root._hmHomeNearCleanup = null;
    }
    let applyNearAt = null;
    let bodyAnimCleanup = null;
    const syncPointerAll = () => {
      if (root._hmLastPointer && applyNearAt) {
        applyNearAt(root._hmLastPointer.x, root._hmLastPointer.y);
      }
      globalThis.__agyPrismOptical?.refreshPointer?.(root._hmLastPointer);
    };
    if (card && typeof document !== 'undefined') {
      const PROX = 120;
      let rafId = 0;
      const setCardProp = (prop, val) => {
        if (card.style.getPropertyValue(prop) !== val) card.style.setProperty(prop, val);
      };
      const clearNear = () => {
        setCardProp('--hm-near-alpha', '0');
        card.removeAttribute('data-hm-near');
      };
      applyNearAt = (clientX, clientY) => {
        if (!card.isConnected) {
          cleanupHeatmapRoot(root);
          return;
        }
        const r = card.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) { clearNear(); return; }
        const dx = Math.max(r.left - clientX, 0, clientX - r.right);
        const dy = Math.max(r.top - clientY, 0, clientY - r.bottom);
        const dist = Math.hypot(dx, dy);
        if (dist < PROX) {
          const alpha = Math.pow(1 - dist / PROX, 1.35);
          setCardProp('--hm-px', Math.round(clientX - r.left) + 'px');
          setCardProp('--hm-py', Math.round(clientY - r.top) + 'px');
          setCardProp('--hm-near-alpha', alpha.toFixed(3));
          if (card.getAttribute('data-hm-near') !== '1') card.setAttribute('data-hm-near', '1');
        } else if (card.hasAttribute('data-hm-near')) {
          clearNear();
        }
      };
      const onMove = (ev) => {
        root._hmLastPointer = { x: ev.clientX, y: ev.clientY };
        applyNearAt(ev.clientX, ev.clientY);
      };
      const onLeave = () => {
        root._hmLastPointer = null;
        clearNear();
      };
      document.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerleave', onLeave, { passive: true });
      globalThis.addEventListener?.('blur', onLeave, { passive: true });
      root._hmHomeNearCleanup = () => {
        if (rafId && typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        if (bodyAnimCleanup) {
          bodyAnimCleanup(true);
          bodyAnimCleanup = null;
        }
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerleave', onLeave);
        globalThis.removeEventListener?.('blur', onLeave);
      };
      if (root._hmLastPointer) {
        syncPointerAll();
        if (typeof requestAnimationFrame === 'function') {
          rafId = requestAnimationFrame(() => {
            rafId = 0;
            if (card.isConnected && root._hmLastPointer) {
              syncPointerAll();
            }
          });
        }
      }
    }
    const updateBodyUi = (nextCollapsed) => {
      const bodyEl = root.querySelector('.hm-home-body');
      const statsEl = root.querySelector('.hm-home-stats');
      const toggleBtn = root.querySelector('[data-hm-home="toggle"]');
      const nextBucket = curData?.sources?.all;
      if (!card || !bodyEl) return false;
      card.setAttribute('data-collapsed', nextCollapsed ? '1' : '0');
      if (statsEl) statsEl.textContent = formatHomeStatsText(curData, nextCollapsed);
      if (toggleBtn) {
        toggleBtn.title = nextCollapsed ? '展开近 12 周' : '收起为近 14 天';
        toggleBtn.setAttribute('aria-expanded', String(!nextCollapsed));
      }
      bodyEl.innerHTML = buildHomeBodyHtml(nextBucket, { themeName, dark, collapsed: nextCollapsed });
      bindHomeCells(getHomeCells(nextBucket, nextCollapsed), nextBucket);
      const updSt = curCallbacks?.updateStatus;
      const showUpd = Boolean(updSt?.updateAvailable && updSt?.actionKind === 'upgrade' && updSt?.latest?.tag);
      let updBtn = root.querySelector('[data-hm-home="update"]');
      if (showUpd) {
        if (!updBtn && toggleBtn?.parentElement && typeof document !== 'undefined') {
          updBtn = document.createElement('button');
          updBtn.type = 'button';
          updBtn.className = 'hm-home-upd';
          updBtn.setAttribute('data-hm-home', 'update');
          updBtn.title = '查看新版本并一键更新';
          updBtn.addEventListener('click', () => curCallbacks?.onOpenUpdate?.());
          toggleBtn.parentElement.insertBefore(updBtn, toggleBtn);
        }
        if (updBtn) updBtn.textContent = `新版本 ${updSt.latest.tag}`;
      } else if (updBtn) {
        updBtn.remove?.();
      }
      return true;
    };
    root._hmUpdateHomeData = (nextData, nextCollapsed, nextCallbacks) => {
      curData = nextData;
      curCollapsed = nextCollapsed;
      if (nextCallbacks) curCallbacks = nextCallbacks;
      const updated = updateBodyUi(curCollapsed);
      if (updated && !bodyAnimCleanup) {
        syncPointerAll();
      }
      return updated;
    };
    root.querySelector('[data-hm-home="toggle"]')?.addEventListener('click', (ev) => {
      if (typeof ev?.clientX === 'number' && typeof ev?.clientY === 'number' && (ev.clientX !== 0 || ev.clientY !== 0)) {
        root._hmLastPointer = { x: ev.clientX, y: ev.clientY };
      }
      if (bodyAnimCleanup) {
        bodyAnimCleanup(false);
        bodyAnimCleanup = null;
      }
      const bodyEl = root.querySelector('.hm-home-body');
      const prevBodyH = bodyEl ? bodyEl.getBoundingClientRect().height : 0;

      curCollapsed = !curCollapsed;
      saveHomeCollapsed(curCollapsed);
      root._hmHomeKey = getHomeKey(curData, curCollapsed, curCallbacks?.updateStatus);

      if (!updateBodyUi(curCollapsed)) {
        root._hmHomeKey = '';
        root._hmHomeShellKey = '';
        root._hmUpdateHomeData = null;
        renderHomeHeatmapCard(root, curData, curCallbacks);
        return;
      }

      const reducedMotion = Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
      bodyEl.style.height = '';
      bodyEl.style.overflow = '';
      bodyEl.style.transition = '';
      bodyEl.removeAttribute('data-hm-swapping');
      const nextBodyH = bodyEl.getBoundingClientRect().height;

      if (!reducedMotion && prevBodyH > 0 && Math.abs(nextBodyH - prevBodyH) > 2 && typeof requestAnimationFrame === 'function') {
        let loopRaf = 0;
        let doneTimer = 0;
        let finished = false;
        const finish = (clearStyles) => {
          if (finished) return;
          finished = true;
          if (loopRaf && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(loopRaf);
            loopRaf = 0;
          }
          if (doneTimer) {
            clearTimeout(doneTimer);
            doneTimer = 0;
          }
          bodyEl.removeEventListener('transitionend', onTransitionEnd);
          if (clearStyles) {
            bodyEl.style.height = '';
            bodyEl.style.overflow = '';
            bodyEl.style.transition = '';
            bodyEl.removeAttribute('data-hm-swapping');
            if (card.isConnected) syncPointerAll();
          }
          if (bodyAnimCleanup === finish) bodyAnimCleanup = null;
        };
        const onTransitionEnd = (te) => {
          if (te.target === bodyEl && te.propertyName === 'height') finish(true);
        };
        bodyAnimCleanup = finish;

        bodyEl.style.height = `${prevBodyH}px`;
        bodyEl.style.overflow = 'hidden';
        bodyEl.style.transition = 'none';
        bodyEl.setAttribute('data-hm-swapping', '1');
        void bodyEl.offsetHeight;
        bodyEl.style.transition = 'height 220ms cubic-bezier(0.22, 1, 0.36, 1)';
        bodyEl.style.height = `${nextBodyH}px`;
        bodyEl.addEventListener('transitionend', onTransitionEnd);
        doneTimer = setTimeout(() => finish(true), 260);
        syncPointerAll();

        const tick = () => {
          if (finished || !card.isConnected) return;
          syncPointerAll();
          loopRaf = requestAnimationFrame(tick);
        };
        loopRaf = requestAnimationFrame(tick);
      } else {
        syncPointerAll();
        if (typeof requestAnimationFrame === 'function') {
          let settleRaf = requestAnimationFrame(() => {
            settleRaf = 0;
            if (bodyAnimCleanup === cancelSettle) bodyAnimCleanup = null;
            if (card.isConnected) syncPointerAll();
          });
          const cancelSettle = () => {
            if (settleRaf && typeof cancelAnimationFrame === 'function') {
              cancelAnimationFrame(settleRaf);
              settleRaf = 0;
            }
            if (bodyAnimCleanup === cancelSettle) bodyAnimCleanup = null;
          };
          bodyAnimCleanup = cancelSettle;
        }
      }
    });
  }

  return {
    version: 27,
    SUPPORTED_HM_LOCALES,
    resolveHmLang,
    hmT,
    THEMES,
    DEFAULT_THEME,
    fmtTok,
    fmtUsd,
    buildDynamicPalette,
    buildFullHtml,
    buildHomeHtml,
    renderFullHeatmap,
    renderHomeHeatmapCard,
    cleanupHeatmapRoot,
  };
}

export const getHeatmapRendererScript = () => `if (globalThis.__agyPrismHeatmapUI?.version !== 27) globalThis.__agyPrismHeatmapUI = (${createHeatmapRenderer.toString()})();`;
