<script>
import BaseDialog from './BaseDialog.vue';

export default {
  components: { BaseDialog },
  emits: ['close', 'start'],
  methods: {
    startNavigation() {
      this.$refs.dialog.skipFocusRestore();
      this.$emit('start');
    },
  },
};
</script>

<template>
  <BaseDialog ref="dialog" title="Keyboard shortcuts" label-id="help-title" @close="$emit('close')">
    <template #description>Works without a mouse. Every action also supports Tab.</template>
    <div class="shortcut-row">
      <span>Move between deal rows</span>
      <div>
        <kbd>↑</kbd>
        <kbd>↓</kbd>
        <span class="kbd-or">or</span>
        <kbd>J</kbd>
        <kbd>K</kbd>
      </div>
    </div>
    <div class="shortcut-row">
      <span>Select / deselect focused deal</span>
      <div>
        <kbd>X</kbd>
        <span class="kbd-or">or</span>
        <kbd>Space</kbd>
      </div>
    </div>
    <div class="shortcut-row">
      <span>Change focused deal's stage</span>
      <div>
        <kbd>M</kbd>
        <span class="kbd-or">or</span>
        <kbd>Enter</kbd>
      </div>
    </div>
    <div class="shortcut-row">
      <span>Jump to search</span>
      <kbd>/</kbd>
    </div>
    <div class="shortcut-row">
      <span>Show this dialog</span>
      <kbd>?</kbd>
    </div>
    <div class="shortcut-row">
      <span>Move through native controls</span>
      <kbd>Tab</kbd>
    </div>
    <template #actions>
      <button type="button" class="primary-button" @click="startNavigation">Start navigating</button>
    </template>
  </BaseDialog>
</template>
