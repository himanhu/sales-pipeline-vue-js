import test from 'node:test';
import assert from 'node:assert/strict';
import { COLUMNS, DEFAULT_COLUMNS } from '../src/constants.js';
import { normalizeColumns, compareDeals, matchesFilters, validRule } from '../src/utils/table.js';
import { createDeals } from '../src/data/deals.js';
import { ME } from '../src/constants.js';
import { createFakePipelineApi } from '../src/services/fakeApi.js';

const rule = (field, operator, value) => ({ field, operator, value });
const deal = { id: 1, company: 'Acme Labs', amount: 500_000, owner: 'Priya Shah', stage: 'Contacted', closeAt: new Date(2026, 10, 19, 18, 30).getTime() };

test('field filters support text, numeric, AND, and OR conditions', () => {
  assert.equal(matchesFilters(deal, [rule('company', 'contains', 'ACME')]), true);
  assert.equal(matchesFilters(deal, [rule('company', 'notContains', 'labs')]), false);
  assert.equal(matchesFilters(deal, [rule('amount', 'gte', '500000')]), true);
  assert.equal(matchesFilters(deal, [rule('amount', 'gt', '500000')]), false);
  const rules = [rule('stage', 'eq', 'Lost'), rule('owner', 'eq', 'Priya Shah')];
  assert.equal(matchesFilters(deal, rules, 'all'), false);
  assert.equal(matchesFilters(deal, rules, 'any'), true);
  assert.equal(matchesFilters(deal, [], 'any'), true);
});

test('date filters compare local calendar days, including the entire chosen day', () => {
  assert.equal(matchesFilters(deal, [rule('closeAt', 'eq', '2026-11-19')]), true);
  assert.equal(matchesFilters(deal, [rule('closeAt', 'lte', '2026-11-19')]), true);
  assert.equal(matchesFilters(deal, [rule('closeAt', 'gt', '2026-11-19')]), false);
  assert.equal(matchesFilters(deal, [rule('closeAt', 'lt', '2026-11-20')]), true);
});

test('filter validation rejects incomplete conditions, invalid fields, numbers, dates, and operators', () => {
  assert.equal(validRule(rule('company', 'contains', '')), false);
  assert.equal(validRule(rule('unknown', 'eq', 'x')), false);
  assert.equal(validRule(rule('amount', 'gte', 'abc')), false);
  assert.equal(validRule(rule('createdAt', 'eq', 'not-a-date')), false);
  assert.equal(validRule(rule('amount', 'contains', '1')), false);
});

test('column sorting handles A–Z, Z–A, numbers, dates, and deterministic ties', () => {
  const deals = [
    { id: 2, company: 'Zebra', amount: 2, createdAt: 30 },
    { id: 1, company: 'Acme', amount: 100, createdAt: 10 },
  ];
  assert.deepEqual([...deals].sort((a, b) => compareDeals(a, b, 'company', 'asc')).map(d => d.id), [1, 2]);
  assert.deepEqual([...deals].sort((a, b) => compareDeals(a, b, 'company', 'desc')).map(d => d.id), [2, 1]);
  assert.deepEqual([...deals].sort((a, b) => compareDeals(a, b, 'amount', 'asc')).map(d => d.id), [2, 1]);
  assert.deepEqual([...deals].sort((a, b) => compareDeals(a, b, 'createdAt', 'asc')).map(d => d.id), [1, 2]);
  assert.ok(compareDeals({ id: 1, amount: 5 }, { id: 2, amount: 5 }, 'amount', 'desc') < 0);
});

test('column preferences preserve chosen order and reject duplicates and unknown keys', () => {
  assert.deepEqual(normalizeColumns(['createdBy', 'company', 'company', 'unknown']), ['createdBy', 'company']);
  assert.deepEqual(normalizeColumns([]), DEFAULT_COLUMNS);
  assert.deepEqual(normalizeColumns(null), DEFAULT_COLUMNS);
  assert.equal(COLUMNS.length, new Set(COLUMNS.map(column => column.key)).size);
});

