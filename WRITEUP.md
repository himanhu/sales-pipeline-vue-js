# Sales Pipeline — Design & Engineering Decisions

**Implementation:** Vue 3 Options API + plain JavaScript + Vite. A table and detail page; 50,000 seeded deals; configurable fake API. No TypeScript or state-management library.

## What I built and why

- **Priority-first pipeline:** I built a **virtualized table** for a shared pipeline used by **20 salespeople** handling **50,000 deals**.

- **My priorities:** The default view highlights **overdue close dates**, **stale activity**, **deals due soon**, and **high-value opportunities**, helping a salesperson decide what needs attention today.

- **All deals:** Supports **grouped AND/OR filters**, **sortable and customizable columns**, per-row stage changes, and selecting **all matching records** for a bulk stage change.

- **Choose table columns:** The **settings icon beside the matching-deals count** opens the column chooser. Move columns between **Available** and **Visible** to choose which fields appear in the table. **Reorder visible columns** with the up/down buttons or **restore defaults**. Changes apply immediately, and column preferences are saved in the browser when storage is available.

- **Text search:** Searches by **company, owner, or deal ID**. <span style="color: #0F766E;">(Minimum: 1 non-space character; debounce: 120ms after typing pauses; cleanup: cancel the previous timer on new input and clear any pending timer when the app unmounts.)</span>

- **Copy view link:** Copies a link containing the **selected view, search, grouped filters, and sort order**. Opening it restores those criteria. Links share the view configuration; **local edits, comment drafts, selected rows, and browser-specific column preferences are not included**.

- **Testing controls:** A dedicated panel adjusts **save failure rate**, **network delay**, and **teammate update frequency**, and can force an edit to the focused deal.

- **Why a table:** This workflow emphasizes comparing **values, owners, dates, and priority reasons**, and sometimes moving **thousands of records at once**. A Kanban board can also be virtualized, but a table fits the comparison, bulk-selection, and keyboard-navigation workflow.

- **Why Vue 3 with Options API:** Provides familiar component organization through **state, computed values, methods, and lifecycle hooks**.

- **Why plain JavaScript:** Keeps the project approachable and fulfills the brief without requiring **TypeScript**.

## Performance and state choices

Only visible rows plus **9 overscan rows** above and below the viewport are mounted. Each row is **84px high**, so spacer heights and visible positions are easy to calculate without rendering 50,000 DOM elements. Deals are indexed by ID in a **Map**, and selected IDs live in a **Set**; selection operates on all matching results, not only mounted rows. Filtering is O(N), and sorting M matches is O(M log M). Virtualization reduces *DOM rendering*, not that data processing cost.

State uses Vue's Options API: `data`, `computed`, `watch`, `methods`, and lifecycle hooks. `mixins/pipeline/index.js` declares shared state and subscriptions; four behavior mixins separate view/navigation, saves, virtualization/keyboard interaction, and detail activity. Each feature has an `index.vue` and private components. `common/BaseDialog.vue` shares modal markup and focus behavior; `constants.js` holds options, labels, limits, columns, and API defaults. This keeps UI pieces small without adding a state manager. Two `markRaw` Maps hold confirmed deals and drafts without deep proxy tracking of 50,000 records; numeric version counters invalidate relevant computed values.

`PipelineList.vue` assembles the list controls and virtual table while forwarding explicit props and events to App. Row cell content, detail conflict comparison, and bulk save progress have focused components. Confirmed metrics are cached independently of draft statuses; activity is invalidated after confirmed changes or comments rather than on every draft keystroke. Filter predicates are prepared before the dataset scan, and reusable `Intl.DateTimeFormat` instances avoid per-cell formatter construction.

## Slow saves, failures, and simultaneous edits

When a stage is changed, the UI immediately shows the proposed stage with **Saving…**, while the server-confirmed record remains separate. The fake API waits **300–1,500ms** by default and randomly fails approximately **10% of requests**. On success, the confirmed record is updated and the draft removed. On failure, the draft stays visibly **Not saved** with **Retry** and **Undo**. Undo discards a local unconfirmed proposal, not a committed server update.

- **Revision checks:** Every write includes an `expectedRevision`. If another salesperson changes the deal first, the in-memory server rejects the stale revision instead of silently overwriting it.

- **Keep mine:** Retries the user's proposal against the latest revision.

