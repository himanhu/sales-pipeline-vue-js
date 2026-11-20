<script>
import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-vue-next';
import { ME } from '../../../constants.js';
import DealConflictReview from './DealConflictReview.vue';

export default {
  components: { AlertCircle, CheckCircle2, LoaderCircle, DealConflictReview },
  props: {
    record: { type: Object, required: true }, edit: Object, bulkRunning: Boolean,
    remotelyChanged: Boolean, message: String, proposedPatch: { type: Object, required: true },
  },
  emits: ['retry', 'accept', 'keep', 'reload'],
  computed: {
    notOwner() { return this.record.owner !== ME; },
  },
};
</script>

<template>
  <div v-if="notOwner" class="detail-notice detail-warning" role="status">
    <AlertCircle aria-hidden="true" focusable="false" :size="18" />
    <span><strong>You’re not the owner.</strong> This deal belongs to {{ record.owner }}. You can edit it in the shared pipeline; confirmed changes are recorded in its history.</span>
  </div>
  <div v-if="edit?.status === 'saving'" class="detail-notice" role="status"><LoaderCircle aria-hidden="true" focusable="false" class="spinning" :size="18" /> Saving your changes…</div>
  <div v-if="edit?.status === 'failed'" class="detail-notice detail-warning" role="alert">
    <AlertCircle aria-hidden="true" focusable="false" :size="18" />
    <span>Save failed. Your draft is preserved. Retry saving or discard it.</span>
    <button class="plain-button" type="button" :disabled="bulkRunning" @click="$emit('retry')">Retry save</button>
    <button class="plain-button" type="button" @click="$emit('accept', record.id)">Discard draft</button>
  </div>
  <DealConflictReview
    v-if="edit?.status === 'conflict'"
    :record="record"
    :proposed-patch="proposedPatch"
    :bulk-running="bulkRunning"
    @keep="$emit('keep')"
    @accept="$emit('accept', $event)"
  />
  <div v-if="remotelyChanged" class="detail-notice detail-warning" role="status">
    <span>A teammate updated this deal while you were editing. Saving will check for conflicts.</span>
    <button class="plain-button" type="button" @click="$emit('reload')">Load latest</button>
  </div>
  <div v-if="message" class="detail-notice" role="status"><CheckCircle2 aria-hidden="true" focusable="false" :size="18" />{{ message }}</div>
</template>
