// Per-step model identification, Orchestrator phase tracking (plan vs execute),
// and thinking effort / thinking depth telemetry derived from SQLite ground-truth.

const KNOWN_MODEL_NUMS = Object.freeze({
  1537: { modelId: 'gemini-pro-orchestrator-neon', modelName: 'Orchestrator (Neon)' },
  1669: { modelId: 'gemini-flash-worker-agy', modelName: 'Gemini 4 Hydrogen (Orchestrator)' },
  1535: { modelId: 'gemini-4-neon', modelName: 'Gemini 4 Neon (XHigh)' },
  1532: { modelId: 'gemini-4-neon', modelName: 'Gemini 4 Neon (High)' },
  1533: { modelId: 'gemini-4-neon', modelName: 'Gemini 4 Neon (Medium)' },
  1531: { modelId: 'gemini-4-neon', modelName: 'Gemini 4 Neon (Low)' },
  1528: { modelId: 'gemini-4-hydrogen', modelName: 'Gemini 4 Hydrogen (XHigh)' },
  1525: { modelId: 'gemini-4-hydrogen', modelName: 'Gemini 4 Hydrogen (High)' },
  1417: { modelId: 'gemini-4-argon-trial', modelName: 'Gemini 4 Argon (High)' },
  1418: { modelId: 'gemini-4-argon-trial', modelName: 'Gemini 4 Argon (Medium)' },
  1405: { modelId: 'claude-sonnet-5-5-high', modelName: 'Claude Sonnet 5.5 (High)' },
  1402: { modelId: 'claude-opus-5-5-high', modelName: 'Claude Opus 5.5 (High)' },
  1401: { modelId: 'claude-opus-5-5-medium', modelName: 'Claude Opus 5.5 (Medium)' },
  1400: { modelId: 'claude-opus-5-5-low', modelName: 'Claude Opus 5.5 (Low)' },
  1322: { modelId: 'gemini-3.8-flash-tiered', modelName: 'Gemini 3.8 Flash' },
  1320: { modelId: 'gemini-3.8-flash-low', modelName: 'Gemini 3.8 Flash (Low)' },
  1198: { modelId: 'gemini-3.5-flash-lite', modelName: 'Gemini 3.5 Flash Lite' },
});

const EFFORT_CANONICAL = Object.freeze({
  xhigh: 'XHigh',
  extrahigh: 'XHigh',
  extra: 'XHigh',
  high: 'High',
  medium: 'Medium',
  med: 'Medium',
  low: 'Low',
  minimal: 'Minimal',
  max: 'Max',
});

function normalizeEffort(raw) {
  if (!raw) return null;
  const key = String(raw).trim().toLowerCase().replace(/\s+/g, '');
  return EFFORT_CANONICAL[key] || null;
}

function extractEffort(displayName = '', configSlug = '', modelId = '') {
  const paren = /\((XHigh|Extra\s*High|Extra|High|Medium|Med|Low|Minimal|Max)\)/i.exec(displayName);
  if (paren) return normalizeEffort(paren[1]);
  for (const slug of [configSlug, modelId]) {
    if (!slug) continue;
    const suffix = /(?:^|[-_])(xhigh|high|medium|low|minimal|max)$/i.exec(slug.trim());
    if (suffix) return normalizeEffort(suffix[1]);
  }
  return null;
}

