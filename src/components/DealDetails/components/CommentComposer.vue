<script>
import { LoaderCircle } from 'lucide-vue-next';
import { COMMENT_MAX_LENGTH } from '../../../constants.js';

export default {
  components: { LoaderCircle },
  props: { draft: { type: Object, required: true } },
  emits: ['update', 'post'],
  data() { return { commentMaxLength: COMMENT_MAX_LENGTH }; },
};
</script>

<template>
  <form class="comment-composer" @submit.prevent="$emit('post')">
    <label for="deal-comment">Add a comment</label>
    <textarea
      id="deal-comment"
      :value="draft.text"
      :disabled="draft.status === 'saving'"
      :maxlength="commentMaxLength"
      :aria-describedby="draft.error ? 'deal-comment-count deal-comment-error' : 'deal-comment-count'"
      rows="3"
      placeholder="Add an update or context for your teammates…"
      @input="$emit('update', $event.target.value)"
    />
    <div class="comment-composer-actions">
      <span id="deal-comment-count">{{ draft.text.length.toLocaleString('en-IN') }} / {{ commentMaxLength.toLocaleString('en-IN') }}</span>
      <button
        class="primary-button"
        type="submit"
        :disabled="!draft.text.trim() || draft.status === 'saving'"
      ><LoaderCircle aria-hidden="true" focusable="false" v-if="draft.status === 'saving'" class="spinning" :size="16" />{{ draft.status === 'saving' ? 'Posting…' : draft.status === 'failed' ? 'Retry comment' : 'Post comment' }}</button>
    </div>
    <p v-if="draft.error" id="deal-comment-error" class="filter-error" role="alert">{{ draft.error }}</p>
    <p v-if="draft.status === 'saving'" class="comment-status" role="status">Posting your comment…</p>
  </form>
</template>
