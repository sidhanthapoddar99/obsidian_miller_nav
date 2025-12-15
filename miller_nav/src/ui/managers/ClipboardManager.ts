/**
 * ClipboardManager
 * Manages internal clipboard state for copy/cut/paste operations
 */

import { App } from 'obsidian';

export type ClipboardOperation = 'copy' | 'cut';

export interface ClipboardData {
  items: string[];
  operation: ClipboardOperation;
  timestamp: number;
}

export class ClipboardManager {
  private data: ClipboardData | null = null;

  constructor(private app: App) {}

  /**
   * Copy items to clipboard
   */
  copy(itemPaths: string[]): void {
    if (itemPaths.length === 0) return;

    this.data = {
      items: [...itemPaths],
      operation: 'copy',
      timestamp: Date.now()
    };
  }

  /**
   * Cut items to clipboard
   */
  cut(itemPaths: string[]): void {
    if (itemPaths.length === 0) return;

    this.data = {
      items: [...itemPaths],
      operation: 'cut',
      timestamp: Date.now()
    };
  }

  /**
   * Get clipboard data with validation
   * Returns null if clipboard is empty or items no longer exist
   */
  getClipboardData(): ClipboardData | null {
    if (!this.data) return null;

    // Validate that items still exist
    const validItems = this.data.items.filter(path => {
      const file = this.app.vault.getAbstractFileByPath(path);
      return file !== null;
    });

    // If no items are valid anymore, clear clipboard
    if (validItems.length === 0) {
      this.data = null;
      return null;
    }

    // Update clipboard with only valid items
    if (validItems.length !== this.data.items.length) {
      this.data = {
        ...this.data,
        items: validItems
      };
    }

    return this.data;
  }

  /**
   * Clear clipboard
   */
  clear(): void {
    this.data = null;
  }

  /**
   * Check if clipboard is empty
   */
  isEmpty(): boolean {
    const data = this.getClipboardData();
    return data === null;
  }

  /**
   * Check if current operation is cut
   */
  isCut(): boolean {
    const data = this.getClipboardData();
    return data?.operation === 'cut';
  }

  /**
   * Check if current operation is copy
   */
  isCopy(): boolean {
    const data = this.getClipboardData();
    return data?.operation === 'copy';
  }

  /**
   * Get clipboard item paths
   */
  getItems(): string[] {
    const data = this.getClipboardData();
    return data?.items ?? [];
  }

  /**
   * Get number of items in clipboard
   */
  getItemCount(): number {
    return this.getItems().length;
  }
}