test('created metadata stays fixed while saves and teammate updates track the modifying person', async () => {
  const api = createFakePipelineApi(createDeals(1), { minDelayMs: 0, maxDelayMs: 0, failureRate: 0 }, () => .99);
  const initial = api.get(100_001);
  assert.ok(initial.createdAt <= initial.updatedAt);
  const { saved } = await api.saveBatch([{ id: initial.id, expectedRevision: initial.revision, stage: 'Won' }]);
  assert.equal(saved[0].modifiedBy, ME);
  const teammate = api.simulateTeammateUpdate(initial.id);
  assert.notEqual(teammate.modifiedBy, ME);
  assert.equal(teammate.createdAt, initial.createdAt);
  assert.equal(teammate.createdBy, initial.createdBy);
});

test('mixed filter groups evaluate (A AND B) OR C for every truth-table combination', async () => {
  const { matchesFilterGroups } = await import('../src/utils/table.js');
  const groups = [
    { match: 'all', rules: [rule('stage', 'eq', 'Contacted'), rule('amount', 'gt', 500000)] },
    { match: 'all', rules: [rule('owner', 'eq', 'Rahul Verma')] },
  ];
  for (const a of [false, true]) for (const b of [false, true]) for (const c of [false, true]) {
    const candidate = { ...deal, stage: a ? 'Contacted' : 'Lost', amount: b ? 600000 : 100, owner: c ? 'Rahul Verma' : 'Priya Shah' };
    assert.equal(matchesFilterGroups(candidate, groups, 'any'), (a && b) || c, `${a}, ${b}, ${c}`);
  }
});

test('mixed filter groups evaluate (A OR B) AND C without flattening the groups', async () => {
  const { matchesFilterGroups } = await import('../src/utils/table.js');
  const groups = [
    { match: 'any', rules: [rule('stage', 'eq', 'Contacted'), rule('amount', 'gt', 500000)] },
    { match: 'all', rules: [rule('owner', 'eq', 'Rahul Verma')] },
  ];
  for (const a of [false, true]) for (const b of [false, true]) for (const c of [false, true]) {
    const candidate = { ...deal, stage: a ? 'Contacted' : 'Lost', amount: b ? 600000 : 100, owner: c ? 'Rahul Verma' : 'Priya Shah' };
    assert.equal(matchesFilterGroups(candidate, groups, 'all'), (a || b) && c);
  }
});

test('empty or incomplete groups cannot silently match all deals', async () => {
  const { validFilterGroups, cleanFilterGroups, matchesFilterGroups } = await import('../src/utils/table.js');
  assert.equal(validFilterGroups([]), true);
  assert.equal(validFilterGroups([{ match: 'all', rules: [] }]), false);
  assert.equal(validFilterGroups([{ match: 'any', rules: [rule('company', 'contains', '')] }]), false);
  assert.equal(validFilterGroups([{ match: 'invalid', rules: [rule('stage', 'eq', 'Lost')] }]), false);
  assert.deepEqual(cleanFilterGroups([{ match: 'all', rules: [] }]), []);
  assert.equal(matchesFilterGroups(deal, [{ match: 'all', rules: [] }], 'any'), false);
});

test('date filters reject impossible calendar days and unknown enum values', () => {
  assert.equal(validRule(rule('closeAt', 'eq', '2026-02-30')), false);
  assert.equal(validRule(rule('closeAt', 'eq', '2026-13-01')), false);
  assert.equal(validRule(rule('closeAt', 'eq', '2024-02-29')), true);
  assert.equal(validRule(rule('owner', 'eq', 'Unknown person')), false);
  assert.equal(validRule(rule('stage', 'eq', 'Unknown stage')), false);
});

test('compiled grouped filters retain AND/OR and calendar-day matching across records', async () => {
  const { compileFilterGroups } = await import('../src/utils/table.js');
  const matches = compileFilterGroups([
    { match: 'all', rules: [rule('closeAt', 'eq', '2026-11-19'), rule('amount', 'gte', 500000)] },
    { match: 'any', rules: [rule('owner', 'eq', 'Rahul Verma'), rule('stage', 'eq', 'Won')] },
  ], 'any');
  assert.equal(matches(deal), true);
  assert.equal(matches({ ...deal, amount: 1 }), false);
  assert.equal(matches({ ...deal, amount: 1, stage: 'Won' }), true);
  assert.equal(matches({ ...deal, amount: 1, owner: 'Rahul Verma' }), true);
});
