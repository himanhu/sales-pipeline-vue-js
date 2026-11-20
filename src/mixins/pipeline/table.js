import { ROW_HEIGHT, OVERSCAN } from '../../constants.js';
import { reasonForDeal } from '../../data/deals.js';

// Options API behavior for table. State is declared once in index.js.
export default {
  computed: {
    start() { return Math.max(0, Math.floor(this.scrollTop / ROW_HEIGHT) - OVERSCAN); },

    end() { return Math.min(this.total, Math.ceil((this.scrollTop + this.viewportHeight) / ROW_HEIGHT) + OVERSCAN); },

    renderedCount() { return Math.max(0, this.end - this.start); },

    topSpacer() { return this.start * ROW_HEIGHT; },

    bottomSpacer() { return Math.max(0, this.total - this.end) * ROW_HEIGHT; },

    visibleRows() {
      void this.recordsVersion;
      void this.editsVersion;
      return this.viewIds.slice(this.start, this.end).flatMap((id) => {
        const record = this.confirmed.get(id);
        if (!record) return [];
        const edit = this.edits.get(id);
        const shown = edit ? { ...record, ...edit.patch } : record;
        return [{ id, record, edit, shown, reason: reasonForDeal(shown), rowIndex: this.indexById.get(id) + 2 }];
      });
    },
  },
  methods: {
    onScroll(event) { this.scrollTop = event.target.scrollTop; },

    captureRow(element, id) {
      if (element instanceof HTMLDivElement) this.rowElements.set(id, element);
      else this.rowElements.delete(id);
    },

    async focusRow(id) {
      const index = this.indexById.get(id);
      const viewport = this.viewportEl;
      if (index === undefined || !viewport) return;
      const top = index * ROW_HEIGHT;
      const bottom = top + ROW_HEIGHT;
      if (top < viewport.scrollTop) viewport.scrollTop = top;
      else if (bottom > viewport.scrollTop + viewport.clientHeight) {
        viewport.scrollTop = bottom - viewport.clientHeight;
      }
      this.scrollTop = viewport.scrollTop;
      this.activeId = id;
      await this.$nextTick();
      this.rowElements.get(id)?.focus();
    },

    onRowKeydown(event, id) {
      if (event.target !== event.currentTarget) return;
      if (event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return;
      const index = this.indexById.get(id);
      if (index === undefined) return;
      const key = event.key.toLowerCase();
      if (key === 'arrowdown' || key === 'j') {
        event.preventDefault();
        void this.focusRow(this.viewIds[Math.min(this.viewIds.length - 1, index + 1)]);
      } else if (key === 'arrowup' || key === 'k') {
        event.preventDefault();
        void this.focusRow(this.viewIds[Math.max(0, index - 1)]);
      } else if (key === 'x' || key === ' ') {
        event.preventDefault();
        this.toggleRow(id);
      } else if (key === 'm' || key === 'enter') {
        event.preventDefault();
        this.rowElements.get(id)?.querySelector('select')?.focus();
      }
    },

    onDocumentKeydown(event) {
      if (event.defaultPrevented || event.isComposing) return;
      if (this.detailId !== null) return;
      if (this.showHelp || this.confirmBulk || this.conflictResolution || this.showColumns) {
        if (event.key === 'Escape') { this.showHelp = false; this.confirmBulk = false; this.conflictResolution = null; this.showColumns = false; }
        return;
      }
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) return;
      if (event.target.closest?.('[contenteditable="true"], [contenteditable=""], [role="textbox"]')) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === '/') { event.preventDefault(); this.searchEl?.focus(); }
      if (event.key === '?') { event.preventDefault(); this.showHelp = true; }
    },
  },
};
