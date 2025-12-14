/**
 * Folder context menu items
 * Organized by functionality
 */

import { Menu, TFolder } from 'obsidian';
import type { FolderMenuOptions } from './types';

/**
 * Build complete folder context menu
 */
export function buildFolderMenu(menu: Menu, options: FolderMenuOptions): void {
  addSubfolderMarking(menu, options);
  addShortcutSection(menu, options);
  addCreationOptions(menu, options);
  addFolderOperations(menu, options);
  addClipboardOperations(menu, options);
  addSystemOperations(menu, options);
  addCustomization(menu, options);
  addBasicOperations(menu, options);
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
 * Shortcuts section (future implementation)
 */
function addShortcutSection(menu: Menu, options: FolderMenuOptions): void {
  menu.addItem((item) => {
    item
      .setTitle('Add to Shortcut')
      .setIcon('star')
      .setDisabled(true)
      .onClick(() => {
        // TODO: Implement add to shortcuts
      });
  });

  menu.addItem((item) => {
    item
      .setTitle('Password protect folder')
      .setIcon('lock')
      .setDisabled(true)
      .onClick(() => {
        // TODO: Implement password protection
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

/**
 * Clipboard operations
 */
function addClipboardOperations(menu: Menu, options: FolderMenuOptions): void {
  const { item } = options;

  // Copy path
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Copy path')
      .setIcon('copy')
      .onClick(() => {
        navigator.clipboard.writeText(item.path);
      });
  });

  // Copy relative path
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Copy relative path')
      .setIcon('copy')
      .onClick(() => {
        navigator.clipboard.writeText(item.path);
      });
  });

  menu.addSeparator();
}

/**
 * System operations
 */
function addSystemOperations(menu: Menu, options: FolderMenuOptions): void {
  const { app, item } = options;
  const folder = app.vault.getAbstractFileByPath(item.path);

  if (!folder) return;

  // Show in system explorer
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Show in system explorer')
      .setIcon('folder-open')
      .onClick(() => {
        // @ts-ignore - showInFolder is an undocumented API
        app.showInFolder(folder.path);
      });
  });

  menu.addSeparator();
}

/**
 * Customization (MillerNav specific - future implementation)
 */
function addCustomization(menu: Menu, options: FolderMenuOptions): void {
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Change icon')
      .setIcon('image')
      .setDisabled(true)
      .onClick(() => {
        // TODO: Implement icon picker
      });
  });

  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Change icon color')
      .setIcon('palette')
      .setDisabled(true)
      .onClick(() => {
        // TODO: Implement color picker
      });
  });

  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Remove icon')
      .setIcon('x')
      .setDisabled(true)
      .onClick(() => {
        // TODO: Implement remove icon
      });
  });

  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Change background color')
      .setIcon('palette')
      .setDisabled(true)
      .onClick(() => {
        // TODO: Implement background color picker
      });
  });

  menu.addSeparator();
}

/**
 * Basic operations (Rename, Delete)
 */
function addBasicOperations(menu: Menu, options: FolderMenuOptions): void {
  const { item, callbacks } = options;

  // Rename
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Rename...')
      .setIcon('pencil')
      .onClick(() => callbacks.renameItem(item.path));
  });

  // Delete
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Delete')
      .setIcon('trash')
      .setWarning(true)
      .onClick(() => callbacks.deleteItem(item.path));
  });
}
