# MillerNav Refactoring Log

## 2025-12-03 - Performance & Modularity Improvements

### Problem Analysis
| Issue | Description | Impact |
|-------|-------------|--------|
| Excessive re-renders | Selection/active file changes triggered full `renderAllColumns()` | UI lag on large vaults |
| Callbacks recreation | New callback object created on every render | GC pressure, unnecessary allocations |
| Code duplication | Create methods (note/folder/canvas/base) had repeated path logic | Maintenance burden |
| Monolithic view | All file operations embedded in single 700+ line file | Hard to test/maintain |

### Changes Made

#### 1. Targeted Visual Updates
Replaced full DOM re-renders with direct CSS class manipulation for selection and active file highlighting.

| Operation | Before | After |
|-----------|--------|-------|
| Toggle selection | Re-render all columns | Update single element's CSS class |
| Switch active file | Re-render all columns | Remove class from old, add to new |
| Complexity | O(n) where n = total items | O(1) constant time |

New methods: `updateSelectionVisuals()`, `updateActiveFileVisual()` in MillerNavView.ts:158-192

#### 2. Cached Callbacks Object
Callbacks object now created once on first access and reused for all subsequent calls.

**Impact**: Eliminated repeated object creation during renders.

#### 3. Utility Functions Module
Created `src/ui/utils/index.ts` with reusable helpers:

| Function | Purpose |
|----------|---------|
| `normalizePath()` | Remove trailing slashes, handle root |
| `getParentPath()` | Extract parent from path |
| `getPathName()` | Get last segment of path |
| `buildPath()` | Construct path from parent + name |
| `createToolbarButton()` | DRY button creation with icon |
| `createFooterButton()` | DRY footer button creation |
| `findItemByPath()` | DOM lookup for targeted updates |

#### 4. FileOperations Class
Created `src/ui/utils/FileOperations.ts` consolidating all file operations:

| Method | Replaces |
|--------|----------|
| `createFile(path, type, onSuccess)` | createNote, createCanvas, createBase |
| `createFolder(path, onSuccess)` | createFolder |
| `rename(path, newName, onSuccess)` | renameItem logic |
| `delete(path, onSuccess)` | deleteItem logic |
| `moveItems(paths, target, onSuccess)` | moveItems logic |

Type-safe `FileType = 'note' | 'folder' | 'canvas' | 'base'` with centralized error handling.

#### 5. ColumnHeader Refactor
Replaced 60+ lines of repetitive button creation with utility function calls.

### Files Changed
| File | Change |
|------|--------|
| `src/ui/utils/index.ts` | NEW - utility functions |
| `src/ui/utils/FileOperations.ts` | NEW - file operations class |
| `src/ui/MillerNavView.ts` | Added targeted updates, cached callbacks, simplified create methods |
| `src/ui/components/ColumnHeader.ts` | Refactored to use utility functions |
| `src/ui/types.ts` | Changed `renameItem` return type to void |

### Build Status
Build successful

---

## 2025-12-15 - MillerNavView Modularization

### Problem Analysis
| Issue | Description | Impact |
|-------|-------------|--------|
| Monolithic view class | MillerNavView.ts was 820 lines with 9 distinct responsibilities | Hard to test, maintain, and understand |
| Mixed concerns | Selection, column state, data transformation all in one file | Tight coupling, difficult to modify |
| No separation of state | State management mixed with rendering logic | Changes to state logic required understanding rendering |

### Solution: Manager/Provider Pattern

Extracted three focused modules from MillerNavView.ts:

| Module | Responsibility | Lines |
|--------|---------------|-------|
| `ColumnManager` | Column state (columns[], collapse/expand, open/close) | 238 |
| `SelectionManager` | Selection state (selectedItems, toggle, range selection) | 176 |
| `ItemDataProvider` | Data transformation (getFolderItems, getVirtualItems) | 220 |

### Changes Made

