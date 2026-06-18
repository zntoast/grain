# Comprehensive Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Grain's legacy built-in workspaces and groups with a directory-organized comprehensive creation preset while preserving every user-created entity during v1-to-v2 migration.

**Architecture:** Keep preset content in a dedicated data module and snapshot upgrade behavior in a pure migration module. `store.ts` delegates all normalization to that module so localStorage imports and local JSON imports take the same path; version 2 snapshots are normalized without re-adding presets the user deliberately deleted.

**Tech Stack:** React 19, TypeScript 6, Zustand 5, Node built-in test runner, Vite 8

---

## File Map

- Create `grain-react/src/data/comprehensive-presets.ts`: stable preset workspaces, groups, directories, mappings, and English tag terms.
- Create `grain-react/src/data/snapshotMigration.ts`: pure normalization and v1-to-v2 migration.
- Create `grain-react/src/data/snapshotMigration.test.ts`: migration and preset integrity tests.
- Modify `grain-react/src/constants.ts`: expose the new preset data as the app defaults and resolve tag terms to current tag IDs.
- Modify `grain-react/src/types.ts`: permit reading snapshot versions 1 and 2 while exporting version 2.
- Modify `grain-react/src/store.ts`: remove inline normalization, call the migration module, and export version 2.
- Modify `grain-react/package.json`: add a stable `test` script using the installed Node executable.

### Task 1: Establish Versioned Snapshot Types and Test Command

**Files:**
- Modify: `grain-react/src/types.ts`
- Modify: `grain-react/package.json`
- Create: `grain-react/src/data/snapshotMigration.test.ts`

- [ ] **Step 1: Add a failing version contract test**

Create the initial test file:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import type { GrainDataSnapshot } from '../types.ts';

test('current snapshots use version 2', () => {
  const version: GrainDataSnapshot['version'] = 2;
  assert.equal(version, 2);
});
```

- [ ] **Step 2: Add the test command and verify the type contract fails**

Add to `package.json` scripts:

```json
"test": "node --test --experimental-strip-types src/**/*.test.ts"
```

Run from `grain-react`:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' test
```

Expected: FAIL because `GrainDataSnapshot['version']` only accepts `1`.

- [ ] **Step 3: Expand the snapshot version type**

In `types.ts`, add and apply:

```ts
export type SnapshotVersion = 1 | 2;

export interface GrainDataSnapshot {
  version: SnapshotVersion;
  // existing fields remain unchanged
}
```

- [ ] **Step 4: Run the focused test**

Run:

```powershell
& 'C:\Program Files\nodejs\node.exe' --test --experimental-strip-types src/data/snapshotMigration.test.ts
```

Expected: PASS with 1 test.

- [ ] **Step 5: Commit the test foundation**

```powershell
git add grain-react/package.json grain-react/src/types.ts grain-react/src/data/snapshotMigration.test.ts
git commit -m "test: add snapshot version contract"
```

### Task 2: Add Comprehensive Preset Data

**Files:**
- Create: `grain-react/src/data/comprehensive-presets.ts`
- Modify: `grain-react/src/data/snapshotMigration.test.ts`

- [ ] **Step 1: Write failing preset integrity tests**

Append:

