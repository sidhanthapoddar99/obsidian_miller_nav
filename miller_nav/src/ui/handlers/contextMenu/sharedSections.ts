/**
 * Shared context menu sections used by both file and folder menus
 * Eliminates duplication between fileMenuItems.ts and folderMenuItems.ts
 */

import { App, Menu } from 'obsidian';
import { PaneItem } from '../../../types';
import type { ViewCallbacks } from '../../types';

/**
 * Base options for shared sections
 */
export interface SharedMenuOptions {
  app: App;
  item: PaneItem;
  callbacks: ViewCallbacks;
}

/**
 * Options for shortcut section
 */
export interface ShortcutSectionOptions extends SharedMenuOptions {
  /** Custom title for password protect (e.g., "Password protect" vs "Password protect folder") */
  passwordProtectTitle?: string;
}

/**
 * Options for clipboard section
 */
export interface ClipboardSectionOptions extends SharedMenuOptions {
  /** Whether to include "Copy Obsidian URL" option (files only) */
  includeObsidianUrl?: boolean;
}

/**
 * Options for system operations section
 */
export interface SystemSectionOptions extends SharedMenuOptions {
  /** Whether to include "Open in default app" option (files only) */
  includeOpenInDefaultApp?: boolean;
}

/**
 * Options for customization section
 */
export interface CustomizationSectionOptions extends SharedMenuOptions {
  /** Whether to include "Change background color" option (folders only) */
  includeBackgroundColor?: boolean;
}

// ============ Shared Section Functions ============

/**
 * Shortcuts section (Add to Shortcut, Password protect)
 * Used by both file and folder menus
 */
export function addSharedShortcutSection(menu: Menu, options: ShortcutSectionOptions): void {
  const { passwordProtectTitle = 'Password protect' } = options;

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
      .setTitle(passwordProtectTitle)
      .setIcon('lock')
      .setDisabled(true)
      .onClick(() => {
        // TODO: Implement password protection
      });
  });

  menu.addSeparator();
}

/**
 * Clipboard operations (Copy path, Copy relative path, optionally Copy Obsidian URL)
 * Used by both file and folder menus
 */
export function addSharedClipboardOperations(menu: Menu, options: ClipboardSectionOptions): void {
  const { app, item, includeObsidianUrl = false } = options;

  // Copy Obsidian URL (files only)
  if (includeObsidianUrl) {
    menu.addItem((menuItem) => {
      menuItem
        .setTitle('Copy Obsidian URL')
        .setIcon('link')
        .onClick(() => {
          const url = `obsidian://open?vault=${encodeURIComponent(app.vault.getName())}&file=${encodeURIComponent(item.path)}`;
          navigator.clipboard.writeText(url);
        });
    });
  }

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
 * System operations (Show in system explorer, optionally Open in default app)
 * Used by both file and folder menus
 */
export function addSharedSystemOperations(menu: Menu, options: SystemSectionOptions): void {
  const { app, item, includeOpenInDefaultApp = false } = options;
  const file = app.vault.getAbstractFileByPath(item.path);

  if (!file) return;

  // Open in default app (files only)
  if (includeOpenInDefaultApp) {
    menu.addItem((menuItem) => {
      menuItem
        .setTitle('Open in default app')
        .setIcon('external-link')
        .onClick(() => {
          // @ts-ignore - openWithDefaultApp is an undocumented API
          app.openWithDefaultApp(file.path);
        });
    });
  }

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
 * Icon/appearance customization (Change icon, Change icon color, Remove icon, optionally Change background color)
 * Used by both file and folder menus
 */
export function addSharedCustomization(menu: Menu, options: CustomizationSectionOptions): void {
  const { includeBackgroundColor = false } = options;

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

  // Change background color (folders only)
  if (includeBackgroundColor) {
    menu.addItem((menuItem) => {
      menuItem
        .setTitle('Change background color')
        .setIcon('palette')
        .setDisabled(true)
        .onClick(() => {
          // TODO: Implement background color picker
        });
    });
  }

  menu.addSeparator();
}

/**
 * Basic operations (Rename, Delete)
 * Used by both file and folder menus
 */
export function addSharedBasicOperations(menu: Menu, options: SharedMenuOptions): void {
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
