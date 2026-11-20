<script>
import { Plus, X } from 'lucide-vue-next';
import { validFilterGroups, cleanFilterGroups, describeFilterGroups } from '../../../utils/table.js';
import FilterGroup from './FilterGroup.vue';

export default {
  components: { Plus, X, FilterGroup },
  props: { groups: { type: Array, required: true }, match: String },
  emits: ['apply', 'clear', 'close'],
  data() { return { draftGroups: [], draftMatch: 'all', error: '', nextId: 0 }; },
  computed: { draftExpression() { return describeFilterGroups(this.draftGroups, this.draftMatch); } },
  created() {
    this.draftGroups = this.groups.length
      ? this.groups.map(group => ({
        id: ++this.nextId,
        match: group.match,
        rules: group.rules.map(rule => ({ ...rule, id: ++this.nextId })),
      }))
      : [this.newGroup()];
    this.draftMatch = this.match;
  },
  methods: {
    newRule() { return { id: ++this.nextId, field: 'company', operator: 'contains', value: '' }; },
    newGroup() { return { id: ++this.nextId, match: 'all', rules: [this.newRule()] }; },
    apply() {
      if (!validFilterGroups(this.draftGroups)) {
        this.error = 'Each group needs at least one complete condition. Choose valid values for every condition, or remove the empty group.';
        return;
      }
      this.$emit('apply', { groups: cleanFilterGroups(this.draftGroups), match: this.draftMatch });
    },
    clear() {
      this.draftGroups = [this.newGroup()];
      this.draftMatch = 'all';
      this.error = '';
      this.$emit('clear');
    },
  },
};
</script>

<template>
  <form
    id="filter-builder"
    class="filter-builder"
    aria-label="Build deal filters"
    @keydown.esc.stop.prevent="$emit('close')"
    @submit.prevent="apply"
  >
    <div class="filter-builder-heading">
      <label class="match-label">Combine groups with
        <select v-model="draftMatch" aria-label="Combine filter groups"><option value="all">AND — all groups must match</option><option value="any">OR — any group can match</option></select>
      </label>
      <button
        class="icon-button"
        type="button"
        aria-label="Close filter builder"
        @click="$emit('close')"
      >
        <X aria-hidden="true" focusable="false" :size="16" />
      </button>
    </div>
    <p class="filter-group-help">Each group works like brackets. Choose AND or OR inside each group, then combine the groups above.</p>
    <div class="filter-group-list">
      <template v-for="(group, groupIndex) in draftGroups" :key="group.id">
        <div v-if="groupIndex > 0" class="filter-group-connector">{{ draftMatch === 'any' ? 'OR' : 'AND' }}</div>
        <FilterGroup
          v-model="draftGroups[groupIndex]"
          :index="groupIndex"
          @remove="draftGroups.splice(groupIndex, 1)"
          @add-condition="group.rules.push(newRule())"
        />
      </template>
    </div>
    <p v-if="draftGroups.length" class="filter-expression filter-preview"><strong>Preview:</strong> {{ draftExpression }}</p>
    <p v-else class="filter-group-help">No groups: running this filter will clear the applied conditions.</p>
    <p v-if="error" class="filter-error" role="alert">{{ error }}</p>
    <div class="filter-builder-actions">
      <button class="plain-button" type="button" @click="draftGroups.push(newGroup())"><Plus aria-hidden="true" focusable="false" :size="15" /> Add group</button>
      <button class="small-link" type="button" @click="clear">Clear</button>
      <button class="primary-button" type="submit">Run filter</button>
    </div>
  </form>
</template>
