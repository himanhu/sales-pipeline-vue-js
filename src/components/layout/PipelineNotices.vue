<script>
import { RefreshCcw, ShieldAlert } from 'lucide-vue-next';

export default {
  components: { RefreshCcw, ShieldAlert },
  props: {
    shareMessage: String,
    shareLink: String,
    updatesWaiting: Number,
    ownershipNotice: String,
    metrics: { type: Object, required: true },
    bulkRunning: Boolean,
  },
  emits: ['apply-updates', 'dismiss-ownership', 'retry-failed', 'resolve-all'],
  computed: { failedTotal() { return this.metrics.failed + this.metrics.conflicts; } },
};
</script>

<template>
  <div v-if="shareMessage" class="share-view-message" role="status">
    <span>{{ shareMessage }}</span>
    <input
      v-if="shareLink"
      :value="shareLink"
      readonly
      aria-label="Shareable view link"
      @focus="$event.target.select()"
    />
  </div>
  <div v-if="updatesWaiting > 0" class="sync-banner" role="status">
    <RefreshCcw aria-hidden="true" focusable="false" :size="17" />
    <span><strong>{{ updatesWaiting }} teammate {{ updatesWaiting === 1 ? 'change' : 'changes' }}</strong> received. Your rows haven't been reordered.</span>
    <button type="button" @click="$emit('apply-updates')">Apply updates</button>
  </div>
  <div v-if="ownershipNotice" class="sync-banner" role="status">
    <ShieldAlert aria-hidden="true" focusable="false" :size="18" />
    <span>{{ ownershipNotice }}</span>
    <button type="button" @click="$emit('dismiss-ownership')">Dismiss</button>
  </div>
  <div v-if="failedTotal > 0" class="error-banner" role="alert">
    <ShieldAlert aria-hidden="true" focusable="false" :size="18" />
    <span><strong>{{ metrics.failed }} failed saves, {{ metrics.conflicts }} {{ metrics.conflicts === 1 ? 'conflict' : 'conflicts' }}.</strong> Draft changes are visible but are not confirmed on the server.</span>
    <div class="conflict-banner-actions">
      <button
        v-if="metrics.failed > 0"
        type="button"
        :disabled="bulkRunning"
        @click="$emit('retry-failed')"
      >Retry all failed</button>
      <template v-if="metrics.conflicts > 0">
        <button type="button" :disabled="bulkRunning" @click="$emit('resolve-all', 'mine')">Keep mine for all</button>
        <button type="button" :disabled="bulkRunning" @click="$emit('resolve-all', 'theirs')">Use theirs for all</button>
      </template>
    </div>
  </div>
</template>
