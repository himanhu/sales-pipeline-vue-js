// Static configuration and shared options. Business logic lives in utils/ and mixins/.
export const APP_NAME = 'HighPoint';
export const APP_AUTHOR = 'Himashu';
export const DEMO_DEAL_COUNT = 50_000;
export const DATA_SEED = 20261117;
export const ROW_HEIGHT = 84;
export const TABLE_SELECTION_WIDTH = 42;
export const TABLE_HORIZONTAL_PADDING = 32;
export const MINUTE_MS = 60_000;
export const OVERSCAN = 9;
export const BATCH_SIZE = 500;
export const PARALLEL_SAVES = 4;
export const SEARCH_DEBOUNCE_MS = 120;
export const DEFAULT_VIEWPORT_HEIGHT = 570;
export const COMPANY_MAX_LENGTH = 200;
export const COMMENT_MAX_LENGTH = 2000;
export const PRIORITY_RULES = { staleDays: 14, dueSoonDays: 7, highValue: 1_750_000 };

export const STAGES = [
  'New Lead', 'Contacted', 'Demo Done', 'Proposal Sent',
  'Negotiation', 'Won', 'Lost',
];

export const ME = 'Priya Shah';

export const OWNERS = [
  ME, 'Arjun Rao', 'Nisha Patel', 'Kabir Singh', 'Sana Khan',
  'Dev Mehta', 'Meera Iyer', 'Rohan Gupta', 'Tara Das', 'Vikram Nair',
  'Ayesha Ali', 'Neel Joshi', 'Aditi Bose', 'Rahul Verma', 'Kavya Sethi',
  'Om Bhat', 'Riya Kapoor', 'Sam Roy', 'Anika Jain', 'Ishaan Menon',
];

export const FIRST_NAMES = [
  'Acme', 'Northstar', 'Bluebird', 'Atlas', 'Nimbus', 'Meridian',
  'Summit', 'Cascade', 'Orbit', 'Evergreen', 'Prism', 'Harbor',
  'Helix', 'Nova', 'Copper', 'Vertex', 'Pioneer', 'Quanta',
  'Cedar', 'Horizon', 'Astra', 'Brightpath', 'Lighthouse', 'Delta',
];

export const SECOND_NAMES = [
  'Labs', 'Systems', 'Health', 'Retail', 'Logistics', 'Cloud',
  'Financial', 'Networks', 'Software', 'Technologies', 'Media', 'Group',
];

export const DAY = 86_400_000;

export const DEFAULT_SETTINGS = {
  minDelayMs: 300,
  maxDelayMs: 1500,
  failureRate: 10,
  teammateUpdatesPerMinute: 6,
};

export const EDITABLE_FIELDS = ['company', 'owner', 'amount', 'stage', 'closeAt', 'lastTouchAt'];

export const DEAL_FIELD_LABELS = {
  company: 'Company',
  owner: 'Owner',
  amount: 'Value',
  stage: 'Stage',
  closeAt: 'Close date',
  lastTouchAt: 'Last activity',
};
export const STAGE_CLASSES = {
  Won: 'stage-won',
  Lost: 'stage-lost',
  Negotiation: 'stage-negotiation',
  'Proposal Sent': 'stage-proposal',
  'Demo Done': 'stage-demo',
};
export const REASON_CLASSES = { Overdue: 'reason-overdue', 'No activity': 'reason-stale', 'Due soon': 'reason-soon' };

export const COLUMNS = [
  { key: 'company', label: 'Company', type: 'text', width: 210 },
  { key: 'id', label: 'Deal ID', type: 'number', width: 115 },
  { key: 'owner', label: 'Owner', type: 'person', width: 160 },
  { key: 'amount', label: 'Value', type: 'number', width: 120 },
  { key: 'closeAt', label: 'Close date', type: 'date', width: 130 },
  { key: 'reason', label: 'Why now', type: 'text', width: 140 },
  { key: 'stage', label: 'Stage / save status', type: 'stage', width: 310 },
  { key: 'createdAt', label: 'Created', type: 'date', width: 175 },
  { key: 'updatedAt', label: 'Modified', type: 'date', width: 175 },
  { key: 'createdBy', label: 'Created by', type: 'person', width: 160 },
  { key: 'modifiedBy', label: 'Modified by', type: 'person', width: 160 },
  { key: 'lastTouchAt', label: 'Last activity', type: 'date', width: 175 },
  { key: 'revision', label: 'Revision', type: 'number', width: 110 },
];

export const DEFAULT_COLUMNS = ['company', 'owner', 'amount', 'closeAt', 'reason', 'stage'];

export const COLUMN_STORAGE_KEY = 'flowline.columns.v1';

export const OPERATORS = {
  text: [['contains', 'contains'], ['notContains', 'does not contain'], ['eq', 'is'], ['neq', 'is not'], ['startsWith', 'starts with']],
  number: [['eq', '='], ['neq', '≠'], ['gt', '>'], ['gte', '≥'], ['lt', '<'], ['lte', '≤']],
  date: [['eq', 'on'], ['lt', 'before'], ['gt', 'after'], ['lte', 'on or before'], ['gte', 'on or after']],
  person: [['eq', 'is'], ['neq', 'is not']],
  stage: [['eq', 'is'], ['neq', 'is not']],
};

export const API_CONTROLS = [
  {
    key: 'failureRate',
    label: 'Save failure rate',
    icon: 'Wifi',
    min: 0,
    max: 100,
    step: 5,
    suffix: '%',
    start: 'Always succeeds',
    end: 'Always fails',
  },
  {
    key: 'maxDelayMs',
    label: 'Network delay',
    icon: 'Clock3',
    min: 300,
    max: 3000,
    step: 100,
    start: '300 ms',
    end: '3 sec',
  },
  {
    key: 'teammateUpdatesPerMinute',
    label: 'Teammate updates',
    icon: 'Users',
    min: 0,
    max: 60,
    step: 3,
    suffix: '/min',
    start: 'Paused',
    end: 'Busy team',
  },
];