function deriveShortName(displayName = '', modelId = '', isOrchestrator = false, phase = 'direct') {
  const name = String(displayName || '').trim();
  const slug = String(modelId || '').trim().toLowerCase();

  if (isOrchestrator && phase === 'plan' && /^orchestrator\b/i.test(name)) {
    const m = /Orchestrator\s*\(([^)]+)\)/i.exec(name);
    if (m) return m[1].trim();
    if (slug.includes('neon')) return 'Neon';
    if (slug.includes('argon') || slug.includes('g1-pro')) return 'Argon';
    if (slug.includes('opus')) return 'Opus';
    if (slug.includes('carbon')) return 'Carbon';
    return 'Planner';
  }

  if (name) {
    let cleaned = name
      .replace(/\s*\((?:XHigh|Extra\s*High|Extra|High|Medium|Med|Low|Minimal|Max|Orchestrator)\)\s*/gi, ' ')
      .replace(/^Gemini\s+4\s+/i, '')
      .replace(/^Gemini\s+3\.8\s+/i, '3.8 ')
      .replace(/^Gemini\s+3\.5\s+/i, '3.5 ')
      .replace(/^Claude\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned) return cleaned;
  }

  if (slug.includes('worker') || slug.includes('hydrogen')) return 'Hydrogen';
  if (slug.includes('neon')) return 'Neon';
  if (slug.includes('argon') || slug.includes('g1-pro')) return 'Argon';
  if (slug.includes('opus')) return 'Opus';
  if (slug.includes('sonnet')) return 'Sonnet';
  if (slug.includes('carbon')) return 'Carbon';
  if (slug.includes('flash-lite')) return 'Flash Lite';
  if (slug.includes('flash')) return 'Flash';
  return name || modelId || 'Unknown';
}

export function classifyModelInfo({
  modelNum = 0,
  modelId = '',
  modelName = '',
  configSlug = '',
  workerModelNum = 0,
  phaseOverride = null,
} = {}) {
  const fallback = modelNum > 0 ? KNOWN_MODEL_NUMS[modelNum] : null;
  const resolvedId = String(modelId || fallback?.modelId || '').trim();
  const resolvedName = String(modelName || fallback?.modelName || resolvedId || '').trim();
  const lowerId = resolvedId.toLowerCase();

  const isLegacyWorker =
    lowerId.includes('worker') ||
    /\(orchestrator\)/i.test(resolvedName) ||
    modelNum === 1669;
  const isLegacyPlanner =
    !isLegacyWorker &&
    (lowerId.includes('orchestrator') ||
      /^orchestrator\b/i.test(resolvedName));

  let phase = 'direct';
  let isOrchestrator = false;
  if (phaseOverride === 'plan' || phaseOverride === 'execute') {
    phase = phaseOverride;
    isOrchestrator = true;
  } else if (isLegacyWorker || (modelNum > 0 && workerModelNum === modelNum)) {
    phase = 'execute';
    isOrchestrator = true;
  } else if (isLegacyPlanner || (workerModelNum > 0 && workerModelNum !== modelNum)) {
    phase = 'plan';
    isOrchestrator = true;
  }

  const explicitEffort = extractEffort(resolvedName, configSlug, resolvedId);
  const effort = explicitEffort || (isOrchestrator ? 'auto' : null);
  const shortName = deriveShortName(resolvedName, resolvedId, isOrchestrator, phase);

  return {
    modelNum: Number(modelNum) || 0,
    modelId: resolvedId,
    displayName: resolvedName || shortName,
    shortName,
    isOrchestrator,
    phase,
    effort,
    workerModelNum: Number(workerModelNum) || 0,
  };
}

/**
 * Infers per-request Orchestrator phase ('plan' | 'execute' | 'direct') across both:
 * 1) Legacy Orchestrator (1537 Orchestrator (Neon) / 1669 Gemini 4 Hydrogen (Orchestrator))
 * 2) New Orchestrator (Neon/Argon/Opus with explicit effort + Hydrogen XHigh worker,
 *    signaled by exit_plan_mode/enter_plan_mode tool steps and m3.60 workerModelNum).
 */
