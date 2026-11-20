<script>
import BaseDialog from '../../common/BaseDialog.vue';

export default {
  components: { BaseDialog },
  props: {
    selectedSize: { type: Number, required: true },
    bulkStage: { type: String, required: true },
    nonOwnedCount: { type: Number, default: 0 },
  },
  emits: ['close', 'confirm'],
};
</script>

<template>
  <BaseDialog
    ref="dialog"
    title="Confirm bulk stage change"
    label-id="confirm-title"
    @close="$emit('close')"
  >
    <template #description>This action will attempt to update {{ selectedSize.toLocaleString('en-IN') }} selected deals.</template>
    <p class="confirmation-copy">Move <strong>{{ selectedSize.toLocaleString('en-IN') }} deals</strong> to <strong>{{ bulkStage }}</strong>? Some saves may fail or conflict. Failed proposals remain visible for retry.</p>
    <p v-if="nonOwnedCount > 0" class="bulk-ownership-warning">You’re not the owner of <strong>{{ nonOwnedCount.toLocaleString('en-IN') }} selected {{ nonOwnedCount === 1 ? 'deal' : 'deals' }}</strong>. Confirmed changes will be recorded in each deal’s history.</p>
    <template #actions>
      <button type="button" class="plain-button" @click="$emit('close')">Cancel</button>
      <button type="button" class="primary-button" @click="$emit('confirm')">Confirm move</button>
    </template>
  </BaseDialog>
</template>
