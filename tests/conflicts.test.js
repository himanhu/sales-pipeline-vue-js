import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer, nextTick } from 'vue';
import pipelineOptions from '../src/mixins/pipeline/index.js';

// Mount the real Options API pipeline without a browser. These tests exercise its state
// transitions; DOM layout and focus still require browser verification.
async function withPipeline(run) {
  const previousDocument = globalThis.document;
  globalThis.document = { addEventListener() {}, removeEventListener() {} };
  const renderer = createRenderer({
    createComment: () => ({}), insert() {}, remove() {},
    parentNode: () => null, nextSibling: () => null,
  });
  const app = renderer.createApp({ mixins: [pipelineOptions], render() { return null; } });
  const pipeline = app.mount({});
  try {
    Object.assign(pipeline.settings, {
      minDelayMs: 0, maxDelayMs: 0, failureRate: 0, teammateUpdatesPerMinute: 0,
    });
    await nextTick();
    pipeline.mode = 'all';
    await nextTick();
    await run(pipeline);
  } finally {
    app.unmount();
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
}

async function waitFor(predicate) {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.fail('Timed out waiting for saves');
}

async function createConflicts(pipeline, rows) {
  for (const row of rows) {
    pipeline.activeId = row.id;
    pipeline.moveSingle(row.id, row.record.stage === 'Won' ? 'Lost' : 'Won');
    pipeline.simulateFocusedTeammate();
  }
  await waitFor(() => pipeline.metrics.saving === 0);
  assert.equal(pipeline.metrics.conflicts, rows.length);
}

test('keep mine for all retries conflicts in batches and preserves unrelated failed drafts', async () => {
  await withPipeline(async p => {
    const rows = p.visibleRows.slice(0, 3);
    p.settings.failureRate = 100;
    await nextTick();
    p.moveSingle(rows[2].id, rows[2].record.stage === 'Won' ? 'Lost' : 'Won');
    await waitFor(() => p.metrics.failed === 1);
    p.settings.failureRate = 0;
    await nextTick();
    await createConflicts(p, rows.slice(0, 2));
    const targets = new Map(p.visibleRows.filter(r => r.edit?.status === 'conflict').map(r => [r.id, r.edit.target]));
    p.requestResolveAll('mine');
    assert.equal(p.conflictResolution.drafts.length, 2);
    assert.equal(p.metrics.conflicts, 2); // Opening confirmation changes nothing.
    p.resolveAllConflicts();
    await waitFor(() => p.bulkProgress?.running === false);
    assert.equal(p.metrics.conflicts, 0);
    assert.equal(p.metrics.failed, 1);
    assert.equal(p.bulkProgress.saved, 2);
    for (const row of p.visibleRows) {
      if (targets.has(row.id)) assert.equal(row.record.stage, targets.get(row.id));
    }
  });
});

test('use theirs for all discards only the conflicts included in the confirmation', async () => {
  await withPipeline(async p => {
    const rows = p.visibleRows.slice(0, 3);
    await createConflicts(p, rows.slice(0, 2));
    p.requestResolveAll('theirs');
    p.conflictResolution = null; // Cancel leaves drafts intact.
    assert.equal(p.metrics.conflicts, 2);
    p.requestResolveAll('theirs');
    const third = rows[2];
    p.activeId = third.id;
    p.moveSingle(third.id, third.record.stage === 'Won' ? 'Lost' : 'Won');
    p.simulateFocusedTeammate();
    await waitFor(() => p.metrics.saving === 0);
    p.resolveAllConflicts();
    assert.equal(p.metrics.conflicts, 1);
    for (const row of p.visibleRows.filter(r => rows.slice(0, 2).some(original => original.id === r.id))) {
      assert.equal(row.edit, undefined);
      assert.equal(row.shown.stage, row.record.stage);
    }
    assert.equal(p.visibleRows.find(r => r.id === third.id).edit.status, 'conflict');
  });
});

test('failed keep mine for all preserves drafts for retry', async () => {
  await withPipeline(async p => {
    await createConflicts(p, p.visibleRows.slice(0, 2));
    p.settings.failureRate = 100;
    await nextTick();
    p.requestResolveAll('mine');
    p.resolveAllConflicts();
    await waitFor(() => p.bulkProgress?.running === false);
    assert.equal(p.metrics.failed, 2);
    assert.equal(p.bulkProgress.failed, 2);
    p.settings.failureRate = 0;
    await nextTick();
    p.retryFailed();
    await waitFor(() => p.bulkProgress?.running === false);
    assert.equal(p.metrics.failed, 0);
    assert.equal(p.bulkProgress.saved, 2);
  });
});

test('view switching clears selection and virtualizes the full dataset', async () => {
  await withPipeline(async p => {
    assert.equal(p.total, 50_000);
    assert.ok(p.visibleRows.length < 30);
    const id = p.visibleRows[0].id;
    p.toggleRow(id);
    p.onScroll({ target: { scrollTop: 84 * 100 } });
    assert.equal(p.start, 91);
    assert.equal(p.topSpacer, 91 * 84);
    p.mode = 'attention';
    await nextTick();
    assert.equal(p.selected.size, 0);
    assert.equal(p.scrollTop, 0);
    assert.ok(p.total > 0 && p.total < 50_000);
    p.mode = 'all';
    await nextTick();
    assert.equal(p.total, 50_000);
  });
});

test('search remains debounced and filters by deal ID', async () => {
  await withPipeline(async p => {
    const id = p.visibleRows[0].id;
    p.search = 'discard this query';
    await nextTick();
    p.search = String(id);
    await nextTick();
    assert.equal(p.deferredSearch, '');
    assert.equal(p.total, 50_000);
    await waitFor(() => p.deferredSearch === String(id));
    assert.equal(p.total, 1);
    assert.equal(p.visibleRows[0].id, id);
  });
});

test('teammate updates refresh cells without reordering until apply updates', async () => {
  await withPipeline(async p => {
    p.sortMode = 'updatedAt';
    await nextTick();
    const originalIds = p.viewIds;
    const id = originalIds[originalIds.length - 1];
    p.activeId = id;
    p.simulateFocusedTeammate();
    assert.equal(p.viewIds, originalIds);
    assert.equal(p.updatesWaiting, 1);
    p.toggleRow(id);
    p.applyChanges();
    await nextTick();
    assert.equal(p.viewIds[0], id);
    assert.equal(p.updatesWaiting, 0);
    assert.equal(p.selected.size, 0);
  });
});

test('keyboard row selection and stage focus use Options API methods', async () => {
  await withPipeline(async p => {
    const id = p.visibleRows[0].id;
    const target = {};
    let prevented = 0;
    let focused = false;
    const event = key => ({ key, target, currentTarget: target, preventDefault() { prevented++; } });
    p.rowElements.set(id, { querySelector() { return { focus() { focused = true; } }; } });
    p.onRowKeydown(event('x'), id);
    assert.equal(p.selected.has(id), true);
    p.onRowKeydown(event('m'), id);
    assert.equal(focused, true);
    assert.equal(prevented, 2);
  });
});

test('column headers toggle full-dataset sorting and clear selection', async () => {
  await withPipeline(async p => {
    p.toggleRow(p.viewIds[0]);
    p.sortColumn('amount');
    await nextTick();
    assert.equal(p.sortDirection, 'asc');
    assert.equal(p.selected.size, 0);
    for (let i = 1; i < p.viewIds.length; i++) {
      assert.ok(p.confirmed.get(p.viewIds[i - 1]).amount <= p.confirmed.get(p.viewIds[i]).amount);
    }
    p.sortColumn('amount');
    await nextTick();
    assert.equal(p.sortDirection, 'desc');
    for (let i = 1; i < p.viewIds.length; i++) {
      assert.ok(p.confirmed.get(p.viewIds[i - 1]).amount >= p.confirmed.get(p.viewIds[i]).amount);
    }
  });
});

test('applied field filters scope bulk selection to all matching deals', async () => {
  await withPipeline(async p => {
    p.applyFilters({ groups: [{ match: 'all', rules: [{ field: 'amount', operator: 'gte', value: '1750000' }] }], match: 'all' });
    await nextTick();
    assert.ok(p.total > 0 && p.total < 50_000);
    assert.ok(p.viewIds.every(id => p.confirmed.get(id).amount >= 1_750_000));
    p.toggleAllResults();
    assert.equal(p.selected.size, p.total);
    p.applyFilters({ groups: [], match: 'all' });
    await nextTick();
    assert.equal(p.total, 50_000);
    assert.equal(p.selected.size, 0);
  });
});

test('mixed groups filter the full dataset and select only the matching IDs', async () => {
  await withPipeline(async p => {
    p.applyFilters({ groups: [
      { match: 'all', rules: [{ field: 'stage', operator: 'eq', value: 'Contacted' }, { field: 'amount', operator: 'gt', value: 500000 }] },
      { match: 'all', rules: [{ field: 'owner', operator: 'eq', value: 'Rahul Verma' }] },
    ], match: 'any' });
    await nextTick();
    const expected = [...p.confirmed.values()].filter(deal => (deal.stage === 'Contacted' && deal.amount > 500000) || deal.owner === 'Rahul Verma');
    assert.deepEqual(new Set(p.viewIds), new Set(expected.map(deal => deal.id)));
    p.toggleAllResults();
    assert.equal(p.selected.size, expected.length);
    assert.ok(p.visibleRows.length < 30);
  });
});

test('choosing columns updates their order without changing the result scope', async () => {
  await withPipeline(async p => {
    const ids = p.viewIds;
    p.updateColumns(['createdAt', 'company', 'modifiedBy']);
    assert.deepEqual(p.visibleColumns.map(column => column.key), ['createdAt', 'company', 'modifiedBy']);
    assert.equal(p.viewIds, ids);
    assert.ok(p.visibleRows.length < 30);
  });
});

test('detail saves update shared table data and returning preserves the list position', async () => {
  await withPipeline(async p => {
    const id = p.visibleRows[0].id;
    p.scrollTop = 84 * 20;
    p.toggleRow(id);
    p.openDeal(id);
    const before = p.detailRecord;
    await p.saveDealDetails({ id, patch: { company: 'Updated via details', amount: 765432 }, expectedRevision: before.revision });
    assert.equal(p.detailRecord.company, 'Updated via details');
    assert.equal(p.detailRecord.amount, 765432);
    assert.equal(p.detailRecord.createdBy, before.createdBy);
    assert.equal(p.detailEdit, null);
    p.closeDeal();
    assert.equal(p.detailId, null);
    assert.equal(p.scrollTop, 84 * 20);
    assert.equal(p.selected.has(id), true);
  });
});

test('failed detail patches survive leaving the page and retrying from the list', async () => {
  await withPipeline(async p => {
    const id = p.visibleRows[0].id;
    const before = p.confirmed.get(id);
    p.openDeal(id);
    p.settings.failureRate = 100;
    await nextTick();
    await p.saveDealDetails({ id, patch: { company: 'Retry all fields', amount: 42 }, expectedRevision: before.revision });
    assert.equal(p.detailEdit.status, 'failed');
    assert.equal(p.confirmed.get(id).company, before.company);
    assert.equal(p.visibleRows.find(row => row.id === id).shown.company, 'Retry all fields');
    // A stage-only action cannot unexpectedly submit the detail form's fields.
    assert.equal(p.beginEdits([{ id, stage: 'Lost' }]).length, 0);
    assert.equal(p.detailEdit.status, 'failed');
    p.closeDeal();
    p.settings.failureRate = 0;
    await nextTick();
    p.retryFailed(id);
    await waitFor(() => p.metrics.saving === 0);
    assert.equal(p.confirmed.get(id).company, 'Retry all fields');
    assert.equal(p.confirmed.get(id).amount, 42);
    assert.equal(p.metrics.failed, 0);
  });
});

test('keeping a detail patch preserves teammate changes to fields the user did not edit', async () => {
  await withPipeline(async p => {
    const id = p.visibleRows[0].id;
    p.openDeal(id);
    const baseRevision = p.detailRecord.revision;
    p.simulateFocusedTeammate();
    const theirStage = p.detailRecord.stage;
    await p.saveDealDetails({ id, patch: { company: 'My company change' }, expectedRevision: baseRevision });
    assert.equal(p.detailEdit.status, 'conflict');
    assert.equal(p.visibleRows.find(row => row.id === id).shown.stage, theirStage);
    p.requestResolveAll('mine');
    p.resolveAllConflicts();
    await waitFor(() => p.bulkProgress?.running === false);
    assert.equal(p.detailRecord.company, 'My company change');
    assert.equal(p.detailRecord.stage, theirStage);
    assert.equal(p.detailEdit, null);
  });
});

test('editing another owner’s deal shows ownership context and counts bulk ownership', async () => {
  await withPipeline(async p => {
    const record = [...p.confirmed.values()].find(deal => deal.owner === 'Rahul Verma');
    p.moveSingle(record.id, record.stage === 'Lost' ? 'Won' : 'Lost');
    assert.ok(p.ownershipNotice.includes("You're not the owner"));
    assert.ok(p.ownershipNotice.includes('Rahul Verma'));
    p.toggleRow(record.id);
    assert.equal(p.bulkNonOwnedCount, 1);
    await waitFor(() => p.metrics.saving === 0);
  });
});

test('comment text survives failed posting and navigation; retry adds history exactly once', async () => {
  await withPipeline(async p => {
    const id = p.viewIds[0];
    p.openDeal(id);
    p.settings.failureRate = 100;
    await nextTick();
    p.updateCommentDraft({ id, text: 'Please follow up next week.' });
    await p.postComment(id);
    assert.equal(p.detailCommentDraft.status, 'failed');
    assert.equal(p.detailActivity.filter(entry => entry.type === 'comment').length, 0);
    p.closeDeal();
    p.openDeal(id);
    assert.equal(p.detailCommentDraft.text, 'Please follow up next week.');
    p.settings.failureRate = 0;
    await nextTick();
    const posting = p.postComment(id);
    await p.postComment(id); // A second click cannot submit another copy.
    await posting;
    assert.equal(p.detailCommentDraft.text, '');
    assert.equal(p.detailActivity.filter(entry => entry.type === 'comment').length, 1);
    assert.equal(p.detailActivity[0].text, 'Please follow up next week.');
  });
});

test('detail reassignment updates the activity timeline with previous and new owners', async () => {
  await withPipeline(async p => {
    const id = p.viewIds[0];
    p.openDeal(id);
    const before = p.detailRecord;
    const owner = before.owner === 'Rahul Verma' ? 'Priya Shah' : 'Rahul Verma';
    await p.saveDealDetails({ id, patch: { owner }, expectedRevision: before.revision });
    const change = p.detailActivity[0].changes.find(item => item.field === 'owner');
    assert.deepEqual(change, { field: 'owner', before: before.owner, after: owner });
    assert.equal(p.detailActivity[0].actor, 'Priya Shah');
  });
});

test('draft status updates reuse cached confirmed metrics instead of rescanning the dataset', async () => {
  await withPipeline(async p => {
    const confirmedMetrics = p.confirmedMetrics;
    const before = p.metrics;
    const record = p.confirmed.get(p.viewIds[0]);
    const requests = p.beginEdits([{ id: record.id, stage: record.stage === 'Won' ? 'Lost' : 'Won' }]);
    assert.equal(p.metrics.saving, 1);
    assert.equal(p.confirmedMetrics, confirmedMetrics);
    assert.equal(p.metrics.open, before.open);
    await p.saveChanges(requests);
    assert.notEqual(p.confirmedMetrics, confirmedMetrics);
    assert.equal(p.metrics.saving, 0);
  });
});

test('typing a comment keeps cached activity; a confirmed post refreshes it', async () => {
  await withPipeline(async p => {
    const id = p.viewIds[0];
    p.openDeal(id);
    const activity = p.detailActivity;
    p.updateCommentDraft({ id, text: 'First draft' });
    assert.equal(p.detailActivity, activity);
    p.updateCommentDraft({ id, text: 'Final comment' });
    assert.equal(p.detailActivity, activity);
    await p.postComment(id);
    assert.notEqual(p.detailActivity, activity);
    assert.equal(p.detailActivity[0].text, 'Final comment');
  });
});

test('row shortcuts preserve modified browser shortcuts and IME input', async () => {
  await withPipeline(async p => {
    const id = p.viewIds[0];
    const target = {};
    let prevented = false;
    const event = { key: 'x', target, currentTarget: target, preventDefault() { prevented = true; } };
    p.onRowKeydown({ ...event, ctrlKey: true }, id);
    p.onRowKeydown({ ...event, isComposing: true }, id);
    assert.equal(p.selected.size, 0);
    assert.equal(prevented, false);
  });
});