export function buildStepPhaseMap(parsedRequests = [], allSteps = []) {
  const phaseByReqIndex = new Map();
  const knownOrchWorkerNums = new Set([1669]);
  for (const req of parsedRequests) {
    if (req.workerModelNum > 0) knownOrchWorkerNums.add(req.workerModelNum);
  }

  const userIndices = allSteps.filter(s => s.step_type === 14).map(s => s.idx).sort((a, b) => a - b);
  const turnBounds = [];
  if (userIndices.length === 0) {
    turnBounds.push({ start: -Infinity, end: Infinity });
  } else {
    if (allSteps.length > 0 && allSteps[0].idx < userIndices[0]) {
      turnBounds.push({ start: -Infinity, end: userIndices[0] });
    }
    for (let i = 0; i < userIndices.length; i++) {
      turnBounds.push({
        start: userIndices[i],
        end: i + 1 < userIndices.length ? userIndices[i + 1] : Infinity,
      });
    }
  }

  const isLegacyWorkerReq = (req) => {
    const lowerId = String(req.modelId || '').toLowerCase();
    return lowerId.includes('worker') || /\(orchestrator\)/i.test(req.modelName || '') || req.modelNum === 1669;
  };
  const isWorkerSignalReq = (req) =>
    isLegacyWorkerReq(req) || (req.workerModelNum > 0 && req.modelNum === req.workerModelNum);
  const isPlannerSignalReq = (req) => {
    if (isWorkerSignalReq(req)) return false;
    const lowerId = String(req.modelId || '').toLowerCase();
    const lowerName = String(req.modelName || '').toLowerCase();
    return (
      (req.workerModelNum > 0 && req.modelNum !== req.workerModelNum) ||
      req.modelNum === 1537 ||
      lowerId.includes('orchestrator') ||
      lowerName.includes('orchestrator')
    );
  };

  const turns = [];
  for (const bound of turnBounds) {
    const scopeSteps = allSteps.filter(s => s.idx >= bound.start && s.idx < bound.end);
    const scopeReqs = parsedRequests.filter(req => {
      const anchor = req.stepIndices?.[0] ?? (req.lastStepIndex >= 0 ? req.lastStepIndex : -1);
      if (anchor < 0) return bound.start === -Infinity;
      return anchor >= bound.start && anchor < bound.end;
    });
    if (scopeReqs.length === 0) continue;

    const planToolSteps = scopeSteps
      .filter(s => s.toolName === 'exit_plan_mode' || s.toolName === 'enter_plan_mode')
      .sort((a, b) => a.idx - b.idx);
    const hasExplicitOrchReq = scopeReqs.some(req => isWorkerSignalReq(req) || isPlannerSignalReq(req));
    const isExplicitOrch = planToolSteps.length > 0 || hasExplicitOrchReq;

    let explicitPlannerNum = 0;
    if (isExplicitOrch) {
      const plannerReq = scopeReqs.find(req => isPlannerSignalReq(req) && req.modelNum > 0);
      if (plannerReq) {
        explicitPlannerNum = plannerReq.modelNum;
      } else {
        const initialPhase = planToolSteps[0]?.toolName === 'enter_plan_mode' ? 'execute' : 'plan';
        for (const req of scopeReqs) {
          if (isWorkerSignalReq(req) || !(req.modelNum > 0) || knownOrchWorkerNums.has(req.modelNum)) continue;
          const reqStartIdx = req.stepIndices?.[0] ?? req.lastStepIndex ?? -1;
          let phase = initialPhase;
          for (const toolStep of planToolSteps) {
            if (reqStartIdx > toolStep.idx) {
              phase = toolStep.toolName === 'exit_plan_mode' ? 'execute' : 'plan';
            }
          }
          if (phase === 'plan') {
            explicitPlannerNum = req.modelNum;
            break;
          }
        }
      }

      const initialPhase = planToolSteps[0]?.toolName === 'enter_plan_mode' ? 'execute' : 'plan';
      for (const req of scopeReqs) {
        if (isWorkerSignalReq(req)) {
          phaseByReqIndex.set(req.turn, 'execute');
          continue;
        }
        if (req.workerModelNum > 0 && req.modelNum !== req.workerModelNum) {
          phaseByReqIndex.set(req.turn, 'plan');
          continue;
        }
        const reqStartIdx = req.stepIndices?.[0] ?? req.lastStepIndex ?? -1;
        let phase = initialPhase;
        for (const toolStep of planToolSteps) {
          if (reqStartIdx > toolStep.idx) {
            phase = toolStep.toolName === 'exit_plan_mode' ? 'execute' : 'plan';
          }
        }
        if (
          phase === 'plan' &&
          req.modelNum > 0 &&
          knownOrchWorkerNums.has(req.modelNum) &&
          (explicitPlannerNum === 0 || req.modelNum !== explicitPlannerNum)
        ) {
          phase = 'execute';
        }
        phaseByReqIndex.set(req.turn, phase);
      }
    }

    turns.push({ bound, scopeSteps, scopeReqs, planToolSteps, isExplicitOrch, explicitPlannerNum });
  }

  let lastOrchPlannerNum = 0;
  for (const t of turns) {
    if (t.isExplicitOrch) {
      if (t.explicitPlannerNum > 0) lastOrchPlannerNum = t.explicitPlannerNum;
      continue;
    }
    if (
      lastOrchPlannerNum > 0 &&
      t.scopeReqs.length > 0 &&
      t.scopeReqs.every(req => req.modelNum === lastOrchPlannerNum)
    ) {
      for (const req of t.scopeReqs) {
        phaseByReqIndex.set(req.turn, 'plan');
      }
    } else if (t.scopeReqs.length > 0) {
      lastOrchPlannerNum = 0;
    }
  }

  return phaseByReqIndex;
}

