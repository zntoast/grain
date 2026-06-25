## ADDED Requirements

### Requirement: Favorite a group
The system SHALL allow a user to toggle a词组 favorite state from the词组详情 and workspace词组 card.

#### Scenario: Favorite state persists
- **WHEN** the user favorites a词组 and reloads the application
- **THEN** the词组 remains favorited

### Requirement: Prioritize favorites when linking
The system SHALL display favorited词组 before non-favorited词组 in the workspace association dialog.

#### Scenario: Association dialog contains favorites
- **WHEN** the user opens the association dialog
- **THEN** favorited unlinked词组 appear first

### Requirement: Filter association choices to favorites
The system SHALL provide an option to show only favorited词组 in the workspace association dialog.

#### Scenario: Favorite-only filter is enabled
- **WHEN** the user enables the favorite-only filter
- **THEN** non-favorited词组 are hidden from the available list
