import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { startDeckInjector } from '../agy-prism-ui/sidecars/agy_prism_ui/deck_injector.mjs';
import { UI_HTML } from '../agy-prism-ui/sidecars/agy_prism_ui/server.mjs';
import { createPresentation } from '../agy-prism-ui/sidecars/agy_prism_ui/ui.mjs';

test('injector reports whether the debugging port is missing, unreachable or ok', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'agy-cdp-state-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const portFile = join(dir, 'DevToolsActivePort');
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  const originalLog = console.log;
  console.error = console.log = () => {};
  t.after(() => { globalThis.fetch = originalFetch; console.error = originalError; console.log = originalLog; });

  const injector = startDeckInjector(async () => ({}), { portFile });
  t.after(() => injector.stop());
  assert.equal(injector.status(), 'unknown');
  await injector.tick();
  assert.equal(injector.status(), 'missing');

  writeFileSync(portFile, '9\n/devtools/browser/x\n');
  globalThis.fetch = async () => { throw new Error('connect ECONNREFUSED'); };
  await injector.tick();
  assert.equal(injector.status(), 'unreachable');

  globalThis.fetch = async () => ({ ok: true, json: async () => [] });
  await injector.tick();
  assert.equal(injector.status(), 'ok');
});

test('sidebar ships the CDP notice on both tabs with the script command and translated strings', () => {
  assert.match(UI_HTML, /id="cdp-notice"[^>]*hidden/);
  assert.ok(UI_HTML.includes('-File scripts\\enable-cdp.ps1'), 'backslash must survive the template literal');
  assert.ok(UI_HTML.includes('--remote-debugging-port=0'));
  assert.match(UI_HTML, /\['missing', 'unreachable'\]\.includes\(lastData\?\.deckCdp\)/);
  const notice = UI_HTML.indexOf('id="cdp-notice"');
  assert.ok(notice > 0 && notice < UI_HTML.indexOf('id="sidebar-stats"'), 'notice sits above both tabs, so settings shows it too');
  const { dictionaries } = createPresentation();
  for (const language of ['en', 'zh-CN', 'zh-TW']) {
    for (const key of ['cdpTitle', 'cdpBody', 'cdpHow', 'cdpScript', 'cdpManual', 'cdpRestart']) {
      assert.ok(dictionaries[language][key], `${language}.${key}`);
    }
  }
});

test('enable-cdp.ps1 adds and removes the switch only on Antigravity shortcuts', { skip: process.platform !== 'win32' }, t => {
  const root = mkdtempSync(join(tmpdir(), 'agy enable cdp '));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const appDir = join(root, 'antigravity');
  const startMenu = join(root, 'Start Menu', 'Programs');
  const taskbar = join(root, 'TaskBar');
  mkdirSync(appDir, { recursive: true });
  mkdirSync(startMenu, { recursive: true });
  mkdirSync(taskbar, { recursive: true });
  const exe = join(appDir, 'Antigravity.exe');
  writeFileSync(exe, '');
  writeFileSync(join(appDir, 'Uninstall Antigravity.exe'), '');
  const ps = command => spawnSync('powershell.exe', ['-NoProfile', '-Command', command], { encoding: 'utf8' });
  const q = value => `'${value.replace(/'/g, "''")}'`;
  const make = (file, target, args) => {
    const r = ps(`$l=(New-Object -ComObject WScript.Shell).CreateShortcut(${q(file)});$l.TargetPath=${q(target)};$l.Arguments=${q(args)};$l.Save()`);
    assert.equal(r.status, 0, r.stderr);
  };
  const args = file => ps(`(New-Object -ComObject WScript.Shell).CreateShortcut(${q(file)}).Arguments`).stdout.trim();
  const plain = join(startMenu, 'Antigravity.lnk');
  const withArgs = join(taskbar, 'Antigravity.lnk');
  const other = join(startMenu, 'Uninstall.lnk');
  make(plain, exe, '');
  make(withArgs, exe, '--disable-gpu');
  make(other, join(appDir, 'Uninstall Antigravity.exe'), '');

  const script = fileURLToPath(new URL('../scripts/enable-cdp.ps1', import.meta.url));
  const run = (...extra) => {
    const r = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', `& ${q(script)} -ShortcutDirectories ${q(startMenu)},${q(taskbar)} ${extra.join(' ')}; exit $LASTEXITCODE`], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    return r.stdout;
  };
  // install.bat path: without an interactive yes nothing changes, and the install still succeeds.
  assert.match(run('-Ask'), /Not interactive, skipped/);
  assert.equal(args(plain), '');
  run();
  assert.equal(args(plain), '--remote-debugging-port=0');
  assert.equal(run('-Ask').trim(), '', 'no prompt once every shortcut has the switch');
  assert.equal(args(withArgs), '--disable-gpu --remote-debugging-port=0');
  assert.equal(args(other), '');
  assert.match(run(), /Already set/);
  assert.equal(args(plain), '--remote-debugging-port=0', 'running twice must not duplicate the switch');
  run('-Undo');
  assert.equal(args(plain), '');
  assert.equal(args(withArgs), '--disable-gpu');
});
