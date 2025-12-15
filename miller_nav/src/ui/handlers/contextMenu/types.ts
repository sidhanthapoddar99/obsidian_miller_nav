/**
 * Shared types for context menu system
 */

import { App, Menu } from 'obsidian';
import { PaneItem } from '../../../types';
import type { ViewCallbacks } from '../../types';
import type { ClipboardManager } from '../../managers';

/**
 * Main context menu options
 */
export interface ContextMenuOptions {
  app: App;
  event: MouseEvent;
  item: PaneItem;
  columnIndex: number;
  selectedItems: Set<string>;
  maxLevels: number;
  confirmBeforeDelete: boolean;
  isMarkedFolder: (path: string) => boolean;
  clipboardManager: ClipboardManager;
  callbacks: ViewCallbacks;
}

/**
 * Options for bulk selection menu
 */
export interface BulkMenuOptions {
  app: App;
  selectedItems: Set<string>;
  columnIndex: number;
  maxLevels: number;
  clipboardManager: ClipboardManager;
  callbacks: ViewCallbacks;
}

/**
 * Options for folder menu
 */
export interface FolderMenuOptions {
  app: App;
  item: PaneItem;
  columnIndex: number;
  maxLevels: number;
  confirmBeforeDelete: boolean;
  isMarkedFolder: (path: string) => boolean;
  clipboardManager: ClipboardManager;
  callbacks: ViewCallbacks;
}

/**
 * Options for file menu
 */
export interface FileMenuOptions {
  app: App;
  item: PaneItem;
  confirmBeforeDelete: boolean;
  clipboardManager: ClipboardManager;
  callbacks: ViewCallbacks;
}

/**
 * Menu builder function signature
 */
export type MenuBuilder = (menu: Menu, options: ContextMenuOptions) => void;
