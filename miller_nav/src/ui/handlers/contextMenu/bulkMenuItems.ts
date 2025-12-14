/**
 * Bulk selection context menu items
 * For multi-file/folder operations
 */

import { Menu, TFolder } from 'obsidian';
import type { BulkMenuOptions } from './types';

/**
 * Build complete bulk selection menu
 */
export function buildBulkMenu(menu: Menu, options: BulkMenuOptions): void {
  addBulkOperations(menu, options);
  addSubfolderBulkOperations(menu, options);
  addSelectionManagement(menu, options);
}

/**
 * Basic bulk operations
 */
function addBulkOperations(menu: Menu, options: BulkMenuOptions): void {
  const { selectedItems } = options;
  const selectedCount = selectedItems.size;

  // Delete N items
  menu.addItem((menuItem) => {
    menuItem
      .setTitle(`Delete ${selectedCount} items`)
      .setIcon('trash')
      .setWarning(true)
      .setDisabled(true)
      .onClick(() => {
        // TODO: Implement bulk delete
      });
  });

  // Move N items
  menu.addItem((menuItem) => {
    menuItem
      .setTitle(`Move ${selectedCount} items`)
      .setIcon('folder-input')
      .setDisabled(true)
      .onClick(() => {
        // TODO: Implement bulk move
      });
  });

  menu.addSeparator();
}

/**
 * Subfolder bulk operations (MillerNav specific)
 */
function addSubfolderBulkOperations(menu: Menu, options: BulkMenuOptions): void {
  const { app, selectedItems, columnIndex, maxLevels, callbacks } = options;
  const selectedCount = selectedItems.size;

  // Get all file objects
  const files = Array.from(selectedItems)
    .map(path => app.vault.getAbstractFileByPath(path))
    .filter(file => file !== null);

  // Check if all selected are folders
  const allFolders = files.every(file => file instanceof TFolder);

  // Only show for folders and not at max level
  if (!allFolders || columnIndex >= maxLevels) return;

  // Set N folders as Subfolders
  menu.addItem((menuItem) => {
    menuItem
      .setTitle(`Set ${selectedCount} folders as Subfolders`)
      .setIcon('columns')
      .onClick(async () => {
        for (const path of selectedItems) {
          callbacks.addMarkedFolder(path);
        }
        callbacks.clearSelection();
        await callbacks.renderAllColumns();
      });
  });

  // Remove Subfolder from N folders
  menu.addItem((menuItem) => {
    menuItem
      .setTitle(`Remove Subfolder from ${selectedCount} folders`)
      .setIcon('x')
      .onClick(async () => {
        for (const path of selectedItems) {
          callbacks.removeMarkedFolder(path);
        }
        callbacks.clearSelection();
        await callbacks.renderAllColumns();
      });
  });

  menu.addSeparator();
}

/**
 * Selection management
 */
function addSelectionManagement(menu: Menu, options: BulkMenuOptions): void {
  const { callbacks } = options;

  // Clear selection
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Clear selection')
      .setIcon('x-circle')
      .onClick(() => callbacks.clearSelection());
  });
}
