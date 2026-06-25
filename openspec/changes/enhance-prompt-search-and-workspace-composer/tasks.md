## 1. Data Model and Core Logic

- [x] 1.1 Add group favorite, workspace composition, preset, history, and deleted-tag fields
- [x] 1.2 Normalize missing enhanced fields when loading old snapshots
- [x] 1.3 Export and import enhanced fields through the existing snapshot flow
- [x] 1.4 Implement and test prompt normalization, duplicate grouping, reference merging, weighting, ordering, output generation, and 30-entry history trimming
- [ ] 1.5 Add regression coverage proving deleted default tags remain deleted after snapshot normalization
- [ ] 1.6 Clean deleted group references from saved presets and history snapshots

## 2. Duplicate Prompt Management

- [x] 2.1 Add duplicate detection action to the提示词 management page
- [x] 2.2 Show duplicate candidates, retained selection, and affected词组 preview
- [x] 2.3 Merge duplicate IDs across all词组 associations without repeated references
- [x] 2.4 Record removed default提示词 IDs so normalization does not restore them
- [ ] 2.5 Browser-test a real merge, reload, and JSON export/import round trip

## 3. Group Favorites

- [x] 3.1 Add persistent favorite state to词组
- [x] 3.2 Add favorite controls to workspace词组 cards
- [x] 3.3 Add favorite control to词组详情
- [x] 3.4 Sort favorites first and add favorite-only filtering in the association dialog
- [ ] 3.5 Browser-test favorite persistence after reload

## 4. Workspace Prompt Composition

- [x] 4.1 Derive stable workspace提示词 items from linked词组
- [x] 4.2 Persist workspace-specific group enablement,提示词 order, disabled prompts, and weights
- [x] 4.3 Add the workspace prompt composition modal with positive and negative sections
- [x] 4.4 Apply `(prompt:weight)` formatting to preview and copied output
- [x] 4.5 Reflect disabled groups and prompts in output counts and text
- [ ] 4.6 Verify ordering, disabling, and weight changes remain after reload

## 5. Presets and History

- [x] 5.1 Save named presets with workspace group and prompt composition state
- [x] 5.2 Apply and delete workspace presets
- [x] 5.3 Record a history entry whenever workspace output is copied
- [x] 5.4 Limit history to the newest 30 entries and restore selected history
- [ ] 5.5 Verify preset and history restore after reload and JSON round trip

## 6. Quality and Delivery

- [x] 6.1 Run unit tests for the implemented pure logic
- [x] 6.2 Run TypeScript checking during implementation
- [x] 6.3 Perform initial desktop browser walkthrough of composer, preset save, copy history, and duplicate preview
- [ ] 6.4 Resolve remaining persistence and stale-reference findings
- [x] 6.5 Run the complete test suite and production build
- [ ] 6.6 Perform final desktop and narrow-viewport browser verification with no console errors
- [x] 6.7 Validate the OpenSpec change and review the final diff
