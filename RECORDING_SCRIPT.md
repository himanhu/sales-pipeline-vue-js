# 2–3 minute screen recording — HighPoint by Himashu (Vue 3 + JavaScript)

**0:00–0:25 — Problem and UX**

"This is HighPoint by Himashu, a Vue 3 application built with plain JavaScript. It simulates 50,000 deals for a team of 20. I chose a table over Kanban so salespeople can compare deals and bulk-update thousands of records. My priorities shows what needs attention today."

**0:25–0:50 — Performance**

"Switching to All deals shows the full 50,000-record dataset. I use fixed-height virtualization, so only rows near the visible scroll area are actually mounted. The footer shows the rendered-row count. I can still search, filter and sort the dataset."

**0:50–1:15 — Failure recovery**

"I'll set failure probability to 100% and change a deal stage. The proposed stage appears immediately as Saving, then Not saved. It isn't falsely shown as committed. I can Undo the draft, or set failures to 0% and Retry."

**1:15–1:45 — Concurrent edit conflict**

"I'll increase latency, edit a deal and trigger a teammate update to the same deal. The API compares revisions and prevents silent overwrites. I can either use the teammate's stage or retry mine against the latest revision. Teammate events don't automatically resort the table, avoiding row jumps."

**1:45–2:15 — Bulk update**

"I can select all matching deals, not just the visible rows, choose a target stage, confirm the count and observe progress. Writes are split into chunks of 500 with four concurrent workers; failed chunks can be retried."

**2:15–2:40 — Keyboard and wrap-up**

"Keyboard users can navigate with arrows or J/K, select with X and edit stages with M. Vue's Options API organizes state, computed values, watchers and methods in a pipeline mixin; a functional fake API simulates delays, failures and teammate updates. With more time I'd add integration tests and a real server-side bulk-job API."

**Before recording:** run `npm test` and `npm run build`, verify these demos in Chrome, and use a modest filtered set for bulk moves.
