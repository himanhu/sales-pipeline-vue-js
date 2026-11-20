import test from 'node:test';
import assert from 'node:assert/strict';
import { buildViewHash, parseViewHash } from '../src/utils/viewUrl.js';

const state = {
  detailId: null, mode: 'all', search: 'Acme & Sons + ₹',
  filterGroups: [{ match: 'all', rules: [{ field: 'stage', operator: 'neq', value: 'Lost' }, { field: 'amount', operator: 'gte', value: 100000 }] }],
  filterMatch: 'all', sortMode: 'amount', sortDirection: 'asc',
};

test('share links round-trip view, special characters, filters, AND/OR, and sort direction', () => {
  assert.deepEqual(parseViewHash(buildViewHash(state)), state);
  const any = { ...state, filterMatch: 'any' };
  assert.deepEqual(parseViewHash(buildViewHash(any)), any);
});

test('detail URLs retain the complete filtered table context', () => {
  const detail = { ...state, detailId: 100001 };
  assert.ok(buildViewHash(detail).startsWith('#/deals/100001?'));
  assert.deepEqual(parseViewHash(buildViewHash(detail)), detail);
});

test('legacy detail links and empty addresses open with safe default view criteria', () => {
  assert.equal(parseViewHash('#/deals/100001').detailId, 100001);
  const defaults = parseViewHash('');
  assert.equal(defaults.mode, 'attention');
  assert.equal(defaults.sortMode, 'priority');
  assert.deepEqual(defaults.filterGroups, []);
});

test('malformed filter JSON, invalid fields, and unsupported sort options do not break navigation', () => {
  assert.deepEqual(parseViewHash('#/pipeline?filters=not-json').filterGroups, []);
  const filters = [null, { field: 'company', operator: 'contains', value: 'Acme' }, { field: 'invalid', operator: 'eq', value: 'x' }, { field: 'amount', operator: 'gt', value: 'bad' }];
  const hash = `#/pipeline?filters=${encodeURIComponent(JSON.stringify(filters))}&sort=unknown&direction=invalid&view=unknown`;
  const parsed = parseViewHash(hash);
  assert.equal(parsed.filterGroups.length, 1);
  assert.equal(parsed.sortMode, 'priority');
  assert.equal(parsed.sortDirection, 'desc');
  assert.equal(parsed.mode, 'attention');
});

test('share links omit selected records and local drafts', () => {
  const hash = buildViewHash({ ...state, selected: [100001], drafts: [{ company: 'Private draft' }] });
  assert.ok(!hash.includes('Private'));
  assert.ok(!hash.includes('selected'));
});

test('mounted pipeline restores shared criteria and retains them through detail navigation', async () => {
  const { createRenderer, nextTick } = await import('vue');
  const { default: pipeline } = await import('../src/mixins/pipeline/index.js');
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  let address = new URL(`http://localhost:5173/${buildViewHash({ ...state, search: 'Acme' })}`);
  const listeners = new Map();
  globalThis.window = {
    get location() { return address; },
    history: { replaceState(_state, _title, hash) { address = new URL(hash, address); } },
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name) { listeners.delete(name); },
  };
  globalThis.document = { addEventListener() {}, removeEventListener() {} };
  const renderer = createRenderer({ createComment: () => ({}), insert() {}, remove() {}, parentNode: () => null, nextSibling: () => null });
  const app = renderer.createApp({ mixins: [pipeline], render() { return null; } });
  try {
    const vm = app.mount({});
    vm.settings.teammateUpdatesPerMinute = 0;
    await nextTick();
    assert.equal(vm.mode, 'all');
    assert.equal(vm.search, 'Acme');
    assert.equal(vm.deferredSearch, 'Acme');
    assert.deepEqual(JSON.parse(JSON.stringify(vm.filterGroups)), state.filterGroups);
    assert.equal(vm.sortMode, 'amount');
    assert.ok(vm.total > 0);
    vm.sortColumn('company');
    await nextTick();
    assert.equal(parseViewHash(address.hash).sortMode, 'company');
    assert.equal(parseViewHash(address.hash).sortDirection, 'asc');
    const id = vm.viewIds[0];
    vm.toggleRow(id);
    vm.scrollTop = 84;
    vm.openDeal(id);
    await nextTick();
    vm.handleDealRoute();
    assert.equal(parseViewHash(address.hash).detailId, id);
    assert.equal(parseViewHash(address.hash).search, 'Acme');
    const detailAddress = address.href;
    vm.closeDeal();
    await nextTick();
    vm.handleDealRoute();
    assert.equal(vm.detailId, null);
    assert.equal(vm.selected.has(id), true);
    assert.equal(vm.scrollTop, 84);
    assert.equal(parseViewHash(address.hash).filterGroups[0].rules.length, 2);
    address = new URL(detailAddress);
    listeners.get('popstate')();
    assert.equal(vm.detailId, id);
    assert.equal(vm.search, 'Acme');
    // Opening a different bookmark hydrates the new scope.
    address = new URL('http://localhost:5173/#/pipeline?view=all&search=Harbor&sort=updatedAt&direction=desc');
    listeners.get('hashchange')();
    await nextTick();
    assert.equal(vm.detailId, null);
    assert.equal(vm.search, 'Harbor');
    assert.equal(vm.filterGroups.length, 0);
    assert.equal(vm.selected.size, 0);
  } finally {
    app.unmount();
    assert.equal(listeners.size, 0);
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
  }
});

test('shared links preserve multiple groups and both levels of AND/OR', () => {
  const mixed = {
    ...state, filterMatch: 'any',
    filterGroups: [
      { match: 'all', rules: [{ field: 'stage', operator: 'eq', value: 'Contacted' }, { field: 'amount', operator: 'gt', value: 500000 }] },
      { match: 'any', rules: [{ field: 'owner', operator: 'eq', value: 'Rahul Verma' }] },
    ],
  };
  assert.deepEqual(parseViewHash(buildViewHash(mixed)), mixed);
  assert.deepEqual(parseViewHash(buildViewHash({ ...mixed, detailId: 109157 })), { ...mixed, detailId: 109157 });
});

test('old flat OR links retain their meaning when migrated into a group', () => {
  const rules = [{ field: 'owner', operator: 'eq', value: 'Rahul Verma' }, { field: 'stage', operator: 'eq', value: 'Lost' }];
  const parsed = parseViewHash(`#/pipeline?view=all&filters=${encodeURIComponent(JSON.stringify(rules))}&match=any`);
  assert.deepEqual(parsed.filterGroups, [{ match: 'any', rules }]);
  assert.equal(parsed.filterMatch, 'all');
  assert.deepEqual(parseViewHash(buildViewHash(parsed)), parsed);
});