```ts
import {
  PRESET_WORKSPACES,
  PRESET_GROUPS,
  PRESET_WORKSPACE_FOLDERS,
  PRESET_GROUP_FOLDERS,
  PRESET_WORKSPACE_GROUPS,
  PRESET_GROUP_TAG_TERMS,
} from './comprehensive-presets.ts';

test('comprehensive presets have the agreed shape', () => {
  assert.equal(PRESET_WORKSPACES.length, 9);
  assert.equal(PRESET_GROUPS.length, 25);
  assert.equal(PRESET_WORKSPACE_FOLDERS.length, 3);
  assert.equal(PRESET_GROUP_FOLDERS.length, 5);
  assert.deepEqual(PRESET_WORKSPACE_FOLDERS.map((folder) => folder.name), [
    '人物创作', '商业视觉', '世界构建',
  ]);
  assert.deepEqual(PRESET_GROUP_FOLDERS.map((folder) => folder.name), [
    '主体设定', '动作情绪', '画面设计', '艺术表现', '输出控制',
  ]);
});

test('every preset entity has valid and unique relationships', () => {
  const workspaceIds = new Set(PRESET_WORKSPACES.map(({ id }) => id));
  const groupIds = new Set(PRESET_GROUPS.map(({ id }) => id));
  assert.equal(workspaceIds.size, PRESET_WORKSPACES.length);
  assert.equal(groupIds.size, PRESET_GROUPS.length);
  for (const workspace of PRESET_WORKSPACES) {
    const links = PRESET_WORKSPACE_GROUPS[workspace.id];
    assert.ok(links.length >= 6 && links.length <= 10);
    assert.ok(links.every(({ groupId }) => groupIds.has(groupId)));
  }
  for (const group of PRESET_GROUPS) {
    assert.ok(PRESET_GROUP_TAG_TERMS[group.id].length >= 6);
  }
});
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run the focused test command from Task 1.

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `comprehensive-presets.ts`.

- [ ] **Step 3: Create the stable preset entities**

Create `comprehensive-presets.ts` with typed exports. Use these exact IDs and names:

```ts
import type { Folder, Group, Workspace, WorkspaceGroups } from '../types.ts';

export const LEGACY_PRESET_WORKSPACE_IDS = ['ws_main', 'ws_photo', 'ws_concept'] as const;
export const LEGACY_PRESET_GROUP_IDS = [
  'character', 'scene', 'style', 'lighting', 'composition',
  'quality', 'pose', 'clothing', 'expression', 'effect',
] as const;

export const PRESET_WORKSPACE_FOLDERS: Folder[] = [
  { id: 'preset_wsf_people', name: '人物创作' },
  { id: 'preset_wsf_commercial', name: '商业视觉' },
  { id: 'preset_wsf_world', name: '世界构建' },
];

export const PRESET_GROUP_FOLDERS: Folder[] = [
  { id: 'preset_gf_subject', name: '主体设定' },
  { id: 'preset_gf_action', name: '动作情绪' },
  { id: 'preset_gf_visual', name: '画面设计' },
  { id: 'preset_gf_style', name: '艺术表现' },
  { id: 'preset_gf_output', name: '输出控制' },
];

export const PRESET_WORKSPACES: Workspace[] = [
  { id: 'preset_ws_character', name: '角色立绘', desc: '游戏、小说和设定集角色全身设计。', color: '300', createdAt: '2026-06-18' },
  { id: 'preset_ws_anime', name: '动漫插画', desc: '二次元单人或多人叙事插画。', color: '320', createdAt: '2026-06-18' },
  { id: 'preset_ws_portrait', name: '写实人像', desc: '棚拍、环境人像和电影感肖像。', color: '28', createdAt: '2026-06-18' },
  { id: 'preset_ws_product', name: '产品摄影', desc: '单品、静物及材质展示。', color: '45', createdAt: '2026-06-18' },
  { id: 'preset_ws_brand', name: '品牌海报', desc: '品牌主视觉和活动宣传图。', color: '255', createdAt: '2026-06-18' },
  { id: 'preset_ws_ecommerce', name: '电商素材', desc: '商品主图、详情页和社媒配图。', color: '145', createdAt: '2026-06-18' },
  { id: 'preset_ws_scene', name: '场景概念', desc: '游戏、影视和叙事环境概念图。', color: '170', createdAt: '2026-06-18' },
  { id: 'preset_ws_architecture', name: '建筑空间', desc: '建筑外观、室内和空间氛围设计。', color: '200', createdAt: '2026-06-18' },
  { id: 'preset_ws_fantasy', name: '奇幻与科幻', desc: '奇幻世界、未来城市和超现实场景。', color: '255', createdAt: '2026-06-18' },
];
```

Define the 25 groups with IDs matching this record:

```ts
const GROUP_NAMES = {
  preset_group_count: '人物数量', preset_group_identity: '身份职业',
  preset_group_age: '年龄气质', preset_group_face: '外貌五官',
  preset_group_hair: '发型发色', preset_group_clothing: '服装配饰',
  preset_group_product: '产品主体', preset_group_pose: '姿势动作',
  preset_group_gesture: '视线手势', preset_group_expression: '表情情绪',
  preset_group_interaction: '互动关系', preset_group_shot: '构图景别',
  preset_group_camera: '镜头视角', preset_group_lighting: '光影布置',
  preset_group_color: '色彩氛围', preset_group_background: '背景环境',
  preset_group_anime: '动漫风格', preset_group_photo: '写实摄影',
  preset_group_illustration: '插画媒介', preset_group_concept: '概念艺术',
  preset_group_material: '材质细节', preset_group_effect: '视觉特效',
  preset_group_quality: '画质增强', preset_group_retouched: '商业精修',
  preset_group_negative: '负面排除',
} as const;
```

All 25 entries are required. `产品主体` remains independent from `材质细节` because commercial workspaces need separate subject and rendering controls.

- [ ] **Step 4: Add exact folder and workspace relationships**

Export `PRESET_WORKSPACE_FOLDER_MAP`, `PRESET_GROUP_FOLDER_MAP`, and `PRESET_WORKSPACE_GROUPS`. Assign the first 3/next 3/final 3 workspaces to their respective folders. Assign groups in runs of 7/4/5/6/3 to the five group folders. Mark only `preset_group_negative` as `negative`.

Use a helper to keep entries consistent:

```ts
const positive = (groupId: string) => ({ groupId, type: 'positive' as const });
const negative = (groupId: string) => ({ groupId, type: 'negative' as const });

