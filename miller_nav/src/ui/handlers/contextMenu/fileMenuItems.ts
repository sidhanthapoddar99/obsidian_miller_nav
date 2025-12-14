/**
 * File context menu items
 * Organized by functionality
 */

import { Menu, TFile } from 'obsidian';
import type { FileMenuOptions } from './types';

/**
 * Build complete file context menu
 */
export function buildFileMenu(menu: Menu, options: FileMenuOptions): void {
  addShortcutSection(menu, options);
  addOpeningOptions(menu, options);
  addFileOperations(menu, options);
  addClipboardOperations(menu, options);
  addSystemOperations(menu, options);
  addIconCustomization(menu, options);
  addBasicOperations(menu, options);
}

/**
 * Shortcuts section (future implementation)
 */
function addShortcutSection(menu: Menu, options: FileMenuOptions): void {
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
      .setTitle('Password protect')
      .setIcon('lock')
      .setDisabled(true)
      .onClick(() => {
        // TODO: Implement password protection
      });
  });

  menu.addSeparator();
}

/**
 * Opening options
 */
function addOpeningOptions(menu: Menu, options: FileMenuOptions): void {
  const { app, item } = options;
  const file = app.vault.getAbstractFileByPath(item.path);

  if (!(file instanceof TFile)) return;

  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Open in new tab')
      .setIcon('file-plus')
      .onClick(() => {
        app.workspace.getLeaf('tab').openFile(file);
      });
  });

  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Open to right')
      .setIcon('separator-vertical')
      .onClick(() => {
        app.workspace.getLeaf('split', 'vertical').openFile(file);
      });
  });

  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Open in new window')
      .setIcon('scan')
      .onClick(() => {
        app.workspace.getLeaf('window').openFile(file);
      });
  });

  menu.addSeparator();
}

/**
 * File operations (Duplicate, Move, Merge, Copy, Cut)
 */
function addFileOperations(menu: Menu, options: FileMenuOptions): void {
  const { app, item } = options;
  const file = app.vault.getAbstractFileByPath(item.path);

  if (!(file instanceof TFile)) return;

  // Duplicate
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Duplicate')
      .setIcon('copy')
      .onClick(async () => {
        const content = await app.vault.read(file);
        const dir = file.parent;
        const baseName = file.basename;
        const ext = file.extension;

        let copyNum = 1;
        let newName = `${baseName} ${copyNum}.${ext}`;
        while (await app.vault.adapter.exists(`${dir?.path}/${newName}`)) {
          copyNum++;
          newName = `${baseName} ${copyNum}.${ext}`;
        }

        await app.vault.create(`${dir?.path}/${newName}`, content);
      });
  });

  // Move file to...
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Move file to...')
      .setIcon('folder-input')
      .onClick(() => {
        options.callbacks.renameItem(item.path);
      });
  });

  // Merge entire file with...
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Merge entire file with...')
      .setIcon('merge')
      .setDisabled(true)
      .onClick(() => {
        // TODO: Implement merge functionality
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
function addClipboardOperations(menu: Menu, options: FileMenuOptions): void {
  const { app, item } = options;

  // Copy Obsidian URL
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Copy Obsidian URL')
      .setIcon('link')
      .onClick(() => {
        const url = `obsidian://open?vault=${encodeURIComponent(app.vault.getName())}&file=${encodeURIComponent(item.path)}`;
        navigator.clipboard.writeText(url);
      });
  });

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
function addSystemOperations(menu: Menu, options: FileMenuOptions): void {
  const { app, item } = options;
  const file = app.vault.getAbstractFileByPath(item.path);

  if (!file) return;

  // Open in default app
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Open in default app')
      .setIcon('external-link')
      .onClick(() => {
        // @ts-ignore - openWithDefaultApp is an undocumented API
        app.openWithDefaultApp(file.path);
      });
  });

  // Show in system explorer
  menu.addItem((menuItem) => {
    menuItem
      .setTitle('Show in system explorer')
      .setIcon('folder-open')
      .onClick(() => {
        // @ts-ignore - showInFolder is an undocumented API
        app.showInFolder(file.path);
      });
  });

  menu.addSeparator();
}

/**
 * Icon customization (MillerNav specific - future implementation)
 */
function addIconCustomization(menu: Menu, options: FileMenuOptions): void {
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

  menu.addSeparator();
}

/**
 * Basic operations (Rename, Delete)
 */
function addBasicOperations(menu: Menu, options: FileMenuOptions): void {
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
