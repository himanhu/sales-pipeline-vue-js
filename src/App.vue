<script>
import PipelineList from './components/PipelineList.vue';
import { DEMO_DEAL_COUNT } from './constants.js';
import PipelineHeader from './components/layout/PipelineHeader.vue';
import AppSidebar from './components/layout/AppSidebar.vue';
import PipelineMetrics from './components/layout/PipelineMetrics.vue';
import FakeApiControls from './components/layout/FakeApiControls.vue';
import BulkConfirmDialog from './components/DealTable/components/BulkConfirmDialog.vue';
import KeyboardHelpDialog from './components/common/KeyboardHelpDialog.vue';
import ConflictConfirmDialog from './components/DealTable/components/ConflictConfirmDialog.vue';
import pipeline from './mixins/pipeline/index.js';
import ColumnSettingsDialog from './components/DealTable/components/ColumnSettingsDialog.vue';
import DealDetails from './components/DealDetails/index.vue';

export default {
  components: {
    PipelineList,
    PipelineHeader,
    AppSidebar,
    PipelineMetrics,
    FakeApiControls,
    BulkConfirmDialog,
    KeyboardHelpDialog,
    ConflictConfirmDialog,
    ColumnSettingsDialog,
    DealDetails,
  },
  mixins: [pipeline],
  data() { return { sidebarCollapsed: false, dealCount: DEMO_DEAL_COUNT }; },
  methods: {
    updateSetting(key, value) { this.settings[key] = value; },
    setSearchElement(element) { this.searchEl = element; },
    setViewportElement(element) { this.viewportEl = element; },
    activateRow(id) { this.activeId = id; },
    dismissProgress() { this.bulkProgress = null; },
    startNavigation() {
      this.showHelp = false;
      this.$nextTick(() => { if (this.activeId !== null) void this.focusRow(this.activeId); });
    },
  },
};
</script>

<template>
  <a class="skip-link" href="#main-content" @click.prevent="$refs.mainContent?.focus()">Skip to main content</a>
  <div class="app-layout" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <AppSidebar :collapsed="sidebarCollapsed" @toggle="sidebarCollapsed = !sidebarCollapsed" />
    <main ref="mainContent" id="main-content" class="main-content" tabindex="-1">
      <DealDetails
        v-if="detailRecord"
        :key="detailId"
        ref="dealDetails"
        :record="detailRecord"
        :edit="detailEdit"
        :activity="detailActivity"
        :comment-draft="detailCommentDraft"
        @update-comment="updateCommentDraft({ id: detailId, text: $event })"
        @post-comment="postComment(detailId)"
        :bulk-running="Boolean(bulkProgress?.running)"
        @close="closeDeal"
        @save="saveDealDetails"
        @accept="acceptTheirs"
      />
      <PipelineHeader
        v-show="detailId === null"
        :deal-count="dealCount"
        :sync-enabled="settings.teammateUpdatesPerMinute > 0"
        @help="showHelp = true"
      />
      <PipelineMetrics v-show="detailId === null" :metrics="metrics" />
      <PipelineList
        v-show="detailId === null"
        v-model:mode="mode"
        v-model:search="search"
        v-model:bulk-stage="bulkStage"
        :filter-groups="filterGroups"
        :filter-match="filterMatch"
        :total="total"
        :share-message="shareMessage"
        :share-link="shareLink"
        :updates-waiting="updatesWaiting"
        :ownership-notice="ownershipNotice"
        :metrics="metrics"
        :bulk-running="Boolean(bulkProgress?.running)"
        :selected="selected"
        :bulk-progress="bulkProgress"
        :visible-rows="visibleRows"
        :visible-columns="visibleColumns"
        :sort-mode="sortMode"
        :sort-direction="sortDirection"
        :active-id="activeId"
        :start="start"
        :end="end"
        :rendered-count="renderedCount"
        :top-spacer="topSpacer"
        :bottom-spacer="bottomSpacer"
        :register-row="captureRow"
        :all-matching-selected="allMatchingSelected"
        @apply-filters="applyFilters"
        @reset-sort="sortMode = 'priority'; sortDirection = 'desc'"
        @search-ready="setSearchElement"
        @columns="showColumns = true"
        @share="copyViewLink"
        @apply-updates="applyChanges"
        @dismiss-ownership="ownershipNotice = ''"
        @retry-failed="retryFailed()"
        @resolve-all="requestResolveAll"
        @clear="clearSelection"
        @request-move="requestBulkMove"
        @dismiss-progress="dismissProgress"
        @sort="sortColumn"
        @toggle-all="toggleAllResults"
        @viewport-ready="setViewportElement"
        @scroll="onScroll"
        @activate="activateRow"
        @toggle-select="toggleRow"
        @row-keydown="onRowKeydown"
        @move="moveSingle"
        @retry="retryFailed"
        @accept="acceptTheirs"
        @keep="keepMine"
        @open="openDeal"
      />
    </main>
    <FakeApiControls
      :settings="settings"
      :last-teammate-event="lastTeammateEvent"
      @update-setting="updateSetting"
      @simulate-teammate="simulateFocusedTeammate"
    />
    <ColumnSettingsDialog
      v-if="showColumns"
      :column-keys="columnKeys"
      @change="updateColumns"
      @close="showColumns = false"
    />
    <BulkConfirmDialog
      v-if="confirmBulk"
      :selected-size="selected.size"
      :bulk-stage="bulkStage"
      :non-owned-count="bulkNonOwnedCount"
      @close="confirmBulk = false"
      @confirm="performBulkMove"
    />
    <KeyboardHelpDialog v-if="showHelp" @close="showHelp = false" @start="startNavigation" />
    <ConflictConfirmDialog
      v-if="conflictResolution"
      :action="conflictResolution.action"
      :count="conflictResolution.drafts.length"
      @close="conflictResolution = null"
      @confirm="resolveAllConflicts"
    />
  </div>
</template>
