import { ME, BATCH_SIZE, PARALLEL_SAVES } from '../../constants.js';
import { needsAttention } from '../../data/deals.js';
import { editablePatch } from '../../utils/dealFields.js';

// Options API behavior for saves. State is declared once in index.js.
export default {
  computed: {
    confirmedMetrics() {
      void this.recordsVersion;
      let attention = 0;
      let open = 0;
      let openValue = 0;
      for (const deal of this.confirmed.values()) {
        if (deal.stage !== 'Won' && deal.stage !== 'Lost') {
          open++;
          openValue += deal.amount;
        }
        if (deal.owner === ME && needsAttention(deal)) attention++;
      }
      return { attention, open, openValue };
    },

    metrics() {
      void this.editsVersion;
      let saving = 0, failed = 0, conflicts = 0;
      for (const edit of this.edits.values()) {
        if (edit.status === 'saving') saving++;
        if (edit.status === 'failed') failed++;
        if (edit.status === 'conflict') conflicts++;
      }
      return { ...this.confirmedMetrics, saving, failed, conflicts };
    },

    bulkNonOwnedCount() {
      void this.recordsVersion;
      return [...this.selected].filter(id => this.confirmed.get(id)?.owner !== ME).length;
    },
  },
  methods: {
    updateConfirmed(deals) {
      for (const deal of deals) {
        const current = this.confirmed.get(deal.id);
        if (!current || deal.revision >= current.revision) this.confirmed.set(deal.id, deal);
      }
      if (deals.length) this.recordsVersion++;
    },

    notifyEdits() { this.editsVersion++; },

    beginEdits(changes) {
      const requests = [];
      for (const { id, stage, patch, expectedRevision } of changes) {
        const record = this.confirmed.get(id);
        if (!record || this.edits.get(id)?.status === 'saving') continue;
        const previous = this.edits.get(id);
        // A stage-only action must not also commit an unrelated detail draft.
        if (stage !== undefined && patch === undefined && previous && Object.keys(previous.patch ?? {}).some(key => key !== 'stage')) continue;
        const fields = editablePatch({
          ...(patch === undefined ? previous?.patch : {}),
          ...patch,
          ...(stage === undefined ? {} : { stage }),
        });
        if (!Object.keys(fields).length) continue;
        if (!previous && (expectedRevision === undefined || expectedRevision === record.revision) && Object.entries(fields).every(([key, value]) => record[key] === value)) continue;
        const target = fields.stage ?? previous?.target ?? record.stage;
        const baseRevision = expectedRevision ?? record.revision;
        const token = ++this.nextToken;
        this.edits.set(id, { target, patch: fields, status: 'saving', baseRevision, token });
        requests.push({ id, stage: target, patch: fields, expectedRevision: baseRevision, token });
      }
      if (requests.length) this.notifyEdits();
      return requests;
    },

    async saveChanges(requests, showProgress = false) {
      if (!requests.length) return;
      const batches = [];
      for (let i = 0; i < requests.length; i += BATCH_SIZE) {
        batches.push(requests.slice(i, i + BATCH_SIZE));
      }
      const progress = { total: requests.length, completed: 0, saved: 0, failed: 0, conflicts: 0, running: true };
      if (showProgress) this.bulkProgress = { ...progress };
      let nextBatch = 0;

      const worker = async () => {
        while (nextBatch < batches.length) {
          const batch = batches[nextBatch++];
          try {
            const result = await this.api.saveBatch(batch);
            this.updateConfirmed([...result.saved, ...result.conflicts]);
            const savedIds = new Set(result.saved.map((deal) => deal.id));
            const conflictIds = new Map(result.conflicts.map((deal) => [deal.id, deal]));

            for (const request of batch) {
              const edit = this.edits.get(request.id);
              if (!edit || edit.token !== request.token) continue;
              if (savedIds.has(request.id)) this.edits.delete(request.id);
              else if (conflictIds.has(request.id)) {
                this.edits.set(request.id, { ...edit, status: 'conflict', remoteStage: conflictIds.get(request.id).stage });
              } else this.edits.set(request.id, { ...edit, status: 'failed' });
            }
            progress.saved += result.saved.length;
            progress.conflicts += result.conflicts.length;
            progress.failed += batch.length - result.saved.length - result.conflicts.length;
          } catch {
            // Preserve the proposed stage on failure and show Retry / Undo.
            for (const request of batch) {
              const edit = this.edits.get(request.id);
              if (!edit || edit.token !== request.token) continue;
              if (edit.status === 'saving') this.edits.set(request.id, { ...edit, status: 'failed' });
            }
            for (const request of batch) {
              if (this.edits.get(request.id)?.status === 'conflict') progress.conflicts++;
              else progress.failed++;
            }
          }
          this.notifyEdits();
          progress.completed += batch.length;
          if (showProgress) this.bulkProgress = { ...progress };
        }
      }
      await Promise.all(Array.from({ length: Math.min(PARALLEL_SAVES, batches.length) }, () => worker()));
      if (showProgress) this.bulkProgress = { ...progress, running: false };
    },

    moveSingle(id, stage) {
      const deal = this.confirmed.get(id);
      this.ownershipNotice = deal && deal.owner !== ME ? `You're not the owner. This deal belongs to ${deal.owner}. Confirmed changes are recorded in its history.` : '';
      void this.saveChanges(this.beginEdits([{ id, stage }]));
    },

    requestBulkMove() {
      if (this.selected.size && !this.bulkProgress?.running) this.confirmBulk = true;
    },

    performBulkMove() {
      this.confirmBulk = false;
      if (!this.selected.size || this.bulkProgress?.running) return;
      const changes = [...this.selected].map((id) => ({ id, stage: this.bulkStage }));
      void this.saveChanges(this.beginEdits(changes), true);
    },

    retryFailed(id) {
      if (this.bulkProgress?.running) return;
      const changes = [...this.edits.entries()]
        .filter(([editId, edit]) => edit.status === 'failed' && (id === undefined || editId === id))
        .map(([editId, edit]) => ({ id: editId, patch: edit.patch }));
      void this.saveChanges(this.beginEdits(changes), changes.length > 1);
    },

    acceptTheirs(id) { this.edits.delete(id); this.notifyEdits(); },

    keepMine(id) {
      const edit = this.edits.get(id);
      if (edit?.status === 'conflict') void this.saveChanges(this.beginEdits([{ id, patch: edit.patch }]));
    },

    requestResolveAll(action) {
      if (!['mine', 'theirs'].includes(action) || this.bulkProgress?.running) return;
      const drafts = [...this.edits.entries()]
        .filter(([, edit]) => edit.status === 'conflict')
        .map(([id, edit]) => ({ id, token: edit.token }));
      if (drafts.length) this.conflictResolution = { action, drafts };
    },

    resolveAllConflicts() {
      const resolution = this.conflictResolution;
      this.conflictResolution = null;
      if (!resolution || this.bulkProgress?.running) return;
      // Resolve only the drafts reviewed in the confirmation. New conflicts or
      // drafts changed individually while it was open must remain untouched.
      const changes = resolution.drafts.flatMap(({ id, token }) => {
        const edit = this.edits.get(id);
        return edit?.status === 'conflict' && edit.token === token
          ? [{ id, patch: edit.patch }] : [];
      });
      if (resolution.action === 'mine') {
        void this.saveChanges(this.beginEdits(changes), true);
      } else {
        for (const { id } of changes) this.edits.delete(id);
        if (changes.length) this.notifyEdits();
      }
    },

    saveDealDetails({ id, patch, expectedRevision }) {
      return this.saveChanges(this.beginEdits([{ id, patch: editablePatch(patch), expectedRevision }]));
    },
  },
};
