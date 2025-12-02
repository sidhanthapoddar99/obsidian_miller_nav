/**
 * UI-specific types for MillerNav
 */

/**
 * Represents the state of a single column in the Miller columns layout
 */
export interface ColumnState {
  folderPath: string;
  selectedItem?: string;
  expandedFolders: Set<string>;
  isCollapsed: boolean;
}

/**
 * Serializable version of ColumnState for persistence
 */
export interface SerializedColumnState {
  folderPath: string;
  selectedItem?: string;
  expandedFolders: string[];
  isCollapsed: boolean;
}

/**
 * View state for persistence
 */
export interface ViewState {
  columns: SerializedColumnState[];
  [key: string]: unknown;
}

/**
 * Callback interface for view actions
 */
export interface ViewCallbacks {
  renderAllColumns: () => Promise<void>;
  toggleColumnCollapse: (columnIndex: number) => void;
  collapseColumnTree: (columnIndex: number) => void;
  closeColumnsFrom: (columnIndex: number) => void;
  createNote: (folderPath: string) => Promise<void>;
  createFolder: (folderPath: string) => Promise<void>;
  createCanvas: (folderPath: string) => Promise<void>;
  createBase: (folderPath: string) => Promise<void>;
  openSubfolderColumn: (folderPath: string, fromColumnIndex: number) => void;
  toggleExpand: (path: string, columnIndex: number) => void;
  handleItemClick: (path: string, type: string, columnIndex: number) => void;
  moveItems: (itemPaths: string[], targetFolderPath: string) => Promise<void>;
  deleteItem: (path: string) => Promise<void>;
  renameItem: (path: string) => Promise<void>;
  clearSelection: () => void;
  toggleItemSelection: (path: string, addToSelection: boolean) => void;
  addMarkedFolder: (path: string) => void;
  removeMarkedFolder: (path: string) => void;
  getActiveFilePath: () => string | null;
}
