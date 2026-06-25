## ADDED Requirements

### Requirement: Isolated workspace composition
The system SHALL store group enablement,提示词 order,提示词 enablement, and提示词 weights independently for each workspace.

#### Scenario: Same group is used in two workspaces
- **WHEN** a user changes a提示词 weight in one workspace
- **THEN** the original词组 and the other workspace remain unchanged

### Requirement: Edit prompt order and enablement
The system SHALL let the user reorder and temporarily disable individual positive and negative提示词.

#### Scenario: Disabled prompt is excluded
- **WHEN** a提示词 is disabled in the current workspace
- **THEN** it is excluded from preview and copied output

### Requirement: Format weighted prompts
The system SHALL output a提示词 with a non-default numeric weight using `(prompt:weight)` syntax.

#### Scenario: Weight is increased
- **WHEN** the user sets `cinematic lighting` to `1.2`
- **THEN** copied output contains `(cinematic lighting:1.2)`

#### Scenario: Weight remains default
- **WHEN** a提示词 weight is `1`
- **THEN** copied output contains the unwrapped提示词

### Requirement: Separate positive and negative output
The system SHALL generate positive and negative output independently from the current workspace composition.

#### Scenario: Workspace contains both prompt types
- **WHEN** the workspace contains enabled positive and negative词组
- **THEN** each output contains only its matching type

### Requirement: Save and apply presets
The system SHALL save named presets containing group state and order,提示词 order,提示词 weights, and提示词 enablement.

#### Scenario: Apply a saved preset
- **WHEN** the user applies a preset
- **THEN** the workspace composition is restored to the saved state

### Requirement: Record copy history
The system SHALL create a history entry whenever the user copies a workspace提示词 output and SHALL retain at most 30 entries.

#### Scenario: Copy creates history
- **WHEN** the user clicks copy for the workspace prompt output
- **THEN** a history entry stores both positive and negative text plus the restorable composition state

#### Scenario: History exceeds limit
- **WHEN** the 31st history entry is added
- **THEN** only the newest 30 entries remain

### Requirement: Restore history
The system SHALL allow a history entry to restore the saved workspace composition.

#### Scenario: Restore previous composition
- **WHEN** the user selects restore on a history entry
- **THEN** group state, order,提示词 order, weights, and enablement match that entry

### Requirement: Persist composition data
The system SHALL include favorites, composition configs, presets, history, and deletion markers in browser storage and JSON snapshots.

#### Scenario: Export and import enhanced data
- **WHEN** the user exports and imports a snapshot containing enhanced data
- **THEN** the enhanced workspace state is preserved
