## ADDED Requirements

### Requirement: Detect normalized duplicate prompts
The system SHALL group提示词 whose English values are equal after removing case differences, spaces, underscores, and hyphens.

#### Scenario: Equivalent separators are detected
- **WHEN** the library contains `Master_Piece`, `master piece`, and `master-piece`
- **THEN** the system presents them as one duplicate group

### Requirement: Preview duplicate merge impact
The system SHALL show every duplicate candidate, the selected retained提示词, and all affected词组 before merging.

#### Scenario: User reviews affected groups
- **WHEN** the user opens a duplicate group
- **THEN** the system lists the候选提示词 and the names of词组 linked to any candidate

### Requirement: Merge duplicate references
The system SHALL replace removed提示词 IDs with the retained ID in every词组 and SHALL remove repeated references.

#### Scenario: Multiple duplicate references exist in one group
- **WHEN** a词组 links both the retained提示词 and a removed duplicate
- **THEN** the词组 contains the retained提示词 exactly once after merging

### Requirement: Persist deletion of default prompts
The system SHALL remember removed default提示词 IDs and SHALL NOT restore them during subsequent default-data normalization.

#### Scenario: Reload after merging default prompts
- **WHEN** a default提示词 is removed through merge and the application reloads
- **THEN** the removed提示词 remains absent
