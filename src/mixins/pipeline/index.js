import { markRaw } from 'vue';
import {
  DEFAULT_COLUMNS,
  DEFAULT_SETTINGS,
  DEFAULT_VIEWPORT_HEIGHT,
  COLUMN_STORAGE_KEY,
  MINUTE_MS,
} from '../../constants.js';
import { createDeals } from '../../data/deals.js';
import { createFakePipelineApi } from '../../services/fakeApi.js';
import { normalizeColumns } from '../../utils/table.js';
import view from './view.js';
import saves from './saves.js';
import table from './table.js';
import details from './details.js';

// Shared state and lifecycle. Each imported mixin owns one behavior area.
export default {
  mixins: [view, saves, table, details],

  data() {
    const api = createFakePipelineApi(createDeals());
    return {
      // Raw Maps avoid deep reactivity for 50,000 records. The version counters
      // below explicitly invalidate computed values after a Map changes.
      api: markRaw(api),
      confirmed: markRaw(api.snapshot()),
      edits: markRaw(new Map()),
      commentDrafts: markRaw(new Map()),
      commentVersion: 0,
      activityVersion: 0,
      ownershipNotice: '',
      rowElements: markRaw(new Map()),
      nextToken: 0,
      runtime: markRaw({ unsubscribe: null, timer: null, resizeObserver: null, searchTimer: null, routeReady: false }),
      recordsVersion: 0,
      editsVersion: 0,
      refreshVersion: 0,
      mode: 'attention',
      search: '',
      deferredSearch: '',
      filterGroups: [],
      filterMatch: 'all',
      columnKeys: [...DEFAULT_COLUMNS],
      showColumns: false,
      sortMode: 'priority',
      sortDirection: 'desc',
      selected: new Set(),
      bulkStage: 'Lost',
      bulkProgress: null,
      confirmBulk: false,
      conflictResolution: null,
      settings: { ...DEFAULT_SETTINGS },
      updatesWaiting: 0,
      lastTeammateEvent: 'No teammate changes yet',
      activeId: null,
      detailId: null,
      showHelp: false,
      shareLink: '',
      shareMessage: '',
      scrollTop: 0,
      viewportHeight: DEFAULT_VIEWPORT_HEIGHT,
      viewportEl: null,
      searchEl: null,
    };
  },

  mounted() {
    try {
      const saved = localStorage.getItem(COLUMN_STORAGE_KEY);
      if (saved) this.columnKeys = normalizeColumns(JSON.parse(saved));
    } catch { /* Storage may be unavailable; keep the default columns. */ }

    this.runtime.unsubscribe = this.api.subscribe((deal) => {
      this.updateConfirmed([deal]);
      const edit = this.edits.get(deal.id);
      if (edit && deal.revision > edit.baseRevision) {
        this.edits.set(deal.id, { ...edit, status: 'conflict', remoteStage: deal.stage });
        this.notifyEdits();
      }
      this.updatesWaiting++;
      this.lastTeammateEvent = `#${deal.id} moved to ${deal.stage}`;
    });
    this.restartTeammates();
    if (this.viewportEl) {
      this.runtime.resizeObserver = new ResizeObserver(() => {
        this.viewportHeight = this.viewportEl?.clientHeight ?? DEFAULT_VIEWPORT_HEIGHT;
      });
      this.runtime.resizeObserver.observe(this.viewportEl);
      this.viewportHeight = this.viewportEl.clientHeight;
    }
    document.addEventListener('keydown', this.onDocumentKeydown);
    if (typeof window !== 'undefined') {
      this.handleDealRoute();
      this.runtime.routeReady = true;
      this.syncViewUrl();
      window.addEventListener('hashchange', this.handleDealRoute);
      window.addEventListener('popstate', this.handleDealRoute);
    }
  },

  beforeUnmount() {
    clearTimeout(this.runtime.searchTimer);
    this.runtime.unsubscribe?.();
    clearInterval(this.runtime.timer);
    this.runtime.resizeObserver?.disconnect();
    document.removeEventListener('keydown', this.onDocumentKeydown);
    if (typeof window !== 'undefined') {
      window.removeEventListener('hashchange', this.handleDealRoute);
      window.removeEventListener('popstate', this.handleDealRoute);
    }
  },

  watch: {
    settings: {
      deep: true,
      handler() {
        this.api.configure({ ...this.settings });
        this.restartTeammates();
      },
    },
  },

  methods: {
    simulateFocusedTeammate() {
      this.api.simulateTeammateUpdate(this.activeId ?? this.viewIds[0]);
    },

    restartTeammates() {
      clearInterval(this.runtime.timer);
      this.runtime.timer = undefined;
      if (this.settings.teammateUpdatesPerMinute > 0) {
        this.runtime.timer = setInterval(() => this.api.simulateTeammateUpdate(), MINUTE_MS / this.settings.teammateUpdatesPerMinute);
      }
    },
  },
};
