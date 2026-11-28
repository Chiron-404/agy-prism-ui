import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export const DEFAULT_SETTINGS = Object.freeze({ language: 'en', settingsLanguage: 'zh-CN', panelLayout: 'natural', density: 'compact', quotaIndicator: 'ring', labelCase: 'lowercase', resetFormat: 'compact', contextLayout: 'columns', turnLayout: 'columns', contextMarker: 'square', turnMarker: 'square', showContextBreakdown: true, columnLabel: true, columnValue: true, columnPercent: false, columnOrder: 'label,value,percent', highlightActiveModel: false, hideUnavailableQuota: true, showCacheWarnings: true, showContextWarnings: true, showRequestErrors: true, showSpeed: true, speedAnimation: false, showRequestMetrics: true, showTurnMetrics: false, opticalLightTheme: 'crystal', opticalDarkTheme: 'obsidian', opticalPrismRim: true, opticalGlass: true, opticalMotion: true, opticalCodeTools: true, updateChannel: 'stable', autoCheckUpdates: true });
const choices = {
  language: ['en', 'zh-CN', 'zh-TW', 'ja'],
  settingsLanguage: ['en', 'zh-CN', 'zh-TW', 'ja'],
  panelLayout: ['natural', 'matched'],
  density: ['compact', 'standard', 'spacious'],
  quotaIndicator: ['ring', 'bar'],
  labelCase: ['lowercase', 'titlecase'],
  resetFormat: ['compact', 'localized'],
  contextLayout: ['columns', 'rows'],
  turnLayout: ['columns', 'rows'],
  contextMarker: ['square', 'dot'],
  turnMarker: ['square', 'dot'],
  showContextBreakdown: [true, false],
  columnLabel: [true, false],
  columnValue: [true, false],
  columnPercent: [true, false],
  columnOrder: ['label,value,percent', 'label,percent,value', 'value,label,percent', 'value,percent,label', 'percent,label,value', 'percent,value,label'],
  highlightActiveModel: [true, false],
  hideUnavailableQuota: [true, false],
  showCacheWarnings: [true, false],
  showContextWarnings: [true, false],
  showRequestErrors: [true, false],
  showSpeed: [true, false],
  speedAnimation: [true, false],
  showRequestMetrics: [true, false],
  showTurnMetrics: [true, false],
  opticalLightTheme: ['crystal', 'alabaster', 'native'],
  opticalDarkTheme: ['obsidian', 'warm', 'native'],
  opticalPrismRim: [true, false],
  opticalGlass: [true, false],
  opticalMotion: [true, false],
  opticalCodeTools: [true, false],
  updateChannel: ['stable', 'preview', 'dev'],
  autoCheckUpdates: [true, false],
};

export function validateSettings(raw) {
  return Object.fromEntries(Object.entries(choices).filter(([key, values]) => values.includes(raw?.[key])).map(([key]) => [key, raw[key]]));
}

export function normalizeSettings(raw = {}) {
  const valid = validateSettings(raw);
  const legacyReqKeys = ['showRequestSpeed', 'showOutput', 'showTtft', 'showTotalTime'];
  const hasLegacyReq = legacyReqKeys.some(key => typeof raw?.[key] === 'boolean');
  const migrated = typeof raw?.showRequestMetrics === 'boolean' ? {}
    : hasLegacyReq ? { showRequestMetrics: legacyReqKeys.some(key => raw?.[key] === true) }
    : typeof raw?.showGenerationDetails === 'boolean' ? { showRequestMetrics: raw.showGenerationDetails } : {};
  // Read old style-only settings once without restoring a selectable preset.
  const legacyStyle = raw?.panelStyle === 'modern' ? { density: 'standard', quotaIndicator: 'bar' } : {};
  const next = { ...DEFAULT_SETTINGS, ...legacyStyle, ...migrated, ...valid };
  if (next.showSpeed === false) next.speedAnimation = false;
  return next;
}

export function createSettingsStore(
  filePath,
  legacyFilePath = filePath === undefined ? join(homedir(), '.gemini', 'config', 'agy-capsule', 'settings.json') : null,
) {
  const targetPath = filePath || join(homedir(), '.gemini', 'config', 'agy-prism-ui', 'settings.json');
  let cached = { ...DEFAULT_SETTINGS };
  let lastRaw = null;
  function writeAtomically(next) {
    mkdirSync(dirname(targetPath), { recursive: true });
    const text = JSON.stringify(next, null, 2) + '\n';
    const tmp = `${targetPath}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
    writeFileSync(tmp, text, 'utf8');
    renameSync(tmp, targetPath);
    return text;
  }
  function read() {
    try {
      const text = readFileSync(targetPath, 'utf8');
      if (text !== lastRaw) {
        const raw = JSON.parse(text);
        cached = normalizeSettings(raw);
        lastRaw = text;
      }
    } catch (err) {
      if (err?.code === 'ENOENT') {
        let migrated = false;
        if (legacyFilePath) {
          try {
            const raw = JSON.parse(readFileSync(legacyFilePath, 'utf8'));
            cached = normalizeSettings(raw);
            try {
              lastRaw = writeAtomically(cached);
            } catch {
              lastRaw = null;
            }
            migrated = true;
          } catch {}
        }
        if (!migrated) {
          cached = { ...DEFAULT_SETTINGS };
          lastRaw = null;
        }
      } else {
        lastRaw = null;
      }
    }
    return { ...cached };
  }
  function update(patch) {
    const valid = validateSettings(patch);
    const next = normalizeSettings({ ...read(), ...valid });
    writeAtomically(next);
    lastRaw = null;
    return read();
  }
  return { read, update };
}
