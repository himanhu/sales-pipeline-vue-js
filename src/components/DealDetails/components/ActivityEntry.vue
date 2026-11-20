<script>
import { History, MessageSquare } from 'lucide-vue-next';
import { ME, DEAL_FIELD_LABELS } from '../../../constants.js';
import { formatDateTime, formatFieldValue } from '../../../utils/formatters.js';

export default {
  components: { History, MessageSquare },
  props: { entry: { type: Object, required: true } },
  methods: {
    actorName(actor) { return actor === ME ? `${actor} (you)` : actor; },
    timestamp: formatDateTime,
    isoTime(value) { return new Date(value).toISOString(); },
    label(field) { return DEAL_FIELD_LABELS[field] ?? field; },
    display: formatFieldValue,
  },
};
</script>

<template>
  <li class="activity-entry">
    <div class="activity-marker">
      <MessageSquare aria-hidden="true" focusable="false" v-if="entry.type === 'comment'" :size="16" />
      <History aria-hidden="true" focusable="false" v-else :size="16" />
    </div>
    <article>
      <header>
        <strong>{{ actorName(entry.actor) }}</strong>
        <span>{{ entry.type === 'comment' ? 'commented' : entry.type === 'created' ? 'created this deal' : 'updated this deal' }}</span>
        <time :datetime="isoTime(entry.timestamp)">{{ timestamp(entry.timestamp) }}</time>
      </header>
      <p v-if="entry.type === 'created'">Assigned to <strong>{{ entry.owner }}</strong> when created.</p>
      <p v-else-if="entry.type === 'comment'" class="activity-comment">{{ entry.text }}</p>
      <ul v-else class="activity-changes">
        <li v-for="change in entry.changes" :key="change.field">
          <template v-if="change.field === 'owner'">Reassigned from <strong>{{ display(change.field, change.before) }}</strong> to <strong>{{ display(change.field, change.after) }}</strong>.</template>
          <template v-else><span>{{ label(change.field) }}:</span> <span class="activity-previous">{{ display(change.field, change.before) }}</span> → <strong>{{ display(change.field, change.after) }}</strong></template>
        </li>
      </ul>
    </article>
  </li>
</template>
