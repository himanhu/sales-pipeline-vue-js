<script>
import { CircleHelp } from 'lucide-vue-next';

export default {
  components: { CircleHelp },
  props: {
    dealCount: { type: Number, required: true },
    syncEnabled: Boolean,
  },
  emits: ['help'],
};
</script>

<template>
  <header class="page-header">
    <div>
      <h1>Sales pipeline <span class="heading-count">{{ dealCount.toLocaleString('en-IN') }} deals</span></h1>
    </div>
    <div class="header-actions">
      <div class="live-pill" role="status"><span v-if="syncEnabled" class="live-dot" />{{ syncEnabled ? 'Teammate sync on' : 'Automatic sync paused' }}</div>
      <button class="plain-button help-button" type="button" aria-haspopup="dialog" @click="$emit('help')"><CircleHelp aria-hidden="true" focusable="false" :size="17" /> Keyboard shortcuts</button>
    </div>
  </header>
</template>
