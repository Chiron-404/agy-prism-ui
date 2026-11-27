import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyModelInfo, summarizeStepModelState } from '../agy-prism-ui/sidecars/agy_prism_ui/model_routing.mjs';
import { createPresentation } from '../agy-prism-ui/sidecars/agy_prism_ui/ui.mjs';
import { readConversationSnapshot } from '../agy-prism-ui/sidecars/agy_prism_ui/server.mjs';
import { existsSync } from 'node:fs';

test('classifyModelInfo distinguishes Orchestrator plan vs execute phases and standalone effort tiers', () => {
  const plan = classifyModelInfo({
    modelNum: 1537,
    modelId: 'gemini-pro-orchestrator-neon',
    modelName: 'Orchestrator (Neon)',
    workerModelNum: 1669,
  });
  assert.equal(plan.isOrchestrator, true);
  assert.equal(plan.phase, 'plan');
  assert.equal(plan.shortName, 'Neon');
  assert.equal(plan.effort, 'auto');

  const exec = classifyModelInfo({
    modelNum: 1669,
    modelId: 'gemini-flash-worker-agy',
    modelName: 'Gemini 4 Hydrogen (Orchestrator)',
  });
  assert.equal(exec.isOrchestrator, true);
  assert.equal(exec.phase, 'execute');
  assert.equal(exec.shortName, 'Hydrogen');
  assert.equal(exec.effort, 'auto');

  const argonOrch = classifyModelInfo({
    modelId: 'gemini-pro-orchestrator-g1-pro',
    modelName: 'Orchestrator (Argon)',
  });
  assert.equal(argonOrch.isOrchestrator, true);
  assert.equal(argonOrch.phase, 'plan');
  assert.equal(argonOrch.shortName, 'Argon');
  assert.equal(argonOrch.effort, 'auto');

  const standalone = classifyModelInfo({
    modelNum: 1535,
    modelId: 'gemini-4-neon',
    modelName: 'Gemini 4 Neon (XHigh)',
    configSlug: 'gemini-4-neon-xhigh',
  });
  assert.equal(standalone.isOrchestrator, false);
  assert.equal(standalone.phase, 'direct');
  assert.equal(standalone.shortName, 'Neon');
  assert.equal(standalone.effort, 'XHigh');

  const claude = classifyModelInfo({
    modelNum: 1405,
    modelId: 'claude-sonnet-5-5-high',
    modelName: 'Claude Sonnet 5.5 (High)',
  });
  assert.equal(claude.isOrchestrator, false);
  assert.equal(claude.shortName, 'Sonnet 5.5');
  assert.equal(claude.effort, 'High');
});

