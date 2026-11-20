<script>
import { Database, Menu, Sparkles } from 'lucide-vue-next';

import { APP_NAME, APP_AUTHOR, ME } from '../../constants.js';

export default {
  components: { Database, Menu, Sparkles },
  props: { collapsed: Boolean },
  data() { return { appName: APP_NAME, appAuthor: APP_AUTHOR, userName: ME }; },
  emits: ['toggle'],
  computed: { userInitials() { return this.userName.split(' ').map(part => part[0]).join(''); } },
};
</script>

<template>
  <aside class="sidebar" aria-label="Application navigation">
    <div class="sidebar-header">
      <button
        class="icon-button sidebar-toggle"
        type="button"
        :aria-expanded="!collapsed"
        aria-controls="sidebar-navigation"
        :aria-label="collapsed ? 'Expand navigation' : 'Collapse navigation'"
        :title="collapsed ? 'Expand navigation' : 'Collapse navigation'"
        @click="$emit('toggle')"
      >
        <Menu aria-hidden="true" focusable="false" :size="21" />
      </button>
      <div class="brand">
        <span>{{ appName }}<span class="brand-dot">.</span></span>
        <small>by {{ appAuthor }}</small>
      </div>
    </div>
    <nav id="sidebar-navigation" class="sidebar-navigation" aria-label="Workspace">
      <div class="workspace-label">WORKSPACE</div>
      <div class="nav-active" title="Sales pipeline">
        <Database aria-hidden="true" focusable="false" :size="17" />
        <span class="nav-label">Sales pipeline</span>
        <span v-if="collapsed" class="sr-only">Sales pipeline</span>
        <span class="nav-count">50k</span>
      </div>
      <div class="sidebar-note"><Sparkles aria-hidden="true" focusable="false" :size="16" /> Built for high-volume teams, not endless scrolling.</div>
    </nav>
    <div class="sidebar-footer">
      <span class="avatar" role="img" :title="`${userName} · Demo user`" :aria-label="`${userName}, demo user`">{{ userInitials }}</span>
      <div class="sidebar-user-details">
        <strong>{{ userName }}</strong>
        <small>Sales team · Demo user</small>
      </div>
    </div>
  </aside>
</template>
