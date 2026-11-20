import { COLUMNS } from '../constants.js';
import { validRule, cleanFilterGroups } from './table.js';

// Links contain view criteria only, never selected IDs, drafts, or deal data.
export function parseViewHash(hash) {
  const raw = String(hash || '').replace(/^#/, '');
  const split = raw.indexOf('?');
  const path = split === -1 ? raw : raw.slice(0, split);
  const params = new URLSearchParams(split === -1 ? '' : raw.slice(split + 1));
  const detail = path.match(/^\/deals\/(\d+)$/);
  let groups = [];
  let match = params.get('match') === 'any' ? 'any' : 'all';
  try {
    if (params.has('groups')) {
      groups = cleanFilterGroups(JSON.parse(params.get('groups')));
    } else {
      // Previously shared flat filters retain their original AND/OR meaning.
      const parsed = JSON.parse(params.get('filters') || '[]');
      const rules = Array.isArray(parsed) ? parsed.filter(validRule).map(({ field, operator, value }) => ({ field, operator, value })) : [];
      if (rules.length) groups = [{ match, rules }];
      match = 'all';
    }
  } catch { /* Malformed criteria fall back to an unfiltered view. */ }
  if (!groups.length) match = 'all';
  const sort = params.get('sort');
  return {
    detailId: detail ? Number(detail[1]) : null,
    mode: params.get('view') === 'all' ? 'all' : 'attention',
    search: params.get('search') || '',
    filterGroups: groups,
    filterMatch: match,
    sortMode: sort === 'priority' || COLUMNS.some(column => column.key === sort) ? sort : 'priority',
    sortDirection: params.get('direction') === 'asc' ? 'asc' : 'desc',
  };
}

export function buildViewHash(state) {
  const params = new URLSearchParams();
  params.set('view', state.mode);
  if (state.search) params.set('search', state.search);
  if (state.filterGroups.length) {
    params.set('groups', JSON.stringify(cleanFilterGroups(state.filterGroups)));
    params.set('match', state.filterMatch);
  }
  params.set('sort', state.sortMode);
  params.set('direction', state.sortDirection);
  const path = state.detailId === null ? '/pipeline' : `/deals/${state.detailId}`;
  return `#${path}?${params.toString()}`;
}