#### 1. SelectionManager (`src/ui/managers/SelectionManager.ts`)
Manages multi-selection state with clean interface:
- `selectedItems: Set<string>` - currently selected paths
- `toggle(path, addToSelection)` - handles ctrl+click
- `selectRange(from, to, visibleItems)` - handles shift+click
- `updateVisuals()` - static method for targeted DOM updates

#### 2. ColumnManager (`src/ui/managers/ColumnManager.ts`)
Manages Miller column lifecycle:
- `columns: ColumnState[]` - column array state
- `toggleCollapse(index)` - collapse/expand column
- `openSubfolder(path, fromIndex)` - add new column
- `collapseAll()` - cascade collapse
- `serialize()`/`deserialize()` - state persistence

#### 3. ItemDataProvider (`src/ui/providers/ItemDataProvider.ts`)
Pure data transformation (no state):
- `getFolderItems(folder, indent)` - build PaneItem[] for folder
- `getVirtualItems()` - build virtual folder items (Recent, Tags, Shortcuts)
- `getVisibleItemsInColumn()` - for range selection
- `KNOWN_EXTENSIONS` - centralized icon mapping

#### 4. Simplified MillerNavView
Now focused on orchestration:
- Obsidian ItemView lifecycle
- Wiring managers together
- Rendering coordination (kept in view - it's the View's job)
- Callback delegation to managers

### Key Design Decisions

1. **Keep rendering in View** - Rendering is the View's core responsibility; extracting it would over-abstract
2. **Managers don't trigger renders** - They mutate state and return; View decides when to render
3. **Pure data provider** - ItemDataProvider has no state, just transforms data
4. **Static visual update methods** - `SelectionManager.updateVisuals()` decoupled from instance

### Files Changed
| File | Change |
|------|--------|
| `src/ui/managers/ColumnManager.ts` | NEW - column state management |
| `src/ui/managers/SelectionManager.ts` | NEW - selection state management |
| `src/ui/managers/index.ts` | NEW - exports |
| `src/ui/providers/ItemDataProvider.ts` | NEW - data transformation |
| `src/ui/providers/index.ts` | NEW - exports |
| `src/ui/MillerNavView.ts` | SIMPLIFIED - 820 → 549 lines (33% reduction) |

### Metrics
| Metric | Before | After |
|--------|--------|-------|
| MillerNavView.ts lines | 820 | 549 |
| Distinct responsibilities in view | 9 | 4 (lifecycle, callbacks, rendering, navigation) |
| Testable units | 1 | 4 |

### Build Status
Build successful

---

## 2025-12-15 - Context Menu & Component Refactoring

### Problem Analysis
| Issue | Description | Impact |
|-------|-------------|--------|
| Context menu duplication | ~100 lines of identical code between fileMenuItems.ts and folderMenuItems.ts | DRY violation, maintenance burden |
| Mixed component concerns | ColumnHeader.ts contained both header and footer rendering | Single responsibility violation |

### Solution: Shared Sections & Component Split

#### 1. Shared Context Menu Sections (`src/ui/handlers/contextMenu/sharedSections.ts`)
Extracted 5 shared functions used by both file and folder menus:

| Function | Options | Purpose |
|----------|---------|---------|
| `addSharedShortcutSection()` | `passwordProtectTitle` | Add to Shortcut, Password protect |
| `addSharedClipboardOperations()` | `includeObsidianUrl` | Copy path, Copy relative path, (optional) Copy Obsidian URL |
| `addSharedSystemOperations()` | `includeOpenInDefaultApp` | Show in explorer, (optional) Open in default app |
| `addSharedCustomization()` | `includeBackgroundColor` | Change icon/color, (optional) background color |
| `addSharedBasicOperations()` | - | Rename, Delete |

Each function accepts options with optional flags for file/folder-specific differences.

#### 2. Split ColumnHeader/ColumnFooter
Separated concerns into focused components:
- `ColumnHeader.ts` - Header with title and toolbar buttons
- `ColumnFooter.ts` - Footer with creation buttons (New note, folder, canvas, base)

