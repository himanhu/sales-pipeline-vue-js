import { DEFAULT_SETTINGS, COMMENT_MAX_LENGTH } from '../constants.js';
import { isClosed } from '../data/deals.js';
import { STAGES, ME, OWNERS } from '../constants.js';

import { editablePatch } from '../utils/dealFields.js';

// Functional fake API: closure holds the server's state, no classes or network.
export function createFakePipelineApi(initialDeals, initialSettings = DEFAULT_SETTINGS, random = Math.random) {
  const records = new Map(initialDeals.map((deal) => [deal.id, { ...deal }]));
  const ids = initialDeals.map((deal) => deal.id);
  const listeners = new Set();
  const activity = new Map();
  let nextActivityId = 0;
  let settings = { ...initialSettings };

  const snapshot = () => new Map(records);
  const get = (id) => records.get(id);
  const configure = (next) => { settings = { ...next }; };

  function subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  function ensureActivity(deal) {
    if (!activity.has(deal.id)) {
      activity.set(deal.id, [{
        id: ++nextActivityId,
        type: 'created',
        actor: deal.createdBy,
        timestamp: deal.createdAt,
        owner: deal.owner,
      }]);
    }
    return activity.get(deal.id);
  }

  function recordChanges(before, after, actor) {
    const history = ensureActivity(before);
    const changes = Object.keys(editablePatch(after))
      .filter(field => before[field] !== after[field])
      .map(field => ({ field, before: before[field], after: after[field] }));
    if (changes.length) history.push({
      id: ++nextActivityId,
      type: 'changed',
      actor,
      timestamp: after.updatedAt,
      revision: after.revision,
      changes,
    });
  }

  function getActivity(id) {
    const deal = records.get(id);
    if (!deal) return [];
    return ensureActivity(deal).map(entry => ({ ...entry, ...(entry.changes ? { changes: entry.changes.map(change => ({ ...change })) } : {}) }))
      .sort((a, b) => b.timestamp - a.timestamp || b.id - a.id);
  }

  async function waitForNetwork() {
    const delay = settings.minDelayMs + random() * Math.max(0, settings.maxDelayMs - settings.minDelayMs);
    await new Promise(resolve => setTimeout(resolve, delay));
    if (random() * 100 < settings.failureRate) throw new Error('Simulated network failure');
  }

  async function addComment(id, text) {
    if (!records.has(id)) throw new Error('Deal not found');
    if (typeof text !== 'string' || !text.trim() || text.trim().length > COMMENT_MAX_LENGTH) throw new Error('Comments must contain 1–2,000 characters.');
    await waitForNetwork();
    const entry = { id: ++nextActivityId, type: 'comment', actor: ME, timestamp: Date.now(), text: text.trim() };
    ensureActivity(records.get(id)).push(entry);
    return { ...entry };
  }

  async function saveBatch(requests) {
    // Fail before committing records or writing history.
    await waitForNetwork();

    // Validate the entire batch before committing any records.
    const prepared = requests.map(request => ({ ...request, patch: editablePatch(request.patch ?? { stage: request.stage }) }));
    const saved = [];
    const conflicts = [];
    for (const request of prepared) {
      const current = records.get(request.id);
      if (!current) continue;
      if (current.revision !== request.expectedRevision) {
        conflicts.push(current);
        continue;
      }
      const updated = {
        ...current,
        ...request.patch,
        revision: current.revision + 1,
        updatedAt: Date.now(),
        modifiedBy: ME,
      };
      recordChanges(current, updated, ME);
      records.set(request.id, updated);
      saved.push(updated);
    }
    return { saved, conflicts };
  }

  function simulateTeammateUpdate(specificId) {
    if (!ids.length) return null;
    const id = specificId ?? ids[Math.floor(random() * ids.length)];
    const current = records.get(id);
    if (!current) return null;
    const options = STAGES.filter((stage) =>
      stage !== current.stage && (!isClosed(current.stage) || !isClosed(stage))
    );
    const stage = options[Math.floor(random() * options.length)];
    const teammate = OWNERS.filter(owner => owner !== ME)[id % (OWNERS.length - 1)];
    const updated = { ...current, stage, revision: current.revision + 1, updatedAt: Date.now(), modifiedBy: teammate };
    recordChanges(current, updated, teammate);
    records.set(id, updated);
    listeners.forEach((listener) => listener(updated));
    return updated;
  }

  return { snapshot, get, configure, subscribe, saveBatch, simulateTeammateUpdate, getActivity, addComment };
}
