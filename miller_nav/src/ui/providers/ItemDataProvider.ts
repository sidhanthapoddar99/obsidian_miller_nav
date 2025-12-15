/**
 * ItemDataProvider - Provides pane item data for rendering
 * Handles folder item collection, virtual items, and note counting
 */

import { TFolder, TFile, Vault } from 'obsidian';
import type { PaneItem, MillerNavSettings, FolderMetadata } from '../../types';

/**
 * Known Obsidian file types with their associated icons
 */
export const KNOWN_EXTENSIONS: Record<string, string> = {
  'md': 'file-text',
  'canvas': 'layout-dashboard',
  'base': 'database',
  'pdf': 'file-type',
  'png': 'image',
  'jpg': 'image',
  'jpeg': 'image',
  'gif': 'image',
  'svg': 'image',
  'webp': 'image',
  'mp3': 'music',
  'wav': 'music',
  'mp4': 'video',
  'webm': 'video',
};

/**
 * Interface for DataManager methods used by ItemDataProvider
 */
export interface ItemDataManagerInterface {
  isMarkedFolder(path: string): boolean;
  getFolderMetadata(path: string): FolderMetadata | undefined;
}

/**
 * Provider class for pane item data
 */
export class ItemDataProvider {
  constructor(
    private vault: Vault,
    private dataManager: ItemDataManagerInterface,
    private settings: MillerNavSettings
  ) {}

  /**
   * Update settings reference (for when settings change)
   */
  updateSettings(settings: MillerNavSettings): void {
    this.settings = settings;
  }

  /**
   * Get virtual items (Recent, Tags, Shortcuts) based on settings
   */
  getVirtualItems(): PaneItem[] {
    const items: PaneItem[] = [];

    if (this.settings.showRecentNotes) {
      items.push({
        id: 'virtual-recent',
        type: 'virtual',
        name: 'Recent',
        path: '__recent__',
        level: 0,
        virtualType: 'recent',
        icon: 'clock',
        hasChildren: false,
      });
    }

    if (this.settings.showTags) {
      items.push({
        id: 'virtual-tags',
        type: 'virtual',
        name: 'Tags',
        path: '__tags__',
        level: 0,
        virtualType: 'tags',
        icon: 'tag',
        hasChildren: false,
      });
    }

    if (this.settings.showShortcuts) {
      items.push({
        id: 'virtual-shortcuts',
        type: 'virtual',
        name: 'Shortcuts',
        path: '__shortcuts__',
        level: 0,
        virtualType: 'shortcuts',
        icon: 'star',
        hasChildren: false,
      });
    }

    return items;
  }

  /**
   * Get items for a folder (files and subfolders)
   * Returns sorted array with folders first, then files, alphabetically
   */
  getFolderItems(folder: TFolder, indent: number): PaneItem[] {
    const items: PaneItem[] = [];
    const ignoredExtensions = this.settings.ignoredExtensions.map(e => e.toLowerCase());

    for (const child of folder.children) {
      if (child instanceof TFolder) {
        // Skip hidden folders
        if (child.name.startsWith('.')) continue;

        const isMarked = this.dataManager.isMarkedFolder(child.path);
        const metadata = this.dataManager.getFolderMetadata(child.path);
        const hasChildren = child.children.some((c) =>
          (c instanceof TFolder && !c.name.startsWith('.')) ||
          (c instanceof TFile)
        );

        items.push({
          id: `folder-${child.path}`,
          type: 'folder',
          name: child.name,
          path: child.path,
          level: indent,
          isMarked,
          hasChildren,
          icon: metadata?.icon ?? 'folder',
          color: metadata?.color,
          noteCount: this.settings.showNoteCount ? this.countNotes(child) : undefined,
        });
      } else if (child instanceof TFile) {
        const ext = child.extension.toLowerCase();

        // Skip ignored extensions
        if (ignoredExtensions.includes(ext)) continue;

        const isKnownType = ext in KNOWN_EXTENSIONS;
        const icon = KNOWN_EXTENSIONS[ext] ?? 'file';

        items.push({
          id: `file-${child.path}`,
          type: 'file',
          name: child.basename,
          path: child.path,
          level: indent,
          icon,
          hasChildren: false,
          // Only show extension label for unknown types
          extension: isKnownType ? undefined : ext.toUpperCase(),
        });
      }
    }

    // Sort: folders first, then files, alphabetically within each group
    return items.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Count markdown notes in a folder (non-recursive)
   */
  countNotes(folder: TFolder): number {
    return folder.children.filter(c => c instanceof TFile && c.extension === 'md').length;
  }

  /**
   * Get all visible items in a column for range selection
   * Traverses the folder tree following expanded folders
   */
  getVisibleItemsInColumn(
    folderPath: string,
    expandedFolders: Set<string>,
    shouldOpenHorizontally: (path: string) => boolean
  ): string[] {
    const allItems: string[] = [];
    const folder = folderPath === '/'
      ? this.vault.getRoot()
      : this.vault.getAbstractFileByPath(folderPath);

    if (!folder || !(folder instanceof TFolder)) return allItems;

    const collectItems = (parentFolder: TFolder) => {
      const children = parentFolder.children.sort((a, b) => {
        // Folders first, then files, alphabetically
        if (a instanceof TFolder && !(b instanceof TFolder)) return -1;
        if (!(a instanceof TFolder) && b instanceof TFolder) return 1;
        return a.name.localeCompare(b.name);
      });

      for (const child of children) {
        // Skip hidden folders
        if (child instanceof TFolder && child.name.startsWith('.')) continue;

        // Skip ignored extensions
        if (child instanceof TFile) {
          const ext = child.extension.toLowerCase();
          if (this.settings.ignoredExtensions.map(e => e.toLowerCase()).includes(ext)) continue;
        }

        allItems.push(child.path);

        // If folder is expanded (and not opening horizontally), add its children
        if (child instanceof TFolder &&
            expandedFolders.has(child.path) &&
            !shouldOpenHorizontally(child.path)) {
          collectItems(child);
        }
      }
    };

    collectItems(folder);
    return allItems;
  }
}