export const PRESET_WORKSPACE_GROUPS: WorkspaceGroups = {
  preset_ws_character: [
    positive('preset_group_count'), positive('preset_group_identity'),
    positive('preset_group_age'), positive('preset_group_face'),
    positive('preset_group_hair'), positive('preset_group_clothing'),
    positive('preset_group_pose'), positive('preset_group_quality'),
    negative('preset_group_negative'),
  ],
  preset_ws_anime: [...['count', 'face', 'hair', 'clothing', 'expression', 'interaction', 'anime', 'background', 'effect'].map((id) => positive(`preset_group_${id}`)), negative('preset_group_negative')],
  preset_ws_portrait: [...['age', 'face', 'clothing', 'expression', 'shot', 'camera', 'lighting', 'photo', 'retouched'].map((id) => positive(`preset_group_${id}`)), negative('preset_group_negative')],
  preset_ws_product: [...['product', 'shot', 'camera', 'lighting', 'color', 'background', 'photo', 'material', 'retouched'].map((id) => positive(`preset_group_${id}`)), negative('preset_group_negative')],
  preset_ws_brand: [...['product', 'shot', 'lighting', 'color', 'background', 'illustration', 'effect', 'retouched'].map((id) => positive(`preset_group_${id}`)), negative('preset_group_negative')],
  preset_ws_ecommerce: [...['product', 'shot', 'lighting', 'color', 'background', 'photo', 'material', 'retouched'].map((id) => positive(`preset_group_${id}`)), negative('preset_group_negative')],
  preset_ws_scene: [...['shot', 'camera', 'lighting', 'color', 'background', 'concept', 'material', 'effect', 'quality'].map((id) => positive(`preset_group_${id}`)), negative('preset_group_negative')],
  preset_ws_architecture: [...['shot', 'camera', 'lighting', 'color', 'background', 'photo', 'concept', 'material', 'retouched'].map((id) => positive(`preset_group_${id}`)), negative('preset_group_negative')],
  preset_ws_fantasy: [...['shot', 'lighting', 'color', 'background', 'concept', 'effect', 'quality'].map((id) => positive(`preset_group_${id}`)), negative('preset_group_negative')],
};
```

- [ ] **Step 5: Add short-term tag definitions**

Export `PRESET_GROUP_TAG_TERMS: Record<string, string[]>`. Each of the 25 groups must contain 6-16 exact English terms already present in `DEFAULT_TAGS` or `NOVELAI_TAGS`.

```ts
export const PRESET_GROUP_TAG_TERMS: Record<string, string[]> = {
  preset_group_count: ['1girl', '1boy', '2girls', 'solo', 'duo', 'group'],
  preset_group_identity: ['warrior', 'mage', 'knight', 'princess', 'detective', 'idol'],
  preset_group_age: ['child', 'teenager', 'young_woman', 'adult', 'mature_male', 'elderly'],
  preset_group_face: ['beautiful detailed eyes', 'blue eyes', 'green eyes', 'heterochromia', 'freckles', 'beauty mark'],
  preset_group_hair: ['short hair', 'long hair', 'ponytail', 'twintails', 'curly hair', 'wavy hair'],
  preset_group_clothing: ['dress', 'school uniform', 'business suit', 'jacket', 'kimono', 'necklace'],
  preset_group_product: ['professional', 'polished', 'clean_lines', 'sharp_focus', 'fine_texture', 'rich_details'],
  preset_group_pose: ['standing', 'sitting', 'walking', 'running', 'kneeling', 'head tilt'],
  preset_group_gesture: ['looking at viewer', 'looking_away', 'peace sign', 'thumbs up', 'pointing at viewer', 'hands in pockets'],
  preset_group_expression: ['smile', 'laughing', 'shy', 'angry', 'sad', 'confident'],
  preset_group_interaction: ['duo', 'group', 'sisters', 'twins', 'holding object', 'reaching_out'],
  preset_group_shot: ['close_up', 'upper_body', 'full_body', 'portrait', 'wide_angle', 'panorama'],
  preset_group_camera: ['front_view', 'side_view', 'top_view', 'low_angle', 'high_angle', 'dutch_angle'],
  preset_group_lighting: ['cinematic_lighting', 'soft_lighting', 'backlight', 'rim_light', 'volumetric_light', 'studio_light'],
  preset_group_color: ['warm_tone', 'cold_tone', 'pastel_colors', 'vivid_colors', 'muted_colors', 'teal_orange'],
  preset_group_background: ['city_street', 'forest', 'beach', 'snow_mountain', 'castle', 'space_station'],
  preset_group_anime: ['anime', 'cel_shaded', 'manga_style', 'chibi', 'lineart', 'digital_art'],
  preset_group_photo: ['realistic', 'photorealistic', 'hyperrealistic', 'film_grain', 'depth_of_field', 'bokeh'],
  preset_group_illustration: ['watercolor', 'oil_painting', 'gouache', 'ink_drawing', 'flat_illustration', 'paper_cut'],
  preset_group_concept: ['concept_art', 'matte_painting', 'science_fiction', 'surrealism', 'cyber_city', 'ruins'],
  preset_group_material: ['fine_texture', 'leather', 'silk', 'velvet', 'denim', 'embroidery'],
  preset_group_effect: ['sparkles', 'glitter', 'fog', 'flames', 'lightning', 'floating_particles'],
  preset_group_quality: ['masterpiece', 'best_quality', 'high_resolution', 'ultra_detailed', 'sharp_focus', 'rich_details'],
  preset_group_retouched: ['professional', 'polished', 'clean_lines', 'high_contrast', 'hdr', 'crisp_edges'],
  preset_group_negative: ['worst quality', 'low quality', 'blurry', 'bad anatomy', 'bad hands', 'watermark'],
};
```

Before accepting the implementation, validate every term by building a set from all tag `en` values. If a negative term is missing, add it as a short tag in `constants.ts` under category `画质`; do not silently drop it.

- [ ] **Step 6: Run the preset integrity tests**

Expected: PASS with all preset counts, names, relationships, and minimum tag-term sizes valid.

- [ ] **Step 7: Commit the preset data**

```powershell
git add grain-react/src/data/comprehensive-presets.ts grain-react/src/data/snapshotMigration.test.ts
git commit -m "feat: add comprehensive creation presets"
```

### Task 3: Resolve Presets into Application Defaults

**Files:**
- Modify: `grain-react/src/constants.ts`
- Modify: `grain-react/src/data/snapshotMigration.test.ts`

- [ ] **Step 1: Add a failing tag-resolution test**

Append:

```ts
import { DEFAULT_GROUP_TAGS, DEFAULT_TAGS } from '../constants.ts';

