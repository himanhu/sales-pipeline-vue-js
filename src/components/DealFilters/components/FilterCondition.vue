<script>
import { X } from 'lucide-vue-next';
import { COLUMNS, OPERATORS, OWNERS, STAGES } from '../../../constants.js';

export default {
  components: { X },
  props: {
    modelValue: { type: Object, required: true },
    labelPrefix: { type: String, required: true },
  },
  emits: ['update:modelValue', 'remove'],
  data() { return { fields: COLUMNS, owners: OWNERS, stages: STAGES }; },
  computed: {
    fieldType() { return this.fields.find(field => field.key === this.modelValue.field)?.type ?? 'text'; },
    operators() { return OPERATORS[this.fieldType]; },
  },
  methods: {
    update(key, value) {
      const rule = { ...this.modelValue, [key]: value };
      if (key === 'field') {
        const type = this.fields.find(field => field.key === value).type;
        rule.operator = OPERATORS[type][0][0];
        rule.value = '';
      }
      this.$emit('update:modelValue', rule);
    },
  },
};
</script>

<template>
  <div class="filter-rule">
    <select
      :value="modelValue.field"
      :aria-label="`Field for ${labelPrefix}`"
      @change="update('field', $event.target.value)"
    >
      <option v-for="field in fields" :key="field.key" :value="field.key">{{ field.label }}</option>
    </select>
    <select
      :value="modelValue.operator"
      :aria-label="`Operator for ${labelPrefix}`"
      @change="update('operator', $event.target.value)"
    >
      <option v-for="[key, label] in operators" :key="key" :value="key">{{ label }}</option>
    </select>
    <select
      v-if="fieldType === 'person' || fieldType === 'stage'"
      :value="modelValue.value"
      :aria-label="`Value for ${labelPrefix}`"
      @change="update('value', $event.target.value)"
    >
      <option disabled value="">Choose value</option>
      <option v-for="value in fieldType === 'stage' ? stages : owners" :key="value" :value="value">{{ value }}</option>
    </select>
    <input
      v-else
      :value="modelValue.value"
      :type="fieldType === 'date' ? 'date' : fieldType === 'number' ? 'number' : 'text'"
      step="any"
      :aria-label="`Value for ${labelPrefix}`"
      placeholder="Enter value"
      @input="update('value', $event.target.value)"
    />
    <button
      class="icon-button"
      type="button"
      :aria-label="`Remove ${labelPrefix}`"
      @click="$emit('remove')"
    >
      <X aria-hidden="true" focusable="false" :size="16" />
    </button>
  </div>
</template>
