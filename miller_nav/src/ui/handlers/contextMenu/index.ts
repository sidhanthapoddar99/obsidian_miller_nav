/**
 * Context Menu Handler - Main Entry Point
 *
 * Comprehensive custom context menu system organized by functionality:
 * - File operations (opening, copying, moving, etc.)
 * - Folder operations (creation, organization, etc.)
 * - Bulk operations (multi-selection)
 * - MillerNav-specific features (subfolder marking, customization)
 */

import { Menu } from 'obsidian';
import type { ContextMenuOptions } from './types';
import { buildFileMenu } from './fileMenuItems';
import { buildFolderMenu } from './folderMenuItems';
import { buildBulkMenu } from './bulkMenuItems';

/**
 * Show context menu for a file, folder, or bulk selection
 */
export function showContextMenu(options: ContextMenuOptions): void {
  const { event, item, selectedItems, app, columnIndex, maxLevels, confirmBeforeDelete, isMarkedFolder, clipboardManager, callbacks } = options;
  const menu = new Menu();
  const selectedCount = selectedItems.size;

  // === BULK SELECTION MENU ===
  if (selectedCount > 1) {
    buildBulkMenu(menu, {
      app,
      selectedItems,
      columnIndex,
      maxLevels,
      clipboardManager,
      callbacks
    });

    menu.showAtMouseEvent(event);
    return;
  }

  // === SINGLE ITEM MENU ===

  // Check if virtual item (Recent, Tags, Shortcuts)
  const isVirtual = item.virtualType !== undefined;

  if (isVirtual) {
    // For virtual items, show minimal menu
    menu.addItem((menuItem) => {
      menuItem
        .setTitle('Virtual folder')
        .setDisabled(true);
    });
    menu.showAtMouseEvent(event);
    return;
  }

  // Build appropriate menu based on item type
  if (item.type === 'folder') {
    buildFolderMenu(menu, {
      app,
      item,
      columnIndex,
      maxLevels,
      confirmBeforeDelete,
      isMarkedFolder,
      clipboardManager,
      callbacks
    });
  } else if (item.type === 'file') {
    buildFileMenu(menu, {
      app,
      item,
      confirmBeforeDelete,
      clipboardManager,
      callbacks
    });
  }

  menu.showAtMouseEvent(event);
}

// Re-export types for convenience
export type { ContextMenuOptions } from './types';
