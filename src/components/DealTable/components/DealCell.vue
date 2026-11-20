<script>
import { Info } from 'lucide-vue-next';
import { ME, DAY, REASON_CLASSES } from '../../../constants.js';
import { formatDate, formatINR, formatFullDate, formatTime } from '../../../utils/formatters.js';

import DealStageCell from './DealStageCell.vue';

export default {
  components: { Info, DealStageCell },
  props: {
    row: { type: Object, required: true },
    column: { type: Object, required: true },
    selected: Boolean,
    bulkRunning: Boolean,
  },
  emits: ['move', 'retry', 'accept', 'keep', 'open'],
  data() { return { ME }; },
  computed: {
    hasDetailDraft() { return Object.keys(this.row.edit?.patch ?? {}).some(key => key !== 'stage'); },
  },
  methods: {
    reasonClass(reason) { return REASON_CLASSES[reason] ?? 'reason-neutral'; },
    closeDateDetail(closeAt, stage) {
      if (stage === 'Won' || stage === 'Lost') return 'Closed';
      const days = Math.abs(Math.ceil((closeAt - Date.now()) / DAY));
      return `${days}d ${closeAt < Date.now() ? 'overdue' : 'away'}`;
    },
    fullDate: formatFullDate,
    time: formatTime,
    formatDate,
    formatINR,
  },
};
</script>

<template>
  <template v-if="column.key === 'company'">
    <div class="company-name">
      <button
        class="deal-info-button"
        type="button"
        :aria-label="`Open details for ${row.shown.company}`"
        title="Open deal details"
        @click.stop="$emit('open', row.id)"
      >
        <Info aria-hidden="true" focusable="false" :size="17" />
      </button>
      <strong :title="row.shown.company">{{ row.shown.company }}</strong>
    </div>
    <span>#{{ row.record.id }}</span>
  </template>
  <template v-else-if="column.key === 'owner'">
    <span class="owner-avatar">{{ row.shown.owner.split(' ').map(part => part[0]).join('') }}</span>
    <span>{{ row.shown.owner === ME ? 'You' : row.shown.owner }}</span>
  </template>
  <template v-else-if="column.key === 'amount'">{{ formatINR(row.shown.amount) }}</template>
  <template v-else-if="column.key === 'closeAt'">
    <span>{{ formatDate(row.shown.closeAt) }}</span>
    <small>{{ closeDateDetail(row.shown.closeAt, row.shown.stage) }}</small>
  </template>
  <template v-else-if="column.key === 'reason'">
    <span class="reason-pill" :class="reasonClass(row.reason)">{{ row.reason }}</span>
  </template>
  <template v-else-if="column.key === 'stage'">
    <DealStageCell
      :stage="row.shown.stage"
      :company="row.shown.company"
      :edit="row.edit"
      :bulk-running="bulkRunning"
      :disabled="hasDetailDraft || (bulkRunning && selected)"
      @move="$emit('move', row.id, $event)"
      @retry="$emit('retry', row.id)"
      @accept="$emit('accept', row.id)"
      @keep="$emit('keep', row.id)"
    />
  </template>
  <template v-else-if="column.type === 'date'">
    <span>{{ fullDate(row.shown[column.key]) }}</span>
    <small>{{ time(row.shown[column.key]) }}</small>
  </template>
  <span v-else :title="String(row.shown[column.key])">{{ row.shown[column.key] }}</span>
</template>
