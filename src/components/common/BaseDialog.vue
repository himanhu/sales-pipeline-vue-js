<script>
import { X } from 'lucide-vue-next';
import dialogFocus from '../../mixins/dialogFocus.js';

export default {
  components: { X },
  mixins: [dialogFocus],
  props: {
    title: { type: String, required: true },
    labelId: { type: String, required: true },
    wide: Boolean,
  },
  emits: ['close'],
};
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @mousedown.self="$emit('close')">
      <div
        ref="dialogEl"
        class="help-modal"
        :class="{ 'column-modal': wide }"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="labelId"
        :aria-describedby="$slots.description ? `${labelId}-description` : undefined"
        tabindex="-1"
        @keydown="trapTab"
        @keydown.esc.stop="$emit('close')"
      >
        <header class="modal-head">
          <div>
            <h2 :id="labelId">{{ title }}</h2>
            <p v-if="$slots.description" :id="`${labelId}-description`">
              <slot name="description" />
            </p>
          </div>
          <button
            class="icon-button"
            type="button"
            :aria-label="`Close ${title}`"
            @click="$emit('close')"
          >
            <X aria-hidden="true" focusable="false" :size="20" />
          </button>
        </header>
        <slot />
        <footer v-if="$slots.actions" class="modal-actions">
          <slot name="actions" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>
