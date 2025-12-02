/**
 * Context menu handler for files and folders
 */

import { App, Menu, TFolder, TFile } from 'obsidian';
import { PaneItem } from '../../types';
import type { ViewCallbacks } from '../types';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';

export interface ContextMenuOptions {
  app: App;
  event: MouseEvent;
  item: PaneItem;
  columnIndex: number;
  selectedItems: Set<string>;
  maxLevels: number;
  confirmBeforeDelete: boolean;
  isMarkedFolder: (path: string) => boolean;
  callbacks: ViewCallbacks;
}

export function showContextMenu(options: ContextMenuOptions): void {
  const {
    app,
    event,
    item,
    columnIndex,
    selectedItems,
    maxLevels,
    confirmBeforeDelete,
    isMarkedFolder,
    callbacks
  } = options;

  const menu = new Menu();
  const selectedCount = selectedItems.size;

  // Bulk actions for multiple selected items
  if (selectedCount > 1) {
    showBulkContextMenu(menu, {
      app,
      selectedItems,
      columnIndex,
      maxLevels,
      confirmBeforeDelete,
      callbacks
    });
    menu.showAtMouseEvent(event);
    return;
  }

  // Single item context menu
  if (item.type === 'folder') {
    showFolderContextMenu(menu, {
      app,
      item,
      columnIndex,
      maxLevels,
      confirmBeforeDelete,
      isMarkedFolder,
      callbacks
    });
  } else if (item.type === 'file') {
    showFileContextMenu(menu, {
      app,
      item,
      confirmBeforeDelete,
      callbacks
    });
  }

  menu.showAtMouseEvent(event);
}

interface BulkMenuOptions {
  app: App;
  selectedItems: Set<string>;
  columnIndex: number;
  maxLevels: number;
  confirmBeforeDelete: boolean;
  callbacks: ViewCallbacks;
}

function showBulkContextMenu(menu: Menu, options: BulkMenuOptions): void {
  const { app, selectedItems, columnIndex, maxLevels, confirmBeforeDelete, callbacks } = options;
  const selectedCount = selectedItems.size;

  // Check if all selected are folders
  const allFolders = Array.from(selectedItems).every(path => {
    const file = app.vault.getAbstractFileByPath(path);
    return file instanceof TFolder;
  });

  if (allFolders && columnIndex < maxLevels) {
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

  menu.addItem((menuItem) => {
    menuItem
      .setTitle(`Delete ${selectedCount} items`)
      .setIcon('trash')
      .onClick(async () => {
        const pathsToDelete = Array.from(selectedItems);
        const itemNames = pathsToDelete.map(p => p.split('/').pop() ?? p);

        const doDelete = async () => {
          for (const path of pathsToDelete) {
            const file = app.vault.getAbstractFileByPath(path);
            if (file) {
              await app.vault.trash(file, true);
            }
          }
          callbacks.clearSelection();
          await callbacks.renderAllColumns();
        };

        if (confirmBeforeDelete) {
          new DeleteConfirmModal(app, itemNames, doDelete).open();
        } else {
          await doDelete();
        }
      });
  });

  menu.addSeparator();

  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Clear selection')
      .setIcon('x-circle')
      .onClick(() => callbacks.clearSelection());
  });
}

interface FolderMenuOptions {
  app: App;
  item: PaneItem;
  columnIndex: number;
  maxLevels: number;
  confirmBeforeDelete: boolean;
  isMarkedFolder: (path: string) => boolean;
  callbacks: ViewCallbacks;
}

function showFolderContextMenu(menu: Menu, options: FolderMenuOptions): void {
  const { item, columnIndex, maxLevels, isMarkedFolder, callbacks } = options;
  const isMarked = isMarkedFolder(item.path);

  if (columnIndex < maxLevels) {
    menu.addItem((menuItem) => {
      menuItem
        .setTitle(isMarked ? 'Remove Subfolder' : 'Set as Subfolder')
        .setIcon(isMarked ? 'x' : 'columns')
        .onClick(async () => {
          if (isMarked) {
            callbacks.removeMarkedFolder(item.path);
          } else {
            callbacks.addMarkedFolder(item.path);
          }
          await callbacks.renderAllColumns();
        });
    });

    menu.addSeparator();
  }

  menu.addItem((menuItem) => {
    menuItem
      .setTitle('New note')
      .setIcon('plus')
      .onClick(() => callbacks.createNote(item.path));
  });

  menu.addItem((menuItem) => {
    menuItem
      .setTitle('New folder')
      .setIcon('folder-plus')
      .onClick(() => callbacks.createFolder(item.path));
  });

  menu.addSeparator();

  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Rename')
      .setIcon('pencil')
      .onClick(() => callbacks.renameItem(item.path));
  });

  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Delete')
      .setIcon('trash')
      .onClick(() => callbacks.deleteItem(item.path));
  });
}

interface FileMenuOptions {
  app: App;
  item: PaneItem;
  confirmBeforeDelete: boolean;
  callbacks: ViewCallbacks;
}

function showFileContextMenu(menu: Menu, options: FileMenuOptions): void {
  const { app, item, callbacks } = options;

  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Open in new tab')
      .setIcon('file-plus')
      .onClick(() => {
        const file = app.vault.getAbstractFileByPath(item.path);
        if (file instanceof TFile) {
          app.workspace.getLeaf('tab').openFile(file);
        }
      });
  });

  menu.addSeparator();

  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Rename')
      .setIcon('pencil')
      .onClick(() => callbacks.renameItem(item.path));
  });

  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Delete')
      .setIcon('trash')
      .onClick(() => callbacks.deleteItem(item.path));
  });
}
