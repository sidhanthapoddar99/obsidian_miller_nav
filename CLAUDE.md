 Overview

  MillerNav provides a multi-pane, hierarchical navigation system for Obsidian vaults where:

  - Level 0 contains virtual folders (Recent, Tags, Shortcuts) plus user-marked entry points
  - Levels 1-4 are user-defined navigation columns created by marking folders as "subfolders"
  - Levels are computed dynamically based on marked ancestors (not stored explicitly)

  Key Concepts

  | Concept           | Description                                               |
  |-------------------|-----------------------------------------------------------|
  | Miller Columns    | Side-by-side panes showing parent→child hierarchy         |
  | Marked Folders    | User designates folders to appear as navigation levels    |
  | Virtual Folders   | System-generated views (Recent, Tags, Shortcuts)          |
  | Cascade Collapse  | Collapsing level N hides levels 0 through N-1             |
  | Level Computation | Levels calculated at runtime by counting marked ancestors |

  Architecture Highlights

  - Data Storage: Multi-file JSON approach (folders.json, shortcuts.json, appearance.json, etc.)
  - Performance: RAM caching, virtual scrolling, lazy loading, debounced saves
  - Mobile: Single-pane mode with swipe navigation
  - Extensibility: Public API, icon pack support, Style Settings integration

  Development Phases

  1. Phase 1 (MVP): Core navigation, folder marking, multi-pane rendering
  2. Phase 2: Virtual folders, shortcuts, cascade collapse
  3. Phase 3: Customization (icons, colors, dividers)
  4. Phase 4: Mobile support & performance optimization
  5. Phase 5: Polish, integrations, documentation

refer to @SRS.md for detailed requirements specification.

## Reference Implementation

- [Notebook Navigator](https://github.com/johansan/notebook-navigator) - Reference plugin for icon packs, virtual scrolling, and API design patterns

## Current Phase

**Phase 1 (MVP)** - Core navigation, folder marking, multi-pane rendering

> **Note:** Update this file when the current phase changes.

## Testing

- `obsidian_test_note/` - This folder is used to test the extension
