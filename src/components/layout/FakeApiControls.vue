<script>
import { Clock3, RefreshCcw, Settings2, Users, Wifi } from 'lucide-vue-next';

import { API_CONTROLS } from '../../constants.js';
import RangeField from '../common/RangeField.vue';

export default {
  components: { Clock3, RefreshCcw, Settings2, Users, Wifi, RangeField },
  props: {
    settings: { type: Object, required: true },
    lastTeammateEvent: { type: String, required: true },
  },
  emits: ['update-setting', 'simulate-teammate'],
  data() { return { controls: API_CONTROLS }; },
  methods: {
    displayValue(control) {
      if (control.key === 'maxDelayMs') return `${this.settings.minDelayMs}–${this.settings.maxDelayMs}ms`;
      return `${this.settings[control.key]}${control.suffix}`;
    },
  },
};
</script>

<template>
  <aside class="inspector" aria-label="Fake API testing controls">
    <div class="inspector-title">
      <Settings2 aria-hidden="true" focusable="false" :size="18" />
      <h2>Test the edge cases</h2>
    </div>
    <p class="inspector-subtitle">These knobs control the in-memory fake API. No backend is required.</p>
    <RangeField
      v-for="control in controls"
      :key="control.key"
      :input-id="`api-${control.key}`"
      :label="control.label"
      :value="settings[control.key]"
      :display-value="displayValue(control)"
      :min="control.min"
      :max="control.max"
      :step="control.step"
      :start-label="control.start"
      :end-label="control.end"
      @input="$emit('update-setting', control.key, $event)"
    >
      <template #icon>
        <component aria-hidden="true" focusable="false" :is="control.icon" :size="15" />
      </template>
    </RangeField>
    <button type="button" class="simulate-button" @click="$emit('simulate-teammate')"><RefreshCcw aria-hidden="true" focusable="false" :size="16" /> Change focused deal as teammate</button>
    <div class="event-log" role="status" aria-atomic="true">
      <small>LATEST TEAMMATE EVENT</small>
      <p>{{ lastTeammateEvent }}</p>
      <span>Local simulation · live subscription</span>
    </div>
    <div class="inspector-divider" />
    <h3>Try these scenarios</h3>
    <ol class="scenario-list">
      <li><strong>Failure:</strong> set 100%, change a stage, inspect Retry and Undo.</li>
      <li><strong>Conflict:</strong> set delay to 3 sec, change a stage, immediately click teammate change.</li>
      <li><strong>Bulk:</strong> select a filtered result set, confirm the stage change, observe chunks.</li>
      <li><strong>Stable order:</strong> let teammate updates arrive, then Apply updates.</li>
    </ol>
    <div class="test-footer"><span class="sync-dot" /> Fake server ready · {{ settings.failureRate }}% failure probability</div>
  </aside>
</template>
