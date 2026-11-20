import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeals } from '../src/data/deals.js';
import { ME, OWNERS } from '../src/constants.js';
import { createFakePipelineApi } from '../src/services/fakeApi.js';
const settings = { minDelayMs: 0, maxDelayMs: 0, failureRate: 0 };

function setup() {
  const deal = createDeals(1)[0];
  return { deal, api: createFakePipelineApi([deal], settings, () => .99) };
}

test('history starts with the original creation and owner, then records reassignment with actual values', async () => {
  const { deal, api } = setup();
  const owner = OWNERS.find(person => person !== deal.owner);
  // History must be initialized before the first change even if never opened.
  const result = await api.saveBatch([{ id: deal.id, expectedRevision: 1, patch: { owner, amount: deal.amount + 10 } }]);
  const history = api.getActivity(deal.id);
  assert.equal(history.length, 2);
  assert.equal(history[0].actor, ME);
  assert.equal(history[0].revision, result.saved[0].revision);
  assert.deepEqual(history[0].changes.find(change => change.field === 'owner'), { field: 'owner', before: deal.owner, after: owner });
  assert.equal(history[1].type, 'created');
  assert.equal(history[1].actor, deal.createdBy);
  assert.equal(history[1].owner, deal.owner);
  assert.equal(history[1].timestamp, deal.createdAt);
});

test('failed and conflicted saves never create a completed history entry', async () => {
  const { deal, api } = setup();
  api.configure({ ...settings, failureRate: 100 });
  await assert.rejects(api.saveBatch([{ id: deal.id, expectedRevision: 1, stage: 'Lost' }]));
  assert.equal(api.getActivity(deal.id).length, 1);
  api.configure(settings);
  const theirs = api.simulateTeammateUpdate(deal.id);
  const response = await api.saveBatch([{ id: deal.id, expectedRevision: 1, stage: 'Won' }]);
  assert.equal(response.conflicts.length, 1);
  const history = api.getActivity(deal.id);
  assert.equal(history.length, 2);
  assert.notEqual(history[0].actor, ME);
  assert.equal(history[0].changes[0].after, theirs.stage);
});

test('comments are separate activity entries with author and time and do not change deal revisions', async () => {
  const { deal, api } = setup();
  const entry = await api.addComment(deal.id, '  Discussed next steps.\nFollow up tomorrow.  ');
  assert.equal(entry.type, 'comment');
  assert.equal(entry.actor, ME);
  assert.equal(entry.text, 'Discussed next steps.\nFollow up tomorrow.');
  assert.ok(Number.isFinite(entry.timestamp));
  assert.equal(api.getActivity(deal.id)[0].id, entry.id);
  assert.equal(api.get(deal.id).revision, 1);
});

test('invalid or failed comments leave history untouched and retry posts one entry', async () => {
  const { deal, api } = setup();
  await assert.rejects(api.addComment(deal.id, '  '));
  await assert.rejects(api.addComment(deal.id, 'x'.repeat(2001)));
  api.configure({ ...settings, failureRate: 100 });
  await assert.rejects(api.addComment(deal.id, 'Retry this comment'));
  assert.equal(api.getActivity(deal.id).length, 1);
  api.configure(settings);
  await api.addComment(deal.id, 'Retry this comment');
  assert.equal(api.getActivity(deal.id).filter(entry => entry.type === 'comment').length, 1);
});

test('history snapshots cannot mutate the stored audit data', async () => {
  const { deal, api } = setup();
  await api.saveBatch([{ id: deal.id, expectedRevision: 1, patch: { company: 'Updated' } }]);
  const history = api.getActivity(deal.id);
  history[0].changes[0].after = 'Tampered';
  history[1].owner = 'Tampered';
  assert.equal(api.getActivity(deal.id)[0].changes[0].after, 'Updated');
  assert.equal(api.getActivity(deal.id)[1].owner, deal.owner);
});
