// Options API behavior for details. State is declared once in index.js.
export default {
  computed: {
    detailActivity() {
      void this.recordsVersion;
      void this.activityVersion;
      return this.detailId === null ? [] : this.api.getActivity(this.detailId);
    },

    detailCommentDraft() {
      void this.commentVersion;
      return this.commentDrafts.get(this.detailId) ?? { text: '', status: 'editing', error: '' };
    },

    detailRecord() {
      void this.recordsVersion;
      return this.confirmed.get(this.detailId) ?? null;
    },

    detailEdit() {
      void this.editsVersion;
      return this.edits.get(this.detailId) ?? null;
    },
  },
  methods: {
    updateCommentDraft({ id, text }) {
      if (!this.confirmed.has(id) || this.commentDrafts.get(id)?.status === 'saving') return;
      this.commentDrafts.set(id, { text, status: 'editing', error: '' });
      this.commentVersion++;
    },

    async postComment(id) {
      const draft = this.commentDrafts.get(id);
      if (!draft?.text.trim() || draft.status === 'saving') return;
      this.commentDrafts.set(id, { ...draft, status: 'saving', error: '' });
      this.commentVersion++;
      try {
        await this.api.addComment(id, draft.text);
        this.commentDrafts.delete(id);
        this.activityVersion++;
      } catch (error) {
        this.commentDrafts.set(id, {
          ...draft,
          status: 'failed',
          error: `Comment not posted. ${error.message}. Your text is preserved; try again.`,
        });
      }
      this.commentVersion++;
    },
  },
};
