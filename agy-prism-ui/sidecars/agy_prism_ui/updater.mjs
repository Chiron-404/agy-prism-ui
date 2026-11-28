import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import zlib from 'node:zlib';

const DEFAULT_REPO = 'Chiron-404/agy-prism-ui';
const DEFAULT_ALLOWED_HOSTS = new Set([
  'api.github.com',
  'github.com',
  'objects.githubusercontent.com',
  'release-assets.githubusercontent.com',
  'github-releases.githubusercontent.com',
]);
const VALID_CHANNELS = ['stable', 'preview', 'dev'];
const MAX_ZIP_BYTES = 15 * 1024 * 1024;
const MAX_EXTRACT_FILES = 250;
const MAX_EXTRACT_BYTES = 30 * 1024 * 1024;

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  if (typeof zlib.crc32 === 'function') return zlib.crc32(buf) >>> 0;
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function normalizeChannel(ch) {
  return VALID_CHANNELS.includes(ch) ? ch : 'stable';
}

export function parseReleaseVersion(tag = '') {
  const raw = String(tag || '').trim();
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9a-z-]+?)(?:\.(\d+))?)?$/i.exec(raw);
  if (!m) return null;
  const major = Number(m[1]);
  const minor = Number(m[2]);
  const patch = Number(m[3]);
  const preTag = m[4] ? m[4].toLowerCase() : '';
  const preNum = m[5] !== undefined ? Number(m[5]) : 0;
  const isDevTag = preTag === 'dev' || preTag.startsWith('dev-') || /(?:^|-)dev$/.test(preTag);
  const channel = !preTag ? 'stable' : isDevTag ? 'dev' : 'preview';
  return { raw, major, minor, patch, preTag, preNum, channel };
}

function preTagRank(preTag) {
  if (!preTag) return 100;
  if (preTag === 'dev' || preTag.startsWith('dev-') || /(?:^|-)dev$/.test(preTag)) return 10;
  if (preTag.startsWith('rc')) return 40;
  if (preTag.startsWith('beta')) return 30;
  if (preTag.startsWith('pre')) return 25;
  if (preTag.startsWith('alpha')) return 20;
  return 15;
}

export function compareVersions(a, b) {
  const pa = typeof a === 'object' && a ? a : parseReleaseVersion(a);
  const pb = typeof b === 'object' && b ? b : parseReleaseVersion(b);
  if (!pa && !pb) return 0;
  if (!pa) return -1;
  if (!pb) return 1;
  if (pa.major !== pb.major) return pa.major > pb.major ? 1 : -1;
  if (pa.minor !== pb.minor) return pa.minor > pb.minor ? 1 : -1;
  if (pa.patch !== pb.patch) return pa.patch > pb.patch ? 1 : -1;
  const ra = preTagRank(pa.preTag);
  const rb = preTagRank(pb.preTag);
  if (ra !== rb) return ra > rb ? 1 : -1;
  if (pa.preTag !== pb.preTag) return pa.preTag > pb.preTag ? 1 : -1;
  if (pa.preNum !== pb.preNum) return pa.preNum > pb.preNum ? 1 : -1;
  return 0;
}

export function classifyReleaseChannel(release) {
  if (!release || release.draft) return null;
  const parsed = parseReleaseVersion(release.tag_name || release.tag || '');
  if (!parsed) return null;
  if (parsed.channel === 'dev') return 'dev';
  if (release.prerelease || parsed.channel === 'preview') return 'preview';
  return 'stable';
}

export function extractSha256(asset, body = '') {
  const digest = String(asset?.digest || '').trim();
  const dm = /^sha256:([0-9a-f]{64})$/i.exec(digest);
  if (dm) return dm[1].toLowerCase();
  const bm = /SHA-256[^0-9a-f]{0,24}([0-9a-f]{64})/i.exec(String(body || ''));
  return bm ? bm[1].toLowerCase() : '';
}

function decodeHtmlEntities(str = '') {
  return String(str || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:x0*27|0*39);|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number(dec);
      return Number.isInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : _;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = Number.parseInt(hex, 16);
      return Number.isInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : _;
    })
    .replace(/&amp;/gi, '&');
}

