import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import zlib from 'node:zlib';
import {
  applyWindowsNonAsciiSidecarFix,
  classifyReleaseChannel,
  compareVersions,
  createUpdater,
  extractZipBuffer,
  getCurrentScheduleSlot,
  getNextScheduleTime,
  parseReleaseVersion,
  parseReleasesAtom,
  selectReleaseForChannel,
} from '../agy-prism-ui/sidecars/agy_prism_ui/updater.mjs';

function crc32(buf) {
  if (typeof zlib.crc32 === 'function') return zlib.crc32(buf) >>> 0;
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function buildTestZip(entries) {
  const localParts = [];
  const cdParts = [];
  let offset = 0;
  for (const ent of entries) {
    const nameBuf = Buffer.from(ent.name, 'utf8');
    const raw = Buffer.from(ent.content || '', 'utf8');
    const method = ent.deflate ? 8 : 0;
    const comp = ent.deflate ? zlib.deflateRawSync(raw) : raw;
    const crc = crc32(raw);

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(method, 8);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(raw.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);

    localParts.push(lh, nameBuf, comp);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(comp.length, 20);
    cd.writeUInt32LE(raw.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt32LE(ent.extAttrs || 0, 38);
    cd.writeUInt32LE(offset, 42);
    cdParts.push(cd, nameBuf);

    offset += lh.length + nameBuf.length + comp.length;
  }
  const cdBuf = Buffer.concat(cdParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, cdBuf, eocd]);
}

test('parseReleaseVersion, classifyReleaseChannel, compareVersions, and selectReleaseForChannel handle 3 channels', () => {
  assert.deepEqual(parseReleaseVersion('v2.0.3'), { raw: 'v2.0.3', major: 2, minor: 0, patch: 3, preTag: '', preNum: 0, channel: 'stable' });
  assert.deepEqual(parseReleaseVersion('v2.1.0-beta.2'), { raw: 'v2.1.0-beta.2', major: 2, minor: 1, patch: 0, preTag: 'beta', preNum: 2, channel: 'preview' });
  assert.deepEqual(parseReleaseVersion('v2.1.0-pre'), { raw: 'v2.1.0-pre', major: 2, minor: 1, patch: 0, preTag: 'pre', preNum: 0, channel: 'preview' });
  assert.deepEqual(parseReleaseVersion('v2.0.3-dev'), { raw: 'v2.0.3-dev', major: 2, minor: 0, patch: 3, preTag: 'dev', preNum: 0, channel: 'dev' });
  assert.deepEqual(parseReleaseVersion('v2.1.0-pre-dev'), { raw: 'v2.1.0-pre-dev', major: 2, minor: 1, patch: 0, preTag: 'pre-dev', preNum: 0, channel: 'dev' });

  assert.equal(compareVersions('v2.0.3', 'v2.0.3-beta.1'), 1);
  assert.equal(compareVersions('v2.0.3-beta.1', 'v2.0.3-dev'), 1);
  assert.equal(compareVersions('v2.1.0-pre', 'v2.1.0-pre-dev'), 1);
  assert.equal(compareVersions('v2.0.3-dev.2', 'v2.0.3-dev.1'), 1);

  const releases = [
    { tag_name: 'v2.0.2', prerelease: false, draft: false, assets: [{ name: 'a.zip', browser_download_url: 'https://github.com/x/a.zip', digest: 'sha256:' + 'a'.repeat(64) }] },
    { tag_name: 'v2.0.3', prerelease: false, draft: false, assets: [{ name: 'b.zip', browser_download_url: 'https://github.com/x/b.zip', digest: 'sha256:' + 'b'.repeat(64) }] },
    { tag_name: 'v2.1.0-pre', prerelease: true, draft: false, assets: [{ name: 'c.zip', browser_download_url: 'https://github.com/x/c.zip', digest: 'sha256:' + 'c'.repeat(64) }] },
    { tag_name: 'v2.1.0-pre-dev', prerelease: true, draft: false, assets: [{ name: 'd.zip', browser_download_url: 'https://github.com/x/d.zip', digest: 'sha256:' + 'd'.repeat(64) }] },
    { tag_name: 'v2.0.9', prerelease: false, draft: true, assets: [{ name: 'e.zip', browser_download_url: 'https://github.com/x/e.zip' }] },
  ];

  assert.equal(classifyReleaseChannel(releases[1]), 'stable');
  assert.equal(classifyReleaseChannel(releases[2]), 'preview');
  assert.equal(classifyReleaseChannel(releases[3]), 'dev');
  assert.equal(classifyReleaseChannel(releases[4]), null);

  assert.equal(selectReleaseForChannel(releases, 'stable').tag, 'v2.0.3');
  assert.equal(selectReleaseForChannel(releases, 'preview').tag, 'v2.1.0-pre');
  assert.equal(selectReleaseForChannel(releases, 'dev').tag, 'v2.1.0-pre-dev');
});

test('schedule slots trigger at 09:00 and 19:00 and catch up missed slots on startup', async () => {
  const t0859 = new Date(2026, 10, 28, 8, 59, 0).getTime();
  const t0900 = new Date(2026, 10, 28, 9, 0, 0).getTime();
  const t1859 = new Date(2026, 10, 28, 18, 59, 0).getTime();
  const t1900 = new Date(2026, 10, 28, 19, 0, 0).getTime();

  assert.equal(getCurrentScheduleSlot(t0859), '2026-11-27@19:00');
  assert.equal(getCurrentScheduleSlot(t0900), '2026-11-28@09:00');
  assert.equal(getCurrentScheduleSlot(t1859), '2026-11-28@09:00');
  assert.equal(getCurrentScheduleSlot(t1900), '2026-11-28@19:00');
  assert.equal(getNextScheduleTime(t0859).label, '09:00');
  assert.equal(getNextScheduleTime(t0900).label, '19:00');
  assert.equal(getNextScheduleTime(t1900).label, '09:00');

  const dir = mkdtempSync(join(tmpdir(), 'agy-upd-sched-'));
  try {
    let nowMs = new Date(2026, 10, 28, 10, 30, 0).getTime(); // missed 09:00
    let autoCheck = true;
    let calls = 0;
    const updater = createUpdater({
      pluginDir: join(dir, 'plugin'),
      currentVersion: '2.0.2',
      statePath: join(dir, 'update_state.json'),
      getPrefs: () => ({ updateChannel: 'stable', autoCheckUpdates: autoCheck }),
      now: () => nowMs,
      fetchImpl: async () => {
        calls++;
        return new Response(JSON.stringify([
          { tag_name: 'v2.0.3', prerelease: false, draft: false, assets: [{ name: 'agy-prism-ui-v2.0.3.zip', browser_download_url: 'https://github.com/Chiron-404/agy-prism-ui/releases/download/v2.0.3/agy-prism-ui-v2.0.3.zip', digest: 'sha256:' + '1'.repeat(64) }] },
        ]), { status: 200 });
      },
    });

    assert.equal(await updater.maybeRunScheduledCheck(), true);
    assert.equal(calls, 1);
    assert.equal(updater.getStatus().updateAvailable, true);
    assert.equal(updater.getStatus().latest.tag, 'v2.0.3');

    // Same 09:00 slot -> skipped
    assert.equal(await updater.maybeRunScheduledCheck(), false);
    assert.equal(calls, 1);

    // Cross 19:00 with autoCheckUpdates = false -> skipped
    nowMs = new Date(2026, 10, 28, 19, 5, 0).getTime();
    autoCheck = false;
    assert.equal(await updater.maybeRunScheduledCheck(), false);
    assert.equal(calls, 1);

    // Re-enable -> runs immediately
    autoCheck = true;
    assert.equal(await updater.maybeRunScheduledCheck(), true);
    assert.equal(calls, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('extractZipBuffer rejects path traversal, symlinks, and oversized archives while extracting Store & Deflate', () => {
  const dir = mkdtempSync(join(tmpdir(), 'agy-zip-'));
  try {
    const goodZip = buildTestZip([
      { name: 'agy-prism-ui/plugin.json', content: '{"version":"2.0.3"}', deflate: true },
      { name: 'agy-prism-ui/plain.txt', content: 'ok', deflate: false },
    ]);
    const outGood = join(dir, 'good');
    const res = extractZipBuffer(goodZip, outGood);
    assert.equal(res.files, 2);
    assert.equal(readFileSync(join(outGood, 'agy-prism-ui', 'plain.txt'), 'utf8'), 'ok');

    const evilZip = buildTestZip([{ name: '../escape.txt', content: 'bad', deflate: false }]);
    assert.throws(() => extractZipBuffer(evilZip, join(dir, 'evil')), /traversal|Unsafe/i);

    const symlinkZip = buildTestZip([{ name: 'link', content: '/etc/passwd', extAttrs: (0o120777 << 16) >>> 0 }]);
    assert.throws(() => extractZipBuffer(symlinkZip, join(dir, 'sym')), /symlink/i);

    assert.throws(() => extractZipBuffer(goodZip, join(dir, 'cap'), { maxBytes: 5 }), /size exceeds/i);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('applyUpdate performs SHA-256 verification, atomic swap, Windows non-ASCII sidecar preservation, and rollback on failure', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'agy-apply-'));
  try {
    const pluginDir = join(dir, 'plugins', 'agy-prism-ui');
    mkdirSync(join(pluginDir, 'sidecars', 'agy_prism_ui'), { recursive: true });
    writeFileSync(join(pluginDir, 'plugin.json'), '{"version":"2.0.2"}');
    writeFileSync(join(pluginDir, 'obsolete.txt'), 'old-file');
    writeFileSync(join(pluginDir, 'sidecars', 'agy_prism_ui', 'sidecar.json'), JSON.stringify({
      command: process.execPath,
      args: ['--import=file:///C:/nonascii/register_loader.js', 'server.mjs'],
      env: { ELECTRON_RUN_AS_NODE: '1' },
    }));
    writeFileSync(join(pluginDir, 'sidecars', 'agy_prism_ui', 'server.mjs'), '// v2.0.2');

    const pkgZip = buildTestZip([
      { name: 'agy-prism-ui-v2.0.3/agy-prism-ui/plugin.json', content: '{"version":"2.0.3"}', deflate: true },
      { name: 'agy-prism-ui-v2.0.3/agy-prism-ui/sidecars/agy_prism_ui/sidecar.json', content: JSON.stringify({ command: 'node', args: ['server.mjs'] }), deflate: true },
      { name: 'agy-prism-ui-v2.0.3/agy-prism-ui/sidecars/agy_prism_ui/server.mjs', content: '// v2.0.3', deflate: true },
      { name: 'agy-prism-ui-v2.0.3/agy-prism-ui/sidecars/agy_prism_ui/newmod.mjs', content: 'export const x = 1;', deflate: false },
    ]);
    const sha = createHash('sha256').update(pkgZip).digest('hex');

    let appliedTag = '';
    const updater = createUpdater({
      pluginDir,
      currentVersion: '2.0.2',
      statePath: join(dir, 'update_state.json'),
      getPrefs: () => ({ updateChannel: 'stable', autoCheckUpdates: true }),
      onUpdateApplied: (tag) => { appliedTag = tag; },
      restartDelayMs: 10,
      windowsSidecarOptions: { platform: 'win32', appData: join(dir, 'missing-appdata'), userProfile: dir },
      fetchImpl: async (url) => {
        if (url.includes('/releases?')) {
          return new Response(JSON.stringify([
            {
              tag_name: 'v2.0.3',
              prerelease: false,
              draft: false,
              body: 'New features',
              assets: [{ name: 'agy-prism-ui-v2.0.3.zip', size: pkgZip.length, browser_download_url: 'https://github.com/Chiron-404/agy-prism-ui/releases/download/v2.0.3/agy-prism-ui-v2.0.3.zip', digest: `sha256:${sha}` }],
            },
          ]), { status: 200 });
        }
        return new Response(pkgZip, { status: 200 });
      },
    });

    const status = await updater.applyUpdate({ channel: 'stable' });
    assert.equal(status.state, 'applied');
    assert.equal(JSON.parse(readFileSync(join(pluginDir, 'plugin.json'), 'utf8')).version, '2.0.3');
    assert.equal(readFileSync(join(pluginDir, 'sidecars', 'agy_prism_ui', 'newmod.mjs'), 'utf8'), 'export const x = 1;');
    assert.equal(existsSync(join(pluginDir, 'obsolete.txt')), false);
    assert.equal(existsSync(join(pluginDir, '.update-in-progress')), false);
    // Preserved ELECTRON_RUN_AS_NODE custom sidecar command fallback
    const installedSidecar = JSON.parse(readFileSync(join(pluginDir, 'sidecars', 'agy_prism_ui', 'sidecar.json'), 'utf8'));
    assert.equal(installedSidecar.command, process.execPath);
    assert.equal(installedSidecar.env.ELECTRON_RUN_AS_NODE, '1');
    await new Promise(r => setTimeout(r, 30));
    assert.equal(appliedTag, 'v2.0.3');

    // SHA-256 mismatch must fail cleanly without touching pluginDir
    const badUpdater = createUpdater({
      pluginDir,
      currentVersion: '2.0.3',
      statePath: join(dir, 'update_state_bad.json'),
      getPrefs: () => ({ updateChannel: 'preview', autoCheckUpdates: true }),
      fetchImpl: async (url) => {
        if (url.includes('/releases?')) {
          return new Response(JSON.stringify([
            {
              tag_name: 'v2.1.0-beta.1',
              prerelease: true,
              draft: false,
              assets: [{ name: 'bad.zip', size: pkgZip.length, browser_download_url: 'https://github.com/Chiron-404/agy-prism-ui/releases/download/v2.1.0-beta.1/bad.zip', digest: 'sha256:' + '0'.repeat(64) }],
            },
          ]), { status: 200 });
        }
        return new Response(pkgZip, { status: 200 });
      },
    });
    await assert.rejects(() => badUpdater.applyUpdate({ channel: 'preview' }), /SHA-256/i);
    assert.equal(JSON.parse(readFileSync(join(pluginDir, 'plugin.json'), 'utf8')).version, '2.0.3');

    // Corrupted archive missing server.mjs must fail cleanly
    const incompleteZip = buildTestZip([
      { name: 'agy-prism-ui/plugin.json', content: '{"version":"9.9.9"}' },
    ]);
    const incSha = createHash('sha256').update(incompleteZip).digest('hex');
    const incUpdater = createUpdater({
      pluginDir,
      currentVersion: '2.0.3',
      statePath: join(dir, 'update_state_inc.json'),
      getPrefs: () => ({ updateChannel: 'dev', autoCheckUpdates: true }),
      fetchImpl: async (url) => {
        if (url.includes('/releases?')) {
          return new Response(JSON.stringify([
            {
              tag_name: 'v2.0.4-dev',
              prerelease: true,
              draft: false,
              assets: [{ name: 'inc.zip', size: incompleteZip.length, browser_download_url: 'https://github.com/Chiron-404/agy-prism-ui/releases/download/v2.0.4-dev/inc.zip', digest: `sha256:${incSha}` }],
            },
          ]), { status: 200 });
        }
        return new Response(incompleteZip, { status: 200 });
      },
    });
    await assert.rejects(() => incUpdater.applyUpdate({ channel: 'dev' }), /missing required file/i);
    assert.equal(JSON.parse(readFileSync(join(pluginDir, 'plugin.json'), 'utf8')).version, '2.0.3');

    // Direct helper check for applyWindowsNonAsciiSidecarFix
    assert.equal(typeof applyWindowsNonAsciiSidecarFix, 'function');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('parseReleasesAtom and checkForUpdates handle 403 fallback, ETag 304, all-channel slots, and failure backoff', async () => {
  const shaStable = 'a'.repeat(64);
  const shaDev = 'b'.repeat(64);
  const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <link rel="alternate" type="text/html" href="https://github.com/Chiron-404/agy-prism-ui/releases/tag/v2.0.3"/>
    <title>Agy Prism UI v2.0.3</title>
    <updated>2026-11-28T04:26:40Z</updated>
    <content type="html">&lt;blockquote&gt;&lt;p&gt;Provenance credit&lt;/p&gt;&lt;/blockquote&gt;&lt;ul&gt;&lt;li&gt;&lt;strong&gt;Hover fix&lt;/strong&gt;: native emphasis&lt;/li&gt;&lt;/ul&gt;&lt;p&gt;Archive: &lt;code&gt;agy-prism-ui-v2.0.3.zip&lt;/code&gt; SHA-256: &lt;code&gt;${shaStable}&lt;/code&gt;&lt;/p&gt;</content>
  </entry>
  <entry>
    <link rel="alternate" type="text/html" href="https://github.com/Chiron-404/agy-prism-ui/releases/tag/v2.0.3-dev"/>
    <title>Agy Prism UI v2.0.3-dev</title>
    <updated>2026-11-28T04:34:39Z</updated>
    <content type="html">&lt;ul&gt;&lt;li&gt;&lt;strong&gt;Dev channel&lt;/strong&gt;: extension bus&lt;/li&gt;&lt;/ul&gt;&lt;p&gt;Archive: &lt;code&gt;agy-prism-ui-v2.0.3-dev.zip&lt;/code&gt; SHA-256: &lt;code&gt;${shaDev}&lt;/code&gt;&lt;/p&gt;</content>
  </entry>
</feed>`;

  const parsedAtom = parseReleasesAtom(atomXml);
  assert.equal(parsedAtom.length, 2);
  const stablePick = selectReleaseForChannel(parsedAtom, 'stable');
  const devPick = selectReleaseForChannel(parsedAtom, 'dev');
  assert.equal(stablePick.tag, 'v2.0.3');
  assert.equal(stablePick.sha256, shaStable);
  assert.equal(stablePick.prerelease, false);
  assert.equal(stablePick.assetName, 'agy-prism-ui-v2.0.3.zip');
  assert.equal(devPick.tag, 'v2.0.3-dev');
  assert.equal(devPick.sha256, shaDev);
  assert.equal(devPick.prerelease, true);
  assert.equal(devPick.downloadUrl, 'https://github.com/Chiron-404/agy-prism-ui/releases/download/v2.0.3-dev/agy-prism-ui-v2.0.3-dev.zip');
  assert.ok(stablePick.summary.includes('Hover fix: native emphasis'));
  assert.ok(!stablePick.summary.includes('Provenance credit'));

  const dir = mkdtempSync(join(tmpdir(), 'agy-atom-'));
  try {
    let channel = 'stable';
    let nowMs = new Date(2026, 10, 28, 10, 0, 0).getTime();
    let mode = 'api-403';
    const seenIfNoneMatch = [];
    let fetchCount = 0;

    const updater = createUpdater({
      pluginDir: join(dir, 'plugin'),
      currentVersion: '2.0.3',
      statePath: join(dir, 'update_state.json'),
      getPrefs: () => ({ updateChannel: channel, autoCheckUpdates: true }),
      now: () => nowMs,
      fetchImpl: async (url, init = {}) => {
        fetchCount++;
        if (url.includes('/releases.atom')) {
          if (mode === 'both-fail') return new Response('unavailable', { status: 503 });
          return new Response(atomXml, { status: 200, headers: { 'Content-Type': 'application/atom+xml' } });
        }
        seenIfNoneMatch.push(init?.headers?.['If-None-Match'] || '');
        if (mode === 'api-403') {
          return new Response('rate limit', { status: 403, headers: { 'x-ratelimit-reset': String(Math.floor((nowMs + 3600_000) / 1000)) } });
        }
        if (mode === 'api-200') {
          return new Response(JSON.stringify([
            { tag_name: 'v2.0.3', prerelease: false, draft: false, assets: [{ name: 'agy-prism-ui-v2.0.3.zip', browser_download_url: 'https://github.com/Chiron-404/agy-prism-ui/releases/download/v2.0.3/agy-prism-ui-v2.0.3.zip', digest: `sha256:${shaStable}` }] },
          ]), { status: 200, headers: { etag: 'W/"etag-v203"' } });
        }
        if (mode === 'api-304') {
          return new Response(null, { status: 304 });
        }
        return new Response('err', { status: 500 });
      },
    });

    // 1) REST API 403 transparently falls back to releases.atom and clears error
    const s1 = await updater.checkForUpdates({ channel: 'dev', manual: true });
    assert.equal(s1.state, 'available');
    assert.equal(s1.actionKind, 'switch');
    assert.equal(s1.error, '');
    assert.equal(s1.latest.tag, 'v2.0.3-dev');
    assert.equal(s1.latest.sha256, shaDev);

    // Switching channel within same slot skips redundant scheduled check
    channel = 'stable';
    assert.equal(await updater.maybeRunScheduledCheck(), false);

    // 2) ETag 200 -> 304 saves quota & preserves cached release
    mode = 'api-200';
    nowMs += 120_000;
    const s2 = await updater.checkForUpdates({ channel: 'stable', manual: true });
    assert.equal(s2.state, 'up-to-date');
    assert.equal(s2.latest.tag, 'v2.0.3');

    mode = 'api-304';
    nowMs += 120_000;
    const s3 = await updater.checkForUpdates({ channel: 'stable', manual: true });
    assert.equal(seenIfNoneMatch.at(-1), 'W/"etag-v203"');
    assert.equal(s3.state, 'up-to-date');
    assert.equal(s3.latest.tag, 'v2.0.3');

    // 3) Both REST API and Atom fail -> 15-min backoff blocks immediate retry
    mode = 'both-fail';
    nowMs = new Date(2026, 10, 28, 19, 5, 0).getTime();
    const s4 = await updater.checkForUpdates({ channel: 'stable', manual: true });
    assert.equal(s4.state, 'error');
    assert.ok(s4.error.includes('403') || s4.error.includes('500'));
    const countAfterFail = fetchCount;
    assert.equal(await updater.maybeRunScheduledCheck(), false);
    assert.equal(fetchCount, countAfterFail);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
