<script>
import { ChevronDown, Filter, Search, Share2, Settings, Sparkles, Users } from 'lucide-vue-next';
import { describeFilterGroups } from '../../utils/table.js';
import FilterBuilder from './components/FilterBuilder.vue';

export default {
  components: { ChevronDown, Filter, Search, Share2, Settings, Sparkles, Users, FilterBuilder },
  props: {
    mode: String,
    search: String,
    total: Number,
    groups: { type: Array, default: () => [] },
    match: String,
  },
  emits: ['update:mode', 'update:search', 'search-ready', 'apply-filters', 'reset-sort', 'columns', 'share'],
  data() { return { expanded: false }; },
  computed: {
    conditionCount() { return this.groups.reduce((count, group) => count + group.rules.length, 0); },
    appliedExpression() { return describeFilterGroups(this.groups, this.match); },
  },
  mounted() { this.$emit('search-ready', this.$refs.searchInput); },
  methods: {
    toggleFilters() {
      this.expanded = !this.expanded;
      if (this.expanded) this.$nextTick(() => this.$refs.builder?.$el.querySelector('select')?.focus());
    },
    closeFilters() {
      this.expanded = false;
      this.$nextTick(() => this.$refs.filterToggle?.focus());
    },
    apply(filters) { this.$emit('apply-filters', filters); this.closeFilters(); },
    applyClearedFilters() { this.$emit('apply-filters', { groups: [], match: 'all' }); },
    clear() {
      if (this.$refs.builder) this.$refs.builder.clear();
      else this.applyClearedFilters();
    },
  },
};
</script>

<template>
  <div class="toolbar-row">
    <div class="view-tabs" role="group" aria-label="Pipeline views">
      <button
        type="button"
        class="tab"
        :class="{ active: mode === 'attention' }"
        :aria-pressed="mode === 'attention'"
        @click="$emit('update:mode', 'attention')"
      ><Sparkles aria-hidden="true" focusable="false" :size="15" /> My priorities</button>
      <button
        type="button"
        class="tab"
        :class="{ active: mode === 'all' }"
        :aria-pressed="mode === 'all'"
        @click="$emit('update:mode', 'all')"
      ><Users aria-hidden="true" focusable="false" :size="15" /> All deals</button>
    </div>
    <div class="search-box">
      <Search aria-hidden="true" focusable="false" :size="17" />
      <input
        ref="searchInput"
        type="search"
        :value="search"
        @input="$emit('update:search', $event.target.value)"
        placeholder="Search company, owner or ID  /"
        aria-label="Search deals"
      />
    </div>
  </div>
  <div class="filters-row">
    <button
      ref="filterToggle"
      class="plain-button filter-toggle"
      type="button"
      :class="{ 'filter-active': conditionCount }"
      :aria-expanded="expanded"
      :aria-controls="expanded ? 'filter-builder' : undefined"
      @click="toggleFilters"
    ><Filter aria-hidden="true" focusable="false" :size="16" /> Filter <span v-if="conditionCount" class="filter-count">{{ conditionCount }}</span><ChevronDown aria-hidden="true" focusable="false" :size="14" /></button>
    <span v-if="conditionCount" class="filter-summary">{{ conditionCount }} active {{ conditionCount === 1 ? 'condition' : 'conditions' }} · {{ groups.length }} {{ groups.length === 1 ? 'group' : 'groups' }}</span>
    <button v-if="conditionCount" class="small-link" type="button" @click="clear">Clear filters</button>
    <button class="small-link priority-sort" type="button" @click="$emit('reset-sort')">Prioritize deals</button>
    <button class="plain-button copy-view-button" type="button" @click="$emit('share')"><Share2 aria-hidden="true" focusable="false" :size="15" /> Copy view link</button>
    <div class="result-count">
      <button
        class="column-settings-button"
        type="button"
        aria-label="Choose table columns"
        title="Choose table columns"
        aria-haspopup="dialog"
        @click="$emit('columns')"
      >
        <Settings aria-hidden="true" focusable="false" :size="17" />
      </button>
      <span role="status">{{ total.toLocaleString('en-IN') }} matching deals</span>
    </div>
  </div>
  <p v-if="conditionCount" class="filter-expression" :title="appliedExpression"><strong>Applied:</strong> {{ appliedExpression }}</p>
  <FilterBuilder
    v-if="expanded"
    ref="builder"
    :groups="groups"
    :match="match"
    @apply="apply"
    @clear="applyClearedFilters"
    @close="closeFilters"
  />
</template>
