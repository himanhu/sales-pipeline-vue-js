<script>
import { Command } from 'lucide-vue-next';

export default {
  components: { Command },
  props: { total: Number, start: Number, end: Number, renderedCount: Number },
};
</script>

<template>
  <footer class="table-footer">
    <div class="virtualization-summary">
      <strong
        class="virtualization-badge"
        title="Only rows near the viewport are mounted, including overscan rows for smooth scrolling."
      >Virtualization active</strong>
      <span>Showing {{ total === 0 ? 0 : start + 1 }}–{{ end }} of {{ total.toLocaleString('en-IN') }} · <strong>{{ renderedCount }} rendered rows</strong></span>
    </div>
    <span id="pipeline-keyboard-hint"><Command aria-hidden="true" focusable="false" :size="13" /> J/K navigate · X select · M move · ? help</span>
  </footer>
</template>
