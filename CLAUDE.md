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

Refer to [docs/SRS.md](docs/SRS.md) for detailed requirements specification.

## Reference Implementation

- [Notebook Navigator](https://github.com/johansan/notebook-navigator) - Reference plugin for icon packs, virtual scrolling, and API design patterns

## Current Phase

**Phase 1 (MVP)** - Core navigation, folder marking, multi-pane rendering

> **Note:** Update this file when the current phase changes.

## Testing

- `obsidian_test_note/` - This folder is used to test the extension

## Project Structure

- `miller_nav/` - The Obsidian plugin source code
  - `src/` - TypeScript source files
  - `styles/` - CSS styles
  - `manifest.json` - Plugin manifest
  - `package.json` - npm dependencies
- `docs/` - Documentation files
  - `SRS.md` - Software Requirements Specification
  - `features.md` - Feature tracking and status
  - `refactoring_log.md` - Code refactoring history
  - `TODO.md` - Planned features and tasks
- `reference/notebook-navigator/` - Reference implementation (cloned from GitHub)

## Development Commands

```bash
cd miller_nav
npm install       # Install dependencies
npm run dev       # Start development build (watch mode)
npm run build     # Production build
```

## Installation for Testing

1. Build the plugin: `cd miller_nav && npm run build`
2. Copy `miller_nav/main.js`, `miller_nav/manifest.json`, and `miller_nav/styles/styles.css` to your test vault's `.obsidian/plugins/miller-nav/` folder
3. Enable the plugin in Obsidian settings
4. Reload Obsidian to see changes after rebuilding
5. Location of the plugin foler is in @.env file under `OBSIDIAN_TEST_VAULT_PATH`

# Updates

- After refactoring add the details in [docs/refactoring_log.md](docs/refactoring_log.md) file -- keep code only where absolutely necessary else describe in table and words
- After adding/editing feature update [docs/features.md](docs/features.md)

## Documentation

- [docs/SRS.md](docs/SRS.md) - Software Requirements Specification
- [docs/features.md](docs/features.md) - Feature tracking and status
- [docs/refactoring_log.md](docs/refactoring_log.md) - Code refactoring history
- [docs/TODO.md](docs/TODO.md) - Planned features and tasks 