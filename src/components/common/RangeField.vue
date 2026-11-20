<script>
export default {
  props: {
    inputId: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: Number, required: true },
    displayValue: String,
    min: Number,
    max: Number,
    step: Number,
    startLabel: String,
    endLabel: String,
  },
  emits: ['input'],
};
</script>

<template>
  <div class="setting-group">
    <label class="setting-label" :for="inputId">
      <span><slot name="icon" />{{ label }}</span>
      <strong>{{ displayValue }}</strong>
    </label>
    <input
      :id="inputId"
      :value="value"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :aria-valuetext="displayValue"
      @input="$emit('input', Number($event.target.value))"
    />
    <div class="range-labels">
      <span>{{ startLabel }}</span>
      <span>{{ endLabel }}</span>
    </div>
  </div>
</template>
