// Session-wide request & turn history and fluctuation series derived from SQLite ground-truth.
import { summarizeGeneration } from './metrics.mjs';
import { summarizeTurnMetrics } from './turn_metrics.mjs';
import { classifyModelInfo, buildStepPhaseMap } from './model_routing.mjs';

const MAX_HISTORY_REQUESTS = 500;
const MAX_HISTORY_TURNS = 200;

export function summarizeConversationHistory(parsedRequests = [], allSteps = [], executors = [], cpRows = []) {
  const stepMap = new Map(allSteps.map(step => [step.idx, step]));
  const phaseByReqIndex = buildStepPhaseMap(parsedRequests, allSteps);
  const cpIndices = cpRows.map(row => row.idx).filter(Number.isFinite).sort((a, b) => a - b);
  const hasCheckpointBetween = (prevIdx, currIdx) =>
    prevIdx >= 0 && currIdx > prevIdx && cpIndices.some(cp => cp > prevIdx && cp <= currIdx);

  const requests = [];
  let prevContextTokens = 0;
  let prevStepIndex = -1;
  let peakContextTokens = 0;
  let compactionThresholdTokens = 0;
  let compactionCount = 0;
  let measuredOutput = 0;
  let measuredDuration = 0;
  let measuredStreamOutput = 0;
  let measuredStreamDuration = 0;
  let totalModelDurationSec = 0;
  let totalOutputTokens = 0;
  let totalThinkingTokens = 0;
  let totalReplyTokens = 0;
  let totalPromptTokens = 0;
  let totalCachedTokens = 0;
  let totalUncachedTokens = 0;
  let peakTps = null;
  let minTps = null;
  let peakStreamTps = null;

  for (const req of parsedRequests) {
    const gen = summarizeGeneration(req.generation);
    const hasContext = (req.contextTokens || 0) > 0;
    const hasOutput = gen.output !== null && gen.output > 0;
    const hasError = req.requestError && req.requestError.kind !== 'none';
    if (!hasContext && !hasOutput && !hasError) continue;

    if (req.compactionThresholdTokens > 0) {
      compactionThresholdTokens = req.compactionThresholdTokens;
    }

    const compacted =
      prevContextTokens > 0 &&
      hasContext &&
      (req.contextTokens < prevContextTokens * 0.7 || hasCheckpointBetween(prevStepIndex, req.lastStepIndex));

    if (compacted) compactionCount++;
    if (hasContext) {
      if (req.contextTokens > peakContextTokens) peakContextTokens = req.contextTokens;
      prevContextTokens = req.contextTokens;
      totalPromptTokens += req.contextTokens || 0;
      totalCachedTokens += req.cachedIn || 0;
      totalUncachedTokens += req.uncachedIn || 0;
    }
    if (req.lastStepIndex >= 0) prevStepIndex = req.lastStepIndex;

    if (gen.duration !== null && gen.duration > 0) {
      totalModelDurationSec += gen.duration;
    }

    let streamTps = null;
    if (gen.output !== null && gen.output > 0) {
      totalOutputTokens += gen.output;
      if (gen.thinking !== null) totalThinkingTokens += gen.thinking;
      if (gen.reply !== null) totalReplyTokens += gen.reply;
      if (gen.duration !== null && gen.duration > 0 && gen.tps !== null) {
        measuredOutput += gen.output;
        measuredDuration += gen.duration;
        if (peakTps === null || gen.tps > peakTps) peakTps = gen.tps;
        if (minTps === null || gen.tps < minTps) minTps = gen.tps;
      }
      if (gen.streaming !== null && gen.streaming >= 0.5) {
        streamTps = gen.output / gen.streaming;
        measuredStreamOutput += gen.output;
        measuredStreamDuration += gen.streaming;
        if (peakStreamTps === null || streamTps > peakStreamTps) peakStreamTps = streamTps;
      }
    }

    const responseStep = req.stepIndices
      ?.map(idx => stepMap.get(idx))
      .find(step => step?.step_type === 15);
    const atMs = responseStep?.recordedCompletedAtMs || responseStep?.completedAtMs || responseStep?.createdAtMs || null;
    const modelInfo = (req.modelName || req.modelId || req.modelNum)
      ? classifyModelInfo({
          modelNum: req.modelNum,
          modelId: req.modelId,
          modelName: req.modelName,
          configSlug: req.configSlug,
          workerModelNum: req.workerModelNum,
          phaseOverride: phaseByReqIndex.get(req.turn) || null,
        })
      : null;

    requests.push({
      requestIndex: req.turn,
      lastStepIndex: req.lastStepIndex,
      contextTokens: req.contextTokens || 0,
      cachedIn: req.cachedIn || 0,
      uncachedIn: req.uncachedIn || 0,
      maxContextTokens: req.maxContextTokens || 0,
      compactionThresholdTokens: req.compactionThresholdTokens || 0,
      output: gen.output,
      reply: gen.reply,
      thinking: gen.thinking,
      ttft: gen.ttft,
      streaming: gen.streaming,
      duration: gen.duration,
      tps: gen.tps,
      streamTps,
      compacted,
      errorKind: req.requestError?.kind || 'none',
      atMs: Number.isFinite(atMs) && atMs > 0 ? atMs : null,
      modelShort: modelInfo?.shortName || '',
      modelName: modelInfo?.displayName || '',
      modelPhase: modelInfo?.phase || 'direct',
      modelEffort: modelInfo?.effort || null,
      isOrchestrator: modelInfo?.isOrchestrator || false,
    });
  }

  // Group into user turns (step_type === 14).
  const userSteps = allSteps.filter(step => step.step_type === 14);
  const turns = [];
  let completedTurnsDurationSec = 0;
  let runningTurnStartedAtMs = null;

  for (let i = 0; i < userSteps.length; i++) {
    const u = userSteps[i];
    const nextUserIdx = i + 1 < userSteps.length ? userSteps[i + 1].idx : Infinity;
    const scopeSteps = allSteps
      .filter(step => step.idx >= u.idx && step.idx < nextUserIdx)
      .map(step => ({ ...step, completedAtMs: step.recordedCompletedAtMs ?? step.completedAtMs }));
    const scopeReqs = parsedRequests.filter(req => req.lastStepIndex >= u.idx && req.lastStepIndex < nextUserIdx);
    const scopeExecs = executors.filter(ex => ex.lastStepIndex >= u.idx && ex.lastStepIndex < nextUserIdx);

    const tm = summarizeTurnMetrics(scopeReqs, scopeSteps, u.idx, scopeExecs);
    if (!tm) continue;

    let turnPeakContext = 0;
    let turnMeasuredOut = 0;
    let turnMeasuredDur = 0;
    let turnStreamOut = 0;
    let turnStreamDur = 0;
    let turnModelDur = 0;
    const turnModelKeys = new Set();
    const turnModels = [];
    for (const r of scopeReqs) {
      if ((r.contextTokens || 0) > turnPeakContext) turnPeakContext = r.contextTokens;
      if (r.modelName || r.modelId || r.modelNum) {
        const mi = classifyModelInfo({
          modelNum: r.modelNum,
          modelId: r.modelId,
          modelName: r.modelName,
          configSlug: r.configSlug,
          workerModelNum: r.workerModelNum,
          phaseOverride: phaseByReqIndex.get(r.turn) || null,
        });
        const mk = `${mi.phase}|${mi.shortName}|${mi.effort || ''}`;
        if (!turnModelKeys.has(mk)) {
          turnModelKeys.add(mk);
          turnModels.push({ shortName: mi.shortName, phase: mi.phase, effort: mi.effort, isOrchestrator: mi.isOrchestrator });
        }
      }
      const g = summarizeGeneration(r.generation);
      if (g.duration !== null && g.duration > 0) {
        turnModelDur += g.duration;
        if (g.output !== null && g.output > 0) {
          turnMeasuredOut += g.output;
          turnMeasuredDur += g.duration;
        }
      }
      if (g.output !== null && g.output > 0 && g.streaming !== null && g.streaming >= 0.5) {
        turnStreamOut += g.output;
        turnStreamDur += g.streaming;
      }
    }

    const isLastTurn = i === userSteps.length - 1;
    let durationSec = tm.duration;
    if (durationSec === null && !isLastTurn && tm.startedAtMs) {
      // Fallback for historical turns without an executor record: use last step timestamp before next user input.
      const lastInScope = [...scopeSteps]
        .reverse()
        .map(s => s.completedAtMs || s.terminalAtMs || s.createdAtMs)
        .find(ms => Number.isFinite(ms) && ms >= tm.startedAtMs);
      if (lastInScope) durationSec = (lastInScope - tm.startedAtMs) / 1000;
    }

    if (Number.isFinite(durationSec) && durationSec >= 0) {
      completedTurnsDurationSec += durationSec;
    } else if (isLastTurn && ['running', 'queued', 'unknown'].includes(tm.state) && tm.startedAtMs > 0) {
      runningTurnStartedAtMs = tm.startedAtMs;
    }

    turns.push({
      turnNumber: i + 1,
      userStepIndex: u.idx,
      state: tm.state,
      startedAtMs: tm.startedAtMs,
      endedAtMs: tm.endedAtMs,
      duration: durationSec,
      modelDuration: turnModelDur > 0 ? turnModelDur : null,
      requestCount: tm.requestCount ?? tm.knownRequestCount ?? scopeReqs.length,
      write: tm.write ?? tm.knownTotals?.write ?? null,
      thinking: tm.thinking ?? tm.knownTotals?.thinking ?? null,
      peakContextTokens: turnPeakContext,
      avgTps: turnMeasuredDur > 0 ? turnMeasuredOut / turnMeasuredDur : null,
      avgStreamTps: turnStreamDur > 0 ? turnStreamOut / turnStreamDur : null,
      modelsUsed: turnModels,
    });
  }

  const avgTps = measuredDuration > 0 ? measuredOutput / measuredDuration : null;
  const avgStreamTps = measuredStreamDuration > 0 ? measuredStreamOutput / measuredStreamDuration : null;
  const overallCacheHitRate = totalPromptTokens > 0 ? (totalCachedTokens / totalPromptTokens) * 100 : 0;
  const totalSessionTokens = totalPromptTokens + totalOutputTokens;

  return {
    summary: {
      turnCount: turns.length,
      requestCount: requests.length,
      peakContextTokens,
      compactionThresholdTokens,
      compactionCount,
      avgTps,
      avgStreamTps,
      peakTps,
      peakStreamTps,
      minTps,
      completedTurnsDurationSec,
      runningTurnStartedAtMs,
      totalModelDurationSec,
      totalOutputTokens,
      totalThinkingTokens,
      totalReplyTokens,
      totalPromptTokens,
      totalCachedTokens,
      totalUncachedTokens,
      overallCacheHitRate,
      totalSessionTokens,
    },
    requests: requests.slice(-MAX_HISTORY_REQUESTS),
    turns: turns.slice(-MAX_HISTORY_TURNS).reverse(),
  };
}
