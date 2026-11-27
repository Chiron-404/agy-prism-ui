import { DatabaseSync } from 'node:sqlite';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';

function readVarint(buf, offset) {
  let val = 0n;
  let shift = 0n;
  let i = offset;
  while (i < buf.length) {
    const b = buf[i++];
    val |= BigInt(b & 0x7f) << shift;
    if ((b & 0x80) === 0) return [Number(val), i];
    shift += 7n;
  }
  return [Number(val), i];
}

function parsePbMap(buf) {
  const fields = new Map();
  let i = 0;
  while (i < buf.length) {
    try {
      const [tag, nextI] = readVarint(buf, i);
      i = nextI;
      const fn = tag >>> 3;
      const wt = tag & 7;
      if (fn === 0) break;
      if (!fields.has(fn)) fields.set(fn, []);
      if (wt === 0) {
        const [val, nI] = readVarint(buf, i);
        i = nI;
        fields.get(fn).push(val);
      } else if (wt === 2) {
        const [len, nI] = readVarint(buf, i);
        i = nI;
        if (len < 0 || i + len > buf.length) break;
        fields.get(fn).push(buf.subarray(i, i + len));
        i += len;
      } else if (wt === 5) {
        fields.get(fn).push(buf.subarray(i, i + 4));
        i += 4;
      } else if (wt === 1) {
        fields.get(fn).push(buf.subarray(i, i + 8));
        i += 8;
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  return fields;
}

export const PRICING_RULES = Object.freeze({
  'gemini-4-neon': {
    inputPerM: 2.5,
    cacheReadPerM: 0.25,
    outputPerM: 15.0,
    above200k: { inputPerM: 5.0, cacheReadPerM: 0.5, outputPerM: 22.5 },
  },
  'gemini-4-argon': {
    inputPerM: 2.0,
    cacheReadPerM: 0.1,
    outputPerM: 10.0,
  },
  'gemini-4-carbon': {
    inputPerM: 2.5,
    cacheReadPerM: 0.25,
    outputPerM: 15.0,
    above200k: { inputPerM: 5.0, cacheReadPerM: 0.5, outputPerM: 22.5 },
  },
  'gemini-4-hydrogen': {
    inputPerM: 0.75,
    cacheReadPerM: 0.075,
    outputPerM: 3.75,
  },
  'claude-opus': {
    inputPerM: 15.0,
    cacheReadPerM: 1.5,
    outputPerM: 75.0,
  },
  'claude-sonnet': {
    inputPerM: 3.0,
    cacheReadPerM: 0.3,
    outputPerM: 15.0,
  },
  'gpt': {
    inputPerM: 1.5,
    cacheReadPerM: 0.15,
    outputPerM: 6.0,
  },
});

function matchPricingRule(modelId = '', modelName = '') {
  const tag = `${modelId} ${modelName}`.toLowerCase();
  if (tag.includes('neon')) return PRICING_RULES['gemini-4-neon'];
  if (tag.includes('argon')) return PRICING_RULES['gemini-4-argon'];
  if (tag.includes('hydrogen') || tag.includes('flash')) return PRICING_RULES['gemini-4-hydrogen'];
  if (tag.includes('carbon')) return PRICING_RULES['gemini-4-carbon'];
  if (tag.includes('opus')) return PRICING_RULES['claude-opus'];
  if (tag.includes('sonnet')) return PRICING_RULES['claude-sonnet'];
  if (tag.includes('gpt') || tag.includes('codex')) return PRICING_RULES['gpt'];
  if (tag.includes('orchestrator')) return PRICING_RULES['gemini-4-carbon'];
  return null;
}

export function estimateRequestCostUsd(modelId = '', modelName = '', { uncachedIn = 0, cachedIn = 0, totalOut = 0 } = {}) {
  const rule = matchPricingRule(modelId, modelName);
  if (!rule) return 0;
  const promptTotal = Math.max(0, Number(uncachedIn) || 0) + Math.max(0, Number(cachedIn) || 0);
  const rates = rule.above200k && promptTotal > 200_000 ? rule.above200k : rule;
  return (
    (Math.max(0, Number(uncachedIn) || 0) / 1e6) * rates.inputPerM
    + (Math.max(0, Number(cachedIn) || 0) / 1e6) * rates.cacheReadPerM
    + (Math.max(0, Number(totalOut) || 0) / 1e6) * rates.outputPerM
  );
}

function toLocalDayKey(ms) {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dateFromDayKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dayKeyFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fileStamp(path) {
  try {
    const s = statSync(path);
    const w = existsSync(path + '-wal') ? statSync(path + '-wal') : null;
    return `${s.mtimeMs}:${s.size}:${w ? `${w.mtimeMs}:${w.size}` : ''}`;
  } catch {
    return '';
  }
}

export function readConversationHeatmapRecord(dbPath, source = 'app', subagentIds = new Set()) {
  const id = basename(dbPath, '.db');
  let fallbackMs = 0;
  try { fallbackMs = statSync(dbPath).mtimeMs; } catch { fallbackMs = Date.now(); }

  let db;
  try {
    db = new DatabaseSync(dbPath, { readOnly: true, timeout: 1000 });
    const hasGen = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='gen_metadata'").get();
    if (!hasGen) return null;
    const gens = db.prepare('SELECT idx, data FROM gen_metadata ORDER BY idx').all();
    if (!gens.length) return null;

    let isSubagent = subagentIds.has(id);
    if (!isSubagent) {
      try {
        const pr = db.prepare('SELECT 1 FROM parent_references LIMIT 1').get();
        if (pr) isSubagent = true;
      } catch {}
    }

    const stepTs = new Map();
    try {
      for (const s of db.prepare('SELECT idx, metadata FROM steps').all()) {
        if (!s.metadata) continue;
        const sm = parsePbMap(Buffer.from(s.metadata));
        if (sm.has(1)) {
          const ts = parsePbMap(sm.get(1)[0]).get(1)?.[0];
          if (ts) stepTs.set(s.idx, ts * 1000);
        }
      }
    } catch {}

    const days = Object.create(null);
    let hasUsage = false;

    for (const row of gens) {
      const top = parsePbMap(Buffer.from(row.data || []));
      if (!top.has(1)) continue;
      const m1 = parsePbMap(top.get(1)[0]);
      if (!m1.has(4)) continue;
      const u = parsePbMap(m1.get(4)[0]);
      const uncachedIn = u.get(2)?.[0] || 0;
      const cachedIn = u.get(5)?.[0] || 0;
      const thinkTokens = u.get(9)?.[0] || 0;
      const replyTokens = u.get(10)?.[0] || 0;
      const totalOut = u.get(3)?.[0] || (thinkTokens + replyTokens);
      if (uncachedIn + cachedIn + totalOut === 0) continue;

      hasUsage = true;
      const modelId = m1.has(19) && Buffer.isBuffer(m1.get(19)[0]) ? m1.get(19)[0].toString('utf8').trim() : '';
      const modelName = m1.has(21) && Buffer.isBuffer(m1.get(21)[0]) ? m1.get(21)[0].toString('utf8').trim() : '';
      const costUsd = estimateRequestCostUsd(modelId, modelName, { uncachedIn, cachedIn, totalOut });

      let tsMs = 0;
      for (const v of top.get(2) || []) {
        if (typeof v === 'number') {
          if (stepTs.has(v)) { tsMs = stepTs.get(v); break; }
        } else if (Buffer.isBuffer(v)) {
          for (let offset = 0; offset < v.length;) {
            const [stepIdx, next] = readVarint(v, offset);
            offset = next;
            if (stepTs.has(stepIdx)) { tsMs = stepTs.get(stepIdx); break; }
          }
          if (tsMs) break;
        }
      }
      if (!tsMs) tsMs = fallbackMs;

      const dayKey = toLocalDayKey(tsMs);
      const bucket = days[dayKey] || (days[dayKey] = { in: 0, cache: 0, out: 0, think: 0, total: 0, costUsd: 0, reqs: 0 });
      bucket.in += uncachedIn;
      bucket.cache += cachedIn;
      bucket.out += totalOut;
      bucket.think += thinkTokens;
      bucket.total += uncachedIn + cachedIn + totalOut;
      bucket.costUsd += costUsd;
      bucket.reqs += 1;
    }

    if (!hasUsage) return null;
    return { id, source, isSubagent, days };
  } catch {
    return undefined;
  } finally {
    try { db?.close(); } catch {}
  }
}

function aggregateBucket(records, nowMs) {
  let totalTokens = 0;
  let inputTokens = 0;
  let cacheTokens = 0;
  let outputTokens = 0;
  let thinkingTokens = 0;
  let totalCostUsd = 0;
  let requestCount = 0;
  let conversationCount = 0;
  let mainCount = 0;
  let subagentCount = 0;

  const dayMap = new Map();

  for (const rec of records) {
    if (!rec || !rec.days) continue;
    const dayEntries = Object.entries(rec.days);
    if (dayEntries.length === 0) continue;
    conversationCount++;
    if (rec.isSubagent) subagentCount++;
    else mainCount++;

    for (const [dayKey, d] of dayEntries) {
      const inTok = d.in || 0;
      const cacheTok = d.cache || 0;
      const outTok = d.out || 0;
      const thinkTok = d.think || 0;
      const totTok = d.total ?? (inTok + cacheTok + outTok);
      const usd = d.costUsd || 0;
      const reqs = d.reqs || 0;

      inputTokens += inTok;
      cacheTokens += cacheTok;
      outputTokens += outTok;
      thinkingTokens += thinkTok;
      totalTokens += totTok;
      totalCostUsd += usd;
      requestCount += reqs;

      let agg = dayMap.get(dayKey);
      if (!agg) {
        agg = { in: 0, cache: 0, out: 0, think: 0, total: 0, costUsd: 0, reqs: 0, convs: 0 };
        dayMap.set(dayKey, agg);
      }
      agg.in += inTok;
      agg.cache += cacheTok;
      agg.out += outTok;
      agg.think += thinkTok;
      agg.total += totTok;
      agg.costUsd += usd;
      agg.reqs += reqs;
      agg.convs += 1;
    }
  }

  const promptTokens = inputTokens + cacheTokens;
  const cacheHitRate = promptTokens > 0 ? (cacheTokens / promptTokens) * 100 : 0;

  const nowDate = new Date(nowMs);
  const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  const todayKey = dayKeyFromDate(today);
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const yesterdayKey = dayKeyFromDate(yesterday);

  // Activity metrics across all recorded days
  const activeKeys = [...dayMap.entries()]
    .filter(([, v]) => v.total > 0)
    .map(([k]) => k)
    .sort();
  const activeSet = new Set(activeKeys);
  const activeDays = activeKeys.length;

  let currentStreak = 0;
  let cursor = activeSet.has(todayKey)
    ? new Date(today.getTime())
    : activeSet.has(yesterdayKey)
      ? new Date(yesterday.getTime())
      : null;
  while (cursor && activeSet.has(dayKeyFromDate(cursor))) {
    currentStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  let longestStreak = 0;
  let run = 0;
  let prevDayMs = null;
  for (const key of activeKeys) {
    const dt = dateFromDayKey(key);
    const ms = dt.getTime();
    if (prevDayMs !== null && Math.round((ms - prevDayMs) / 86_400_000) === 1) {
      run++;
    } else {
      run = 1;
    }
    if (run > longestStreak) longestStreak = run;
    prevDayMs = ms;
  }

  let peakDay = null;
  for (const [key, v] of dayMap.entries()) {
    if (!peakDay || v.total > peakDay.t) {
      peakDay = {
        d: key,
        t: v.total,
        i: v.in,
        c: v.cache,
        o: v.out,
        n: v.convs,
        usd: Number(v.costUsd.toFixed(2)),
      };
    }
  }

  // 52-week grid: Sunday-aligned start, ending on current week's Saturday (52 * 7 = 364 days)
  const dowSun = today.getDay();
  const endSaturday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - dowSun));
  const startSunday = new Date(endSaturday.getFullYear(), endSaturday.getMonth(), endSaturday.getDate() - 363);

  const windowCells = [];
  const positiveTotals = [];
  for (let idx = 0; idx < 364; idx++) {
    const cellDate = new Date(startSunday.getFullYear(), startSunday.getMonth(), startSunday.getDate() + idx);
    const key = dayKeyFromDate(cellDate);
    const isFuture = cellDate.getTime() > today.getTime();
    const bucket = !isFuture ? dayMap.get(key) : null;
    const total = bucket?.total || 0;
    if (total > 0) positiveTotals.push(total);
    windowCells.push({
      d: key,
      dow: idx % 7,
      t: total,
      i: bucket?.in || 0,
      c: bucket?.cache || 0,
      o: bucket?.out || 0,
      th: bucket?.think || 0,
      n: bucket?.convs || 0,
      r: bucket?.reqs || 0,
      usd: bucket ? Number(bucket.costUsd.toFixed(2)) : 0,
      l: 0,
      ...(isFuture ? { f: 1 } : {}),
    });
  }

  if (positiveTotals.length > 0) {
    positiveTotals.sort((a, b) => a - b);
    const maxVal = positiveTotals[positiveTotals.length - 1];
    const p95 = positiveTotals[Math.min(positiveTotals.length - 1, Math.floor((positiveTotals.length - 1) * 0.95))];
    const refMax = Math.max(1, positiveTotals.length >= 10
      ? Math.min(maxVal, Math.max(p95 * 1.35, maxVal * 0.55))
      : maxVal);
    for (const cell of windowCells) {
      if (cell.f || cell.t <= 0) {
        cell.l = 0;
      } else {
        const score = Math.sqrt(Math.min(1, cell.t / refMax));
        if (score <= 0.28) cell.l = 1;
        else if (score <= 0.46) cell.l = 2;
        else if (score <= 0.66) cell.l = 3;
        else if (score <= 0.85) cell.l = 4;
        else cell.l = 5;
      }
    }
  }

  // Last 14 calendar days
  const last14Days = [];
  for (let offset = 13; offset >= 0; offset--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const key = dayKeyFromDate(d);
    const bucket = dayMap.get(key);
    last14Days.push({
      d: key,
      label: key.slice(5),
      t: bucket?.total || 0,
      i: bucket?.in || 0,
      c: bucket?.cache || 0,
      o: bucket?.out || 0,
      n: bucket?.convs || 0,
      usd: bucket ? Number(bucket.costUsd.toFixed(2)) : 0,
    });
  }

  // Monthly rollup for the last 12 months with running cumulative sum across all history
  const monthMap = new Map();
  for (const [key, v] of dayMap.entries()) {
    const mk = key.slice(0, 7);
    const prev = monthMap.get(mk) || { t: 0, usd: 0, reqs: 0, convs: 0 };
    prev.t += v.total;
    prev.usd += v.costUsd;
    prev.reqs += v.reqs;
    prev.convs += v.convs;
    monthMap.set(mk, prev);
  }

  const windowMonths = [];
  for (let offset = 11; offset >= 0; offset--) {
    const d = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    windowMonths.push(mk);
  }
  const firstWindowMonth = windowMonths[0];
  let runningCum = 0;
  for (const [mk, v] of [...monthMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (mk < firstWindowMonth) runningCum += v.t;
  }
  const monthly = windowMonths.map(mk => {
    const v = monthMap.get(mk);
    const t = v?.t || 0;
    runningCum += t;
    return {
      m: mk,
      label: mk.slice(2),
      t,
      cum: runningCum,
      n: v?.convs || 0,
      usd: v ? Number(v.usd.toFixed(2)) : 0,
    };
  });

  return {
    totals: {
      totalTokens,
      inputTokens,
      cacheTokens,
      outputTokens,
      thinkingTokens,
      totalCostUsd: Number(totalCostUsd.toFixed(2)),
      cacheHitRate: Number(cacheHitRate.toFixed(1)),
      requestCount,
      conversationCount,
      mainCount,
      subagentCount,
    },
    activity: {
      activeDays,
      currentStreak,
      longestStreak,
      peakDay,
    },
    weeks52: {
      startDate: dayKeyFromDate(startSunday),
      endDate: dayKeyFromDate(endSaturday),
      days: windowCells,
    },
    last14Days,
    monthly,
  };
}

export function buildHeatmapData(records = [], nowMs = Date.now()) {
  const bySource = { app: [], ide: [], cli: [] };
  const byConversation = {};
  for (const r of records) {
    if (!r) continue;
    if (bySource[r.source]) bySource[r.source].push(r);
    if (r.id && r.days) {
      let t = 0;
      let i = 0;
      let c = 0;
      let o = 0;
      let reqs = 0;
      let usd = 0;
      for (const d of Object.values(r.days)) {
        t += d.total || 0;
        i += d.in || 0;
        c += d.cache || 0;
        o += d.out || 0;
        reqs += d.reqs || 0;
        usd += d.costUsd || 0;
      }
      if (t > 0) {
        byConversation[r.id] = {
          t,
          i,
          c,
          o,
          r: reqs,
          usd: Number(usd.toFixed(2)),
        };
      }
    }
  }
  const all = aggregateBucket(records, nowMs);
  const app = aggregateBucket(bySource.app, nowMs);
  const ide = aggregateBucket(bySource.ide, nowMs);
  const cli = aggregateBucket(bySource.cli, nowMs);
  return {
    generatedAt: nowMs,
    sources: { all, app, ide, cli },
    counts: {
      all: all.totals.conversationCount,
      app: app.totals.conversationCount,
      ide: ide.totals.conversationCount,
      cli: cli.totals.conversationCount,
    },
    byConversation,
  };
}

export function createHeatmapAggregator(options = {}) {
  const rootGemini = join(homedir(), '.gemini');
  const sources = options.sources || [
    { key: 'app', dir: join(rootGemini, 'antigravity', 'conversations') },
    { key: 'ide', dir: join(rootGemini, 'antigravity-ide', 'conversations') },
    { key: 'cli', dir: join(rootGemini, 'antigravity-cli', 'conversations') },
  ];
  const summariesPath = options.summariesPath ?? join(rootGemini, 'antigravity', 'conversation_summaries.db');
  const ttlMs = options.ttlMs ?? 15_000;

  const fileCache = new Map();
  let summaryStamp = '';
  let cachedSubagentIds = new Set();
  let lastSnapshot = null;
  let lastBuildAt = 0;

  function loadSubagentIds() {
    if (!summariesPath || !existsSync(summariesPath)) return cachedSubagentIds;
    const stamp = fileStamp(summariesPath);
    if (stamp && stamp === summaryStamp) return cachedSubagentIds;
    const ids = new Set();
    let db;
    try {
      db = new DatabaseSync(summariesPath, { readOnly: true, timeout: 1000 });
      try {
        for (const r of db.prepare("SELECT conversation_id FROM conversation_summaries WHERE parent_conversation_id != '' OR nesting_depth > 0").all()) {
          if (r.conversation_id) ids.add(r.conversation_id);
        }
      } catch {}
      try {
        for (const r of db.prepare('SELECT conversation_id FROM conversation_parents').all()) {
          if (r.conversation_id) ids.add(r.conversation_id);
        }
      } catch {}
      cachedSubagentIds = ids;
      summaryStamp = stamp;
    } catch {}
    finally { try { db?.close(); } catch {} }
    return cachedSubagentIds;
  }

  function getSnapshot({ force = false, nowMs = Date.now() } = {}) {
    if (!force && lastSnapshot && nowMs - lastBuildAt < ttlMs) {
      return lastSnapshot;
    }
    const subagentIds = loadSubagentIds();
    const seenPaths = new Set();
    const records = [];

    for (const { key, dir } of sources) {
      if (!dir || !existsSync(dir)) continue;
      let files;
      try {
        files = readdirSync(dir);
      } catch {
        continue;
      }
      for (const name of files) {
        if (!name.endsWith('.db')) continue;
        const full = join(dir, name);
        seenPaths.add(full);
        const stamp = fileStamp(full);
        if (!stamp) continue;
        const cached = fileCache.get(full);
        if (cached && cached.stamp === stamp) {
          if (cached.record) records.push(cached.record);
          continue;
        }
        const record = readConversationHeatmapRecord(full, key, subagentIds);
        if (record === undefined) {
          if (cached?.record) records.push(cached.record);
          continue;
        }
        fileCache.set(full, { stamp, record });
        if (record) records.push(record);
      }
    }

    for (const cachedPath of fileCache.keys()) {
      if (!seenPaths.has(cachedPath)) fileCache.delete(cachedPath);
    }

    lastSnapshot = buildHeatmapData(records, nowMs);
    lastBuildAt = nowMs;
    return lastSnapshot;
  }

  return {
    getSnapshot,
    clearCache: () => {
      fileCache.clear();
      summaryStamp = '';
      cachedSubagentIds = new Set();
      lastSnapshot = null;
      lastBuildAt = 0;
    },
  };
}
