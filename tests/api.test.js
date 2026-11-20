import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeals, needsAttention } from '../src/data/deals.js';
import { STAGES } from '../src/constants.js';
import { createFakePipelineApi } from '../src/services/fakeApi.js';

const fastSettings = {
  minDelayMs: 0,
  maxDelayMs: 0,
  failureRate: 0,
  teammateUpdatesPerMinute: 0,
};

test('seed produces 50,000 unique deals spanning every stage', () => {
  const deals = createDeals();
  assert.equal(deals.length, 50_000);
  assert.equal(new Set(deals.map((d) => d.id)).size, 50_000);
  assert.deepEqual(new Set(deals.map((d) => d.stage)), new Set(STAGES));
  assert.ok(deals.some(needsAttention));
});

test('optimistic client snapshots are independent of server saves', async () => {
  const api = createFakePipelineApi(createDeals(3), fastSettings, () => 0.99);
  const initial = api.snapshot();
  const deal = initial.values().next().value;
  const response = await api.saveBatch([{ id: deal.id, expectedRevision: 1, stage: 'Won' }]);
  assert.equal(response.saved.length, 1);
  assert.equal(api.get(deal.id).revision, 2);
  assert.equal(initial.get(deal.id).revision, 1);
  assert.equal(initial.get(deal.id).stage, deal.stage);
});

test('network failure preserves server data and reports an error', async () => {
  const api = createFakePipelineApi(createDeals(2), { ...fastSettings, failureRate: 100 }, () => 0.0);
  const deal = api.snapshot().values().next().value;
  await assert.rejects(api.saveBatch([{ id: deal.id, expectedRevision: 1, stage: 'Lost' }]), /Simulated network failure/);
  assert.equal(api.get(deal.id).revision, 1);
  assert.equal(api.get(deal.id).stage, deal.stage);
});

test('optimistic revision conflict does not overwrite teammate edits', async () => {
  const api = createFakePipelineApi(createDeals(2), fastSettings, () => 0.99);
  const deal = api.snapshot().values().next().value;
  const mine = 'Won';
  const theirs = api.simulateTeammateUpdate(deal.id);
  const response = await api.saveBatch([{ id: deal.id, expectedRevision: 1, stage: mine }]);
  assert.equal(response.saved.length, 0);
  assert.equal(response.conflicts.length, 1);
  assert.equal(api.get(deal.id).stage, theirs.stage);
  assert.equal(api.get(deal.id).revision, 2);
});

test('teammate subscription receives updates and unsubscribe stops them', () => {
  const api = createFakePipelineApi(createDeals(2), fastSettings);
  let observed = 0;
  const unsubscribe = api.subscribe(() => observed++);
  api.simulateTeammateUpdate();
  unsubscribe();
  api.simulateTeammateUpdate();
  assert.equal(observed, 1);
});

test('large batch updates use per-deal revision checks', async () => {
  const api = createFakePipelineApi(createDeals(2_500), fastSettings, () => 0.99);
  const snapshot = api.snapshot();
  const requests = [...snapshot.values()].map((deal) => ({ id: deal.id, expectedRevision: deal.revision, stage: 'Lost' }));
  const result = await api.saveBatch(requests);
  assert.equal(result.saved.length, 2_500);
  assert.equal(result.conflicts.length, 0);
  assert.ok([...api.snapshot().values()].every((d) => d.stage === 'Lost'));
});