export function summarizeStepModelState(parsedRequests = [], allSteps = [], latestThinkingDurationSec = null) {
  const phaseByReqIndex = buildStepPhaseMap(parsedRequests, allSteps);
  const knownByNum = new Map();
  let sessionUsesOrchestrator = false;
  let knownWorkerNum = 0;
  let knownPlannerInfo = null;
  let knownWorkerInfo = null;

  const breakdownMap = new Map();

  for (const req of parsedRequests) {
    const phaseOverride = phaseByReqIndex.get(req.turn) || null;
    const info = classifyModelInfo({
      modelNum: req.modelNum,
      modelId: req.modelId,
      modelName: req.modelName,
      configSlug: req.configSlug,
      workerModelNum: req.workerModelNum,
      phaseOverride,
    });
    if (info.modelNum > 0 && (req.modelName || req.modelId)) {
      knownByNum.set(info.modelNum, info);
    }
    if (info.workerModelNum > 0) knownWorkerNum = info.workerModelNum;
    if (info.isOrchestrator) {
      sessionUsesOrchestrator = true;
      if (info.phase === 'plan') knownPlannerInfo = info;
      if (info.phase === 'execute') knownWorkerInfo = info;
    }

    const hasActivity = (req.contextTokens || 0) > 0 || (req.generation?.output ?? 0) > 0;
    if (!hasActivity || (!info.displayName && info.modelNum === 0)) continue;

    const key = `${info.phase}|${info.shortName}|${info.effort || ''}`;
    let entry = breakdownMap.get(key);
    if (!entry) {
      entry = {
        phase: info.phase,
        shortName: info.shortName,
        displayName: info.displayName,
        effort: info.effort,
        isOrchestrator: info.isOrchestrator,
        requests: 0,
        thinkingTokens: 0,
        replyTokens: 0,
      };
      breakdownMap.set(key, entry);
    }
    entry.requests++;
    if (Number.isFinite(req.thinkTokens) && req.thinkTokens > 0) entry.thinkingTokens += req.thinkTokens;
    if (Number.isFinite(req.outTokens) && req.outTokens > 0) entry.replyTokens += req.outTokens;
  }

  const latestReq = parsedRequests.at(-1) || null;
  const lastGenStepIndex = latestReq
    ? Math.max(latestReq.lastStepIndex ?? -1, ...(latestReq.stepIndices || [-1]))
    : -1;

  let currentInfo = latestReq
    ? classifyModelInfo({
        modelNum: latestReq.modelNum,
        modelId: latestReq.modelId,
        modelName: latestReq.modelName,
        configSlug: latestReq.configSlug,
        workerModelNum: latestReq.workerModelNum,
        phaseOverride: phaseByReqIndex.get(latestReq.turn) || null,
      })
    : null;
  let liveRunning = false;
  let stepThinkingTokens = latestReq?.generation?.thinking ?? null;
  let stepReplyTokens = latestReq?.generation?.reply ?? null;
  let stepOutputTokens = latestReq?.generation?.output ?? null;
  let stepDurationSec =
    latestReq?.generation?.ttft != null && latestReq?.generation?.streaming != null
      ? latestReq.generation.ttft + latestReq.generation.streaming
      : null;

  // Inspect the newest steps to reflect live phase/model switches immediately
  // (e.g., right after exit_plan_mode or while a worker step is still streaming).
  const trailingSteps = allSteps.filter(s => s.idx > lastGenStepIndex);
  const lastStep = allSteps.at(-1) || null;
  if (lastStep && [1, 2].includes(lastStep.status)) {
    liveRunning = true;
  }

  const lastUserStep = [...allSteps].reverse().find(s => s.step_type === 14) || null;
  const currentTurnSteps = lastUserStep
    ? allSteps.filter(s => s.idx >= lastUserStep.idx)
    : allSteps;
  const lastPlanToolInTurn = [...currentTurnSteps]
    .reverse()
    .find(s => s.toolName === 'exit_plan_mode' || s.toolName === 'enter_plan_mode') || null;
  const liveTurnPhase = lastPlanToolInTurn
    ? (lastPlanToolInTurn.toolName === 'exit_plan_mode' ? 'execute' : 'plan')
    : (sessionUsesOrchestrator ? 'plan' : null);

  const latestResponseStep = [...allSteps].reverse().find(s => s.step_type === 15) || null;
  if (latestResponseStep && latestResponseStep.idx > lastGenStepIndex) {
    liveRunning = [1, 2].includes(latestResponseStep.status) || liveRunning;
    if (latestResponseStep.modelNum > 0) {
      const base = knownByNum.get(latestResponseStep.modelNum);
      const override = liveTurnPhase && (sessionUsesOrchestrator || lastPlanToolInTurn) ? liveTurnPhase : null;
      currentInfo = classifyModelInfo({
        modelNum: latestResponseStep.modelNum,
        modelId: base?.modelId || '',
        modelName: base?.displayName || '',
        phaseOverride: override,
      });
      if (currentInfo.isOrchestrator) sessionUsesOrchestrator = true;
    }
    if (Number.isFinite(latestResponseStep.thinkingTokens)) {
      stepThinkingTokens = latestResponseStep.thinkingTokens;
      stepReplyTokens = latestResponseStep.replyTokens ?? 0;
      stepOutputTokens = (latestResponseStep.thinkingTokens || 0) + (latestResponseStep.replyTokens || 0);
    } else if (liveRunning) {
      stepThinkingTokens = null;
      stepReplyTokens = null;
      stepOutputTokens = null;
    }
  } else if (trailingSteps.length > 0 && (sessionUsesOrchestrator || lastPlanToolInTurn)) {
    const lastPlanTool = [...trailingSteps]
      .reverse()
      .find(s => s.toolName === 'exit_plan_mode' || s.toolName === 'enter_plan_mode');
    if (lastPlanTool?.toolName === 'exit_plan_mode') {
      const workerBase = knownWorkerInfo || classifyModelInfo({ modelNum: knownWorkerNum || 1528, phaseOverride: 'execute' });
      currentInfo = { ...workerBase, isOrchestrator: true, phase: 'execute' };
      stepThinkingTokens = null;
      stepReplyTokens = null;
      stepOutputTokens = null;
    } else if (lastPlanTool?.toolName === 'enter_plan_mode' && knownPlannerInfo) {
      currentInfo = { ...knownPlannerInfo, isOrchestrator: true, phase: 'plan' };
      stepThinkingTokens = null;
      stepReplyTokens = null;
      stepOutputTokens = null;
    }
  }

  if (!currentInfo || (!currentInfo.displayName && currentInfo.modelNum === 0)) {
    return null;
  }

  const thinkingRatio =
    Number.isFinite(stepThinkingTokens) && Number.isFinite(stepOutputTokens) && stepOutputTokens > 0
      ? Math.round((stepThinkingTokens / stepOutputTokens) * 100)
      : null;

  const phaseRank = { plan: 0, execute: 1, direct: 2 };
  const modelBreakdown = [...breakdownMap.values()].sort(
    (a, b) => (phaseRank[a.phase] ?? 9) - (phaseRank[b.phase] ?? 9) || b.requests - a.requests
  );

  return {
    ...currentInfo,
    sessionUsesOrchestrator,
    liveRunning,
    stepThinkingTokens,
    stepReplyTokens,
    stepOutputTokens,
    thinkingRatio,
    thinkingDurationSec: Number.isFinite(latestThinkingDurationSec) && latestThinkingDurationSec > 0 ? latestThinkingDurationSec : null,
    stepDurationSec,
    modelBreakdown,
  };
}
