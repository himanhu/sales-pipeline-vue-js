import test from 'node:test';
import assert from 'node:assert/strict';
import { nextTick } from 'vue';
import { COLUMNS, DEFAULT_COLUMNS } from '../src/constants.js';
import { createDeals } from '../src/data/deals.js';
import { loadComponent, mountComponent, findElements } from './helpers/components.js';

const { default: PipelineList } = await loadComponent('src/components/PipelineList.vue');
const { default: DealConflictReview } = await loadComponent('src/components/DealDetails/components/DealConflictReview.vue');
const { default: BulkSaveProgress } = await loadComponent('src/components/DealTable/components/BulkSaveProgress.vue');

function listProps() {
  const record = createDeals(1)[0];
  return {
    mode: 'all', search: '', filterGroups: [], filterMatch: 'all', total: 1,
    metrics: { failed: 0, conflicts: 0 }, selected: new Set(), bulkStage: 'Lost',
    visibleRows: [{ id: record.id, record, shown: record, rowIndex: 2, reason: 'On track' }],
    visibleColumns: DEFAULT_COLUMNS.map(key => COLUMNS.find(column => column.key === key)),
    sortMode: 'priority', sortDirection: 'desc', activeId: record.id,
    start: 0, end: 1, renderedCount: 1, topSpacer: 0, bottomSpacer: 0,
    registerRow() {},
  };
}

function findOne(root, predicate) {
  const element = findElements(root, predicate)[0];
  assert.ok(element, 'Expected rendered element');
  return element;
}

test('list forwards stage changes, keyboard events, selection, and detail navigation with all arguments', () => {
  const props = listProps();
  const calls = [];
  const mounted = mountComponent(PipelineList, {
    ...props,
    onMove: (...args) => calls.push(['move', ...args]),
    onRowKeydown: (...args) => calls.push(['keydown', ...args]),
    onToggleSelect: id => calls.push(['select', id]),
    onOpen: id => calls.push(['open', id]),
  });
  try {
    const { root } = mounted;
    const id = props.visibleRows[0].id;
    findOne(root, element => element.type === 'select' && element.props['aria-label']?.startsWith('Move '))
      .props.onChange({ target: { value: 'Won' } });
    const event = { key: 'x' };
    findOne(root, element => element.props.role === 'row' && element.props['aria-rowindex'] === 2).props.onKeydown(event);
    findOne(root, element => element.type === 'input' && element.props.type === 'checkbox').props.onChange();
    findOne(root, element => element.props.class === 'deal-info-button').props.onClick({ stopPropagation() {} });
    assert.deepEqual(calls, [['move', id, 'Won'], ['keydown', event, id], ['select', id], ['open', id]]);
    assert.deepEqual(mounted.warnings, []);
  } finally { mounted.unmount(); }
});

test('list forwards named model updates and exposes the selected view to assistive technology', async () => {
  const changes = [];
  const mounted = mountComponent(PipelineList, {
    ...listProps(), selected: new Set([100001]),
    'onUpdate:mode': value => changes.push(['mode', value]),
    'onUpdate:search': value => changes.push(['search', value]),
    'onUpdate:bulkStage': value => changes.push(['stage', value]),
  });
  try {
    const { root } = mounted;
    const viewButtons = findElements(root, element => element.props.class?.includes('tab') && element.type === 'button');
    assert.equal(viewButtons[1].props['aria-pressed'], true);
    viewButtons[0].props.onClick();
    findOne(root, element => element.type === 'input' && element.props.type === 'search').props.onInput({ target: { value: 'Acme' } });
    findOne(root, element => element.props['aria-label'] === 'Destination stage for selected deals').props.onChange({ target: { value: 'Won' } });
    await nextTick();
    assert.deepEqual(changes, [['mode', 'attention'], ['search', 'Acme'], ['stage', 'Won']]);
    assert.deepEqual(mounted.warnings, []);
  } finally { mounted.unmount(); }
});

test('conflict comparison uses table headers and forwards the chosen resolution', () => {
  const accepted = [];
  const mounted = mountComponent(DealConflictReview, {
    record: { id: 7, company: 'Theirs' }, proposedPatch: { company: 'Mine' },
    onAccept: id => accepted.push(id),
  });
  try {
    assert.equal(findElements(mounted.root, element => element.type === 'table').length, 1);
    assert.equal(findElements(mounted.root, element => element.type === 'th' && element.props.scope === 'col').length, 3);
    findOne(mounted.root, element => element.type === 'button' && element.props.class === 'plain-button').props.onClick();
    assert.deepEqual(accepted, [7]);
    assert.deepEqual(mounted.warnings, []);
  } finally { mounted.unmount(); }
});

test('bulk progress exposes counts and avoids an invalid percentage for an empty batch', () => {
  const mounted = mountComponent(BulkSaveProgress, {
    progress: { total: 0, completed: 0, saved: 0, failed: 0, conflicts: 0, running: false },
  });
  try {
    const progress = findOne(mounted.root, element => element.props.role === 'progressbar');
    assert.equal(progress.props['aria-valuenow'], 0);
    assert.equal(progress.children[0].props.style.width, '0%');
    assert.deepEqual(mounted.warnings, []);
  } finally { mounted.unmount(); }
});

test('App renders the extracted list with valid component props and accessible landmarks', async () => {
  const { createSSRApp } = await import('vue');
  const { renderToString } = await import('vue/server-renderer');
  const { default: App } = await loadComponent('src/App.vue');
  const app = createSSRApp(App);
  const warnings = [];
  app.config.warnHandler = message => warnings.push(message);
  const html = await renderToString(app);
  assert.ok(html.includes('aria-label="Deal list"'));
  assert.ok(html.includes('aria-multiselectable="true"'));
  assert.ok(html.includes('id="main-content"'));
  assert.ok(html.includes('id="pipeline-keyboard-hint"'));
  assert.ok(html.includes('aria-valuetext="10%"'));
  assert.deepEqual(warnings, []);
});