test('summarizeStepModelState tracks live Orchestrator handoff from plan to execute and builds model breakdown', () => {
  const planReq = {
    turn: 0,
    lastStepIndex: 0,
    stepIndices: [1, 2],
    contextTokens: 10000,
    outTokens: 222,
    thinkTokens: 651,
    modelNum: 1537,
    modelId: 'gemini-pro-orchestrator-neon',
    modelName: 'Orchestrator (Neon)',
    workerModelNum: 1669,
    generation: { requestIndex: 0, ttft: 5, streaming: 4, output: 873, reply: 222, thinking: 651 },
  };
  const stepsDuringHandoff = [
    { idx: 0, step_type: 14, status: 3, modelNum: 0, toolName: '' },
    { idx: 1, step_type: 15, status: 3, modelNum: 1537, toolName: '' },
    { idx: 2, step_type: 132, status: 3, modelNum: 1537, toolName: 'exit_plan_mode' },
    { idx: 4, step_type: 15, status: 2, modelNum: 1669, toolName: '', thinkingTokens: null, replyTokens: null },
  ];

  const liveExec = summarizeStepModelState([planReq], stepsDuringHandoff, 9.6);
  assert.equal(liveExec.phase, 'execute');
  assert.equal(liveExec.shortName, 'Hydrogen');
  assert.equal(liveExec.effort, 'auto');
  assert.equal(liveExec.liveRunning, true);
  assert.equal(liveExec.modelBreakdown.length, 1);
  assert.equal(liveExec.modelBreakdown[0].shortName, 'Neon');

  const ui = createPresentation();
  const zhView = ui.stepModelView(liveExec, ui.dictionaries['zh-CN']);
  assert.equal(zhView.pillMain, 'Hydrogen');
  assert.equal(zhView.pillEffort, '自动');

  // Standalone composer selection hides capsule immediately, even if previous DB step was Orchestrator.
  assert.equal(ui.resolveActiveOrchestratorModel(liveExec, '全权限 Gemini 4 Neon XHigh'), null);
  assert.equal(ui.resolveActiveOrchestratorModel(liveExec, 'Claude Opus 5.5 High'), null);

  // Switching composer to Orchestrator (Neon) shows ready-state capsule immediately before first turn.
  const standaloneStep = { isOrchestrator: false, phase: 'direct', shortName: 'Neon', effort: 'XHigh', modelBreakdown: [] };
  const switched = ui.resolveActiveOrchestratorModel(standaloneStep, '全权限 Orchestrator (Neon)');
  assert.equal(switched.isOrchestrator, true);
  assert.equal(switched.phase, 'plan');
  assert.equal(switched.shortName, 'Neon');
  assert.equal(switched.effort, 'auto');
  assert.equal(switched.readyPending, true);
  assert.equal(ui.stepModelView(switched, ui.dictionaries['zh-CN']).pillMain, 'Neon');

  // Switching composer to Orchestrator (Neon) on a brand new empty chat also shows immediately.
  const freshOrch = ui.resolveActiveOrchestratorModel(null, 'Orchestrator (Argon)');
  assert.equal(freshOrch.shortName, 'Argon');
  assert.equal(freshOrch.phase, 'plan');
  assert.equal(freshOrch.readyPending, true);

  // While composer stays on Orchestrator (Neon), active SQLite execution step (Hydrogen) is preserved.
  const keptExec = ui.resolveActiveOrchestratorModel(liveExec, 'Orchestrator (Neon)');
  assert.equal(keptExec.phase, 'execute');
  assert.equal(keptExec.shortName, 'Hydrogen');

  // Without composer text (CDP off), standalone stays hidden while Orchestrator shows.
  assert.equal(ui.resolveActiveOrchestratorModel(standaloneStep, ''), null);
  assert.equal(ui.resolveActiveOrchestratorModel(liveExec, '').shortName, 'Hydrogen');
});

const realOrchDb = process.env.AGY_TEST_ORCH_DB || '';
test('readConversationSnapshot parses real Orchestrator SQLite database when present', { skip: !realOrchDb || !existsSync(realOrchDb) }, () => {
  const snap = readConversationSnapshot(realOrchDb);
  assert.equal(snap.maxContextTokens, 1_000_000);
  assert.equal(snap.stepModel.isOrchestrator, true);
  assert.equal(snap.stepModel.phase, 'execute');
  assert.equal(snap.stepModel.shortName, 'Hydrogen');
  assert.equal(snap.stepModel.effort, 'auto');
  assert.equal(snap.stepModel.modelBreakdown.length, 2);
  assert.equal(snap.stepModel.modelBreakdown[0].phase, 'plan');
  assert.equal(snap.stepModel.modelBreakdown[0].shortName, 'Neon');
  assert.equal(snap.stepModel.modelBreakdown[1].phase, 'execute');
  assert.equal(snap.stepModel.modelBreakdown[1].shortName, 'Hydrogen');
  assert.equal(snap.history.requests[0].modelPhase, 'plan');
  assert.equal(snap.history.requests[0].modelShort, 'Neon');
  assert.equal(snap.history.requests[1].modelPhase, 'execute');
  assert.equal(snap.history.requests[1].modelShort, 'Hydrogen');
});

