/**
 * File context menu items
 * Organized by functionality
 */

import { Menu, TFile } from 'obsidian';
import type { FileMenuOptions } from './types';
import {
  addSharedShortcutSection,
  addSharedClipboardOperations,
  addSharedSystemOperations,
  addSharedCustomization,
  addSharedBasicOperations,
} from './sharedSections';

/**
 * Build complete file context menu
 */
export function buildFileMenu(menu: Menu, options: FileMenuOptions): void {
  addSharedShortcutSection(menu, options);
  addOpeningOptions(menu, options);
  addFileOperations(menu, options);
  addSharedClipboardOperations(menu, { ...options, includeObsidianUrl: true });
  addSharedSystemOperations(menu, { ...options, includeOpenInDefaultApp: true });
  addSharedCustomization(menu, options);
  addSharedBasicOperations(menu, options);
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