export function parseReleasesAtom(xml = '', repo = DEFAULT_REPO) {
  const text = String(xml || '');
  if (!text.trim()) return [];
  const entries = [...text.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)];
  const out = [];
  for (const match of entries) {
    const entry = match[1] || '';
    const linkMatch = /<link\b[^>]*href=["']([^"']+)["'][^>]*>/i.exec(entry);
    const htmlUrl = decodeHtmlEntities(linkMatch?.[1] || '').trim();
    const tagMatch = /\/releases\/tag\/([^/?#]+)/i.exec(htmlUrl);
    if (!tagMatch) continue;
    let tag = tagMatch[1];
    try { tag = decodeURIComponent(tag); } catch {}
    if (!parseReleaseVersion(tag)) continue;

    const titleRaw = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(entry)?.[1] || '';
    const updatedRaw = /<updated\b[^>]*>([\s\S]*?)<\/updated>/i.exec(entry)?.[1] || '';
    const contentRaw = /<content\b[^>]*>([\s\S]*?)<\/content>/i.exec(entry)?.[1] || '';

    const name = decodeHtmlEntities(titleRaw).replace(/<[^>]+>/g, '').trim() || tag;
    const publishedAt = decodeHtmlEntities(updatedRaw).replace(/<[^>]+>/g, '').trim();
    const decodedHtml = decodeHtmlEntities(contentRaw);
    const shaMatch = /SHA-256[\s\S]{0,120}?([0-9a-f]{64})/i.exec(decodedHtml);
    const sha256 = shaMatch ? shaMatch[1].toLowerCase() : '';
    const zipMatch = /(agy-prism-ui-v[0-9A-Za-z._-]+\.zip)/i.exec(decodedHtml);
    const assetName = zipMatch ? zipMatch[1] : `agy-prism-ui-${tag}.zip`;

    const plainBody = decodeHtmlEntities(
      decodedHtml
        .replace(/<blockquote\b[\s\S]*?<\/blockquote>/gi, '')
        .replace(/<li\b[^>]*>/gi, '\n- ')
        .replace(/<br\s*\/?>|<\/(?:p|div|li|h[1-6]|tr)>/gi, '\n')
        .replace(/<[^>]+>/g, '')
    )
      .split(/\r?\n/)
      .map(l => l.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n');
    const body = sha256 ? `${plainBody}\nSHA-256: ${sha256}`.trim() : plainBody;
    const parsed = parseReleaseVersion(tag);
    out.push({
      tag_name: tag,
      name,
      prerelease: (parsed?.channel || 'stable') !== 'stable',
      draft: false,
      published_at: publishedAt,
      html_url: htmlUrl || `https://github.com/${repo}/releases/tag/${encodeURIComponent(tag)}`,
      body,
      assets: [
        {
          name: assetName,
          size: 0,
          browser_download_url: `https://github.com/${repo}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(assetName)}`,
          digest: sha256 ? `sha256:${sha256}` : '',
        },
      ],
    });
  }
  return out;
}

function summarizeReleaseBody(body = '') {
  const lines = String(body || '')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('---') && !/^https?:\/\//i.test(l));
  const bullets = lines.filter(l => l.startsWith('- ') || l.startsWith('* ')).slice(0, 3);
  const picked = bullets.length ? bullets : lines.slice(0, 2);
  const text = picked.join(' ').replace(/\*\*/g, '').replace(/`/g, '');
  return text.length > 220 ? text.slice(0, 217) + '...' : text;
}

export function selectReleaseForChannel(releases = [], channel = 'stable') {
  const target = normalizeChannel(channel);
  const candidates = [];
  for (const rel of Array.isArray(releases) ? releases : []) {
    const ch = classifyReleaseChannel(rel);
    if (ch !== target) continue;
    const assets = Array.isArray(rel.assets) ? rel.assets : [];
    const zipAsset = assets.find(a => /\.zip$/i.test(String(a?.name || '')) && a?.browser_download_url);
    if (!zipAsset) continue;
    const tag = String(rel.tag_name || rel.tag || '').trim();
    const parsed = parseReleaseVersion(tag);
    if (!parsed) continue;
    candidates.push({
      parsed,
      info: {
        tag,
        version: tag.replace(/^v/i, ''),
        name: String(rel.name || tag),
        channel: target,
        prerelease: Boolean(rel.prerelease),
        publishedAt: String(rel.published_at || ''),
        htmlUrl: String(rel.html_url || ''),
        summary: summarizeReleaseBody(rel.body || ''),
        assetName: String(zipAsset.name || ''),
        assetSize: Number(zipAsset.size) || 0,
        downloadUrl: String(zipAsset.browser_download_url || ''),
        sha256: extractSha256(zipAsset, rel.body || ''),
      },
    });
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => compareVersions(b.parsed, a.parsed));
  return candidates[0].info;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function localDayKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function getCurrentScheduleSlot(nowMs = Date.now()) {
  const d = new Date(nowMs);
  const h = d.getHours();
  if (h < 9) {
    const prev = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    return `${localDayKey(prev)}@19:00`;
  }
  if (h < 19) return `${localDayKey(d)}@09:00`;
  return `${localDayKey(d)}@19:00`;
}

export function getNextScheduleTime(nowMs = Date.now()) {
  const d = new Date(nowMs);
  const t9 = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0, 0).getTime();
  if (nowMs < t9) return { timestamp: t9, label: '09:00' };
  const t19 = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 19, 0, 0, 0).getTime();
  if (nowMs < t19) return { timestamp: t19, label: '19:00' };
  const next9 = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 9, 0, 0, 0).getTime();
  return { timestamp: next9, label: '09:00' };
}

function sanitizeZipEntryPath(rawName) {
  const name = String(rawName || '').replaceAll('\\', '/');
  if (!name || name.includes('\0') || name.startsWith('/') || /^[a-zA-Z]:/.test(name)) {
    throw new Error(`Unsafe ZIP entry path: ${name}`);
  }
  const parts = name.split('/').filter(Boolean);
  if (!parts.length || parts.some(p => p === '.' || p === '..')) {
    throw new Error(`Unsafe ZIP path traversal: ${name}`);
  }
  return parts.join('/');
}

export function extractZipBuffer(buffer, targetDir, options = {}) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const maxFiles = options.maxFiles ?? MAX_EXTRACT_FILES;
  const maxBytes = options.maxBytes ?? MAX_EXTRACT_BYTES;

  // Locate End of Central Directory (0x06054b50)
  const minOff = Math.max(0, buf.length - 65557);
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= minOff; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error('Invalid ZIP: EOCD signature not found');

  const entryCount = buf.readUInt16LE(eocdOffset + 10);
  const cdSize = buf.readUInt32LE(eocdOffset + 12);
  const cdOffset = buf.readUInt32LE(eocdOffset + 16);
  if (entryCount > maxFiles) throw new Error(`ZIP exceeds maximum file limit (${entryCount} > ${maxFiles})`);
  if (cdOffset + cdSize > eocdOffset) throw new Error('Invalid ZIP: corrupt central directory bounds');

  mkdirSync(targetDir, { recursive: true });
  const absRoot = resolve(targetDir);
  let totalOut = 0;
  let cursor = cdOffset;
  let fileCount = 0;

  for (let idx = 0; idx < entryCount; idx++) {
    if (cursor + 46 > buf.length || buf.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error('Invalid ZIP: corrupt central directory entry');
    }
    const method = buf.readUInt16LE(cursor + 10);
    const expectedCrc = buf.readUInt32LE(cursor + 16);
    const compSize = buf.readUInt32LE(cursor + 20);
    const uncompSize = buf.readUInt32LE(cursor + 24);
    const nameLen = buf.readUInt16LE(cursor + 28);
    const extraLen = buf.readUInt16LE(cursor + 30);
    const commentLen = buf.readUInt16LE(cursor + 32);
    const extAttrs = buf.readUInt32LE(cursor + 38);
    const localHeaderOffset = buf.readUInt32LE(cursor + 42);
    const rawName = buf.subarray(cursor + 46, cursor + 46 + nameLen).toString('utf8');
    cursor += 46 + nameLen + extraLen + commentLen;

    // Reject POSIX symlinks (S_IFLNK = 0o120000)
    if (((extAttrs >>> 16) & 0o170000) === 0o120000) {
      throw new Error(`Refusing symlink in ZIP: ${rawName}`);
    }
    if (rawName.endsWith('/')) {
      const cleanDir = sanitizeZipEntryPath(rawName);
      const outDir = resolve(absRoot, cleanDir);
      if (!outDir.startsWith(absRoot + (absRoot.endsWith('\\') || absRoot.endsWith('/') ? '' : process.platform === 'win32' ? '\\' : '/'))) {
        throw new Error(`ZIP directory escapes target: ${rawName}`);
      }
      mkdirSync(outDir, { recursive: true });
      continue;
    }

    fileCount++;
    if (fileCount > maxFiles) throw new Error('ZIP file count exceeds limit');
    totalOut += uncompSize;
    if (totalOut > maxBytes) throw new Error('ZIP uncompressed size exceeds limit');

    const cleanName = sanitizeZipEntryPath(rawName);
    const outPath = resolve(absRoot, cleanName);
    const sep = process.platform === 'win32' ? '\\' : '/';
    if (!outPath.startsWith(absRoot + sep)) {
      throw new Error(`ZIP entry escapes target: ${rawName}`);
    }

    if (localHeaderOffset + 30 > buf.length || buf.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      throw new Error(`Invalid ZIP local header for ${cleanName}`);
    }
    const lNameLen = buf.readUInt16LE(localHeaderOffset + 26);
    const lExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + lNameLen + lExtraLen;
    if (dataStart + compSize > buf.length) {
      throw new Error(`Truncated ZIP entry data for ${cleanName}`);
    }
    const compressed = buf.subarray(dataStart, dataStart + compSize);
    let data;
    if (method === 0) {
      data = compressed;
    } else if (method === 8) {
      data = zlib.inflateRawSync(compressed, { maxOutputLength: maxBytes });
    } else {
      throw new Error(`Unsupported ZIP compression method ${method} for ${cleanName}`);
    }
    if (data.length !== uncompSize) {
      throw new Error(`ZIP entry size mismatch for ${cleanName}`);
    }
    if (crc32(data) !== expectedCrc) {
      throw new Error(`ZIP CRC32 mismatch for ${cleanName}`);
    }

    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, data);
  }
  return { files: fileCount, bytes: totalOut };
}

export function applyWindowsNonAsciiSidecarFix(manifestPath, installedManifestPath = null, options = {}) {
  const platform = options.platform ?? process.platform;
  if (platform !== 'win32') return false;
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const appData = options.appData ?? process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming');
  const userProfile = options.userProfile ?? process.env.USERPROFILE ?? homedir();
  const wrapperPath = join(appData, 'Antigravity', 'bin', 'agy-node.cmd');
  const loaderPath = join(userProfile, '.gemini', 'antigravity', 'lib', 'node_modules', 'sidecar_sdk', 'register_loader.js');

  let applied = false;
  try {
    const wrapper = readFileSync(wrapperPath, 'utf8');
    const m = /^[ \t]*"((?:[a-z]:\\|\\\\)[^"\r\n]*\\Antigravity\.exe)"[ \t]+%\*[ \t]*\r?$/im.exec(wrapper);
    const exe = m?.[1];
    if (exe && /[^\x00-\x7f]/.test(exe) && existsSync(exe) && existsSync(loaderPath)) {
      const importArg = `--import=${pathToFileURL(loaderPath).href}`;
      const args = Array.isArray(manifest.args) ? manifest.args.filter(a => !String(a).startsWith('--import=')) : [];
      manifest.command = exe;
      manifest.args = [importArg, ...args];
      manifest.env = { ...(manifest.env || {}), ELECTRON_RUN_AS_NODE: '1' };
      applied = true;
    }
  } catch {}

  if (!applied && installedManifestPath && existsSync(installedManifestPath)) {
    try {
      const prev = JSON.parse(readFileSync(installedManifestPath, 'utf8'));
      if (prev?.command && prev.command !== 'node' && prev?.env?.ELECTRON_RUN_AS_NODE === '1' && existsSync(prev.command)) {
        const importArg = Array.isArray(prev.args) ? prev.args.find(a => String(a).startsWith('--import=')) : null;
        const args = Array.isArray(manifest.args) ? manifest.args.filter(a => !String(a).startsWith('--import=')) : [];
        manifest.command = prev.command;
        manifest.args = importArg ? [importArg, ...args] : args;
        manifest.env = { ...(manifest.env || {}), ELECTRON_RUN_AS_NODE: '1' };
        applied = true;
      }
    } catch {}
  }

  if (applied) {
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  }
  return applied;
}

function listFilesRelative(rootDir, baseDir = rootDir, out = []) {
  for (const ent of readdirSync(rootDir, { withFileTypes: true })) {
    const full = join(rootDir, ent.name);
    if (ent.name === '.update-in-progress') continue;
    if (ent.isSymbolicLink()) throw new Error(`Refusing symlink in directory: ${full}`);
    if (ent.isDirectory()) listFilesRelative(full, baseDir, out);
    else if (ent.isFile()) out.push(full.slice(baseDir.length + 1).replaceAll('\\', '/'));
  }
  return out;
}

function findExtractedPluginRoot(extractDir) {
  const direct = join(extractDir, 'plugin.json');
  if (existsSync(direct)) return extractDir;
  for (const ent of readdirSync(extractDir, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const sub1 = join(extractDir, ent.name);
    if (existsSync(join(sub1, 'plugin.json'))) return sub1;
    const sub2 = join(sub1, 'agy-prism-ui');
    if (existsSync(join(sub2, 'plugin.json'))) return sub2;
  }
  throw new Error('Extracted archive does not contain agy-prism-ui/plugin.json');
}

async function copyWithRetry(src, dst) {
  mkdirSync(dirname(dst), { recursive: true });
  const tmp = `${dst}.upd.${process.pid}.${Date.now()}.tmp`;
  copyFileSync(src, tmp);
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      renameSync(tmp, dst);
      return;
    } catch (err) {
      if ((err?.code === 'EBUSY' || err?.code === 'EPERM') && attempt < 5) {
        await new Promise(r => setTimeout(r, 40 * (attempt + 1)));
        continue;
      }
      try { rmSync(tmp, { force: true }); } catch {}
      throw err;
    }
  }
}

export function createUpdater(options = {}) {
  const pluginDir = resolve(options.pluginDir || join(homedir(), '.gemini', 'config', 'plugins', 'agy-prism-ui'));
  let currentVersion = String(options.currentVersion || '0.0.0');
  const repo = String(options.repo || DEFAULT_REPO);
  const statePath = options.statePath || join(homedir(), '.gemini', 'config', 'agy-prism-ui', 'update_state.json');
  const getPrefs = options.getPrefs || (() => ({ updateChannel: 'stable', autoCheckUpdates: true }));
  const onUpdateApplied = options.onUpdateApplied || null;
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const now = options.now || (() => Date.now());
  const allowedHosts = options.allowedHosts || DEFAULT_ALLOWED_HOSTS;
  const allowRepoOverride = Boolean(options.allowRepoOverride);
  const startupDelayMs = options.startupDelayMs ?? 10_000;
  const pollIntervalMs = options.pollIntervalMs ?? 60_000;
  const restartDelayMs = options.restartDelayMs ?? 350;

  let persisted = { lastSlotByChannel: {}, lastCheckedAt: 0, lastCheckError: '', latestByChannel: {}, etag: '', backoffUntil: 0 };
  try {
    if (existsSync(statePath)) {
      const raw = JSON.parse(readFileSync(statePath, 'utf8'));
      if (raw && typeof raw === 'object') {
        persisted = {
          lastSlotByChannel: raw.lastSlotByChannel && typeof raw.lastSlotByChannel === 'object' ? raw.lastSlotByChannel : {},
          lastCheckedAt: Number(raw.lastCheckedAt) || 0,
          lastCheckError: String(raw.lastCheckError || ''),
          latestByChannel: raw.latestByChannel && typeof raw.latestByChannel === 'object' ? raw.latestByChannel : {},
          etag: typeof raw.etag === 'string' ? raw.etag : '',
          backoffUntil: Number(raw.backoffUntil) || 0,
        };
      }
    }
  } catch {}

  function savePersisted() {
    try {
      mkdirSync(dirname(statePath), { recursive: true });
      const tmp = `${statePath}.${process.pid}.${Date.now()}.tmp`;
      writeFileSync(tmp, JSON.stringify(persisted, null, 2) + '\n', 'utf8');
      renameSync(tmp, statePath);
    } catch {}
  }

  let checking = false;
  let applying = false;
  let appliedVersion = '';
  let runtimeError = '';
  let checkPromise = null;
  let startupTimer = null;
  let pollTimer = null;

  function activeChannel() {
    return normalizeChannel(getPrefs()?.updateChannel);
  }

  function currentInstalledChannel() {
    return parseReleaseVersion(currentVersion)?.channel || 'stable';
  }

  function computeAvailability(latest, channel) {
    if (!latest) return { updateAvailable: false, actionKind: 'none' };
    const installedCh = currentInstalledChannel();
    if (latest.channel !== installedCh) {
      return { updateAvailable: true, actionKind: 'switch' };
    }
    if (compareVersions(latest.tag, currentVersion) > 0) {
      return { updateAvailable: true, actionKind: 'upgrade' };
    }
    return { updateAvailable: false, actionKind: 'none' };
  }

  function getStatus(overrideChannel) {
    const channel = normalizeChannel(overrideChannel ?? activeChannel());
    const autoCheckUpdates = getPrefs()?.autoCheckUpdates !== false;
    const latest = persisted.latestByChannel?.[channel] || null;
    const { updateAvailable, actionKind } = computeAvailability(latest, channel);
    const err = runtimeError || persisted.lastCheckError || '';
    let state = 'idle';
    if (applying) state = 'applying';
    else if (appliedVersion) state = 'applied';
    else if (checking) state = 'checking';
    else if (err) state = 'error';
    else if (updateAvailable) state = 'available';
    else if (persisted.lastCheckedAt > 0) state = 'up-to-date';
    const next = getNextScheduleTime(now());
    return {
      currentVersion,
      currentChannel: currentInstalledChannel(),
      channel,
      autoCheckUpdates,
      checking,
      applying,
      state,
      updateAvailable,
      actionKind,
      latest,
      appliedVersion,
      lastCheckedAt: persisted.lastCheckedAt,
      nextCheckAt: autoCheckUpdates ? next.timestamp : 0,
      nextCheckLabel: autoCheckUpdates ? next.label : '',
      error: err,
    };
  }

  function markAllChannelSlots(ts) {
    const slot = getCurrentScheduleSlot(ts);
    for (const ch of VALID_CHANNELS) {
      persisted.lastSlotByChannel[ch] = slot;
    }
  }

  function storeReleases(releases, ts) {
    persisted.latestByChannel = {
      stable: selectReleaseForChannel(releases, 'stable'),
      preview: selectReleaseForChannel(releases, 'preview'),
      dev: selectReleaseForChannel(releases, 'dev'),
    };
    persisted.lastCheckedAt = ts;
    persisted.lastCheckError = '';
    persisted.backoffUntil = 0;
    markAllChannelSlots(ts);
  }

  async function fetchReleasesFromAtom() {
    const atomUrl = `https://github.com/${repo}/releases.atom`;
    const res = await fetchImpl(atomUrl, {
      headers: {
        Accept: 'application/atom+xml, application/xml, text/xml',
        'User-Agent': `agy-prism-ui/${currentVersion}`,
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Atom feed HTTP ${res.status}`);
    const xml = await res.text();
    const parsed = parseReleasesAtom(xml, repo);
    if (!parsed.length) throw new Error('Empty releases Atom feed');
    return parsed;
  }

  async function checkForUpdates({ channel, manual = false, force = false } = {}) {
    const targetChannel = normalizeChannel(channel ?? activeChannel());
    if (checkPromise) {
      await checkPromise;
      return getStatus(targetChannel);
    }
    const tsNow = now();
    if (!manual && !force && !persisted.lastCheckError && persisted.lastCheckedAt > 0 && (tsNow - persisted.lastCheckedAt) < 60_000) {
      return getStatus(targetChannel);
    }
    checking = true;
    runtimeError = '';
    checkPromise = (async () => {
      try {
        if (typeof fetchImpl !== 'function') throw new Error('fetch is unavailable');
        const url = `https://api.github.com/repos/${repo}/releases?per_page=30`;
        const headers = {
          Accept: 'application/vnd.github+json',
          'User-Agent': `agy-prism-ui/${currentVersion}`,
        };
        const hasCached = persisted.latestByChannel && Object.keys(persisted.latestByChannel).length > 0;
        if (persisted.etag && hasCached) {
          headers['If-None-Match'] = persisted.etag;
        }
        let apiErrMsg = '';
        try {
          const res = await fetchImpl(url, {
            headers,
            signal: AbortSignal.timeout(15_000),
          });
          if (res.status === 304 && hasCached) {
            const ts = now();
            persisted.lastCheckedAt = ts;
            persisted.lastCheckError = '';
            persisted.backoffUntil = 0;
            markAllChannelSlots(ts);
            savePersisted();
            return;
          }
          if (res.ok) {
            const releases = await res.json();
            if (!Array.isArray(releases)) throw new Error('Invalid GitHub Releases response');
            persisted.etag = res.headers?.get?.('etag') || '';
            storeReleases(releases, now());
            savePersisted();
            return;
          }
          if (res.status === 403 || res.status === 429) {
            const resetSec = Number(res.headers?.get?.('x-ratelimit-reset') || 0);
            const resetNote = resetSec > 0
              ? ` (reset ${new Date(resetSec * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })})`
              : '';
            apiErrMsg = `GitHub API HTTP ${res.status}${resetNote}`;
          } else {
            apiErrMsg = `GitHub API HTTP ${res.status}`;
          }
        } catch (err) {
          apiErrMsg = err?.message || String(err);
        }

        // Fall back to GitHub's rate-limit-free releases.atom feed when REST API fails or is throttled.
        try {
          const atomReleases = await fetchReleasesFromAtom();
          storeReleases(atomReleases, now());
          runtimeError = '';
          savePersisted();
        } catch (atomErr) {
          const combined = apiErrMsg || atomErr?.message || String(atomErr);
          runtimeError = combined;
          persisted.lastCheckError = combined;
          persisted.backoffUntil = now() + 15 * 60_000;
          savePersisted();
        }
      } finally {
        checking = false;
        checkPromise = null;
      }
    })();
    await checkPromise;
    return getStatus(targetChannel);
  }

  function validateDownloadUrl(rawUrl) {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:' && !options.allowHttpForTests) {
      throw new Error(`Refusing non-HTTPS update URL: ${u.protocol}`);
    }
    if (!allowedHosts.has(u.hostname)) {
      throw new Error(`Untrusted update host: ${u.hostname}`);
    }
    return u.toString();
  }

  async function applyUpdate({ channel } = {}) {
    const targetChannel = normalizeChannel(channel ?? activeChannel());
    if (applying) throw new Error('Update already in progress');
    if (checkPromise) await checkPromise;

    let target = persisted.latestByChannel?.[targetChannel] || null;
    if (!target) {
      await checkForUpdates({ channel: targetChannel });
      target = persisted.latestByChannel?.[targetChannel] || null;
    }
    if (!target) {
      throw new Error(`No release package found for channel: ${targetChannel}`);
    }
    if (!target.sha256 || !/^[0-9a-f]{64}$/i.test(target.sha256)) {
      throw new Error(`Release ${target.tag} is missing a SHA-256 digest`);
    }
    if (!allowRepoOverride && existsSync(join(dirname(pluginDir), '.git')) && !existsSync(join(pluginDir, '.update-target-ok'))) {
      throw new Error('Refusing self-update on source repository directory');
    }
    if (existsSync(pluginDir) && lstatSync(pluginDir).isSymbolicLink()) {
      throw new Error(`Refusing self-update on symlinked plugin directory: ${pluginDir}`);
    }

    applying = true;
    runtimeError = '';
    const parentDir = dirname(pluginDir);
    const workDir = join(parentDir, `.agy-prism-update-${process.pid}-${Date.now()}`);
    const stageDir = join(workDir, 'stage');
    const backupDir = join(workDir, 'backup');
    const markerPath = join(pluginDir, '.update-in-progress');
    let swapped = false;

    try {
      const downloadUrl = validateDownloadUrl(target.downloadUrl);
      const res = await fetchImpl(downloadUrl, {
        headers: { 'User-Agent': `agy-prism-ui/${currentVersion}` },
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) throw new Error(`Package download failed: HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0 || buf.length > MAX_ZIP_BYTES) {
        throw new Error(`Unexpected update archive size: ${buf.length}`);
      }
      const actualSha = createHash('sha256').update(buf).digest('hex').toLowerCase();
      if (actualSha !== target.sha256.toLowerCase()) {
        throw new Error(`SHA-256 verification failed for ${target.assetName}`);
      }

      extractZipBuffer(buf, stageDir);
      const newRoot = findExtractedPluginRoot(stageDir);
      for (const req of ['plugin.json', join('sidecars', 'agy_prism_ui', 'sidecar.json'), join('sidecars', 'agy_prism_ui', 'server.mjs')]) {
        if (!existsSync(join(newRoot, req))) {
          throw new Error(`Update package missing required file: ${req}`);
        }
      }

      applyWindowsNonAsciiSidecarFix(
        join(newRoot, 'sidecars', 'agy_prism_ui', 'sidecar.json'),
        join(pluginDir, 'sidecars', 'agy_prism_ui', 'sidecar.json'),
        options.windowsSidecarOptions,
      );

      const newFiles = listFilesRelative(newRoot);
      const newFileSet = new Set(newFiles);

      mkdirSync(pluginDir, { recursive: true });
      const oldFiles = listFilesRelative(pluginDir);
      for (const rel of oldFiles) {
        const src = join(pluginDir, rel);
        const bak = join(backupDir, rel);
        mkdirSync(dirname(bak), { recursive: true });
        copyFileSync(src, bak);
      }

      writeFileSync(markerPath, `Updating to ${target.tag}\n`, 'utf8');
      swapped = true;
      for (const rel of newFiles) {
        await copyWithRetry(join(newRoot, rel), join(pluginDir, rel));
      }
      for (const rel of oldFiles) {
        if (!newFileSet.has(rel)) {
          try { rmSync(join(pluginDir, rel), { force: true }); } catch {}
        }
      }

      currentVersion = target.version || target.tag;
      appliedVersion = target.tag;
      persisted.lastCheckError = '';
      savePersisted();
      applying = false;
      if (typeof onUpdateApplied === 'function') {
        const t = setTimeout(() => { void onUpdateApplied(target.tag); }, restartDelayMs);
        t.unref?.();
      }
      return getStatus(targetChannel);
    } catch (err) {
      if (swapped && existsSync(backupDir)) {
        try {
          const currentFiles = listFilesRelative(pluginDir);
          const backupFiles = listFilesRelative(backupDir);
          const backupSet = new Set(backupFiles);
          for (const rel of backupFiles) {
            await copyWithRetry(join(backupDir, rel), join(pluginDir, rel));
          }
          for (const rel of currentFiles) {
            if (!backupSet.has(rel)) {
              try { rmSync(join(pluginDir, rel), { force: true }); } catch {}
            }
          }
        } catch {}
      }
      runtimeError = err?.message || String(err);
      throw err;
    } finally {
      applying = false;
      try { rmSync(markerPath, { force: true }); } catch {}
      try { rmSync(workDir, { recursive: true, force: true }); } catch {}
    }
  }

  async function maybeRunScheduledCheck() {
    if (checking || applying) return false;
    const prefs = getPrefs();
    if (prefs?.autoCheckUpdates === false) return false;
    const tsNow = now();
    if (persisted.backoffUntil && tsNow < persisted.backoffUntil) return false;
    const channel = normalizeChannel(prefs?.updateChannel);
    const slot = getCurrentScheduleSlot(tsNow);
    if (persisted.lastSlotByChannel?.[channel] === slot) return false;
    await checkForUpdates({ channel });
    return true;
  }

  function startScheduler() {
    if (startupTimer || pollTimer) return;
    startupTimer = setTimeout(() => {
      startupTimer = null;
      void maybeRunScheduledCheck();
    }, startupDelayMs);
    startupTimer.unref?.();
    pollTimer = setInterval(() => {
      void maybeRunScheduledCheck();
    }, pollIntervalMs);
    pollTimer.unref?.();
  }

  function stopScheduler() {
    if (startupTimer) { clearTimeout(startupTimer); startupTimer = null; }
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  return {
    getStatus,
    checkForUpdates,
    applyUpdate,
    maybeRunScheduledCheck,
    startScheduler,
    stopScheduler,
  };
}
