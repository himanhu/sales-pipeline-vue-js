<script>
import { dealForm, formPatch } from '../../utils/dealFields.js';
import DealActivity from './components/DealActivity.vue';
import DealForm from './components/DealForm.vue';
import DealAudit from './components/DealAudit.vue';
import DealSaveStatus from './components/DealSaveStatus.vue';

export default {
  components: { DealActivity, DealForm, DealAudit, DealSaveStatus },
  props: {
    record: { type: Object, required: true },
    edit: Object,
    bulkRunning: Boolean,
    activity: { type: Array, default: () => [] },
    commentDraft: { type: Object, default: () => ({ text: '', status: 'editing', error: '' }) },
  },
  emits: ['close', 'save', 'accept', 'update-comment', 'post-comment'],
  data() {
    return { form: {}, baseline: {}, baseRevision: 0, error: '', message: '' };
  },
  computed: {
    dirty() { return Object.keys(this.baseline).some(key => this.form[key] !== this.baseline[key]); },
    locked() { return this.bulkRunning || this.edit?.status === 'saving' || this.edit?.status === 'conflict'; },
    formDisabled() { return this.bulkRunning || this.edit?.status === 'saving'; },
    remotelyChanged() { return this.record.revision > this.baseRevision && !this.edit; },
    proposedPatch() {
      try { return formPatch(this.form, this.baseline); }
      catch { return this.edit?.patch ?? {}; }
    },
  },
  created() { this.resetForm(); },
  mounted() {
    this.$refs.heading?.focus();
    window.addEventListener('beforeunload', this.beforePageUnload);
  },
  beforeUnmount() { window.removeEventListener('beforeunload', this.beforePageUnload); },
  watch: {
    record() { if (!this.dirty && !this.edit) this.resetForm(); },
    edit(next, previous) {
      if (!next && previous) {
        this.resetForm();
        this.message = previous.status === 'saving' ? 'Saved successfully.' : 'Latest server version loaded.';
      }
    },
  },
  methods: {
    beforePageUnload(event) {
      if (this.dirty || this.edit || this.commentDraft.text || this.commentDraft.status === 'saving') { event.preventDefault(); event.returnValue = ''; }
    },
    resetForm() {
      this.baseline = dealForm(this.record);
      this.form = dealForm({ ...this.record, ...this.edit?.patch });
      this.baseRevision = this.edit?.baseRevision ?? this.record.revision;
      this.error = '';
      this.message = '';
    },
    save() {
      if (this.locked) return;
      try {
        if (String(this.form.amount).trim() === '') throw new Error('Enter a non-negative deal value.');
        this.form.company = this.form.company.trim();
        this.form.amount = String(Number(this.form.amount));
        const patch = formPatch(this.form, this.baseline);
        if (!Object.keys(patch).length) return;
        this.error = '';
        this.message = '';
        this.$emit('save', { id: this.record.id, patch, expectedRevision: this.baseRevision });
      } catch (error) { this.error = error.message; }
    },
    keepMine() {
      if (this.bulkRunning || this.edit?.status !== 'conflict') return;
      try {
        const patch = formPatch(this.form, this.baseline);
        if (!Object.keys(patch).length) { this.$emit('accept', this.record.id); return; }
        this.error = '';
        this.$emit('save', { id: this.record.id, patch, expectedRevision: this.record.revision });
      } catch (error) { this.error = error.message; }
    },
    canLeave() {
      // Submitted drafts live in the pipeline and survive returning to the list.
      if (!this.dirty) return true;
      if (this.edit) {
        const submitted = dealForm({ ...this.record, ...this.edit.patch });
        if (Object.keys(submitted).every(key => submitted[key] === this.form[key])) return true;
      }
      return window.confirm('Discard your changes that have not been submitted?');
    },
    close() { if (this.canLeave()) this.$emit('close'); },
    reload() {
      if (!this.dirty || window.confirm('Discard your changes and load the latest server version?')) this.resetForm();
    },

  },
};
</script>

<template>
  <section class="deal-details" aria-label="Deal details">
    <header class="deal-details-header">
      <button class="plain-button" type="button" @click="close">Back to pipeline</button>
      <span class="detail-record-id">Deal #{{ record.id }} · Revision {{ record.revision }}</span>
    </header>
    <div class="detail-heading">
      <h1 ref="heading" tabindex="-1">{{ record.company }}</h1>
      <p>Review every field and save changes to this deal.</p>
    </div>
    <DealSaveStatus
      :record="record"
      :edit="edit"
      :bulk-running="bulkRunning"
      :remotely-changed="remotelyChanged"
      :message="message"
      :proposed-patch="proposedPatch"
      @retry="save"
      @accept="$emit('accept', $event)"
      @keep="keepMine"
      @reload="reload"
    />
    <DealForm
      v-model="form"
      :disabled="formDisabled"
      :locked="locked"
      :dirty="dirty"
      :has-edit="Boolean(edit)"
      :saving="edit?.status === 'saving'"
      :error="error"
      @save="save"
      @reset="resetForm"
    />
    <DealAudit :record="record" />
    <DealActivity
      :activity="activity"
      :draft="commentDraft"
      @update-comment="$emit('update-comment', $event)"
      @post-comment="$emit('post-comment')"
    />
  </section>
</template>
