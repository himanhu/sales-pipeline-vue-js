<script>
import DealCell from './DealCell.vue';

export default {
  components: { DealCell },
  props: {
    row: { type: Object, required: true },
    columns: { type: Array, required: true },
    selected: Boolean,
    active: Boolean,
    bulkRunning: Boolean,
    registerRow: { type: Function, required: true },
  },
  emits: ['activate', 'toggle-select', 'row-keydown', 'move', 'retry', 'accept', 'keep', 'open'],
  methods: {
    cellClass(column) {
      if (column.key === 'company') return 'company-cell';
      if (column.key === 'owner') return 'owner-cell';
      if (column.key === 'amount') return 'amount-cell';
      if (column.key === 'stage') return 'stage-cell';
      return column.type === 'date' ? 'date-cell' : 'extra-cell';
    },
  },
};
</script>

<template>
  <div
    :ref="el => registerRow(el, row.id)"
    class="grid-row grid-cols"
    :class="{ 'row-active': active }"
    role="row"
    :aria-rowindex="row.rowIndex"
    :aria-selected="selected"
    :tabindex="active ? 0 : -1"
    @focusin="$emit('activate', row.id)"
    @click="$emit('activate', row.id)"
    @keydown="$emit('row-keydown', $event, row.id)"
  >
    <div class="checkbox-cell" role="gridcell" aria-colindex="1">
      <input
        type="checkbox"
        :checked="selected"
        :aria-label="`Select ${row.shown.company}`"
        @change="$emit('toggle-select', row.id)"
      />
    </div>
    <div v-for="(column, index) in columns" :key="column.key" :aria-colindex="index + 2" role="gridcell" :class="cellClass(column)">
      <DealCell
        :column="column"
        :row="row"
        :selected="selected"
        :bulk-running="bulkRunning"
        @move="(id, stage) => $emit('move', id, stage)"
        @retry="$emit('retry', $event)"
        @accept="$emit('accept', $event)"
        @keep="$emit('keep', $event)"
        @open="$emit('open', $event)"
      />
    </div>
  </div>
</template>
