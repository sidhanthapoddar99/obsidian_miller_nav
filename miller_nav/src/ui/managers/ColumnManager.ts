/**
 * ColumnManager - Manages column state for MillerNav
 * Handles column lifecycle, collapse/expand, and state serialization
 */

import type { ColumnState, SerializedColumnState } from '../types';
import { normalizePath } from '../utils';

/**
 * Manages Miller column state and operations
 * Note: Methods mutate state but do NOT trigger renders - the View handles that
 */
export class ColumnManager {
  private columns: ColumnState[] = [
    { folderPath: '/', expandedFolders: new Set(), isCollapsed: false }
  ];

  // ============ Accessors ============

  /**
   * Get all columns
   */
  getColumns(): ColumnState[] {
    return this.columns;
  }

  /**
   * Get a specific column by index
   */
  getColumn(index: number): ColumnState | undefined {
    return this.columns[index];
  }

  /**
   * Get the number of columns
   */
  getColumnCount(): number {
    return this.columns.length;
  }

  /**
   * Set columns directly (used for state restoration)
   */
  setColumns(columns: ColumnState[]): void {
    this.columns = columns;
  }

  /**
   * Reset to default state (single root column)
   */
  reset(): void {
    this.columns = [{ folderPath: '/', expandedFolders: new Set(), isCollapsed: false }];
  }

  // ============ Column Operations ============

  /**
   * Toggle collapsed state of a column
   * @returns true if state changed
   */
  toggleCollapse(index: number): boolean {
    const col = this.columns[index];
    if (!col) return false;
    col.isCollapsed = !col.isCollapsed;
    return true;
  }

  /**
   * Clear all expanded folders in a column (collapse tree)
   * @returns true if any folders were expanded
   */
  collapseTree(index: number): boolean {
    const col = this.columns[index];
    if (!col) return false;
    const hadExpanded = col.expandedFolders.size > 0;
    col.expandedFolders.clear();
    return hadExpanded;
  }

  /**
   * Close all columns from the given index onwards
   * Also clears selectedItem from the previous column
   * @returns true if any columns were closed
   */
  closeFrom(index: number): boolean {
    if (index <= 0) return false; // Can't close root column
    if (index >= this.columns.length) return false;

    // Clear selected item from previous column
    if (this.columns[index - 1]) {
      this.columns[index - 1].selectedItem = undefined;
    }

    this.columns = this.columns.slice(0, index);
    return true;
  }

  /**
   * Open a subfolder as a new column
   * @returns true if a new column was opened
   */
  openSubfolder(folderPath: string, fromColumnIndex: number): boolean {
    const normalizedPath = normalizePath(folderPath);

    // Check if column for this folder already exists at any position
    const existingIndex = this.columns.findIndex(col => col.folderPath === normalizedPath);
    if (existingIndex !== -1) {
      // Column already exists - don't duplicate
      return false;
    }

    // Check if column already exists at the position we'd create
    if (this.columns.length > fromColumnIndex + 1) {
      if (this.columns[fromColumnIndex + 1]?.folderPath === normalizedPath) {
        // Already have this column as the next one
        return false;
      }
    }

    // Close any columns after the current one
    this.columns = this.columns.slice(0, fromColumnIndex + 1);
    this.columns[fromColumnIndex].selectedItem = normalizedPath;
    this.columns.push({
      folderPath: normalizedPath,
      expandedFolders: new Set(),
      isCollapsed: false,
    });
    return true;
  }

  /**
   * Toggle folder expansion within a column
   * @returns true if state changed
   */
  toggleExpand(path: string, columnIndex: number): boolean {
    const col = this.columns[columnIndex];
    if (!col) return false;

    if (col.expandedFolders.has(path)) {
      col.expandedFolders.delete(path);
    } else {
      col.expandedFolders.add(path);
    }
    return true;
  }

  /**
   * Add path to expanded folders in a column
   */
  expandFolder(path: string, columnIndex: number): void {
    const col = this.columns[columnIndex];
    if (col) {
      col.expandedFolders.add(path);
    }
  }

  /**
   * Check if a folder is expanded in a column
   */
  isExpanded(path: string, columnIndex: number): boolean {
    return this.columns[columnIndex]?.expandedFolders.has(path) ?? false;
  }

  /**
   * Set selected item for a column
   */
  setSelectedItem(columnIndex: number, path: string | undefined): void {
    const col = this.columns[columnIndex];
    if (col) {
      col.selectedItem = path;
    }
  }

  /**
   * Collapse all columns - clears all tree expansions and collapses secondary columns
   * Keeps column 0 expanded, sets all others to collapsed
   */
  collapseAll(): void {
    // Clear all tree folder expansions
    for (const col of this.columns) {
      col.expandedFolders.clear();
    }

    // Collapse all secondary columns (keep them, but set isCollapsed = true)
    for (let i = 1; i < this.columns.length; i++) {
      this.columns[i].isCollapsed = true;
    }

    // Keep column 0 expanded and clear its selected item
    if (this.columns[0]) {
      this.columns[0].isCollapsed = false;
      this.columns[0].selectedItem = undefined;
    }
  }

  /**
   * Close columns to the right when clicking in an earlier column
   * Used by handleItemClick
   * @returns true if columns were closed
   */
  closeColumnsToRight(columnIndex: number, selectedPath: string): boolean {
    if (columnIndex >= this.columns.length - 1) return false;

    // Clear the selected item if clicking something different
    if (this.columns[columnIndex].selectedItem !== selectedPath) {
      this.columns = this.columns.slice(0, columnIndex + 1);
      this.columns[columnIndex].selectedItem = undefined;
      return true;
    }
    return false;
  }

  // ============ Serialization ============

  /**
   * Serialize columns for state persistence
   */
  serialize(): SerializedColumnState[] {
    return this.columns.map(col => ({
      folderPath: col.folderPath,
      selectedItem: col.selectedItem,
      expandedFolders: Array.from(col.expandedFolders),
      isCollapsed: col.isCollapsed,
    }));
  }

  /**
   * Restore columns from serialized state
   */
  deserialize(data: SerializedColumnState[]): void {
    this.columns = data.map(col => ({
      folderPath: col.folderPath,
      selectedItem: col.selectedItem,
      expandedFolders: new Set(col.expandedFolders ?? []),
      isCollapsed: col.isCollapsed ?? false,
    }));
  }
}
