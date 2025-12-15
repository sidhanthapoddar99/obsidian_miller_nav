/**
 * Folder context menu items
 * Organized by functionality
 */

import { Menu, TFolder } from 'obsidian';
import type { FolderMenuOptions } from './types';
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
      .setDisabled(true)
      .onClick(() => {
        // TODO: Implement folder duplication
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
      .setDisabled(true)
      .onClick(() => {
        // TODO: Implement folder search
      });
  });

  // Copy
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Copy')
      .setIcon('copy')
      .setDisabled(true)
      .onClick(() => {
        // TODO: Implement copy to clipboard
      });
  });

  // Cut
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Cut')
      .setIcon('scissors')
      .setDisabled(true)
      .onClick(() => {
        // TODO: Implement cut to clipboard
      });
  });

  menu.addSeparator();
}
