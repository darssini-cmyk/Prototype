import { test } from 'node:test';
import assert from 'node:assert/strict';
import { claimCase, metrics, resetDemo, reviewErrors, saveReview } from '../src/demo.js';

test('pickup and confirmation are local and idempotent', () => {
  let state = resetDemo();
  assert.deepEqual(metrics(state), { Queued: 2, 'In Review': 0, Reviewed: 1 });
  state = claimCase(state, 'SYN-001');
  assert.equal(claimCase(state, 'SYN-001'), state);
  assert.equal(state.events.length, 1);
  assert.equal(saveReview(state, 'SYN-001'), state);
  assert.equal(reviewErrors(state.cases[0]).length, 3);
  state.cases[0].fields[0].value = 'Sample Trading Company';
  state.cases[0].fields[0].validated = true;
  state.cases[0].documentType = 'Invoice';
  state = saveReview(state, 'SYN-001');
  assert.equal(state.events.length, 2);
  assert.equal(saveReview(state, 'SYN-001'), state);
  assert.deepEqual(metrics(state), { Queued: 1, 'In Review': 0, Reviewed: 2 });
  assert.equal(resetDemo().events.length, 0);
});

test('threshold boundary and missing high-confidence values', () => {
  const state = claimCase(resetDemo(), 'SYN-001');
  const item = state.cases[0];
  assert.deepEqual(item.fields.map(f => f.confidence), [0.84, 0.85, 0.86]);
  item.fields[0].value = 'Sample';
  item.fields[0].validated = true;
  item.documentType = 'Invoice';
  assert.deepEqual(reviewErrors(item), []);
  item.fields[1].value = ' ';
  assert.deepEqual(reviewErrors(item), ['Reference: enter a value.']);
  assert.equal(saveReview(state, 'unknown'), state);
});
