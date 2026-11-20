<script>
import PipelineFilters from './DealFilters/index.vue';
import PipelineNotices from './layout/PipelineNotices.vue';
import BulkActions from './DealTable/components/BulkActions.vue';
import DealTable from './DealTable/index.vue';

export default {
  components: { PipelineFilters, PipelineNotices, BulkActions, DealTable },
  props: {
    mode: String,
    search: String,
    filterGroups: { type: Array, required: true },
    filterMatch: String,
    total: { type: Number, required: true },
    shareMessage: String,
    shareLink: String,
    updatesWaiting: Number,
    ownershipNotice: String,
    metrics: { type: Object, required: true },
    bulkRunning: Boolean,
    selected: { type: Set, required: true },
    bulkStage: String,
    bulkProgress: Object,
    visibleRows: { type: Array, required: true },
    visibleColumns: { type: Array, required: true },
    sortMode: String,
    sortDirection: String,
    activeId: Number,
    start: Number,
    end: Number,
    renderedCount: Number,
    topSpacer: Number,
    bottomSpacer: Number,
    registerRow: { type: Function, required: true },
    allMatchingSelected: Boolean,
  },
  emits: [
    'update:mode', 'update:search', 'update:bulkStage',
    'apply-filters', 'reset-sort', 'search-ready', 'columns', 'share',
    'apply-updates', 'dismiss-ownership', 'retry-failed', 'resolve-all',
    'clear', 'request-move', 'dismiss-progress', 'sort', 'toggle-all',
    'viewport-ready', 'scroll', 'activate', 'toggle-select', 'row-keydown',
    'move', 'retry', 'accept', 'keep', 'open',
  ],
};
</script>

<template>
  <section class="pipeline-card" aria-label="Deal list">
    <PipelineFilters
      :mode="mode"
      @update:mode="$emit('update:mode', $event)"
      :search="search"
      @update:search="$emit('update:search', $event)"
      :groups="filterGroups"
      :match="filterMatch"
      @apply-filters="$emit('apply-filters', $event)"
      @reset-sort="$emit('reset-sort')"
      :total="total"
      @search-ready="$emit('search-ready', $event)"
      @columns="$emit('columns')"
      @share="$emit('share')"
    />
    <PipelineNotices
      :share-message="shareMessage"
      :share-link="shareLink"
      :updates-waiting="updatesWaiting"
      :ownership-notice="ownershipNotice"
      :metrics="metrics"
      :bulk-running="bulkRunning"
      @apply-updates="$emit('apply-updates')"
      @dismiss-ownership="$emit('dismiss-ownership')"
      @retry-failed="$emit('retry-failed')"
      @resolve-all="$emit('resolve-all', $event)"
    />
    <BulkActions
      :selected-size="selected.size"
      :bulk-stage="bulkStage"
      @update:bulk-stage="$emit('update:bulkStage', $event)"
      :bulk-progress="bulkProgress"
      @clear="$emit('clear')"
      @request-move="$emit('request-move')"
      @dismiss-progress="$emit('dismiss-progress')"
    />
    <DealTable
      :visible-rows="visibleRows"
      :columns="visibleColumns"
      :sort-key="sortMode"
      :sort-direction="sortDirection"
      @sort="$emit('sort', $event)"
      :selected="selected"
      :active-id="activeId"
      :bulk-running="bulkRunning"
      :total="total"
      :start="start"
      :end="end"
      :rendered-count="renderedCount"
      :top-spacer="topSpacer"
      :bottom-spacer="bottomSpacer"
      :register-row="registerRow"
      :all-matching-selected="allMatchingSelected"
      @toggle-all="$emit('toggle-all')"
      @viewport-ready="$emit('viewport-ready', $event)"
      @scroll="$emit('scroll', $event)"
      @activate="$emit('activate', $event)"
      @toggle-select="$emit('toggle-select', $event)"
      @row-keydown="(event, id) => $emit('row-keydown', event, id)"
      @move="(id, stage) => $emit('move', id, stage)"
      @retry="$emit('retry', $event)"
      @accept="$emit('accept', $event)"
      @keep="$emit('keep', $event)"
      @open="$emit('open', $event)"
    />
  </section>
</template>