### Files Changed
| File | Change |
|------|--------|
| `src/ui/handlers/contextMenu/sharedSections.ts` | NEW - shared menu sections (228 lines) |
| `src/ui/handlers/contextMenu/fileMenuItems.ts` | SIMPLIFIED - 299 → 143 lines (52% reduction) |
| `src/ui/handlers/contextMenu/folderMenuItems.ts` | SIMPLIFIED - 302 → 158 lines (48% reduction) |
| `src/ui/components/ColumnFooter.ts` | NEW - extracted footer component (44 lines) |
| `src/ui/components/ColumnHeader.ts` | SIMPLIFIED - 133 → 93 lines (30% reduction) |
| `src/ui/components/index.ts` | Updated exports |

### Metrics
| Metric | Before | After |
|--------|--------|-------|
| Context menu total lines | 601 | 529 (with shared module) |
| Duplicated code | ~100 lines | 0 |
| Component files | 3 | 4 (better separation) |

### Build Status
Build successful

---

## 2025-12-15 - Auto-Reveal Replaced with Manual Reveal

### Problem Analysis
| Issue | Description | Impact |
|-------|-------------|--------|
| Disruptive auto-navigation | Auto-reveal continuously navigated to active file on every file switch | Interrupted user navigation workflow |
| Toggle vs trigger confusion | Button functioned as toggle (on/off state) rather than one-time action | User expected single-click action |
| Unwanted setting persistence | Setting stored in plugin config but not desired by user | Polluted settings |

### Solution: Manual Single-Click Reveal

Changed auto-reveal from continuous/toggle behavior to manual single-click trigger:
- Removed automatic file-open event listener navigation
- Changed button from toggle to one-time action button
- Removed `autoRevealActiveNote` setting from plugin config
- Kept visual active file highlighting (non-disruptive)

### Changes Made

#### 1. Removed Auto-Reveal Logic
**File**: `src/main.ts:216-222`

Removed automatic `revealFile()` call from `file-open` event handler. Event still registered but only for visual highlighting handled by MillerNavView.

#### 2. Toggle to Manual Trigger
**File**: `src/ui/MillerNavView.ts`

| Before | After |
|--------|-------|
| `toggleAutoReveal()` - toggles setting on/off | `manualRevealActiveFile()` - one-time reveal action |
| Stored `autoRevealActive` state | No state needed |
| Button shows active/inactive state | Button is always clickable |

#### 3. Updated Button Interface
**File**: `src/ui/components/ColumnHeader.ts:11-18`

Changed `ColumnHeaderOptions` interface:
- Removed: `autoRevealActive?: boolean`
- Removed: `onAutoRevealToggle?: () => void`
- Added: `onManualReveal?: () => void`
- Updated button label: "Auto reveal active file" → "Reveal active file"
- Removed `isActive` state from button

#### 4. Removed Setting
**Files**: `src/types/index.ts`, `src/settings/SettingsTab.ts`

Removed `autoRevealActiveNote: boolean` from:
- `MillerNavSettings` interface
- `DEFAULT_SETTINGS` object
- Settings UI (removed toggle control)

### User Experience Impact

| Aspect | Before | After |
|--------|--------|-------|
| File switching | Navigator auto-jumps to new file | Navigator stays where user left it |
| Reveal action | Click button to toggle on/off | Click button to reveal once |
| Visual feedback | Active file always highlighted | Active file always highlighted |
| Navigation control | System controls navigation | User controls navigation |

### Files Changed
| File | Change |
|------|--------|
| `src/main.ts` | Removed auto-reveal from file-open event (kept event for view's visual updates) |
| `src/ui/MillerNavView.ts` | Replaced `toggleAutoReveal()` with `manualRevealActiveFile()`, removed state |
| `src/ui/components/ColumnHeader.ts` | Changed interface from toggle to action button |
| `src/types/index.ts` | Removed `autoRevealActiveNote` from settings |
| `src/settings/SettingsTab.ts` | Removed auto-reveal toggle from UI |

### Build Status
Build successful