test('new Orchestrator supports Neon, Argon, Opus and explicit thinking effort switching', () => {
  const ui = createPresentation();

  // Parse composer Orchestrator variants with explicit effort levels.
  const opusHigh = ui.parseComposerOrchestrator('全权限 Orchestrator (Opus) High');
  assert.equal(opusHigh.isOrchestrator, true);
  assert.equal(opusHigh.plannerName, 'Opus');
  assert.equal(opusHigh.effort, 'High');

  const argonMed = ui.parseComposerOrchestrator('Orchestrator (Argon) Medium');
  assert.equal(argonMed.plannerName, 'Argon');
  assert.equal(argonMed.effort, 'Medium');

  const neonExtra = ui.parseComposerOrchestrator('Orchestrator (Neon) Extra');
  assert.equal(neonExtra.plannerName, 'Neon');
  assert.equal(neonExtra.effort, 'XHigh');

  const opusLow = ui.resolveActiveOrchestratorModel(null, 'Orchestrator (Opus 5.5) Low');
  assert.equal(opusLow.isOrchestrator, true);
  assert.equal(opusLow.phase, 'plan');
  assert.equal(opusLow.shortName, 'Opus 5.5');
  assert.equal(opusLow.effort, 'Low');
  assert.equal(opusLow.readyPending, true);
  assert.equal(ui.stepModelView(opusLow, ui.dictionaries['zh-CN']).pillMain, 'Opus 5.5');
  assert.equal(ui.stepModelView(opusLow, ui.dictionaries['zh-CN']).pillEffort, 'Low');

  // Instant effort switch on the same planner updates immediately before next turn.
  const dbPlanMed = {
    isOrchestrator: true,
    phase: 'plan',
    shortName: 'Neon',
    effort: 'Medium',
    stepThinkingTokens: 866,
    modelBreakdown: [{ isOrchestrator: true, phase: 'plan', shortName: 'Neon', effort: 'Medium', requests: 2, thinkingTokens: 1200 }],
  };
  const sameChoice = ui.resolveActiveOrchestratorModel(dbPlanMed, 'Orchestrator (Neon) Medium');
  assert.equal(sameChoice.readyPending, undefined);
  assert.equal(sameChoice.effort, 'Medium');
  assert.equal(ui.stepModelView(sameChoice, ui.dictionaries['zh-CN']).pillEffort, 'Medium 866');

  const switchedEffort = ui.resolveActiveOrchestratorModel(dbPlanMed, 'Orchestrator (Neon) High');
  assert.equal(switchedEffort.readyPending, true);
  assert.equal(switchedEffort.shortName, 'Neon');
  assert.equal(switchedEffort.effort, 'High');
  assert.equal(switchedEffort.modelBreakdown.length, 1);

  // Instant planner switch (Neon -> Opus) updates immediately.
  const switchedPlanner = ui.resolveActiveOrchestratorModel(dbPlanMed, 'Orchestrator (Opus) XHigh');
  assert.equal(switchedPlanner.readyPending, true);
  assert.equal(switchedPlanner.shortName, 'Opus');
  assert.equal(switchedPlanner.effort, 'XHigh');
});

const newOrchDb = process.env.AGY_TEST_NEW_ORCH_DB || '';
test('readConversationSnapshot parses new Orchestrator SQLite database with explicit effort tiers when present', { skip: !newOrchDb || !existsSync(newOrchDb) }, () => {
  const snap = readConversationSnapshot(newOrchDb);
  assert.equal(snap.maxContextTokens, 1_000_000);
  assert.equal(snap.stepModel.isOrchestrator, true);
  assert.ok(['plan', 'execute'].includes(snap.stepModel.phase));
  assert.ok(snap.stepModel.shortName.length > 0);
  assert.ok(snap.stepModel.effort.length > 0);
  assert.equal(snap.history.requests[5].modelPhase, 'plan');
  assert.equal(snap.history.requests[5].modelShort, 'Neon');
  assert.equal(snap.history.requests[5].modelEffort, 'Medium');
  assert.equal(snap.history.requests[7].modelPhase, 'execute');
  assert.equal(snap.history.requests[7].modelShort, 'Hydrogen');
  assert.equal(snap.history.requests[7].modelEffort, 'XHigh');
  const planRow = snap.stepModel.modelBreakdown.find(r => r.phase === 'plan' && r.shortName === 'Neon');
  const execRow = snap.stepModel.modelBreakdown.find(r => r.phase === 'execute' && r.shortName === 'Hydrogen');
  assert.ok(planRow && planRow.effort === 'Medium');
  assert.ok(execRow && execRow.effort === 'XHigh');
});

