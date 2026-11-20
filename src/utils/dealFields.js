import { EDITABLE_FIELDS, COMPANY_MAX_LENGTH, OWNERS, STAGES } from '../constants.js';

// The fake server accepts business fields only. IDs, revisions, and audit
// metadata are always controlled by the server.
export function editablePatch(values) {
  const patch = {};
  for (const key of EDITABLE_FIELDS) {
    if (!Object.hasOwn(values, key)) continue;
    const value = values[key];
    if (key === 'company') {
      if (typeof value !== 'string' || !value.trim() || value.trim().length > COMPANY_MAX_LENGTH) throw new Error('Enter a company name of 1–200 characters.');
      patch[key] = value.trim();
    } else if (key === 'owner') {
      if (!OWNERS.includes(value)) throw new Error('Choose a valid owner.');
      patch[key] = value;
    } else if (key === 'stage') {
      if (!STAGES.includes(value)) throw new Error('Choose a valid stage.');
      patch[key] = value;
    } else {
      if (typeof value !== 'number' || !Number.isFinite(value) || (key === 'amount' && value < 0)) throw new Error(`Enter a valid ${key === 'amount' ? 'non-negative value' : 'date'}.`);
      if (key !== 'amount' && Number.isNaN(new Date(value).getTime())) throw new Error('Enter a valid date.');
      patch[key] = value;
    }
  }
  return patch;
}

export function localDateTime(timestamp) {
  const date = new Date(timestamp);
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function dealForm(record) {
  return {
    company: record.company, owner: record.owner, amount: String(record.amount),
    stage: record.stage, closeAt: localDateTime(record.closeAt), lastTouchAt: localDateTime(record.lastTouchAt),
  };
}

export function formPatch(form, baseline) {
  const patch = {};
  for (const key of EDITABLE_FIELDS) {
    if (form[key] === baseline[key]) continue;
    if (key === 'amount') patch[key] = String(form[key]).trim() === '' ? NaN : Number(form[key]);
    else if (key === 'closeAt' || key === 'lastTouchAt') patch[key] = new Date(form[key]).getTime();
    else patch[key] = form[key];
  }
  return editablePatch(patch);
}
