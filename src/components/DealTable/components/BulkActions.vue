<script>
import { ChevronDown, LoaderCircle } from 'lucide-vue-next';
import BulkSaveProgress from './BulkSaveProgress.vue';
import { STAGES } from '../../../constants.js';

export default {
  components: { ChevronDown, LoaderCircle, BulkSaveProgress },
  props: {
    selectedSize: { type: Number, required: true },
    bulkStage: String,
    bulkProgress: { type: Object, default: null },
  },
  emits: ['clear', 'update:bulkStage', 'request-move', 'dismiss-progress'],
  data() { return { stages: STAGES }; },
};
</script>

<template>
  <div v-if="selectedSize > 0" class="bulk-toolbar" role="group" aria-label="Selected deal actions">
    <div class="selection-label">
      <span><strong>{{ selectedSize.toLocaleString('en-IN') }}</strong> selected</span>
      <button v-if="selectedSize > 0" class="small-link" type="button" @click="$emit('clear')">Clear</button>
    </div>
    <div class="bulk-actions">
      <span>Move selected to</span>
      <label class="select-shell batch-stage">
        <span class="sr-only">Destination stage for selected deals</span>
        <select
          :value="bulkStage"
          aria-label="Destination stage for selected deals"
          @change="$emit('update:bulkStage', $event.target.value)"
        >
          <option v-for="stage in stages" :key="stage" :value="stage">{{ stage }}</option>
        </select>
        <ChevronDown aria-hidden="true" focusable="false" :size="14" />
      </label>
      <button
        class="primary-button"
        type="button"
        :disabled="selectedSize === 0 || Boolean(bulkProgress?.running)"
        @click="$emit('request-move')"
      ><LoaderCircle aria-hidden="true" focusable="false" v-if="bulkProgress?.running" class="spinning" :size="15" /> Move {{ selectedSize > 0 ? `${selectedSize.toLocaleString('en-IN')} deals` : 'deals' }}</button>
    </div>
  </div>
  <div v-if="selectedSize > 0" class="selection-hint">Changing filters or applying updates clears selection.</div>
  <BulkSaveProgress
    v-if="bulkProgress"
    :progress="bulkProgress"
    @dismiss="$emit('dismiss-progress')"
  />
</template>
