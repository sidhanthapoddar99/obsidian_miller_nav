
# MillerNav - Software Requirements Specification

> **Version:** 1.0.0  
> **Status:** Draft  
> **Last Updated:** December 2025  
> **License:** GPL-3.0 (following Obsidian plugin conventions)

---

## Table of Contents

1. [Executive Summary](https://claude.ai/chat/21de8440-2ff3-4bc9-b880-f2784154ba63#1-executive-summary)
2. [Project Overview](https://claude.ai/chat/21de8440-2ff3-4bc9-b880-f2784154ba63#2-project-overview)
3. [Core Concepts](https://claude.ai/chat/21de8440-2ff3-4bc9-b880-f2784154ba63#3-core-concepts)
4. [Feature Specifications](https://claude.ai/chat/21de8440-2ff3-4bc9-b880-f2784154ba63#4-feature-specifications)
5. [User Interface Design](https://claude.ai/chat/21de8440-2ff3-4bc9-b880-f2784154ba63#5-user-interface-design)
6. [Data Architecture](https://claude.ai/chat/21de8440-2ff3-4bc9-b880-f2784154ba63#6-data-architecture)
7. [Technical Architecture](https://claude.ai/chat/21de8440-2ff3-4bc9-b880-f2784154ba63#7-technical-architecture)
8. [Performance Optimization](https://claude.ai/chat/21de8440-2ff3-4bc9-b880-f2784154ba63#8-performance-optimization)
9. [Mobile Strategy](https://claude.ai/chat/21de8440-2ff3-4bc9-b880-f2784154ba63#9-mobile-strategy)
10. [Integration & Extensibility](https://claude.ai/chat/21de8440-2ff3-4bc9-b880-f2784154ba63#10-integration--extensibility)
11. [Settings & Configuration](https://claude.ai/chat/21de8440-2ff3-4bc9-b880-f2784154ba63#11-settings--configuration)
12. [Commands & Hotkeys](https://claude.ai/chat/21de8440-2ff3-4bc9-b880-f2784154ba63#12-commands--hotkeys)
13. [API Reference](https://claude.ai/chat/21de8440-2ff3-4bc9-b880-f2784154ba63#13-api-reference)
14. [Development Roadmap](https://claude.ai/chat/21de8440-2ff3-4bc9-b880-f2784154ba63#14-development-roadmap)
15. [References](https://claude.ai/chat/21de8440-2ff3-4bc9-b880-f2784154ba63#15-references)

---

## 1. Executive Summary

### 1.1 Vision

**MillerNav** is an Obsidian plugin that implements Miller columns navigation for vault exploration. It provides a multi-pane, hierarchical navigation system where users can mark specific folders as "subfolders" to create a cascading column layout, similar to macOS Finder's column view or OneNote's notebook/section structure.

### 1.2 Key Differentiators

|Feature|MillerNav|Notebook Navigator|File Tree Alternative|
|---|---|---|---|
|Navigation Style|Miller Columns (N-pane)|Dual-pane|Dual-pane|
|User-defined Hierarchy|✅ Mark any folder|❌ Fixed structure|❌ Fixed structure|
|Dynamic Levels|Up to 4 custom levels|2 fixed|2 fixed|
|Virtual Folders|✅ Recent, Tags, Shortcuts|✅ Similar|❌ Limited|
|Cascade Collapse|✅ Collapse to single pane|❌|❌|

### 1.3 Target Users

- Users with deeply nested vault structures
- Project-based workflow users
- Users migrating from OneNote, Notion, or macOS Finder
- Power users seeking customizable navigation

---

## 2. Project Overview

### 2.1 Problem Statement

Obsidian's default file explorer displays all files and folders in a single tree view. For users with complex, deeply nested folder structures, this becomes unwieldy:

- Deep nesting requires excessive scrolling
- Context is lost when expanding multiple folders
- No way to view multiple hierarchy levels simultaneously
- No user control over navigation structure

### 2.2 Solution

MillerNav introduces **Miller columns** navigation with user-defined hierarchy:

```
┌──────────────┬───────────────┬───────────────┬───────────────┬─────────┬
│ Level 0      │ Level 1       │ Level 2       │ Level 3       │ Editor  │
│ Virtual View │ Marked Folder │ Marked Folder │ Marked Folder │         │
├──────────────┼───────────────┼───────────────┼───────────────┼─────────│
│ Recent       │ src/          │ components/   │ Button.md     │ [Note   │
│ Tags         │ docs/         │ hooks/        │ Modal.md      │ Content]│
│ Shortcuts    │ assets/       │ utils/        │ Table.md      │         │
│ ─────────────│               │               │               │         │
│ Projects     │               │               │               │         │
│ Archive      │               │               │               │         │
└──────────────┴───────────────┴───────────────┴───────────────┴─────────┘
```

### 2.3 Core Principles

1. **User Control**: Users define which folders become navigation levels
2. **Sequential Hierarchy**: Levels must be assigned in order (0→1→2→3→4)
3. **No Duplication**: Marked folders are hidden from parent views
4. **Cascade Behavior**: Collapsing shows only the last active level
5. **Performance First**: Data loaded in RAM, minimal disk I/O
6. **Mobile Optimized**: Single-pane mode with swipe navigation

---

## 3. Core Concepts

### 3.1 Terminology

|Term|Definition|
|---|---|
|**Level 0**|The root navigation pane containing virtual folders and entry points|
|**Level 1-4**|User-marked folders that appear as separate navigation columns|
|**Marked Folder**|A folder designated by the user to appear at a specific navigation level|
|**Virtual Folder**|System-generated views (Recent, Tags, Shortcuts)|
|**Miller Columns**|A navigation technique showing multiple hierarchy levels side-by-side|
|**Cascade Collapse**|Collapsing a level hides all previous levels, showing only that level|
|**Active Path**|The currently selected folder chain highlighted across all visible levels|

### 3.2 Level System

```
Level 0 (Always Present)
├── Virtual Folders
│   ├── 🕐 Recent
│   ├── 🏷️ Tags
│   └── ⭐ Shortcuts
├── ─────────────── (Divider)
└── Marked Entry Points
    ├── 📂 Projects (→ Level 1)
    ├── 📂 Archive (→ Level 1)
    └── 📂 Resources (→ Level 1)

Level 1 (User Marked)
└── Contents of selected Level 0 entry
    ├── 📁 Subfolder A (→ Level 2 if marked)
    ├── 📁 Subfolder B
    └── 📄 Files...

Level 2-4 (User Marked)
└── Continues hierarchy...
```

### 3.3 Marking Rules

| Rule                            | Description                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------- |
| **Sequential Assignment**       | Cannot assign Level 3 without Level 2 existing in path                        |
| **Parent Requirement**          | A folder can only be Level N if its parent is Level N-1 (or root for Level 1) |
| **Automatic Level Computation** | Levels are computed at runtime by counting marked ancestors                   |
| **Max Level Setting**           | User configures maximum levels (1-4) in settings                              |
| **Visibility Rule**             | Marked folders are hidden from their parent's view                            |

### 3.4 Collapse Behavior

**Reverse Cascade Collapse**: When collapsing Level N, all levels 0 through N-1 collapse, leaving only Level N visible.

```
Before Collapse (Level 2 visible):
[Level 0] → [Level 1] → [Level 2]

After Collapsing Level 2:
                        [Level 2]  (only this visible)

Expanding restores:
[Level 0] → [Level 1] → [Level 2]
```

---

## 4. Feature Specifications

### 4.1 Core Features

#### 4.1.1 Miller Columns Navigation

|Feature|Priority|Description|
|---|---|---|
|Multi-pane layout|P0|Display 1-5 columns (Level 0 + up to 4 user levels)|
|Folder marking|P0|Right-click → "Mark as Subfolder" to add to navigation|
|Level computation|P0|Automatically compute level based on marked ancestors|
|Active path highlighting|P0|Highlight current selection path across all visible levels|
|Cascade collapse|P0|Collapse to show only selected level|
|Resizable panes|P1|Drag dividers to resize column widths|
|Breadcrumb navigation|P1|Click any segment to jump to that level|

#### 4.1.2 Virtual Folders (Level 0)

|Virtual Folder|Priority|Description|
|---|---|---|
|**Recent**|P0|Recently opened files (configurable 1-20 items)|
|**Tags**|P0|Hierarchical tag browser with nested tags support|
|**Shortcuts**|P0|User-pinned files and folders for quick access|
|**Divider**|P1|Visual separator between virtual and marked folders|

#### 4.1.3 Customization

|Feature|Priority|Description|
|---|---|---|
|Custom icons|P0|Lucide icons + emoji + external icon packs|
|Custom colors|P0|Text and background colors per item|
|Dividers|P1|Add visual separators between files/folders|
|Sort order|P1|Name, date created, date modified, custom|
|Per-folder appearance|P2|Override display settings per folder|

### 4.2 File Operations

|Operation|Priority|Method|
|---|---|---|
|Create new note|P0|Context menu, command, hotkey|
|Create new folder|P0|Context menu, command|
|Rename|P0|Context menu, inline edit|
|Delete|P0|Context menu, command, hotkey|
|Move|P0|Drag-and-drop, context menu|
|Duplicate|P1|Context menu|
|Copy path|P1|Context menu (vault path, system path)|
|Show in system explorer|P1|Context menu|

### 4.3 View Features

|Feature|Priority|Description|
|---|---|---|
|Note preview|P1|1-5 lines of preview text|
|Feature images|P2|Thumbnail from frontmatter or first image|
|File metadata|P1|Show date modified, tags|
|Note count|P1|Show file count per folder|
|Search/filter|P1|Quick filter within current pane|
|Tag display|P1|Show tags on file items|

### 4.4 Management Features

|Feature|Priority|Description|
|---|---|---|
|Tree view (Settings)|P0|Visualize all marked folders as tree|
|Invalid folder detection|P0|Mark non-existent folders in red|
|Rescan & cleanup|P0|Remove invalid entries|
|Bulk operations|P2|Select multiple files for batch actions|
|Pin notes|P1|Pin important notes to top of list|

---

## 5. User Interface Design

### 5.1 Desktop Layout

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ MillerNav Toolbar                                                           [⚙️] [−] │
├─────────────────┬──────────────────┬──────────────────┬──────────────────┬───────────┤
│ Level 0         │ Level 1          │ Level 2          │ Level 3          │           │
│ ═══════════════ │ ═══════════════  │ ═══════════════  │ ═══════════════  │           │
│                 │                  │                  │                  │           │
│ 🕐 Recent    (5)│ 📁 src        → │ 📁 components → │ 📄 Button.md     │           │
│ 🏷️ Tags        │ 📁 docs       → │ 📁 hooks      → │ 📄 Modal.md      │  Editor   │
│ ⭐ Shortcuts (3)│ 📁 tests        │ 📁 utils        │ 📄 Table.md      │  Pane     │
│ ─────────────── │                  │                  │ 📄 Form.md       │           │
│ 📂 Projects   → │                  │                  │                  │           │
│ 📂 Archive    → │                  │                  │                  │           │
│ 📂 Resources  → │                  │                  │                  │           │
│                 │                  │                  │                  │           │
├─────────────────┴──────────────────┴──────────────────┴──────────────────┤           │
│ 📍 Projects / src / components                                            │           │
└───────────────────────────────────────────────────────────────────────────┴───────────┘
  ↑ Breadcrumb bar (clickable segments)
```

### 5.2 Toolbar Components

|Component|Icon|Function|
|---|---|---|
|Collapse All|`◀◀`|Collapse to Level 0|
|Expand All|`▶▶`|Expand all levels in current path|
|Toggle Collapse|`◀▶`|Toggle between collapsed/expanded|
|New Note|`+📄`|Create note in selected folder|
|New Folder|`+📁`|Create folder in selected location|
|Search|`🔍`|Filter current pane|
|Settings|`⚙️`|Open settings|
|Minimize|`−`|Collapse sidebar|

### 5.3 Context Menu Structure

#### Folder Context Menu

```
├── Mark as Subfolder          (toggle)
├── ───────────────────────────
├── New note
├── New folder
├── ───────────────────────────
├── Change icon               →
├── Change color              →
├── Change background         →
├── Add divider below
├── ───────────────────────────
├── Add to shortcuts
├── ───────────────────────────
├── Rename folder
├── Move folder to...
├── Duplicate folder
├── Delete folder
├── ───────────────────────────
├── Copy vault path
├── Copy file system path
├── Show in system explorer
├── ───────────────────────────
├── [Other Plugin Items]       ← Git, etc.
```

#### File Context Menu

```
├── Open in new tab
├── Open in new window
├── Open to the right
├── ───────────────────────────
├── Change icon               →
├── Change color              →
├── Pin note
├── Add to shortcuts
├── ───────────────────────────
├── Rename
├── Move to...
├── Duplicate
├── Delete
├── ───────────────────────────
├── Copy vault path
├── Copy file system path
├── Show in system explorer
├── ───────────────────────────
├── [Other Plugin Items]
```

### 5.4 Visual States

|State|Visual Indicator|
|---|---|
|Selected item|Background highlight|
|Active path|Highlighted across all levels|
|Marked subfolder|Arrow indicator (→)|
|Pinned item|Pin icon (📌)|
|Has children|Folder icon with indicator|
|Empty folder|Dimmed folder icon|
|Invalid/missing|Red text, strikethrough|

### 5.5 Animations & Transitions

|Action|Animation|
|---|---|
|Pane open|Slide in from left (200ms ease-out)|
|Pane collapse|Slide out to left (200ms ease-in)|
|Item select|Background fade (100ms)|
|Drag hover|Scale up 1.02 (150ms)|
|Loading|Skeleton pulse animation|

---

## 6. Data Architecture

### 6.1 Storage Strategy

MillerNav uses a **multi-file configuration** approach for better organization and sync compatibility:

```
.obsidian/plugins/miller-nav/
├── data.json              # Core settings (synced)
├── data/
│   ├── folders.json       # Marked folders & metadata
│   ├── shortcuts.json     # Pinned shortcuts
│   ├── appearance.json    # Icons, colors, custom appearances
│   ├── cache.json         # Local cache (not synced)
│   └── state.json         # UI state (not synced)
└── icons/                 # Downloaded icon packs (local)
    ├── bootstrap/
    ├── fontawesome/
    └── ...
```

### 6.2 Data Schemas

#### 6.2.1 Core Settings (`data.json`)

```typescript
interface MillerNavSettings {
  version: string;                    // Schema version for migrations
  maxLevels: 1 | 2 | 3 | 4;          // Maximum navigation levels
  
  // Startup
  defaultView: 'navigation' | 'list';
  autoRevealActiveNote: boolean;
  homepage: string | null;           // Path to homepage file
  mobileHomepage: string | null;     // Separate mobile homepage
  
  // Display
  showRecentNotes: boolean;
  recentNotesCount: number;          // 1-20
  showTags: boolean;
  showShortcuts: boolean;
  showNoteCount: boolean;
  showNotePreview: boolean;
  previewLines: 1 | 2 | 3 | 4 | 5;
  showFeatureImages: boolean;
  showFileDate: boolean;
  showFileTags: boolean;
  
  // Behavior
  autoExpandFolders: boolean;
  collapseKeepsSelected: boolean;
  confirmBeforeDelete: boolean;
  
  // Icons
  showIcons: boolean;
  enabledIconPacks: string[];        // ['lucide', 'bootstrap', ...]
  
  // Context Menu
  contextMenuItems: {
    [itemId: string]: boolean;       // Toggle visibility
  };
  
  // Advanced
  excludedFolders: string[];         // Glob patterns
  excludedNotes: string[];           // Frontmatter properties
  syncUIState: boolean;              // Sync collapse state across devices
}
```

#### 6.2.2 Folders Data (`data/folders.json`)

```typescript
interface FoldersData {
  version: string;
  
  // Simple list of marked folder paths
  // Level is computed at runtime
  markedFolders: string[];
  
  // Folder metadata (optional per-folder settings)
  metadata: {
    [folderPath: string]: FolderMetadata;
  };
}

interface FolderMetadata {
  icon?: string;                     // Icon identifier
  color?: string;                    // Hex color code
  backgroundColor?: string;          // Hex color code
  hasDividerBelow?: boolean;
  customSortOrder?: 'name' | 'created' | 'modified' | 'custom';
  customAppearance?: {
    previewLines?: number;
    showDate?: boolean;
    showTags?: boolean;
    slimMode?: boolean;
  };
  pinnedNotes?: string[];            // Paths to pinned notes within this folder
  sortIndex?: number;                // For custom ordering
}
```

#### 6.2.3 Shortcuts Data (`data/shortcuts.json`)

```typescript
interface ShortcutsData {
  version: string;
  
  items: Shortcut[];
}

interface Shortcut {
  id: string;                        // UUID
  type: 'file' | 'folder' | 'tag' | 'search';
  path: string;                      // File/folder path or tag name
  query?: string;                    // For saved searches
  icon?: string;
  color?: string;
  sortIndex: number;
}
```

#### 6.2.4 Appearance Data (`data/appearance.json`)

```typescript
interface AppearanceData {
  version: string;
  
  // File-specific customizations
  files: {
    [filePath: string]: {
      icon?: string;
      color?: string;
    };
  };
  
  // Tag customizations
  tags: {
    [tagName: string]: {
      icon?: string;
      color?: string;
      isFavorite?: boolean;
      isHidden?: boolean;
    };
  };
}
```

#### 6.2.5 Cache Data (`data/cache.json`) - Local Only

```typescript
interface CacheData {
  version: string;
  lastUpdated: number;               // Unix timestamp
  
  // File previews cache
  previews: {
    [filePath: string]: {
      text: string;
      hash: string;                  // Content hash for invalidation
      timestamp: number;
    };
  };
  
  // Feature images cache
  featureImages: {
    [filePath: string]: {
      imagePath: string;
      timestamp: number;
    };
  };
  
  // Recent files
  recentFiles: {
    path: string;
    timestamp: number;
  }[];
}
```

#### 6.2.6 UI State (`data/state.json`) - Local Only

```typescript
interface UIState {
  version: string;
  
  // Pane widths
  paneWidths: number[];              // [level0Width, level1Width, ...]
  
  // Expanded folders per level
  expandedFolders: {
    [level: number]: string[];
  };
  
  // Selected items
  selectedPath: string[];            // [level0Item, level1Item, ...]
  
  // Scroll positions
  scrollPositions: {
    [level: number]: number;
  };
  
  // Last active level
  activeLevel: number;
  
  // Collapse state
  isCollapsed: boolean;
  collapsedToLevel: number;
}
```

### 6.3 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         RAM CACHE                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ FoldersCache │  │ShortcutsCache│  │AppearanceCache│          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌─────────────────────────────────────────────────────┐        │
│  │                  DataManager                        │        │
│  │  - loadAll(): Promise<void>                         │        │
│  │  - saveAll(): Promise<void>                         │        │
│  │  - get<T>(key): T                                   │        │
│  │  - set<T>(key, value): void                         │        │
│  │  - onVaultChange(event): void                       │        │
│  └──────────────────────┬──────────────────────────────┘        │
│                         │                                       │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DISK STORAGE                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │folders.json│  │shortcuts.  │  │appearance. │  │ cache.json │ │
│  │            │  │   json     │  │   json     │  │  (local)   │ │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Sync Strategy

|File|Synced|Reason|
|---|---|---|
|`data.json`|✅ Yes|Core settings|
|`folders.json`|✅ Yes|Marked folders structure|
|`shortcuts.json`|✅ Yes|User-defined shortcuts|
|`appearance.json`|✅ Yes|Visual customizations|
|`cache.json`|❌ No|Device-specific cache|
|`state.json`|⚙️ Optional|UI state (configurable)|
|`icons/*`|❌ No|Downloaded on-demand|

---

## 7. Technical Architecture

### 7.1 Technology Stack

|Component|Technology|Rationale|
|---|---|---|
|Language|TypeScript|Type safety, Obsidian standard|
|UI Framework|Vanilla DOM + Custom Components|Performance, no dependencies|
|Build Tool|esbuild|Fast builds, Obsidian standard|
|Linting|ESLint (Obsidian plugin)|Code quality|
|Virtual Scrolling|Custom implementation|Handle large folders|

### 7.2 Module Architecture

```
src/
├── main.ts                      # Plugin entry point
├── types/
│   ├── index.ts                 # Type definitions
│   └── obsidian-extensions.d.ts # Extended Obsidian types
├── core/
│   ├── DataManager.ts           # Data loading/saving
│   ├── LevelComputer.ts         # Level calculation logic
│   ├── FolderWatcher.ts         # Vault change handler
│   └── EventBus.ts              # Internal event system
├── ui/
│   ├── MillerNavView.ts         # Main ItemView
│   ├── components/
│   │   ├── Pane.ts              # Single column pane
│   │   ├── PaneItem.ts          # File/folder item
│   │   ├── Toolbar.ts           # Top toolbar
│   │   ├── Breadcrumb.ts        # Breadcrumb bar
│   │   ├── ContextMenu.ts       # Context menu builder
│   │   ├── IconPicker.ts        # Icon selection modal
│   │   ├── ColorPicker.ts       # Color selection modal
│   │   └── VirtualScroller.ts   # Virtual scrolling
│   ├── virtual/
│   │   ├── RecentPane.ts        # Recent files pane
│   │   ├── TagsPane.ts          # Tags browser pane
│   │   └── ShortcutsPane.ts     # Shortcuts pane
│   └── mobile/
│       ├── MobileView.ts        # Mobile-specific view
│       └── SwipeHandler.ts      # Swipe navigation
├── services/
│   ├── IconService.ts           # Icon management
│   ├── PreviewService.ts        # Note preview generation
│   ├── SearchService.ts         # Search/filter
│   └── DragDropService.ts       # Drag and drop handling
├── settings/
│   ├── SettingsTab.ts           # Main settings tab
│   ├── tabs/
│   │   ├── GeneralTab.ts
│   │   ├── AppearanceTab.ts
│   │   ├── FoldersTab.ts        # Tree view of marked folders
│   │   ├── ContextMenuTab.ts
│   │   └── IconPacksTab.ts
│   └── modals/
│       └── FolderTreeModal.ts   # Marked folders tree view
├── commands/
│   └── Commands.ts              # All plugin commands
├── api/
│   └── PublicAPI.ts             # Public API for other plugins
└── utils/
    ├── path.ts                  # Path utilities
    ├── debounce.ts              # Debounce/throttle
    └── dom.ts                   # DOM utilities
```

### 7.3 Class Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         MillerNavPlugin                         │
│  - settings: MillerNavSettings                                  │
│  - dataManager: DataManager                                     │
│  - view: MillerNavView                                          │
│  + onload(): Promise<void>                                      │
│  + onunload(): void                                             │
│  + saveSettings(): Promise<void>                                │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│   DataManager   │ │MillerNavView│ │   SettingsTab   │
│                 │ │  (ItemView) │ │                 │
│ - cache: Map    │ │             │ │ - plugin: ref   │
│ + load()        │ │ - panes[]   │ │ + display()     │
│ + save()        │ │ + render()  │ │                 │
│ + get()         │ │ + collapse()│ │                 │
│ + set()         │ │ + expand()  │ │                 │
└────────┬────────┘ └──────┬──────┘ └─────────────────┘
         │                 │
         │                 ▼
         │          ┌──────────────┐
         │          │     Pane     │
         │          │              │
         │          │ - level: num │
         │          │ - items[]    │
         │          │ + render()   │
         │          │ + scroll()   │
         │          └──────┬───────┘
         │                 │
         │                 ▼
         │          ┌──────────────┐
         │          │   PaneItem   │
         │          │              │
         │          │ - file/folder│
         │          │ - metadata   │
         │          │ + onClick()  │
         │          │ + onContext()│
         │          └──────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│          LevelComputer              │
│                                     │
│ + computeLevel(path): number        │
│ + getAncestorLevels(path): number[] │
│ + validateMarking(path): boolean    │
│ + canMarkAsSubfolder(path): boolean │
└─────────────────────────────────────┘
```

### 7.4 Event System

```typescript
// Internal events
type MillerNavEvents = {
  'folder:marked': { path: string };
  'folder:unmarked': { path: string };
  'folder:selected': { path: string; level: number };
  'file:selected': { path: string };
  'file:opened': { path: string };
  'pane:collapsed': { level: number };
  'pane:expanded': { level: number };
  'shortcut:added': { item: Shortcut };
  'shortcut:removed': { id: string };
  'appearance:changed': { path: string };
  'settings:changed': { key: string; value: any };
  'cache:invalidated': { type: string };
};

// Vault events (from Obsidian)
vault.on('create', ...)
vault.on('delete', ...)
vault.on('rename', ...)
vault.on('modify', ...)
```

---

## 8. Performance Optimization

### 8.1 Optimization Strategies

|Strategy|Implementation|Impact|
|---|---|---|
|**RAM Caching**|Load all config data into memory at startup|Fast reads|
|**Lazy Loading**|Load pane contents only when visible|Faster startup|
|**Virtual Scrolling**|Render only visible items (30-50 items)|Handle 100k+ files|
|**Debounced Saves**|Batch writes with 500ms debounce|Reduce disk I/O|
|**Preview Caching**|Cache file previews with content hash|Avoid re-parsing|
|**Incremental Updates**|Update only changed items on vault events|Efficient updates|

### 8.2 Memory Management

```typescript
class DataManager {
  // RAM cache - always loaded
  private foldersCache: FoldersData;
  private shortcutsCache: ShortcutsData;
  private appearanceCache: AppearanceData;
  
  // Lazy-loaded caches
  private previewCache: Map<string, PreviewData> = new Map();
  private iconCache: Map<string, SVGElement> = new Map();
  
  // LRU eviction for preview cache
  private maxPreviewCacheSize = 1000;
  
  async get<T>(key: string): Promise<T> {
    // Synchronous read from RAM
    return this.cache.get(key) as T;
  }
  
  set<T>(key: string, value: T): void {
    // Update RAM immediately
    this.cache.set(key, value);
    // Debounced disk write
    this.queueSave(key);
  }
}
```

### 8.3 Virtual Scrolling Implementation

```typescript
class VirtualScroller {
  private itemHeight = 28;           // Fixed item height
  private overscan = 5;              // Extra items above/below
  private container: HTMLElement;
  private items: PaneItemData[];
  
  render(): void {
    const scrollTop = this.container.scrollTop;
    const viewportHeight = this.container.clientHeight;
    
    const startIndex = Math.max(0, 
      Math.floor(scrollTop / this.itemHeight) - this.overscan
    );
    const endIndex = Math.min(this.items.length,
      Math.ceil((scrollTop + viewportHeight) / this.itemHeight) + this.overscan
    );
    
    // Only render visible items
    const visibleItems = this.items.slice(startIndex, endIndex);
    
    // Position with transform for smooth scrolling
    this.renderItems(visibleItems, startIndex);
  }
}
```

### 8.4 Benchmark Targets

|Metric|Target|Measurement|
|---|---|---|
|Startup time|< 200ms|Time to first render|
|Pane switch|< 50ms|Time to render new pane|
|Search filter|< 100ms|Time to filter 10k items|
|Memory usage|< 50MB|With 50k files cached|
|Scroll performance|60 FPS|Virtual scroll smoothness|

---

## 9. Mobile Strategy

### 9.1 Mobile Layout

On mobile, MillerNav uses a **single-pane mode** with swipe navigation:

```
┌────────────────────────────┐
│ ◀ Projects / src           │  ← Header with back + breadcrumb
├────────────────────────────┤
│                            │
│ 📁 components          →   │
│ 📁 hooks               →   │
│ 📁 utils               →   │
│ 📄 index.ts                │
│ 📄 types.ts                │
│                            │
│                            │
│                            │
│                            │
├────────────────────────────┤
│ [+📄] [+📁] [🔍]          │  ← Bottom toolbar
└────────────────────────────┘
```

### 9.2 Mobile Navigation

|Action|Gesture|Result|
|---|---|---|
|Go deeper|Tap folder / Swipe left|Navigate to folder contents|
|Go back|Tap ◀ / Swipe right|Return to parent level|
|Open file|Tap file|Open in editor|
|Context menu|Long press|Show context menu|
|Quick actions|Swipe item left|Reveal action buttons|

### 9.3 Mobile-Specific Features

|Feature|Desktop|Mobile|
|---|---|---|
|Pane count|1-5|1|
|Navigation|Click|Tap + Swipe|
|Context menu|Right-click|Long press|
|Drag & drop|✅|❌ (use context menu)|
|Breadcrumb|Full path|Scrollable, abbreviated|
|Toolbar|Top|Bottom (thumb-friendly)|
|Item height|28px|44px (touch-friendly)|

### 9.4 Platform Detection

```typescript
import { Platform } from 'obsidian';

class MillerNavView extends ItemView {
  render(): void {
    if (Platform.isMobile) {
      this.renderMobile();
    } else {
      this.renderDesktop();
    }
  }
  
  private renderMobile(): void {
    // Single pane with navigation stack
    const currentLevel = this.navigationStack[this.navigationStack.length - 1];
    this.renderPane(currentLevel);
    this.renderMobileToolbar();
    this.setupSwipeHandlers();
  }
}
```

---

## 10. Integration & Extensibility

### 10.1 Obsidian Integration

|Integration|Method|Purpose|
|---|---|---|
|File Explorer events|`workspace.on('file-menu')`|Add menu items|
|Theme support|CSS variables|Match vault theme|
|Commands|`this.addCommand()`|Register commands|
|Settings|`this.addSettingTab()`|Settings UI|
|Ribbon|`this.addRibbonIcon()`|Quick access icon|
|Hotkeys|Command + hotkey mapping|Keyboard shortcuts|

### 10.2 Context Menu Integration

Allow other plugins to add items to MillerNav's context menu:

```typescript
// In MillerNavPlugin
this.registerEvent(
  this.app.workspace.on('file-menu', (menu, file, source) => {
    if (source === 'miller-nav') {
      // Let other plugins add their items
      this.app.workspace.trigger('file-menu', menu, file, 'miller-nav-folder');
    }
  })
);

// Context menu builder
class ContextMenuBuilder {
  build(file: TAbstractFile): Menu {
    const menu = new Menu();
    
    // Add MillerNav items
    this.addMillerNavItems(menu, file);
    
    // Add separator
    menu.addSeparator();
    
    // Trigger for other plugins
    this.app.workspace.trigger('file-menu', menu, file, 'miller-nav');
    
    return menu;
  }
}
```

### 10.3 Icon Pack Integration

Support for external icon packs (inspired by Notebook Navigator):

|Icon Pack|Icons|Source|
|---|---|---|
|Lucide (built-in)|1,000+|Obsidian default|
|Bootstrap Icons|2,000+|icons.getbootstrap.com|
|Font Awesome|1,600+|fontawesome.com|
|Material Icons|2,000+|fonts.google.com/icons|
|Phosphor|6,000+|phosphoricons.com|
|Simple Icons|3,000+|simpleicons.org (brands)|
|Custom SVG|∞|User-provided|

```typescript
interface IconPack {
  id: string;
  name: string;
  version: string;
  downloadUrl: string;
  icons: Map<string, string>;  // name → SVG string
  
  getIcon(name: string): SVGElement | null;
  searchIcons(query: string): string[];
}

class IconService {
  private packs: Map<string, IconPack> = new Map();
  private cache: Map<string, SVGElement> = new Map();
  
  async loadPack(packId: string): Promise<void> {
    // Download and cache icon pack
  }
  
  getIcon(identifier: string): SVGElement | null {
    // identifier format: "pack:icon-name" or just "icon-name" for lucide
    // e.g., "bootstrap:folder-fill", "fa:folder", "folder"
  }
}
```

### 10.4 Style Settings Integration

Support for the Style Settings plugin:

```css
/* styles.css */
.miller-nav-pane {
  --mn-bg-primary: var(--background-primary);
  --mn-bg-secondary: var(--background-secondary);
  --mn-text-normal: var(--text-normal);
  --mn-text-muted: var(--text-muted);
  --mn-accent: var(--interactive-accent);
  --mn-border: var(--background-modifier-border);
  
  /* Item styling */
  --mn-item-height: 28px;
  --mn-item-padding: 4px 8px;
  --mn-item-radius: 4px;
  
  /* Icon styling */
  --mn-icon-size: 16px;
  --mn-icon-color: var(--text-muted);
}

/* @settings
name: MillerNav
id: miller-nav
settings:
  - id: mn-item-height
    title: Item Height
    type: variable-number-slider
    default: 28
    min: 20
    max: 44
    step: 2
    format: px
*/
```

### 10.5 Public API

```typescript
// api/PublicAPI.ts
export interface MillerNavAPI {
  // Navigation
  navigateTo(path: string): void;
  revealFile(path: string): void;
  getCurrentPath(): string[];
  
  // Folder marking
  markAsSubfolder(path: string): boolean;
  unmarkSubfolder(path: string): boolean;
  isMarkedSubfolder(path: string): boolean;
  getMarkedFolders(): string[];
  
  // Shortcuts
  addShortcut(path: string, type: 'file' | 'folder' | 'tag'): void;
  removeShortcut(id: string): void;
  getShortcuts(): Shortcut[];
  
  // Appearance
  setFolderIcon(path: string, icon: string): void;
  setFolderColor(path: string, color: string): void;
  setFileIcon(path: string, icon: string): void;
  setFileColor(path: string, color: string): void;
  
  // Events
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
}

// Access from other plugins
const millerNav = this.app.plugins.getPlugin('miller-nav')?.api as MillerNavAPI;
if (millerNav) {
  millerNav.navigateTo('Projects/MyProject');
}
```

---

## 11. Settings & Configuration

### 11.1 Settings Tabs

#### General Tab

```
┌─────────────────────────────────────────────────────────────────┐
│ General Settings                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Maximum navigation levels                                       │
│ [====●======] 3                                    (1-4)        │
│                                                                 │
│ Default view on startup                                         │
│ [Navigation pane ▼]                                             │
│                                                                 │
│ ☑ Auto-reveal active note                                       │
│ ☑ Auto-expand folders on selection                              │
│ ☑ Collapse keeps selected item expanded                         │
│ ☑ Confirm before deleting                                       │
│                                                                 │
│ Homepage                                                        │
│ [Select file...]                                                │
│                                                                 │
│ Mobile homepage (optional)                                      │
│ [Select file...]                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Navigation Tab

```
┌─────────────────────────────────────────────────────────────────┐
│ Navigation Settings                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Virtual Folders                                                 │
│ ☑ Show Recent notes                                             │
│   Recent notes count: [10 ▼]                      (1-20)        │
│ ☑ Show Tags                                                     │
│ ☑ Show Shortcuts                                                │
│                                                                 │
│ Filtering                                                       │
│ Excluded folders (comma-separated patterns)                     │
│ [.git, .obsidian, node_modules, *_backup            ]           │
│                                                                 │
│ Excluded notes (frontmatter properties)                         │
│ [draft, archived, private                           ]           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Appearance Tab

```
┌─────────────────────────────────────────────────────────────────┐
│ Appearance Settings                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Icons                                                           │
│ ☑ Show icons                                                    │
│ ☐ Apply colors to icons only                                    │
│                                                                 │
│ Note Display                                                    │
│ ☑ Show note count in folders                                    │
│ ☑ Show note preview                                             │
│   Preview lines: [2 ▼]                            (1-5)         │
│ ☑ Show feature images                                           │
│ ☑ Show file date                                                │
│ ☑ Show file tags                                                │
│                                                                 │
│ Layout                                                          │
│ Item height: [====●======] 28px                   (20-44)       │
│ Tree indentation: [====●======] 16px              (8-32)        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Folders Tab

```
┌─────────────────────────────────────────────────────────────────┐
│ Marked Folders                                          [Rescan]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 📂 Projects                                             Level 1 │
│ ├── 📂 ProjectA                                         Level 2 │
│ │   └── 📂 src                                          Level 3 │
│ ├── 📂 ProjectB                                         Level 2 │
│ └── 📂 ProjectC (missing)                      ❌ Remove        │
│                                                                  │
│ 📂 Archive                                              Level 1 │
│ └── 📂 2024                                             Level 2 │
│                                                                  │
│ 📂 Resources                                            Level 1 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ ⚠️ 1 invalid folder detected                     Remove Invalid]│
└─────────────────────────────────────────────────────────────────┘
```

#### Context Menu Tab

```
┌─────────────────────────────────────────────────────────────────┐
│ Context Menu Items                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ File Menu                                                       │
│ ☑ Open in new tab                                               │
│ ☑ Open in new window                                            │
│ ☑ Change icon                                                   │
│ ☑ Change color                                                  │
│ ☑ Pin note                                                      │
│ ☑ Add to shortcuts                                              │
│ ☑ Copy vault path                                               │
│ ☑ Copy file system path                                         │
│ ☐ Show in system explorer                                       │
│                                                                 │
│ Folder Menu                                                     │
│ ☑ Mark as subfolder                                             │
│ ☑ New note                                                      │
│ ☑ New folder                                                    │
│ ...                                                             │
│                                                                 │
│ Other Plugins                                                   │
│ ☑ Show items from other plugins                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Icon Packs Tab

```
┌─────────────────────────────────────────────────────────────────┐
│ Icon Packs                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ✓ Lucide (built-in)                        1,000+ icons         │
│   Default Obsidian icon set                                     │
│                                                                 │
│ ○ Bootstrap Icons                        2,000+ icons  [Install]│
│   icons.getbootstrap.com                                        │
│                                                                 │
│ ✓ Font Awesome                            1,600+ icons  [Remove]│
│   fontawesome.com                                               │
│                                                                 │
│ ○ Material Icons                         2,000+ icons  [Install]│
│   fonts.google.com/icons                                        │
│                                                                 │
│ ○ Phosphor                               6,000+ icons  [Install]│
│   phosphoricons.com                                             │
│                                                                 │
│ ○ Simple Icons                           3,000+ icons  [Install]│
│   Brand icons - simpleicons.org                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Storage used: 2.4 MB                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. Commands & Hotkeys

### 12.1 Command List

|Command ID|Name|Default Hotkey|Description|
|---|---|---|---|
|`miller-nav:open`|Open MillerNav|`Ctrl+Shift+E`|Open/focus MillerNav view|
|`miller-nav:open-homepage`|Open Homepage|-|Open configured homepage|
|`miller-nav:reveal-file`|Reveal File|`Ctrl+Shift+R`|Reveal current file in navigator|
|`miller-nav:navigate-to-folder`|Navigate to Folder|-|Search and jump to folder|
|`miller-nav:navigate-to-tag`|Navigate to Tag|-|Search and jump to tag|
|`miller-nav:search`|Search|`Ctrl+Shift+F`|Focus search field|
|`miller-nav:collapse-all`|Collapse All|`Ctrl+Shift+C`|Collapse to Level 0|
|`miller-nav:expand-path`|Expand Path|-|Expand current selection path|
|`miller-nav:toggle-collapse`|Toggle Collapse|-|Toggle collapse state|
|`miller-nav:new-note`|Create New Note|`Ctrl+N`|Create note in selected folder|
|`miller-nav:new-folder`|Create New Folder|-|Create folder in selected location|
|`miller-nav:delete`|Delete|`Delete`|Delete selected items|
|`miller-nav:mark-subfolder`|Mark as Subfolder|-|Toggle subfolder marking|
|`miller-nav:add-shortcut`|Add to Shortcuts|-|Add selection to shortcuts|
|`miller-nav:rebuild-cache`|Rebuild Cache|-|Clear and rebuild cache|

### 12.2 Keyboard Navigation

|Key|Action|
|---|---|
|`↑` / `↓`|Navigate up/down in current pane|
|`←`|Go to previous level / collapse folder|
|`→`|Go to next level / expand folder|
|`Enter`|Open file / expand folder|
|`Tab`|Move to next pane|
|`Shift+Tab`|Move to previous pane|
|`Home` / `End`|Jump to first/last item|
|`Page Up` / `Page Down`|Scroll pane|
|`Ctrl+A`|Select all in current pane|
|`Escape`|Close search / clear selection|

---

## 13. API Reference

### 13.1 Level Computation

```typescript
class LevelComputer {
  /**
   * Compute the navigation level of a folder based on marked ancestors.
   * Returns -1 if folder is not in any marked hierarchy.
   */
  computeLevel(folderPath: string): number {
    const markedFolders = this.dataManager.getMarkedFolders();
    let level = 0;
    
    // Walk up the path, counting marked ancestors
    const parts = folderPath.split('/');
    let currentPath = '';
    
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (markedFolders.includes(currentPath)) {
        level++;
      }
    }
    
    // Return level only if the folder itself is marked or is a descendant
    if (markedFolders.includes(folderPath) || level > 0) {
      return level;
    }
    
    return -1;
  }
  
  /**
   * Check if a folder can be marked as a subfolder.
   * Rules:
   * - Parent must be marked (or root for Level 1)
   * - Current level must not exceed maxLevels
   */
  canMarkAsSubfolder(folderPath: string): boolean {
    const maxLevels = this.settings.maxLevels;
    const parentPath = this.getParentPath(folderPath);
    
    if (!parentPath) {
      // Root level folder - can always be Level 1
      return true;
    }
    
    const parentLevel = this.computeLevel(parentPath);
    
    // Parent must be marked (level >= 1) or be root (level = 0)
    if (parentLevel < 0) {
      return false;
    }
    
    // Check if we'd exceed max levels
    return parentLevel < maxLevels;
  }
}
```

### 13.2 Vault Event Handling

```typescript
class FolderWatcher {
  setup(): void {
    // Handle folder/file creation
    this.plugin.registerEvent(
      this.vault.on('create', (file) => this.handleCreate(file))
    );
    
    // Handle folder/file deletion
    this.plugin.registerEvent(
      this.vault.on('delete', (file) => this.handleDelete(file))
    );
    
    // Handle folder/file rename/move
    this.plugin.registerEvent(
      this.vault.on('rename', (file, oldPath) => this.handleRename(file, oldPath))
    );
  }
  
  private handleRename(file: TAbstractFile, oldPath: string): void {
    const newPath = file.path;
    
    // Update marked folders
    const markedFolders = this.dataManager.getMarkedFolders();
    const updatedFolders = markedFolders.map(path => {
      if (path === oldPath) {
        return newPath;
      }
      if (path.startsWith(oldPath + '/')) {
        return newPath + path.slice(oldPath.length);
      }
      return path;
    });
    
    this.dataManager.setMarkedFolders(updatedFolders);
    
    // Update shortcuts
    this.updateShortcutPaths(oldPath, newPath);
    
    // Update appearance data
    this.updateAppearancePaths(oldPath, newPath);
    
    // Emit event for UI update
    this.eventBus.emit('folder:renamed', { oldPath, newPath });
  }
  
  private handleDelete(file: TAbstractFile): void {
    const deletedPath = file.path;
    
    // Remove from marked folders
    const markedFolders = this.dataManager.getMarkedFolders()
      .filter(path => path !== deletedPath && !path.startsWith(deletedPath + '/'));
    
    this.dataManager.setMarkedFolders(markedFolders);
    
    // Clean up shortcuts, appearance, cache
    this.cleanupDeletedPath(deletedPath);
  }
}
```

---

## 14. Development Roadmap

### 14.1 Phase 1: Core (MVP)

**Duration:** 4-6 weeks

|Feature|Priority|Status|
|---|---|---|
|Plugin scaffold|P0|⬜|
|Basic ItemView|P0|⬜|
|Single pane navigation|P0|⬜|
|Folder marking (right-click)|P0|⬜|
|Level computation|P0|⬜|
|Multi-pane rendering|P0|⬜|
|Data persistence (folders.json)|P0|⬜|
|Basic file operations|P0|⬜|
|Vault event handling|P0|⬜|
|Settings tab (basic)|P0|⬜|

### 14.2 Phase 2: Virtual Folders & UX

**Duration:** 3-4 weeks

|Feature|Priority|Status|
|---|---|---|
|Recent files pane|P0|⬜|
|Tags browser pane|P0|⬜|
|Shortcuts system|P0|⬜|
|Cascade collapse|P0|⬜|
|Active path highlighting|P0|⬜|
|Breadcrumb navigation|P1|⬜|
|Keyboard navigation|P1|⬜|
|Drag and drop (basic)|P1|⬜|

### 14.3 Phase 3: Customization

**Duration:** 3-4 weeks

|Feature|Priority|Status|
|---|---|---|
|Custom icons (Lucide)|P0|⬜|
|Custom colors|P0|⬜|
|Dividers|P1|⬜|
|External icon packs|P1|⬜|
|Context menu customization|P1|⬜|
|Folder tree view (settings)|P0|⬜|
|Invalid folder detection|P0|⬜|
|Rescan & cleanup|P0|⬜|

### 14.4 Phase 4: Mobile & Performance

**Duration:** 2-3 weeks

|Feature|Priority|Status|
|---|---|---|
|Mobile single-pane mode|P0|⬜|
|Swipe navigation|P0|⬜|
|Touch-friendly UI|P0|⬜|
|Virtual scrolling|P1|⬜|
|Preview caching|P1|⬜|
|Performance optimization|P1|⬜|

### 14.5 Phase 5: Polish & Integration

**Duration:** 2-3 weeks

|Feature|Priority|Status|
|---|---|---|
|Other plugin menu items|P1|⬜|
|Style Settings integration|P2|⬜|
|Public API|P2|⬜|
|Note previews|P1|⬜|
|Feature images|P2|⬜|
|Pin notes|P1|⬜|
|Documentation|P0|⬜|
|Testing & bug fixes|P0|⬜|

### 14.6 Future Considerations

- Saved searches as shortcuts
- Folder notes support
- Custom sort orders
- Frontmatter-based icons/colors
- Multi-vault support
- Workspace integration
- Graph view integration

---

## 15. References

### 15.1 Inspiration

|Project|Reference|Key Learnings|
|---|---|---|
|Notebook Navigator|[GitHub](https://github.com/johansan/notebook-navigator)|Icon packs, virtual scrolling, API design|
|File Tree Alternative|[GitHub](https://github.com/ozntel/file-tree-alternative)|Dual-pane approach|
|macOS Finder|Column View|Miller columns UX|
|OneNote|Section/Page structure|Hierarchical navigation|

### 15.2 Technical Resources

|Resource|URL|Purpose|
|---|---|---|
|Obsidian API|https://github.com/obsidianmd/obsidian-api|Type definitions|
|Obsidian Docs|https://docs.obsidian.md|Plugin development|
|Sample Plugin|https://github.com/obsidianmd/obsidian-sample-plugin|Scaffold|
|Lucide Icons|https://lucide.dev|Icon reference|
|Miller Columns|https://en.wikipedia.org/wiki/Miller_columns|Concept|

### 15.3 Notebook Navigator Features to Adopt

|Feature|Priority|Notes|
|---|---|---|
|Icon packs system|P1|Download on-demand|
|IndexedDB + RAM cache|P1|Dual-layer caching|
|Virtual scrolling|P1|TanStack Virtual or custom|
|Style Settings integration|P2|CSS variables|
|Public API|P2|For plugin interop|
|Keyboard customization|P2|Via data.json|
|Multi-language support|P3|Future consideration|

---

## Appendix A: Glossary

|Term|Definition|
|---|---|
|**ItemView**|Obsidian's base class for custom sidebar views|
|**WorkspaceLeaf**|Container for views in Obsidian's workspace|
|**TAbstractFile**|Base class for files and folders in Obsidian|
|**TFile**|Obsidian's file class|
|**TFolder**|Obsidian's folder class|
|**Plugin**|Obsidian's base class for plugins|
|**Menu**|Obsidian's context menu class|
|**Modal**|Obsidian's modal dialog class|

---

## Appendix B: File Structure Reference

```
miller-nav/
├── .github/
│   └── workflows/
│       └── release.yml
├── src/
│   └── [see Module Architecture]
├── styles/
│   └── styles.css
├── docs/
│   ├── README.md
│   ├── CHANGELOG.md
│   └── API.md
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── .eslintrc.js
└── LICENSE
```

---

## Appendix C: manifest.json

```json
{
  "id": "miller-nav",
  "name": "MillerNav",
  "version": "1.0.0",
  "minAppVersion": "1.4.0",
  "description": "Miller columns navigation for Obsidian with user-defined folder hierarchy",
  "author": "Your Name",
  "authorUrl": "https://github.com/yourusername",
  "fundingUrl": "https://buymeacoffee.com/yourusername",
  "isDesktopOnly": false
}
```

---

_Document generated: December 2025_ _This is a living document and will be updated as development progresses._