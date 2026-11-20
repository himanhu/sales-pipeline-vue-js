import {
  STAGES,
  OWNERS,
  FIRST_NAMES,
  SECOND_NAMES,
  DAY,
  DEMO_DEAL_COUNT,
  DATA_SEED,
  PRIORITY_RULES,
} from '../constants.js';
// A small, deterministic dataset generator. No TypeScript or backend needed.

// Seeded randomness ensures the same example deal distribution every run.
function randomGenerator(seed) {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4_294_967_296;
  };
}

export function isClosed(stage) {
  return stage === 'Won' || stage === 'Lost';
}

export function createDeals(count = DEMO_DEAL_COUNT) {
  const random = randomGenerator(DATA_SEED);
  const now = Date.now();
  const deals = [];

  for (let i = 0; i < count; i++) {
    const r = random() * 100;
    const stage = STAGES[r < 23 ? 0 : r < 44 ? 1 : r < 61 ? 2 : r < 78 ? 3 : r < 92 ? 4 : r < 96 ? 5 : 6];
    const company = `${FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)]} ${SECOND_NAMES[Math.floor(random() * SECOND_NAMES.length)]} ${i + 1}`;
    const daysToClose = Math.floor(random() * 90) - 35;
    const daysSinceContact = Math.floor(random() * 42);

    deals.push({
      id: 100_001 + i,
      company,
      owner: OWNERS[Math.floor(random() * OWNERS.length)],
      stage,
      amount: (Math.floor(random() * 110) + 2) * 25_000,
      closeAt: now + daysToClose * DAY,
      lastTouchAt: now - daysSinceContact * DAY,
      updatedAt: now - Math.floor(random() * 25) * DAY,
      createdAt: now - (60 + i % 180) * DAY,
      createdBy: OWNERS[i % OWNERS.length],
      modifiedBy: OWNERS[(i + 3) % OWNERS.length],
      revision: 1,
    });
  }
  return deals;
}

const daysUntil = (timestamp) => Math.ceil((timestamp - Date.now()) / DAY);
const daysSince = (timestamp) => Math.floor((Date.now() - timestamp) / DAY);

export function reasonForDeal(deal) {
  if (isClosed(deal.stage)) return 'Closed';
  if (daysUntil(deal.closeAt) < 0) return 'Overdue';
  if (daysSince(deal.lastTouchAt) >= PRIORITY_RULES.staleDays) return 'No activity';
  if (daysUntil(deal.closeAt) <= PRIORITY_RULES.dueSoonDays) return 'Due soon';
  if (deal.amount >= PRIORITY_RULES.highValue) return 'High value';
  return 'On track';
}

export function priorityScore(deal) {
  if (isClosed(deal.stage)) return -10_000;
  const late = Math.max(0, -daysUntil(deal.closeAt));
  const stale = Math.max(0, daysSince(deal.lastTouchAt) - PRIORITY_RULES.staleDays);
  const soon = daysUntil(deal.closeAt) >= 0 && daysUntil(deal.closeAt) <= PRIORITY_RULES.dueSoonDays ? 70 : 0;
  return late * 12 + stale * 7 + soon + Math.floor(deal.amount / 100_000);
}

export function needsAttention(deal) {
  return !isClosed(deal.stage) && reasonForDeal(deal) !== 'On track';
}

