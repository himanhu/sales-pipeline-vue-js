<script>
import { X } from 'lucide-vue-next';

export default {
  components: { X },
  props: { progress: { type: Object, required: true } },
  emits: ['dismiss'],
  computed: {
    percentage() {
      return this.progress.total > 0 ? Math.min(100, (this.progress.completed / this.progress.total) * 100) : 0;
    },
  },
};
</script>

<template>
  <div class="batch-progress" role="status" aria-live="polite">
    <div class="batch-head">
      <span>{{ progress.running ? 'Bulk save running' : 'Bulk save finished' }} · {{ progress.completed.toLocaleString('en-IN') }} / {{ progress.total.toLocaleString('en-IN') }} processed</span>
      <strong>{{ progress.saved.toLocaleString('en-IN') }} saved · {{ progress.failed.toLocaleString('en-IN') }} network failures · {{ progress.conflicts.toLocaleString('en-IN') }} conflicts</strong>
      <button
        type="button"
        aria-label="Dismiss progress"
        :disabled="progress.running"
        @click="$emit('dismiss')"
      >
        <X aria-hidden="true" focusable="false" :size="14" />
      </button>
    </div>
    <div
      class="progress-track"
      role="progressbar"
      aria-label="Bulk save progress"
      :aria-valuenow="progress.completed"
      :aria-valuemin="0"
      :aria-valuemax="Math.max(1, progress.total)"
    >
      <div :style="{ width: `${percentage}%` }" />
    </div>
  </div>
</template>
