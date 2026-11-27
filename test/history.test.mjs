import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeConversationHistory } from '../agy-prism-ui/sidecars/agy_prism_ui/history.mjs';
import { createPresentation } from '../agy-prism-ui/sidecars/agy_prism_ui/ui.mjs';

test('summarizeConversationHistory computes context trend, compaction drops, TPS stats and turn history', () => {
  const requests = [
    {
      turn: 0,
      lastStepIndex: 1,
      stepIndices: [1],
      contextTokens: 20000,
      cachedIn: 0,
      uncachedIn: 20000,
      maxContextTokens: 512000,
      outTokens: 100,
      thinkTokens: 100,
      requestError: { kind: 'none' },
      attempts: [{ usage: { read: 20000, cachedRead: 0, uncachedRead: 20000, write: 100, thinking: 100 } }],
      generation: { requestIndex: 0, ttft: 1, streaming: 3, output: 200, reply: 100, thinking: 100 },
    },
    {
      turn: 1,
      lastStepIndex: 3,
      stepIndices: [3],
      contextTokens: 80000,
      cachedIn: 20000,
      uncachedIn: 60000,
      maxContextTokens: 512000,
      outTokens: 200,
      thinkTokens: 200,
      requestError: { kind: 'none' },
      attempts: [{ usage: { read: 80000, cachedRead: 20000, uncachedRead: 60000, write: 200, thinking: 200 } }],
      generation: { requestIndex: 1, ttft: 1, streaming: 3, output: 400, reply: 200, thinking: 200 },
    },
    // Turn 2 after compaction drop (80000 -> 15000)
    {
      turn: 2,
      lastStepIndex: 6,
      stepIndices: [6],
      contextTokens: 15000,
      cachedIn: 10000,
      uncachedIn: 5000,
      maxContextTokens: 512000,
      outTokens: 150,
      thinkTokens: 50,
      requestError: { kind: 'none' },
      attempts: [{ usage: { read: 15000, cachedRead: 10000, uncachedRead: 5000, write: 150, thinking: 50 } }],
      generation: { requestIndex: 2, ttft: 0.5, streaming: 1.5, output: 200, reply: 150, thinking: 50 },
    },
  ];

  const steps = [
    { idx: 0, step_type: 14, status: 3, createdAtMs: 1000, recordedCompletedAtMs: 1000 },
    { idx: 1, step_type: 15, status: 3, createdAtMs: 1000, recordedCompletedAtMs: 5000, executionId: 'e1' },
    { idx: 3, step_type: 15, status: 3, createdAtMs: 6000, recordedCompletedAtMs: 11000, executionId: 'e1' },
    { idx: 5, step_type: 14, status: 3, createdAtMs: 20000, recordedCompletedAtMs: 20000 },
    { idx: 6, step_type: 15, status: 3, createdAtMs: 20000, recordedCompletedAtMs: 25000, executionId: 'e2' },
  ];

  const executors = [
    { lastStepIndex: 3, reason: 4, executionId: 'e1' },
    { lastStepIndex: 6, reason: 4, executionId: 'e2' },
  ];

  const h = summarizeConversationHistory(requests, steps, executors, []);
  assert.equal(h.summary.turnCount, 2);
  assert.equal(h.summary.requestCount, 3);
  assert.equal(h.summary.peakContextTokens, 80000);
  assert.equal(h.summary.compactionCount, 1);
  assert.equal(h.requests[2].compacted, true);
  assert.equal(h.summary.completedTurnsDurationSec, 15); // 10s + 5s
  assert.equal(h.summary.totalModelDurationSec, 10); // 4s + 4s + 2s
  assert.equal(h.summary.avgTps, 80); // 800 tok / 10s
  assert.ok(Math.abs(h.summary.avgStreamTps - (800 / 7.5)) < 0.01); // 800 tok / 7.5s streaming
  assert.equal(h.summary.peakTps, 100);
  assert.equal(h.summary.totalPromptTokens, 115000);
  assert.equal(h.summary.totalSessionTokens, 115800);
  assert.equal(h.turns.length, 2);
  assert.equal(h.turns[0].turnNumber, 2); // newest first

  const ui = createPresentation();
  assert.match(ui.historyMarkup(), /data-history-block/);
});
