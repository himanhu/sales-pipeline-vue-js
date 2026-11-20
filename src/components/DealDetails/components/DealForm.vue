<script>
import { LoaderCircle } from 'lucide-vue-next';
import { OWNERS, STAGES, COMPANY_MAX_LENGTH } from '../../../constants.js';

export default {
  components: { LoaderCircle },
  props: {
    modelValue: { type: Object, required: true }, disabled: Boolean, locked: Boolean,
    dirty: Boolean, hasEdit: Boolean, saving: Boolean, error: String,
  },
  emits: ['update:modelValue', 'save', 'reset'],
  data() { return { owners: OWNERS, stages: STAGES, companyMaxLength: COMPANY_MAX_LENGTH }; },
  methods: {
    update(key, value) { this.$emit('update:modelValue', { ...this.modelValue, [key]: value }); },
  },
};
</script>

<template>
  <form
    class="detail-form"
    aria-label="Edit deal information"
    :aria-describedby="error ? 'deal-form-error' : undefined"
    @submit.prevent="$emit('save')"
  >
    <fieldset :disabled="disabled">
      <legend>Deal information</legend>
      <div class="detail-fields">
        <label>
          Company
          <input
            name="company"
            :value="modelValue.company"
            :maxlength="companyMaxLength"
            autocomplete="organization"
            required
            @input="update('company', $event.target.value)"
          />
        </label>
        <label>
          Owner
          <select name="owner" :value="modelValue.owner" @change="update('owner', $event.target.value)">
            <option v-for="owner in owners" :key="owner" :value="owner">{{ owner }}</option>
          </select>
        </label>
        <label>
          Value (₹)
          <input
            name="amount"
            :value="modelValue.amount"
            type="number"
            min="0"
            step="any"
            required
            @input="update('amount', $event.target.value)"
          />
        </label>
        <label>
          Stage
          <select name="stage" :value="modelValue.stage" @change="update('stage', $event.target.value)">
            <option v-for="stage in stages" :key="stage" :value="stage">{{ stage }}</option>
          </select>
        </label>
        <label>
          Close date
          <input
            name="closeAt"
            :value="modelValue.closeAt"
            type="datetime-local"
            required
            @input="update('closeAt', $event.target.value)"
          />
        </label>
        <label>
          Last activity
          <input
            name="lastTouchAt"
            :value="modelValue.lastTouchAt"
            type="datetime-local"
            required
            @input="update('lastTouchAt', $event.target.value)"
          />
        </label>
      </div>
    </fieldset>
    <p v-if="error" id="deal-form-error" class="filter-error" role="alert">{{ error }}</p>
    <footer class="detail-save-actions">
      <span>{{ saving ? 'Saving…' : dirty ? 'You have unsaved changes' : 'No unsaved changes' }}</span>
      <button
        class="plain-button"
        type="button"
        :disabled="locked || !dirty || hasEdit"
        @click="$emit('reset')"
      >Reset changes</button>
      <button class="primary-button" type="submit" :disabled="locked || !dirty">
        <LoaderCircle aria-hidden="true" focusable="false" v-if="saving" class="spinning" :size="16" />
        Save changes
      </button>
    </footer>
  </form>
</template>