- **Use theirs:** Discards the local proposal and displays the latest confirmed values.

- **Teammate-change banner:** Displays the number of received changes, for example **“21 teammate changes received. Your rows haven't been reordered.”** Subscription events update confirmed values while keeping the current row order stable. Click **Apply updates** to re-run filters and sorting, clear the waiting count, and clear the current selection.

- **Resolve all conflicts:** **Keep mine for all** retries the proposed changes against the latest confirmed revisions; **Use theirs for all** discards the conflicted local proposals. A **confirmation dialog** shows the affected count. This includes conflicts **outside the current filter**, and does not require selecting rows. Failed saves can be retried separately with **Retry all failed**.

- **Stable rows:** A row can temporarily remain visible even if its updated stage no longer matches the active filter. This keeps the list predictable while the user is working.

## Deal details, navigation, history and comments

- **Edit deal details:** Open a deal to edit **company, owner, value, stage, close date, and last activity** with validation. IDs, revisions, audit metadata, and the derived priority reason remain **read-only**.

- **Navigation protection:** Leaving the detail page asks before discarding **form changes that have not been submitted**. Returning to the pipeline preserves **filters, selected deals, and scroll position**. Submitted drafts, including failed saves, remain available during the current session.

- **Ownership context:** A **“You're not the owner”** notice identifies deals belonging to another salesperson while allowing shared editing. Bulk confirmation also shows **how many selected deals belong to others**.

- **History for each deal:** **History & comments** shows the original creation and assignment, then each confirmed field change with **who changed it, when, and the previous and new values**. Ownership transfers show the **previous and new owners**. Failed saves and rejected conflicts do not create completed-change entries.

- **Add comments:** Users can post comments of up to **2,000 characters** on a deal. Each posted comment appears in its timeline with the **author and timestamp**, alongside confirmed changes.

- **Comment drafts:** Text survives **failed posting** and **returning to the pipeline**, so users can retry without retyping. The composer blocks duplicate submissions and further editing **while a comment is posting**.

- **Session-only history:** Records, change history, posted comments, and drafts live in the **in-memory demo** and **reset on browser refresh**; they are not a persistent backend audit trail.

## Bulk operations and keyboard access

Selecting all results selects matching IDs, not 50,000 rendered cards. Before any bulk move, a confirmation dialog displays the affected count and target stage. Saves are split into **500-deal batches** with at most **4 concurrent workers**; progress displays saved, failed and conflicted counts. Failed proposals can be retried without repeating successful ones. Changing views, filters, sort order, or applying teammate updates clears selection so hidden selections cannot accidentally be moved.

Native buttons, inputs, select elements and checkboxes support keyboard interaction. Additional shortcuts: arrows/J/K to navigate, X/Space to select, M/Enter to edit stage, `/` to search, `?` for help. Dialogs restore focus and trap Tab within the modal. Full screen-reader testing remains to be done.

Dialogs render outside the app with Teleport, make background content inert, and restore background scrolling on close. Focus targets exclude hidden and disabled controls, including descendants of disabled fieldsets, and include textareas. Missing or disabled dialog triggers fall back to main content. View buttons announce pressed state, virtual rows and columns expose positions, comparison data uses a semantic table, and bulk progress has a labelled progressbar. Decorative icons are hidden from assistive technology.

## Alternatives, limitations and next steps

**Reviewer note — planned improvements**

- Extend field types and column configuration, including rules for which columns can be sorted.

- Add the ability to create new deal rows in the table.

These are proposed enhancements; they are not implemented in the current version.

I avoided a real backend, drag-and-drop-first UX, unrelated pages, and a global state manager because the assignment explicitly emphasizes a focused six-hour product. With more time: browser and assistive-technology tests, performance profiling on slower hardware, a dedicated conflict review view, server-driven cursor pagination and filtering, server-side async bulk jobs, idempotency keys, persistent audit trails, and real WebSocket/SSE reconnection and event ordering.

**Honest verification:** Automated API/pipeline tests, compiled component wiring and rendering checks, focus-helper/lifecycle checks, and the production build pass. Component checks use Vue's compiler with a lightweight renderer; focus checks use controlled element doubles. They do not replace browser layout, performance, keyboard, or assistive-technology testing. The fake server runs only inside one page and does not reproduce ambiguous timeouts where a write commits but its response is lost.
