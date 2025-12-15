/**
 * SelectionManager - Manages multi-selection state for MillerNav
 * Handles selection toggle, range selection, and visual updates
 */

import { findItemByPath } from '../utils';

/**
 * Result of a selection operation, containing old and new selection sets
 * Used for targeted visual updates
 */
export interface SelectionChangeResult {
  old: Set<string>;
  new: Set<string>;
}

/**
 * Manages selection state and visual updates
 */
export class SelectionManager {
  /** Currently selected item paths */
  readonly selectedItems: Set<string> = new Set();

  /** Anchor point for shift+click range selection */
  lastSelectedPath: string | null = null;

  /**
   * Clear all selections
   * @returns The old selection set (for visual updates)
   */
  clear(): Set<string> {
    const oldSelection = new Set(this.selectedItems);
    this.selectedItems.clear();
    this.lastSelectedPath = null;
    return oldSelection;
  }

  /**
   * Toggle selection of an item
   * @param path - Path of item to toggle
   * @param addToSelection - If true, add/remove from multi-selection; if false, replace selection
   * @returns Old and new selection sets for visual updates
   */
  toggle(path: string, addToSelection: boolean): SelectionChangeResult {
    const oldSelection = new Set(this.selectedItems);

    if (addToSelection) {
      if (this.selectedItems.has(path)) {
        this.selectedItems.delete(path);
      } else {
        this.selectedItems.add(path);
      }
    } else {
      this.selectedItems.clear();
      this.selectedItems.add(path);
    }

    // Track last selected for shift+click range selection
    this.lastSelectedPath = path;

    return {
      old: oldSelection,
      new: new Set(this.selectedItems),
    };
  }

  /**
   * Select a range of items (for shift+click)
   * @param fromPath - Starting path (anchor)
   * @param toPath - Ending path (target)
   * @param visibleItems - Array of visible item paths in display order
   * @returns Old and new selection sets for visual updates
   */
  selectRange(fromPath: string, toPath: string, visibleItems: string[]): SelectionChangeResult {
    const oldSelection = new Set(this.selectedItems);

    // Find indices of from and to items
    const fromIndex = visibleItems.indexOf(fromPath);
    const toIndex = visibleItems.indexOf(toPath);

    if (fromIndex === -1 || toIndex === -1) {
      return { old: oldSelection, new: new Set(this.selectedItems) };
    }

    // Select all items in range
    const startIndex = Math.min(fromIndex, toIndex);
    const endIndex = Math.max(fromIndex, toIndex);

    for (let i = startIndex; i <= endIndex; i++) {
      this.selectedItems.add(visibleItems[i]);
    }

    return {
      old: oldSelection,
      new: new Set(this.selectedItems),
    };
  }

  /**
   * Check if an item is selected
   */
  has(path: string): boolean {
    return this.selectedItems.has(path);
  }

  /**
   * Add an item to selection without triggering change result
   */
  add(path: string): void {
    this.selectedItems.add(path);
  }

  /**
   * Get count of selected items
   */
  get size(): number {
    return this.selectedItems.size;
  }

  /**
   * Get array of selected paths
   */
  getSelectedPaths(): string[] {
    return Array.from(this.selectedItems);
  }

  /**
   * Update DOM visual state for selection changes
   * Only updates elements that changed, not full re-render
   * @param container - Container element to search within
   * @param oldSelection - Previous selection set
   * @param newSelection - New selection set
   */
  static updateVisuals(
    container: HTMLElement,
    oldSelection: Set<string>,
    newSelection: Set<string>
  ): void {
    // Remove selection from items no longer selected
    for (const path of oldSelection) {
      if (!newSelection.has(path)) {
        const el = findItemByPath(container, path);
        if (el) el.removeClass('is-multi-selected');
      }
    }

    // Add selection to newly selected items
    for (const path of newSelection) {
      if (!oldSelection.has(path)) {
        const el = findItemByPath(container, path);
        if (el) el.addClass('is-multi-selected');
      }
    }
  }

  /**
   * Update active file visual state
   * @param container - Container element
   * @param oldPath - Previous active file path
   * @param newPath - New active file path
   */
  static updateActiveFileVisual(
    container: HTMLElement,
    oldPath: string | null,
    newPath: string | null
  ): void {
    if (oldPath) {
      const oldEl = findItemByPath(container, oldPath);
      if (oldEl) oldEl.removeClass('is-active-file');
    }
    if (newPath) {
      const newEl = findItemByPath(container, newPath);
      if (newEl) newEl.addClass('is-active-file');
    }
  }
}
