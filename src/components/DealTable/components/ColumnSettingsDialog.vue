<script>
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-vue-next';
import { COLUMNS, DEFAULT_COLUMNS } from '../../../constants.js';
import BaseDialog from '../../common/BaseDialog.vue';

export default {
  components: { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, BaseDialog },
  props: { columnKeys: { type: Array, required: true } },
  emits: ['close', 'change'],
  data() { return { columns: COLUMNS, pickedAvailable: [], pickedVisible: [] }; },
  computed: {
    available() { return this.columns.filter(column => !this.columnKeys.includes(column.key)); },
    visible() { return this.columnKeys.map(key => this.columns.find(column => column.key === key)); },
  },
  methods: {
    transferColumn(key) {
      if (!this.columns.some(column => column.key === key)) return;
      if (this.columnKeys.includes(key)) {
        if (this.columnKeys.length === 1) return;
        this.$emit('change', this.columnKeys.filter(column => column !== key));
        this.pickedVisible = [];
        this.pickedAvailable = [key];
      } else {
        this.$emit('change', [...this.columnKeys, key]);
        this.pickedAvailable = [];
        this.pickedVisible = [key];
      }
    },
    add() {
      this.$emit('change', [...this.columnKeys, ...this.pickedAvailable]);
      this.pickedAvailable = [];
    },
    remove() {
      const remaining = this.columnKeys.filter(key => !this.pickedVisible.includes(key));
      if (!remaining.length) return;
      this.$emit('change', remaining);
      this.pickedVisible = [];
    },
    move(direction) {
      if (this.pickedVisible.length !== 1) return;
      const keys = [...this.columnKeys];
      const index = keys.indexOf(this.pickedVisible[0]);
      if (index === -1) return;
      const target = index + direction;
      if (target < 0 || target >= keys.length) return;
      [keys[index], keys[target]] = [keys[target], keys[index]];
      this.$emit('change', keys);
    },
    reset() {
      this.pickedAvailable = [];
      this.pickedVisible = [];
      this.$emit('change', [...DEFAULT_COLUMNS]);
    },
  },
};
</script>

<template>
  <BaseDialog
    ref="dialog"
    title="Choose table columns"
    label-id="column-settings-title"
    wide
    @close="$emit('close')"
  >
    <template #description>Double-click a column to move it between lists, or select columns and use the center buttons. Select one visible column and use the up/down icons to change its position. Changes apply immediately.</template>
    <div class="column-transfer">
      <label class="column-list">Available <span>{{ available.length }} columns</span>
          <select v-model="pickedAvailable" multiple aria-label="Available columns"><option
            v-for="column in available"
            :key="column.key"
            :value="column.key"
            @dblclick.stop="transferColumn(column.key)"
          >{{ column.label }}</option></select>
        </label>
      <div class="column-transfer-actions">
        <button
          class="plain-button"
          type="button"
          :disabled="!pickedAvailable.length"
          aria-label="Show selected columns"
          @click="add"
        >
          <ChevronRight aria-hidden="true" focusable="false" :size="20" />
        </button>
        <button
          class="plain-button"
          type="button"
          :disabled="!pickedVisible.length || pickedVisible.length === columnKeys.length"
          aria-label="Hide selected columns"
          @click="remove"
        >
          <ChevronLeft aria-hidden="true" focusable="false" :size="20" />
        </button>
      </div>
      <label class="column-list">Visible <span>{{ visible.length }} columns</span>
          <select v-model="pickedVisible" multiple aria-label="Visible columns"><option
            v-for="column in visible"
            :key="column.key"
            :value="column.key"
            @dblclick.stop="transferColumn(column.key)"
          >{{ column.label }}</option></select>
        </label>
    </div>
    <div class="column-order-actions">
      <span>Keep at least one column visible.</span>
      <button
        class="icon-button"
        type="button"
        aria-label="Move selected column up"
        title="Move selected column up"
        :disabled="pickedVisible.length !== 1 || columnKeys[0] === pickedVisible[0]"
        @click="move(-1)"
      >
        <ChevronUp aria-hidden="true" focusable="false" :size="20" />
      </button>
      <button
        class="icon-button"
        type="button"
        aria-label="Move selected column down"
        title="Move selected column down"
        :disabled="pickedVisible.length !== 1 || columnKeys[columnKeys.length - 1] === pickedVisible[0]"
        @click="move(1)"
      >
        <ChevronDown aria-hidden="true" focusable="false" :size="20" />
      </button>
    </div>
    <aside class="reviewer-note" aria-labelledby="reviewer-note-title">
      <strong id="reviewer-note-title">Reviewer note — planned improvements</strong>
      <p>Extend field types and column configuration, including rules for which columns can be sorted. Add the ability to create new deal rows in the table.</p>
    </aside>
    <template #actions>
      <button class="plain-button" type="button" @click="reset">Restore defaults</button>
      <button class="primary-button" type="button" @click="$emit('close')">Done</button>
    </template>
  </BaseDialog>
</template>
