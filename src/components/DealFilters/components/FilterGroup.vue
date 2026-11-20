<script>
import { Plus, X } from 'lucide-vue-next';
import FilterCondition from './FilterCondition.vue';

export default {
  components: { Plus, X, FilterCondition },
  props: { modelValue: { type: Object, required: true }, index: Number },
  emits: ['update:modelValue', 'remove', 'add-condition'],
  methods: {
    updateMatch(match) { this.$emit('update:modelValue', { ...this.modelValue, match }); },
    updateRule(index, rule) {
      const rules = this.modelValue.rules.map((current, position) => position === index ? rule : current);
      this.$emit('update:modelValue', { ...this.modelValue, rules });
    },
    removeRule(index) {
      this.$emit('update:modelValue', { ...this.modelValue, rules: this.modelValue.rules.filter((_, position) => position !== index) });
    },
  },
};
</script>

<template>
  <fieldset class="filter-group">
    <legend>Group {{ index + 1 }}</legend>
    <div class="filter-group-heading">
      <label class="match-label">Match
        <select
          :value="modelValue.match"
          :aria-label="`Combine conditions in group ${index + 1}`"
          @change="updateMatch($event.target.value)"
        >
          <option value="all">all conditions (AND)</option>
          <option value="any">any condition (OR)</option>
        </select>
      </label>
      <button
        class="icon-button"
        type="button"
        :aria-label="`Remove group ${index + 1}`"
        @click="$emit('remove')"
      >
        <X aria-hidden="true" focusable="false" :size="16" />
      </button>
    </div>
    <FilterCondition
      v-for="(rule, ruleIndex) in modelValue.rules"
      :key="rule.id"
      :model-value="rule"
      :label-prefix="`group ${index + 1}, condition ${ruleIndex + 1}`"
      @update:model-value="updateRule(ruleIndex, $event)"
      @remove="removeRule(ruleIndex)"
    />
    <button class="plain-button" type="button" @click="$emit('add-condition')"><Plus aria-hidden="true" focusable="false" :size="15" /> Add condition</button>
  </fieldset>
</template>
