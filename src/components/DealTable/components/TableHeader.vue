<script>
import { ArrowDown, ArrowUp, ArrowUpDown, Check } from 'lucide-vue-next';

export default {
  components: { ArrowDown, ArrowUp, ArrowUpDown, Check },
  props: {
    columns: { type: Array, required: true },
    sortKey: String,
    sortDirection: String,
    total: Number,
    allMatchingSelected: Boolean,
  },
  emits: ['toggle-all', 'sort'],
};
</script>

<template>
  <div class="grid-header grid-cols" role="row" aria-rowindex="1">
    <div role="columnheader" class="table-header-tools" aria-colindex="1" aria-label="Deal selection">
      <button
        type="button"
        class="square-selection"
        :aria-label="allMatchingSelected ? 'Deselect all matching deals' : 'Select all matching deals'"
        :aria-pressed="allMatchingSelected"
        :disabled="total === 0"
        @click="$emit('toggle-all')"
      >
        <Check aria-hidden="true" focusable="false" v-if="allMatchingSelected" :size="14" />
      </button>
    </div>
    <div
      v-for="(column, index) in columns"
      :key="column.key"
      role="columnheader"
      :aria-colindex="index + 2"
      :aria-sort="sortKey === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'"
    >
      <button
        class="column-sort"
        :class="{ 'sort-active': sortKey === column.key }"
        type="button"
        :aria-label="`Sort ${column.label} ${sortKey === column.key && sortDirection === 'asc' ? 'descending' : 'ascending'}`"
        @click="$emit('sort', column.key)"
      >
        {{ column.label }}
        <ArrowUp aria-hidden="true" focusable="false" v-if="sortKey === column.key && sortDirection === 'asc'" :size="14" />
        <ArrowDown aria-hidden="true" focusable="false" v-else-if="sortKey === column.key" :size="14" />
        <ArrowUpDown aria-hidden="true" focusable="false" v-else :size="13" />
      </button>
    </div>
  </div>
</template>
