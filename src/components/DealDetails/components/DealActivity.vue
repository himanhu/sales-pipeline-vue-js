<script>
import { History } from 'lucide-vue-next';
import CommentComposer from './CommentComposer.vue';
import ActivityEntry from './ActivityEntry.vue';

export default {
  components: { History, CommentComposer, ActivityEntry },
  props: { activity: { type: Array, default: () => [] }, draft: { type: Object, required: true } },
  emits: ['update-comment', 'post-comment'],
};
</script>

<template>
  <section class="detail-activity" aria-labelledby="deal-activity-title">
    <div class="activity-heading">
      <History aria-hidden="true" focusable="false" :size="20" />
      <h2 id="deal-activity-title">History &amp; comments</h2>
      <span>{{ activity.length }} {{ activity.length === 1 ? 'entry' : 'entries' }}</span>
    </div>
    <p class="activity-description">Confirmed changes and comments for this deal. This demo’s history resets on refresh.</p>
    <CommentComposer
      :draft="draft"
      @update="$emit('update-comment', $event)"
      @post="$emit('post-comment')"
    />
    <ol
      class="activity-timeline"
      aria-label="Deal activity, newest first"
      aria-live="polite"
      aria-relevant="additions"
    >
      <ActivityEntry v-for="entry in activity" :key="entry.id" :entry="entry" />
    </ol>
  </section>
</template>
