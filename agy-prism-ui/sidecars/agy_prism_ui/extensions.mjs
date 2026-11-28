export function createExtensionBus() {
  const lenses = new Map();
  const overviewSections = new Map();
  const customThemes = new Map();
  const styles = new Map();
  const snapshotListeners = new Set();
  const heatmapListeners = new Set();

  function safeId(raw) {
    const s = String(raw || '').trim();
    return /^[a-z0-9][a-z0-9._-]{0,63}$/i.test(s) ? s : '';
  }

  function registerLens(id, def = {}) {
    const key = safeId(id);
    if (!key || typeof def?.render !== 'function') return false;
    lenses.set(key, {
      id: key,
      order: Number.isFinite(Number(def.order)) ? Number(def.order) : 100,
      position: def.position === 'start' ? 'start' : 'end',
      render: def.render,
    });
    return true;
  }

  function registerOverviewSection(id, def = {}) {
    const key = safeId(id);
    if (!key || typeof def?.render !== 'function') return false;
    overviewSections.set(key, {
      id: key,
      title: String(def.title || key),
      order: Number.isFinite(Number(def.order)) ? Number(def.order) : 100,
      render: def.render,
    });
    return true;
  }

  function registerHeatmapTheme(id, themeDef = {}) {
    const key = safeId(id);
    if (!key || !Array.isArray(themeDef?.light) || themeDef.light.length !== 6 || !Array.isArray(themeDef?.dark) || themeDef.dark.length !== 6) {
      return false;
    }
    const normalized = {
      label: String(themeDef.label || key),
      swatch: String(themeDef.swatch || `linear-gradient(135deg, ${themeDef.light[2]} 0%, ${themeDef.light[5]} 100%)`),
      accent: String(themeDef.accent || themeDef.light[4]),
      accentDark: String(themeDef.accentDark || themeDef.dark[4]),
      light: themeDef.light.slice(0, 6).map(String),
      dark: themeDef.dark.slice(0, 6).map(String),
      barStops: Array.isArray(themeDef.barStops) && themeDef.barStops.length === 3 ? themeDef.barStops.slice() : [themeDef.light[2], themeDef.light[4], themeDef.light[5]],
      barStopsDark: Array.isArray(themeDef.barStopsDark) && themeDef.barStopsDark.length === 3 ? themeDef.barStopsDark.slice() : [themeDef.dark[2], themeDef.dark[4], themeDef.dark[5]],
      monthlyBar: String(themeDef.monthlyBar || themeDef.light[3]),
      monthlyBarDark: String(themeDef.monthlyBarDark || themeDef.dark[3]),
      curve: String(themeDef.curve || themeDef.light[5]),
      curveDark: String(themeDef.curveDark || themeDef.dark[5]),
    };
    customThemes.set(key, normalized);
    try { globalThis.__agyPrismHeatmapUI?.registerTheme?.(key, normalized); } catch {}
    return true;
  }

  function registerStyle(id, cssText = '') {
    const key = safeId(id);
    if (!key) return false;
    const text = String(cssText || '').slice(0, 65536);
    styles.set(key, text);
    if (typeof document !== 'undefined' && document.head) {
      let el = document.querySelector(`style[data-agy-ext-style="${key}"]`);
      if (!el) {
        el = document.createElement('style');
        el.setAttribute('data-agy-ext-style', key);
        document.head.appendChild(el);
      }
      if (el.textContent !== text) el.textContent = text;
    }
    return true;
  }

  function onSnapshot(fn) {
    if (typeof fn !== 'function') return () => {};
    snapshotListeners.add(fn);
    return () => snapshotListeners.delete(fn);
  }

  function onHeatmap(fn) {
    if (typeof fn !== 'function') return () => {};
    heatmapListeners.add(fn);
    return () => heatmapListeners.delete(fn);
  }

  function emitSnapshot(snapshot) {
    for (const fn of [...snapshotListeners]) {
      try { fn(snapshot); } catch {}
    }
  }

  function emitHeatmap(heatmap) {
    for (const fn of [...heatmapListeners]) {
      try { fn(heatmap); } catch {}
    }
  }

  function getLenses() {
    return [...lenses.values()].sort((a, b) => a.order - b.order);
  }

  function getOverviewSections() {
    return [...overviewSections.values()].sort((a, b) => a.order - b.order);
  }

  function getHeatmapThemes() {
    return Object.fromEntries(customThemes.entries());
  }

  function unregister(id) {
    const key = safeId(id);
    if (!key) return false;
    let removed = false;
    if (lenses.delete(key)) removed = true;
    if (overviewSections.delete(key)) removed = true;
    if (customThemes.delete(key)) {
      removed = true;
      try { globalThis.__agyPrismHeatmapUI?.unregisterTheme?.(key); } catch {}
    }
    if (styles.delete(key)) {
      removed = true;
      if (typeof document !== 'undefined') {
        document.querySelector(`style[data-agy-ext-style="${key}"]`)?.remove?.();
      }
    }
    return removed;
  }

  function list() {
    return {
      lenses: [...lenses.keys()],
      overviewSections: [...overviewSections.keys()],
      heatmapThemes: [...customThemes.keys()],
      styles: [...styles.keys()],
      snapshotListeners: snapshotListeners.size,
      heatmapListeners: heatmapListeners.size,
    };
  }

  function dispose() {
    for (const key of [...styles.keys()]) {
      if (typeof document !== 'undefined') {
        document.querySelector(`style[data-agy-ext-style="${key}"]`)?.remove?.();
      }
    }
    for (const key of [...customThemes.keys()]) {
      try { globalThis.__agyPrismHeatmapUI?.unregisterTheme?.(key); } catch {}
    }
    lenses.clear();
    overviewSections.clear();
    customThemes.clear();
    styles.clear();
    snapshotListeners.clear();
    heatmapListeners.clear();
  }

  return {
    version: 1,
    registerLens,
    registerOverviewSection,
    registerHeatmapTheme,
    registerStyle,
    onSnapshot,
    onHeatmap,
    emitSnapshot,
    emitHeatmap,
    getLenses,
    getOverviewSections,
    getHeatmapThemes,
    unregister,
    list,
    dispose,
  };
}

export const getExtensionBusScript = () => `if (globalThis.__agyPrismExt?.version !== 1) globalThis.__agyPrismExt = (${createExtensionBus.toString()})();`;