test('handles queued execute steps before enter_plan_mode, direct-answer Orchestrator turns, and keeps full sorted breakdown', () => {
  const reqs = [
    // Turn 0: standalone Argon direct
    { turn: 0, lastStepIndex: 1, stepIndices: [1], contextTokens: 1000, outTokens: 50, thinkTokens: 10, modelNum: 1417, modelId: 'gemini-4-argon-trial', modelName: 'Gemini 4 Argon (High)', workerModelNum: 0 },
    // Turn 1: explicit Orchestrator plan -> execute
    { turn: 1, lastStepIndex: 11, stepIndices: [11], contextTokens: 2000, outTokens: 60, thinkTokens: 20, modelNum: 1532, modelId: 'gemini-4-neon', modelName: 'Gemini 4 Neon (High)', workerModelNum: 1525 },
    { turn: 2, lastStepIndex: 13, stepIndices: [13], contextTokens: 2500, outTokens: 80, thinkTokens: 30, modelNum: 1525, modelId: 'gemini-4-hydrogen', modelName: 'Gemini 4 Hydrogen (High)', workerModelNum: 0 },
    // Turn 2: queued execution turn where Hydrogen runs BEFORE enter_plan_mode, then Neon runs AFTER enter_plan_mode
    { turn: 3, lastStepIndex: 21, stepIndices: [21], contextTokens: 3000, outTokens: 90, thinkTokens: 15, modelNum: 1525, modelId: 'gemini-4-hydrogen', modelName: 'Gemini 4 Hydrogen (High)', workerModelNum: 0 },
    { turn: 4, lastStepIndex: 23, stepIndices: [23], contextTokens: 3500, outTokens: 70, thinkTokens: 25, modelNum: 1532, modelId: 'gemini-4-neon', modelName: 'Gemini 4 Neon (High)', workerModelNum: 0 },
    // Turn 3: direct-answer Orchestrator turn (only planner 1532, no workerModelNum, no exit_plan_mode)
    { turn: 5, lastStepIndex: 31, stepIndices: [31], contextTokens: 4000, outTokens: 40, thinkTokens: 12, modelNum: 1532, modelId: 'gemini-4-neon', modelName: 'Gemini 4 Neon (High)', workerModelNum: 0 },
    // Turn 4: active worker request where Hydrogen carries workerModelNum === modelNum (1525 === 1525)
    { turn: 6, lastStepIndex: 41, stepIndices: [41], contextTokens: 4200, outTokens: 55, thinkTokens: 18, modelNum: 1525, modelId: 'gemini-4-hydrogen', modelName: 'Gemini 4 Hydrogen (High)', workerModelNum: 1525 },
  ];
  const steps = [
    { idx: 0, step_type: 14, status: 3, modelNum: 0, toolName: '' },
    { idx: 10, step_type: 14, status: 3, modelNum: 0, toolName: '' },
    { idx: 12, step_type: 132, status: 3, modelNum: 1532, toolName: 'exit_plan_mode' },
    { idx: 20, step_type: 14, status: 3, modelNum: 0, toolName: '' },
    { idx: 22, step_type: 132, status: 3, modelNum: 1525, toolName: 'enter_plan_mode' },
    { idx: 30, step_type: 14, status: 3, modelNum: 0, toolName: '' },
    { idx: 31, step_type: 15, status: 3, modelNum: 1532, toolName: '' },
    { idx: 40, step_type: 14, status: 3, modelNum: 0, toolName: '' },
    { idx: 41, step_type: 15, status: 3, modelNum: 1525, toolName: '' },
  ];
  const state = summarizeStepModelState(reqs, steps, null);
  assert.equal(state.modelBreakdown.length, 3);
  assert.deepEqual(
    state.modelBreakdown.map(b => `${b.phase}:${b.shortName}:${b.requests}`),
    ['plan:Neon:3', 'execute:Hydrogen:3', 'direct:Argon:1'],
  );

  // Ready-pending fallback keeps all breakdown rows including direct historical rows.
  const ui = createPresentation();
  const pending = ui.resolveActiveOrchestratorModel(state, 'Orchestrator (Neon) XHigh');
  assert.equal(pending.readyPending, true);
  assert.equal(pending.modelBreakdown.length, 3);
});
