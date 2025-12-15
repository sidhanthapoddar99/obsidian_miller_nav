/**
 * Folder context menu items
 * Organized by functionality
 */

import { Menu, TFolder } from 'obsidian';
import type { FolderMenuOptions } from './types';
import { FileOperations } from '../../utils';
import {
  addSharedShortcutSection,
  addSharedClipboardOperations,
  addSharedSystemOperations,
  addSharedCustomization,
  addSharedBasicOperations,
} from './sharedSections';

/**
 * Build complete folder context menu
 */
export function buildFolderMenu(menu: Menu, options: FolderMenuOptions): void {
  addSubfolderMarking(menu, options);
  addSharedShortcutSection(menu, { ...options, passwordProtectTitle: 'Password protect folder' });
  addCreationOptions(menu, options);
  addFolderOperations(menu, options);
  addSharedClipboardOperations(menu, options);
  addSharedSystemOperations(menu, options);
  addSharedCustomization(menu, { ...options, includeBackgroundColor: true });
  addSharedBasicOperations(menu, options);
}

/**
 * Subfolder marking (MillerNav specific)
 */
function addSubfolderMarking(menu: Menu, options: FolderMenuOptions): void {
  const { item, columnIndex, maxLevels, isMarkedFolder, callbacks } = options;
  const isMarked = isMarkedFolder(item.path);

  // Only show if not at max level
  if (columnIndex >= maxLevels) return;

  menu.addItem((menuItem) => {
    menuItem
      .setTitle(isMarked ? 'Remove Subfolder' : 'Add Subfolder')
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

/**
 * Creation options
 */
function addCreationOptions(menu: Menu, options: FolderMenuOptions): void {
  const { item, callbacks } = options;

  menu.addItem((menuItem) => {
    menuItem
      .setTitle('New note')
      .setIcon('file-plus')
      .onClick(() => callbacks.createNote(item.path));
  });

  menu.addItem((menuItem) => {
    menuItem
      .setTitle('New folder')
      .setIcon('folder-plus')
      .onClick(() => callbacks.createFolder(item.path));
  });

  menu.addItem((menuItem) => {
    menuItem
      .setTitle('New canvas')
      .setIcon('layout-dashboard')
      .onClick(() => callbacks.createCanvas(item.path));
  });

  menu.addItem((menuItem) => {
    menuItem
      .setTitle('New base')
      .setIcon('database')
      .onClick(() => callbacks.createBase(item.path));
  });

  menu.addSeparator();
}

/**
 * Folder operations (Duplicate, Move, Search, Copy, Cut)
 */
function addFolderOperations(menu: Menu, options: FolderMenuOptions): void {
  const { app, item } = options;
  const folder = app.vault.getAbstractFileByPath(item.path);

  if (!(folder instanceof TFolder)) return;

  // Duplicate
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Duplicate')
      .setIcon('copy')
      .onClick(async () => {
        const fileOps = new FileOperations(app);
        await fileOps.duplicateFolder(item.path, () => options.callbacks.renderAllColumns());
      });
  });

  // Move folder to...
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Move folder to...')
      .setIcon('folder-input')
      .onClick(() => {
        options.callbacks.renameItem(item.path);
      });
  });

  // Search in folder
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Search in folder')
      .setIcon('search')
      .onClick(() => {
        // @ts-ignore - undocumented API
        const globalSearch = app.internalPlugins.getPluginById('global-search');
        if (globalSearch?.instance?.openGlobalSearch) {
          // @ts-ignore
          globalSearch.instance.openGlobalSearch(`path:"${item.path}"`);
        }
      });
  });

  // Copy
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Copy')
      .setIcon('copy')
      .onClick(() => {
        options.callbacks.copyItems([item.path]);
      });
  });

  // Cut
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Cut')
      .setIcon('scissors')
      .onClick(() => {
        options.callbacks.cutItems([item.path]);
      });
  });

  // Paste (only show if clipboard has content)
  if (!options.clipboardManager.isEmpty()) {
    menu.addItem((menuItem) => {
      const count = options.clipboardManager.getItemCount();
      const operation = options.clipboardManager.isCut() ? 'Move' : 'Paste';
      menuItem
        .setTitle(`${operation} ${count} item${count === 1 ? '' : 's'}`)
        .setIcon('clipboard-paste')
        .onClick(async () => {
          await options.callbacks.pasteItems(item.path);
        });
    });
  }

  menu.addSeparator();
}
