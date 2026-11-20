import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeals } from '../src/data/deals.js';
import { ME, OWNERS } from '../src/constants.js';
import { createFakePipelineApi } from '../src/services/fakeApi.js';
import { dealForm, formPatch, editablePatch } from '../src/utils/dealFields.js';

const settings = { minDelayMs: 0, maxDelayMs: 0, failureRate: 0 };

test('detail forms submit only changed fields and preserve untouched date precision', () => {
  const record = createDeals(1)[0];
  const baseline = dealForm(record);
  assert.deepEqual(formPatch({ ...baseline }, baseline), {});
  const form = { ...baseline, company: '  Updated company  ', amount: '123456.5' };
  assert.deepEqual(formPatch(form, baseline), { company: 'Updated company', amount: 123456.5 });
});

test('editable fields reject invalid data and exclude system metadata', () => {
  assert.throws(() => editablePatch({ company: ' ' }), /company/);
  assert.throws(() => editablePatch({ amount: -1 }), /non-negative/);
  assert.throws(() => editablePatch({ closeAt: NaN }), /date/);
  assert.throws(() => editablePatch({ stage: 'Invalid' }), /stage/);
  assert.throws(() => editablePatch({ owner: 'Unknown' }), /owner/);
  assert.deepEqual(editablePatch({ id: 9, revision: 99, createdBy: 'Someone', company: 'Acme' }), { company: 'Acme' });
});

test('detail saves update business fields and audit metadata without changing record identity', async () => {
  const api = createFakePipelineApi(createDeals(1), settings);
  const before = api.get(100_001);
  const patch = { company: 'New company', owner: OWNERS[1], amount: 12345, closeAt: before.closeAt + 86_400_000, stage: 'Negotiation' };
  const { saved } = await api.saveBatch([{ id: before.id, expectedRevision: before.revision, patch }]);
  for (const [key, value] of Object.entries(patch)) assert.equal(saved[0][key], value);
  assert.equal(saved[0].id, before.id);
  assert.equal(saved[0].createdAt, before.createdAt);
  assert.equal(saved[0].createdBy, before.createdBy);
  assert.equal(saved[0].lastTouchAt, before.lastTouchAt);
  assert.equal(saved[0].revision, before.revision + 1);
  assert.equal(saved[0].modifiedBy, ME);
});

test('stale detail saves conflict without overwriting teammate values', async () => {
  const api = createFakePipelineApi(createDeals(1), settings, () => .99);
  const before = api.get(100_001);
  const theirs = api.simulateTeammateUpdate(before.id);
  const result = await api.saveBatch([{ id: before.id, expectedRevision: before.revision, patch: { company: 'Mine', amount: 999 } }]);
  assert.equal(result.saved.length, 0);
  assert.equal(result.conflicts.length, 1);
  assert.equal(api.get(before.id).company, before.company);
  assert.equal(api.get(before.id).stage, theirs.stage);
});

test('invalid batch fields are validated before committing any records', async () => {
  const api = createFakePipelineApi(createDeals(2), settings);
  await assert.rejects(api.saveBatch([
    { id: 100_001, expectedRevision: 1, patch: { company: 'Valid' } },
    { id: 100_002, expectedRevision: 1, patch: { amount: -5 } },
  ]));
  assert.equal(api.get(100_001).revision, 1);
  assert.equal(api.get(100_002).revision, 1);
});

test('editable dates reject finite timestamps outside the JavaScript date range', () => {
  assert.throws(() => editablePatch({ closeAt: 1e20 }), /valid date/);
  assert.throws(() => editablePatch({ lastTouchAt: -1e20 }), /valid date/);
});
