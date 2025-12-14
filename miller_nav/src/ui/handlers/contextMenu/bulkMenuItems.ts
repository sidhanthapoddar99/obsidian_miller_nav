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
  const { app, selectedItems, callbacks } = options;
  const selectedCount = selectedItems.size;

  // Create new folder with selected items
  menu.addItem((menuItem) => {
    menuItem
      .setTitle(`Create new folder with ${selectedCount} items`)
      .setIcon('folder-plus')
      .onClick(async () => {
        // Get the parent folder path (common parent of all selected items)
        const firstItemPath = Array.from(selectedItems)[0];
        const firstItem = app.vault.getAbstractFileByPath(firstItemPath);
        if (!firstItem) return;

        const parentPath = firstItem.parent?.path || '/';

        // Prompt for folder name
        const folderName = await new Promise<string | null>((resolve) => {
          const modal = new (require('obsidian').Modal)(app);
          modal.titleEl.setText('Create new folder');

          const contentEl = modal.contentEl;
          contentEl.createEl('p', { text: `Creating folder with ${selectedCount} items` });

          const inputEl = contentEl.createEl('input', {
            type: 'text',
            placeholder: 'Folder name',
            value: 'New Folder'
          });
          inputEl.style.width = '100%';
          inputEl.style.marginBottom = '10px';

          // Select the default text
          setTimeout(() => inputEl.select(), 10);

          const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

          const createBtn = buttonContainer.createEl('button', { text: 'Create', cls: 'mod-cta' });
          createBtn.addEventListener('click', () => {
            const name = inputEl.value.trim();
            if (name) {
              modal.close();
              resolve(name);
            }
          });

          const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
          cancelBtn.addEventListener('click', () => {
            modal.close();
            resolve(null);
          });

          // Submit on Enter
          inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const name = inputEl.value.trim();
              if (name) {
                modal.close();
                resolve(name);
              }
            } else if (e.key === 'Escape') {
              e.preventDefault();
              modal.close();
              resolve(null);
            }
          });

          modal.open();
        });

        if (!folderName) return;

        // Create the new folder
        const newFolderPath = parentPath === '/' ? folderName : `${parentPath}/${folderName}`;

        try {
          await app.vault.createFolder(newFolderPath);

          // Move all selected items to the new folder
          const itemPaths = Array.from(selectedItems);
          await callbacks.moveItems(itemPaths, newFolderPath);

          // Clear selection
          callbacks.clearSelection();

          // Refresh the view
          await callbacks.renderAllColumns();
        } catch (error) {
          console.error('Error creating folder with selected items:', error);
        }
      });
  });

  menu.addSeparator();

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