test('every preset tag term resolves to a real tag id', () => {
  const tagIds = new Set(DEFAULT_TAGS.map(({ id }) => id));
  for (const group of PRESET_GROUPS) {
    const ids = DEFAULT_GROUP_TAGS[group.id];
    assert.ok(ids.length >= 6, `${group.name} has too few tags`);
    assert.ok(ids.every((id) => tagIds.has(id)), `${group.name} has an invalid tag id`);
  }
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Expected: FAIL because `DEFAULT_GROUP_TAGS` still contains legacy group IDs.

- [ ] **Step 3: Replace legacy defaults after the tag list declaration**

Import the preset module. Set `DEFAULT_WORKSPACES`, `DEFAULT_GROUPS`, and `DEFAULT_WORKSPACE_GROUPS` from the preset exports. Keep `DEFAULT_TAGS` in its current file to avoid moving the large NovelAI dataset.

Resolve terms after `DEFAULT_TAGS` is declared:

```ts
const tagIdByTerm = new Map(DEFAULT_TAGS.map((tag) => [tag.en, tag.id]));

export const DEFAULT_GROUP_TAGS: GroupTags = Object.fromEntries(
  Object.entries(PRESET_GROUP_TAG_TERMS).map(([groupId, terms]) => [
    groupId,
    terms.map((term) => tagIdByTerm.get(term)).filter((id): id is string => Boolean(id)),
  ]),
);
```

Also export default folder arrays and maps from `constants.ts` for initial state and migration use.

- [ ] **Step 4: Run tests and build**

Run:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' test
& 'C:\Program Files\nodejs\npm.cmd' run build
```

Expected: tests PASS; TypeScript and Vite build succeed.

- [ ] **Step 5: Commit default integration**

```powershell
git add grain-react/src/constants.ts grain-react/src/data/snapshotMigration.test.ts
git commit -m "feat: use comprehensive presets as defaults"
```

### Task 4: Implement Idempotent v1-to-v2 Migration

**Files:**
- Create: `grain-react/src/data/snapshotMigration.ts`
- Modify: `grain-react/src/data/snapshotMigration.test.ts`

- [ ] **Step 1: Write failing migration tests**

Add tests that construct a v1 snapshot containing one legacy workspace, one legacy group, and user entities `ws_user`/`group_user`. Assert after `normalizeSnapshot`:

```ts
const migrated = normalizeSnapshot(legacySnapshot);
assert.equal(migrated.version, 2);
assert.equal(migrated.workspaces.some(({ id }) => id === 'ws_main'), false);
assert.equal(migrated.groups.some(({ id }) => id === 'character'), false);
assert.ok(migrated.workspaces.some(({ id }) => id === 'ws_user'));
assert.ok(migrated.groups.some(({ id }) => id === 'group_user'));
assert.equal(migrated.currentWorkspaceId, 'preset_ws_character');
assert.deepEqual(normalizeSnapshot(migrated), migrated);
```

Add a separate version 2 deletion test:

```ts
const withoutAnime = {
  ...migrated,
  workspaces: migrated.workspaces.filter(({ id }) => id !== 'preset_ws_anime'),
};
assert.equal(
  normalizeSnapshot(withoutAnime).workspaces.some(({ id }) => id === 'preset_ws_anime'),
  false,
);
```

Also assert user folder mappings and custom workspace/group links survive unchanged.

- [ ] **Step 2: Run the focused test and verify the missing export failure**

Expected: FAIL because `normalizeSnapshot` does not exist in the new module.

- [ ] **Step 3: Implement pure normalization and migration**

Create `snapshotMigration.ts` exporting:

```ts
export const normalizeSnapshot = (data: Partial<GrainDataSnapshot>): GrainDataSnapshot => {
  const sourceVersion = data.version ?? 1;
  return sourceVersion < 2 ? migrateV1ToV2(data) : normalizeV2(data);
};
```

`migrateV1ToV2` must:

1. Filter only IDs in `LEGACY_PRESET_WORKSPACE_IDS` and `LEGACY_PRESET_GROUP_IDS`.
2. Remove their keys from `workspaceGroups`, `groupTags`, `workspaceFolderMap`, and `groupFolderMap`.
3. Remove references to legacy groups from every remaining workspace link array.
4. Append all v2 preset entities, folders, maps, and associations with stable IDs.
5. Keep user entities and all user-to-user relationships byte-for-byte equivalent.
6. Fall back from a removed `currentWorkspaceId` to `preset_ws_character`.
7. Return `version: 2`.

`normalizeV2` must only supply missing structural fields and normalize folder parent references. It must not merge `PRESET_WORKSPACES` or `PRESET_GROUPS` into a non-empty v2 snapshot.

Use small helpers with explicit signatures:

```ts
const withoutKeys = <T>(record: Record<string, T>, ids: ReadonlySet<string>): Record<string, T>;
const mergeUniqueById = <T extends { id: string }>(current: T[], additions: T[]): T[];
const normalizeFolders = (folders: Folder[] | undefined): Folder[];
```

- [ ] **Step 4: Run migration tests**

Expected: PASS for replacement, preservation, fallback, idempotence, and deletion persistence.

- [ ] **Step 5: Commit migration module**

```powershell
git add grain-react/src/data/snapshotMigration.ts grain-react/src/data/snapshotMigration.test.ts
git commit -m "feat: migrate legacy presets to version two"
```

### Task 5: Connect Store Persistence and Verify the UI

**Files:**
- Modify: `grain-react/src/store.ts`
- Modify: `grain-react/src/data/snapshotMigration.test.ts`

- [ ] **Step 1: Add an export-version assertion**

Add a focused store-level assertion only if importing the Zustand store is stable under Node. Otherwise retain this as a build-time contract and verify `exportData()` manually in Step 4.

Expected object property:

```ts
version: 2,
```

- [ ] **Step 2: Replace inline normalization with the migration module**

In `store.ts`:

```ts
import { normalizeSnapshot } from './data/snapshotMigration';
```

Delete the local `mergeById`, `normalizeFolders`, and `normalizeSnapshot` implementations. Initialize folder state with the new default folder arrays/maps, and change `exportData()` from `version: 1` to `version: 2`.

Keep the current uncommitted `customCategories = []` catch behavior and every unrelated Store action unchanged.

- [ ] **Step 3: Run complete automated verification**

Run from `grain-react`:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' test
& 'C:\Program Files\nodejs\npm.cmd' run build
& 'C:\Program Files\nodejs\npm.cmd' run lint
```

Expected: all tests pass, build exits 0, lint exits 0. If lint reports pre-existing errors outside touched files, record them separately and run ESLint against the touched TypeScript files.

- [ ] **Step 4: Verify migration in the browser**

Start Vite on an available port, open the app, and check:

- Sidebar shows 3 workspace directories and 9 workspaces.
- Sidebar shows 5 group directories and 25 groups.
- Opening each workspace displays 6-10 linked groups.
- `负面排除` appears in the negative section.
- Existing user-created workspace `ddd` remains visible after migration.
- Refresh does not duplicate presets.
- Delete one v2 preset in a disposable browser profile, refresh, and confirm it stays deleted.

- [ ] **Step 5: Inspect final diff and commit**

Run:

```powershell
git diff --check
git status --short
```

Stage only preset/migration files and the intentional portions of already-dirty shared files. Do not stage unrelated UI polish changes.

```powershell
git add grain-react/src/data/comprehensive-presets.ts grain-react/src/data/snapshotMigration.ts grain-react/src/data/snapshotMigration.test.ts grain-react/src/constants.ts grain-react/src/types.ts grain-react/src/store.ts grain-react/package.json
git commit -m "feat: replace legacy presets with comprehensive library"
```

## Final Verification

- [ ] Confirm the implementation satisfies every acceptance criterion in `docs/superpowers/specs/2026-06-18-comprehensive-presets-design.md`.
- [ ] Confirm no user-created ID is filtered by name or prefix; only the ten legacy group IDs and three legacy workspace IDs are replaced.
- [ ] Confirm localStorage load, JSON import, and bound-file import all call the same `normalizeSnapshot` path.
- [ ] Confirm no new long-form prompt sentences were introduced.
- [ ] Confirm the final staged diff excludes unrelated current worktree changes.
