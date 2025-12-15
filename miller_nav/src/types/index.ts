/**
 * MillerNav Type Definitions
 */

// View type constant
export const MILLER_NAV_VIEW = 'miller-nav-view';

// Maximum navigation levels (configurable 1-4)
export type MaxLevels = 1 | 2 | 3 | 4;

/**
 * Core plugin settings
 */
export interface MillerNavSettings {
  version: string;
  maxLevels: MaxLevels;

  // Startup
  defaultView: 'navigation' | 'list';
  homepage: string | null;
  mobileHomepage: string | null;

  // Display
  showRecentNotes: boolean;
  recentNotesCount: number;
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

  // Advanced
  excludedFolders: string[];
  excludedNotes: string[];
  syncUIState: boolean;

  // File types
  ignoredExtensions: string[];
}

/**
 * Marked folders data structure
 */
export interface FoldersData {
  version: string;
  markedFolders: string[];
  metadata: Record<string, FolderMetadata>;
}

/**
 * Per-folder metadata
 */
export interface FolderMetadata {
  icon?: string;
  color?: string;
  backgroundColor?: string;
  hasDividerBelow?: boolean;
  customSortOrder?: 'name' | 'created' | 'modified' | 'custom';
  pinnedNotes?: string[];
  sortIndex?: number;
}

/**
 * Shortcuts data structure
 */
export interface ShortcutsData {
  version: string;
  items: Shortcut[];
}

/**
 * Individual shortcut entry
 */
export interface Shortcut {
  id: string;
  type: 'file' | 'folder' | 'tag' | 'search';
  path: string;
  query?: string;
  icon?: string;
  color?: string;
  sortIndex: number;
}

/**
 * UI State (local, not synced by default)
 */
export interface UIState {
  version: string;
  paneWidths: number[];
  expandedFolders: Record<number, string[]>;
  selectedPath: string[];
  scrollPositions: Record<number, number>;
  activeLevel: number;
  isCollapsed: boolean;
  collapsedToLevel: number;
}

/**
 * Pane item types
 */
export type PaneItemType = 'folder' | 'file' | 'virtual' | 'divider';

/**
 * Virtual folder types
 */
export type VirtualFolderType = 'recent' | 'tags' | 'shortcuts';

/**
 * Pane item data
 */
export interface PaneItem {
  id: string;
  type: PaneItemType;
  name: string;
  path: string;
  level: number;
  isMarked?: boolean;
  hasChildren?: boolean;
  icon?: string;
  color?: string;
  virtualType?: VirtualFolderType;
  noteCount?: number;
  extension?: string;  // For non-md files to show extension label
}

/**
 * Navigation event types
 */
export type MillerNavEvents = {
  'folder:marked': { path: string };
  'folder:unmarked': { path: string };
  'folder:selected': { path: string; level: number };
  'file:selected': { path: string };
  'file:opened': { path: string };
  'pane:collapsed': { level: number };
  'pane:expanded': { level: number };
  'shortcut:added': { item: Shortcut };
  'shortcut:removed': { id: string };
  'settings:changed': { key: string; value: unknown };
};

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: MillerNavSettings = {
  version: '1.0.0',
  maxLevels: 3,

  defaultView: 'navigation',
  homepage: null,
  mobileHomepage: null,

  showRecentNotes: true,
  recentNotesCount: 10,
  showTags: true,
  showShortcuts: true,
  showNoteCount: true,
  showNotePreview: false,
  previewLines: 2,
  showFeatureImages: false,
  showFileDate: false,
  showFileTags: false,

  autoExpandFolders: true,
  collapseKeepsSelected: true,
  confirmBeforeDelete: true,

  showIcons: true,

  excludedFolders: [],
  excludedNotes: [],
  syncUIState: false,

  ignoredExtensions: [],
};

/**
 * Default folders data
 */
export const DEFAULT_FOLDERS_DATA: FoldersData = {
  version: '1.0.0',
  markedFolders: [],
  metadata: {},
};

/**
 * Default shortcuts data
 */
export const DEFAULT_SHORTCUTS_DATA: ShortcutsData = {
  version: '1.0.0',
  items: [],
};

/**
 * Default UI state
 */
export const DEFAULT_UI_STATE: UIState = {
  version: '1.0.0',
  paneWidths: [200, 200, 200, 200],
  expandedFolders: {},
  selectedPath: [],
  scrollPositions: {},
  activeLevel: 0,
  isCollapsed: false,
  collapsedToLevel: 0,
};
