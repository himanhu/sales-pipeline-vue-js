<script>
import { reasonForDeal } from '../../../data/deals.js';
import { formatDateTime } from '../../../utils/formatters.js';

export default {
  props: { record: { type: Object, required: true } },
  methods: { reasonForDeal, formatDateTime },
};
</script>

<template>
  <section class="detail-audit" aria-labelledby="deal-audit-title">
    <h2 id="deal-audit-title">System information</h2>
    <p>Read-only fields maintained by the server.</p>
    <dl>
      <div>
        <dt>Deal ID</dt>
        <dd>{{ record.id }}</dd>
      </div>
      <div>
        <dt>Why now (confirmed)</dt>
        <dd>{{ reasonForDeal(record) }}</dd>
      </div>
      <div>
        <dt>Created</dt>
        <dd>{{ formatDateTime(record.createdAt) }}</dd>
      </div>
      <div>
        <dt>Created by</dt>
        <dd>{{ record.createdBy }}</dd>
      </div>
      <div>
        <dt>Modified</dt>
        <dd>{{ formatDateTime(record.updatedAt) }}</dd>
      </div>
      <div>
        <dt>Modified by</dt>
        <dd>{{ record.modifiedBy }}</dd>
      </div>
      <div>
        <dt>Revision</dt>
        <dd>{{ record.revision }}</dd>
      </div>
    </dl>
  </section>
</template>
