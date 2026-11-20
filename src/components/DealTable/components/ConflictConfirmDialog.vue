<script>
import BaseDialog from '../../common/BaseDialog.vue';

export default {
  components: { BaseDialog },
  props: { action: { type: String, required: true }, count: { type: Number, required: true } },
  emits: ['close', 'confirm'],
};
</script>

<template>
  <BaseDialog
    ref="dialog"
    :title="`Resolve ${count.toLocaleString('en-IN')} ${count === 1 ? 'conflict' : 'conflicts'}?`"
    label-id="conflict-confirm-title"
    @close="$emit('close')"
  >
    <p class="confirmation-copy">This includes conflicted drafts outside your current view.</p>
    <p v-if="action === 'mine'" class="confirmation-copy">Retry your proposed changes for these <strong>{{ count.toLocaleString('en-IN') }} deals</strong> using the latest server versions. Saves may fail or conflict again if teammates make more changes.</p>
    <p v-else class="confirmation-copy">Discard your proposed changes for these <strong>{{ count.toLocaleString('en-IN') }} deals</strong> and accept their latest server values. Your discarded drafts cannot be restored.</p>
    <template #actions>
      <button type="button" class="plain-button" @click="$emit('close')">Cancel</button>
      <button type="button" class="primary-button" @click="$emit('confirm')">{{ action === 'mine' ? 'Keep mine for all' : 'Use theirs for all' }}</button>
    </template>
  </BaseDialog>
</template>
