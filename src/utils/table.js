import { COLUMNS, DEFAULT_COLUMNS, OPERATORS, OWNERS, STAGES } from '../constants.js';
import { reasonForDeal, priorityScore } from '../data/deals.js';

const byKey = new Map(COLUMNS.map(column => [column.key, column]));
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

export function normalizeColumns(keys) {
  if (!Array.isArray(keys)) return [...DEFAULT_COLUMNS];
  const valid = [...new Set(keys.filter(key => byKey.has(key)))];
  return valid.length ? valid : [...DEFAULT_COLUMNS];
}
export function fieldValue(deal, key) {
  if (key === 'reason') return reasonForDeal(deal);
  if (key === 'priority') return priorityScore(deal);
  return deal[key];
}
export function compareValues(left, right, direction) {
  const comparison = typeof left === 'number' && typeof right === 'number'
    ? left - right : collator.compare(String(left ?? ''), String(right ?? ''));
  return comparison * (direction === 'desc' ? -1 : 1);
}
export function compareDeals(a, b, key, direction) {
  return compareValues(fieldValue(a, key), fieldValue(b, key), direction) || a.id - b.id;
}
export function validRule(rule) {
  if (!rule || typeof rule !== 'object' || !['string', 'number'].includes(typeof rule.value)) return false;
  const column = byKey.get(rule.field);
  if (!column || !OPERATORS[column.type].some(([key]) => key === rule.operator)) return false;
  if (String(rule.value ?? '').trim() === '') return false;
  if (column.type === 'number') return Number.isFinite(Number(rule.value));
  if (column.type === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rule.value)) return false;
    const date = new Date(`${rule.value}T00:00:00`);
    // Date parsing rolls February 30 into March; reject those impossible days.
    return Number.isFinite(date.getTime())
      && date.getFullYear() === Number(rule.value.slice(0, 4))
      && date.getMonth() + 1 === Number(rule.value.slice(5, 7))
      && date.getDate() === Number(rule.value.slice(8, 10));
  }
  if (column.type === 'person') return OWNERS.includes(String(rule.value).trim());
  if (column.type === 'stage') return STAGES.includes(String(rule.value).trim());
  return true;
}

function compileRule(rule) {
  if (!validRule(rule)) return () => false;
  const { type } = byKey.get(rule.field);
  let expected = rule.value;
  if (type === 'date') {
    expected = new Date(`${expected}T00:00:00`).getTime();
  } else if (type === 'number') {
    expected = Number(expected);
  } else {
    expected = String(expected).trim().toLowerCase();
  }
  return deal => {
    let actual = fieldValue(deal, rule.field);
    if (type === 'date') {
      const date = new Date(actual);
      date.setHours(0, 0, 0, 0);
      actual = date.getTime();
    } else if (type !== 'number') {
      actual = String(actual ?? '').toLowerCase();
    }
    switch (rule.operator) {
      case 'eq': return actual === expected;
      case 'neq': return actual !== expected;
      case 'contains': return actual.includes(expected);
      case 'notContains': return !actual.includes(expected);
      case 'startsWith': return actual.startsWith(expected);
      case 'gt': return actual > expected;
      case 'gte': return actual >= expected;
      case 'lt': return actual < expected;
      case 'lte': return actual <= expected;
      default: return false;
    }
  };
}

export function matchesRule(deal, rule) {
  return compileRule(rule)(deal);
}
export function matchesFilters(deal, rules, match = 'all') {
  if (!rules.length) return true;
  return match === 'any' ? rules.some(rule => matchesRule(deal, rule)) : rules.every(rule => matchesRule(deal, rule));
}

// Groups provide explicit parentheses: conditions within each group combine
// using its match mode, then group results combine using the outer mode.
export function validFilterGroups(groups) {
  return Array.isArray(groups) && groups.every(group => group && ['all', 'any'].includes(group.match)
    && Array.isArray(group.rules) && group.rules.length > 0 && group.rules.every(validRule));
}

export function cleanFilterGroups(groups) {
  if (!Array.isArray(groups)) return [];
  return groups.filter(group => validFilterGroups([group])).map(group => ({
    match: group.match,
    rules: group.rules.map(({ field, operator, value }) => ({ field, operator, value })),
  }));
}

export function matchesFilterGroups(deal, groups, match = 'all') {
  return compileFilterGroups(groups, match)(deal);
}

// Compile once before scanning the dataset: validation and expected-value parsing
// depend on the filter, not on each of the 50,000 records.
export function compileFilterGroups(groups, match = 'all') {
  if (!groups.length) return () => true;
  const predicates = groups.map(group => {
    const rules = group.rules.map(compileRule);
    return deal => rules.length > 0 && (group.match === 'any'
      ? rules.some(matches => matches(deal))
      : rules.every(matches => matches(deal)));
  });
  return deal => match === 'any'
    ? predicates.some(matches => matches(deal))
    : predicates.every(matches => matches(deal));
}

export function describeFilterGroups(groups, match) {
  return groups.map(group => `(${group.rules.map(rule => {
    const field = COLUMNS.find(field => field.key === rule.field);
    const operator = OPERATORS[field?.type ?? 'text'].find(([key]) => key === rule.operator)?.[1] ?? rule.operator;
    return `${field?.label ?? 'Field'} ${operator} ${String(rule.value).trim() ? JSON.stringify(rule.value) : '…'}`;
  }).join(group.match === 'any' ? ' OR ' : ' AND ')})`).join(match === 'any' ? ' OR ' : ' AND ');
}
