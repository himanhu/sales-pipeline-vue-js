<script>
import { Search } from 'lucide-vue-next';
import { ROW_HEIGHT, TABLE_SELECTION_WIDTH, TABLE_HORIZONTAL_PADDING } from '../../constants.js';
import DealRow from './components/DealRow.vue';
import TableHeader from './components/TableHeader.vue';
import TableFooter from './components/TableFooter.vue';

export default {
  components: { Search, DealRow, TableHeader, TableFooter },
  props: {
    visibleRows: { type: Array, required: true },
    columns: { type: Array, required: true },
    sortKey: String,
    sortDirection: String,
    selected: { type: Set, required: true },
    activeId: Number,
    bulkRunning: Boolean,
    allMatchingSelected: Boolean,
    total: { type: Number, required: true },
    start: Number,
    end: Number,
    renderedCount: Number,
    topSpacer: Number,
    bottomSpacer: Number,
    registerRow: { type: Function, required: true },
  },
  computed: {
    gridStyle() {
      return {
        '--deal-row-height': `${ROW_HEIGHT}px`,
        '--deal-columns': `${TABLE_SELECTION_WIDTH}px ${this.columns.map(column => `minmax(${column.width}px, ${column.key === 'company' ? '1.6' : '1'}fr)`).join(' ')}`,
        minWidth: `${TABLE_SELECTION_WIDTH + TABLE_HORIZONTAL_PADDING + this.columns.reduce((total, column) => total + column.width, 0)}px`,
      };
    },
  },
  emits: [
    'viewport-ready', 'scroll', 'activate', 'toggle-select', 'row-keydown', 'toggle-all',
    'move', 'retry', 'accept', 'keep', 'open', 'sort',
  ],
};
</script>

<template>
  <div class="grid-scroll-x">
    <div
      class="data-grid"
      :style="gridStyle"
      :aria-colcount="columns.length + 1"
      role="grid"
      aria-label="Sales pipeline deals"
      aria-multiselectable="true"
      aria-describedby="pipeline-keyboard-hint"
      :aria-rowcount="total + 1"
    >
      <TableHeader
        :columns="columns"
        :sort-key="sortKey"
        :sort-direction="sortDirection"
        :all-matching-selected="allMatchingSelected"
        :total="total"
        @toggle-all="$emit('toggle-all')"
        @sort="$emit('sort', $event)"
      />
      <div
        :ref="el => $emit('viewport-ready', el)"
        class="virtual-viewport"
        role="rowgroup"
        tabindex="-1"
        @scroll="$emit('scroll', $event)"
      >
        <div :style="{ height: `${topSpacer}px` }" aria-hidden="true" />
        <DealRow
          v-for="row in visibleRows"
          :key="row.id"
          :row="row"
          :columns="columns"
          :selected="selected.has(row.id)"
          :active="activeId === row.id"
          :bulk-running="bulkRunning"
          :register-row="registerRow"
          @activate="$emit('activate', $event)"
          @toggle-select="$emit('toggle-select', $event)"
          @row-keydown="(event, id) => $emit('row-keydown', event, id)"
          @move="(id, stage) => $emit('move', id, stage)"
          @retry="$emit('retry', $event)"
          @accept="$emit('accept', $event)"
          @keep="$emit('keep', $event)"
          @open="$emit('open', $event)"
        />
        <div :style="{ height: `${bottomSpacer}px` }" aria-hidden="true" />
        <div v-if="total === 0" class="empty-state">
          <Search aria-hidden="true" focusable="false" :size="25" />
          <strong>No matching deals</strong>
          <span>Change a filter or search another company.</span>
        </div>
      </div>
    </div>
  </div>
  <TableFooter :total="total" :start="start" :end="end" :rendered-count="renderedCount" />
</template>
