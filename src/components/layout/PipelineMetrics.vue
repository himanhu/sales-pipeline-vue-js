<script>
import { AlertCircle, ArrowDownUp, LayoutList, Sparkles } from 'lucide-vue-next';
import { formatINR } from '../../utils/formatters.js';

export default {
  components: { AlertCircle, ArrowDownUp, LayoutList, Sparkles },
  props: { metrics: { type: Object, required: true } },
  methods: {
    formatINR,
  },
};
</script>

<template>
  <section class="metrics-grid" aria-label="Pipeline overview">
    <div class="metric-card highlighted">
      <div class="metric-title"><Sparkles aria-hidden="true" focusable="false" :size="16" /> My priorities</div>
      <div class="metric-number">{{ metrics.attention.toLocaleString('en-IN') }}</div>
    </div>
    <div class="metric-card">
      <div class="metric-title"><LayoutList aria-hidden="true" focusable="false" :size="16" /> Open deals</div>
      <div class="metric-number">{{ metrics.open.toLocaleString('en-IN') }}</div>
    </div>
    <div class="metric-card">
      <div class="metric-title"><ArrowDownUp aria-hidden="true" focusable="false" :size="16" /> Confirmed open value</div>
      <div class="metric-number">{{ formatINR(metrics.openValue) }}</div>
    </div>
    <div class="metric-card">
      <div class="metric-title"><AlertCircle aria-hidden="true" focusable="false" :size="16" /> Edits to review</div>
      <div class="metric-number" :class="{ 'text-danger': metrics.failed + metrics.conflicts > 0 }">{{ (metrics.failed + metrics.conflicts).toLocaleString('en-IN') }}</div>
    </div>
  </section>
</template>
