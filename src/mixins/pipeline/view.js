import { ME, COLUMNS, COLUMN_STORAGE_KEY, SEARCH_DEBOUNCE_MS } from '../../constants.js';
import { needsAttention } from '../../data/deals.js';
import { buildViewHash, parseViewHash } from '../../utils/viewUrl.js';
import {
  normalizeColumns,
  compareValues,
  fieldValue,
  compileFilterGroups,
  validFilterGroups,
  cleanFilterGroups,
} from '../../utils/table.js';

// Options API behavior for view. State is declared once in index.js.
export default {
  computed: {
    viewHash() {
      return buildViewHash({
        detailId: this.detailId,
        mode: this.mode,
        search: this.search,
        filterGroups: this.filterGroups,
        filterMatch: this.filterMatch,
        sortMode: this.sortMode,
        sortDirection: this.sortDirection,
      });
    },

    visibleColumns() { return this.columnKeys.map(key => COLUMNS.find(column => column.key === key)); },

    viewIds() {
      void this.refreshVersion;
      const query = this.deferredSearch.trim().toLowerCase();
      const currentMode = this.mode;
      const groups = this.filterGroups;
      const match = this.filterMatch;
      const currentSort = this.sortMode;
      const direction = this.sortDirection;
      const matchesFilters = compileFilterGroups(groups, match);
      const matches = [];

      for (const record of this.confirmed.values()) {
        const edit = this.edits.get(record.id);
        const deal = edit ? { ...record, ...edit.patch } : record;
        if (currentMode === 'attention' && (deal.owner !== ME || !needsAttention(deal))) continue;
        if (!matchesFilters(deal)) continue;
        if (query && !`${deal.company} ${deal.owner} ${deal.id}`.toLowerCase().includes(query)) continue;
        // Calculate expensive values such as priority once per record, not
        // again for every comparison during sorting.
        matches.push({ id: deal.id, sortValue: fieldValue(deal, currentSort) });
      }

      matches.sort((a, b) => compareValues(a.sortValue, b.sortValue, direction) || a.id - b.id);
      return matches.map((item) => item.id);
    },

    indexById() { return new Map(this.viewIds.map((id, index) => [id, index])); },

    total() { return this.viewIds.length; },

    allMatchingSelected() { return this.total > 0 && this.viewIds.every((id) => this.selected.has(id)); },
  },
  watch: {
    viewHash() { this.syncViewUrl(); this.shareLink = ''; this.shareMessage = ''; },

    search(value) {
      // Wait until typing pauses before scanning the full dataset.
      clearTimeout(this.runtime.searchTimer);
      this.runtime.searchTimer = setTimeout(() => { this.deferredSearch = value; }, SEARCH_DEBOUNCE_MS);
    },

    mode: 'resetView',

    filterGroups: 'resetView',

    filterMatch: 'resetView',

    sortDirection: 'resetView',

    sortMode: 'resetView',

    deferredSearch: 'resetView',

    refreshVersion: 'resetView',

    viewIds: {
      immediate: true,
      handler(ids) {
        if (!ids.length) this.activeId = null;
        else if (this.activeId === null || !this.indexById.has(this.activeId)) this.activeId = ids[0];
      },
    },
  },
  methods: {
    syncViewUrl() {
      if (typeof window === 'undefined' || !this.runtime.routeReady) return;
      if (window.location.hash !== this.viewHash) window.history.replaceState(null, '', this.viewHash);
    },

    async copyViewLink() {
      if (typeof window === 'undefined') return;
      this.syncViewUrl();
      const url = new URL(window.location.href);
      url.hash = this.viewHash;
      const link = url.href;
      try {
        await navigator.clipboard.writeText(link);
        this.shareMessage = 'Link copied';
      } catch {
        this.shareLink = link;
        this.shareMessage = 'Select and copy this link';
      }
    },

    handleDealRoute() {
      const route = parseViewHash(window.location.hash);
      const id = this.confirmed.has(route.detailId) ? route.detailId : null;
      if (id !== this.detailId && this.$refs.dealDetails && !this.$refs.dealDetails.canLeave()) {
        window.history.replaceState(null, '', this.viewHash);
        return;
      }
      this.detailId = id;
      if (id !== null) this.activeId = id;
      this.mode = route.mode;
      if (this.search !== route.search) {
        clearTimeout(this.runtime.searchTimer);
        this.search = route.search;
        this.deferredSearch = route.search;
      }
      if (JSON.stringify(this.filterGroups) !== JSON.stringify(route.filterGroups)) this.filterGroups = route.filterGroups;
      this.filterMatch = route.filterMatch;
      this.sortMode = route.sortMode;
      this.sortDirection = route.sortDirection;
    },

    openDeal(id) {
      if (!this.confirmed.has(id)) return;
      this.detailId = id;
      this.activeId = id;
      if (typeof window !== 'undefined') window.location.hash = this.viewHash;
    },

    closeDeal() {
      const id = this.detailId;
      this.detailId = null;
      if (typeof window !== 'undefined') window.location.hash = this.viewHash;
      this.$nextTick(async () => {
        if (this.viewportEl) this.viewportHeight = this.viewportEl.clientHeight;
        await this.$nextTick();
        if (this.indexById.has(id)) {
          await this.focusRow(id);
          const row = this.rowElements.get(id);
          (row?.querySelector('.deal-info-button') ?? row ?? this.searchEl)?.focus();
        } else {
          this.searchEl?.focus();
        }
      });
    },

    sortColumn(key) {
      if (!COLUMNS.some(column => column.key === key)) return;
      if (this.sortMode === key) this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      else { this.sortMode = key; this.sortDirection = 'asc'; }
    },

    applyFilters({ groups, match }) {
      if (!validFilterGroups(groups)) return;
      this.filterGroups = cleanFilterGroups(groups);
      this.filterMatch = this.filterGroups.length && match === 'any' ? 'any' : 'all';
    },

    updateColumns(keys) {
      this.columnKeys = normalizeColumns(keys);
      try { localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(this.columnKeys)); }
      catch { /* Column choices still work for this session. */ }
    },

    resetView() {
      this.selected = new Set();
      this.scrollTop = 0;
      if (this.viewportEl) this.viewportEl.scrollTop = 0;
      if (!this.indexById.has(this.activeId)) this.activeId = this.viewIds[0] ?? null;
    },

    toggleRow(id) {
      const next = new Set(this.selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      this.selected = next;
    },

    toggleAllResults() {
      const next = new Set(this.selected);
      const deselect = this.allMatchingSelected;
      for (const id of this.viewIds) {
        if (deselect) next.delete(id);
        else next.add(id);
      }
      this.selected = next;
    },

    clearSelection() { this.selected = new Set(); },

    applyChanges() { this.refreshVersion++; this.updatesWaiting = 0; },
  },
};
