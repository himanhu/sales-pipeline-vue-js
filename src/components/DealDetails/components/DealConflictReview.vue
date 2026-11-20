<script>
import { DEAL_FIELD_LABELS } from '../../../constants.js';
import { formatFieldValue } from '../../../utils/formatters.js';

export default {
  props: {
    record: { type: Object, required: true },
    proposedPatch: { type: Object, required: true },
    bulkRunning: Boolean,
  },
  emits: ['keep', 'accept'],
  computed: {
    proposedFields() { return Object.keys(this.proposedPatch); },
  },
  methods: {
    fieldLabel(key) { return DEAL_FIELD_LABELS[key] ?? key; },
    fieldDisplay: formatFieldValue,
  },
};
</script>

<template>
  <section class="detail-conflict" aria-labelledby="deal-conflict-title">
    <h2 id="deal-conflict-title">Someone else changed this deal</h2>
    <p role="alert">Your changes have not overwritten theirs. Choose which values to keep.</p>
    <table class="conflict-comparison">
      <caption class="sr-only">Your proposed changes compared with the latest server values</caption>
      <thead>
        <tr>
          <th scope="col">Field</th>
          <th scope="col">Your proposal</th>
          <th scope="col">Latest server value</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="key in proposedFields" :key="key">
          <th scope="row">{{ fieldLabel(key) }}</th>
          <td>{{ fieldDisplay(key, proposedPatch[key]) }}</td>
          <td>{{ fieldDisplay(key, record[key]) }}</td>
        </tr>
      </tbody>
    </table>
    <div class="detail-conflict-actions">
      <button class="primary-button" type="button" :disabled="bulkRunning" @click="$emit('keep')">Keep mine</button>
      <button class="plain-button" type="button" @click="$emit('accept', record.id)">Use theirs</button>
    </div>
  </section>
</template>
