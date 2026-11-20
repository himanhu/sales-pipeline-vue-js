<script>
import { AlertCircle, CheckCircle2, ChevronDown, LoaderCircle } from 'lucide-vue-next';
import { STAGES, STAGE_CLASSES } from '../../../constants.js';

export default {
  components: { AlertCircle, CheckCircle2, ChevronDown, LoaderCircle },
  props: { stage: String, company: String, edit: Object, disabled: Boolean, bulkRunning: Boolean },
  emits: ['move', 'retry', 'accept', 'keep'],
  data() { return { stages: STAGES }; },
  methods: {
    stageClass(stage) { return STAGE_CLASSES[stage] ?? 'stage-default'; },
    saveStatus(status) {
      if (status === 'saving') return 'Saving…';
      return status === 'failed' ? 'Not saved' : 'Conflict';
    },
  },
};
</script>

<template>
  <div class="stage-select-wrap" :class="stageClass(stage)">
    <select
      :aria-label="`Move ${company} to stage`"
      :value="stage"
      :disabled="edit?.status === 'saving' || disabled"
      @change="$emit('move', $event.target.value)"
    >
      <option v-for="stage in stages" :key="stage" :value="stage">{{ stage }}</option>
    </select>
    <ChevronDown aria-hidden="true" focusable="false" :size="13" />
  </div>
  <div v-if="edit" class="save-state" :class="`save-${edit.status}`">
    <LoaderCircle aria-hidden="true" focusable="false" v-if="edit.status === 'saving'" class="spinning" :size="12" />
    <AlertCircle aria-hidden="true" focusable="false" v-else :size="12" />
    <span role="status">{{ saveStatus(edit.status) }}</span>
    <template v-if="edit.status === 'failed'">
      <button type="button" :disabled="bulkRunning" :aria-label="`Retry saving ${company}`" @click="$emit('retry')">Retry</button>
      <button type="button" :aria-label="`Discard draft for ${company}`" @click="$emit('accept')">Undo</button>
    </template>
    <div v-if="edit.status === 'conflict'" class="conflict-actions">
      <span :title="`Teammate chose ${edit.remoteStage ?? stage}`">Theirs: {{ edit.remoteStage ?? stage }}</span>
      <button type="button" :disabled="bulkRunning" :aria-label="`Keep my changes to ${company}`" @click="$emit('keep')">Keep mine</button>
      <button type="button" :aria-label="`Use latest server values for ${company}`" @click="$emit('accept')">Use theirs</button>
    </div>
  </div>
  <span v-else class="save-idle"><CheckCircle2 aria-hidden="true" focusable="false" :size="12" /> Saved</span>
</template>
