/**
 * DataManager - Handles all data persistence for MillerNav
 * Manages loading/saving of folders, shortcuts, and UI state
 */

import { App } from 'obsidian';
import {
  FoldersData,
  ShortcutsData,
  UIState,
  FolderMetadata,
  Shortcut,
  DEFAULT_FOLDERS_DATA,
  DEFAULT_SHORTCUTS_DATA,
  DEFAULT_UI_STATE,
} from '../types';

export class DataManager {
  private app: App;
  private pluginId: string;

  // In-memory caches
  private foldersCache: FoldersData;
  private shortcutsCache: ShortcutsData;
  private uiStateCache: UIState;

  // Debounce timers for saving
  private saveTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly SAVE_DEBOUNCE_MS = 500;

  constructor(app: App, pluginId: string) {
    this.app = app;
    this.pluginId = pluginId;
    this.foldersCache = { ...DEFAULT_FOLDERS_DATA };
    this.shortcutsCache = { ...DEFAULT_SHORTCUTS_DATA };
    this.uiStateCache = { ...DEFAULT_UI_STATE };
  }

  /**
   * Load all data from disk into memory
   */
  async loadAll(): Promise<void> {
    await Promise.all([
      this.loadFolders(),
      this.loadShortcuts(),
      this.loadUIState(),
    ]);
  }

  /**
   * Save all data to disk
   */
  async saveAll(): Promise<void> {
    await Promise.all([
      this.saveFolders(),
      this.saveShortcuts(),
      this.saveUIState(),
    ]);
  }

  // ========== Folders ==========

  private async loadFolders(): Promise<void> {
    try {
      const data = await this.readDataFile('folders.json');
      if (data) {
        this.foldersCache = {
          ...DEFAULT_FOLDERS_DATA,
          ...data,
        };
      }
    } catch (e) {
      console.warn('MillerNav: Could not load folders data', e);
      this.foldersCache = { ...DEFAULT_FOLDERS_DATA };
    }
  }

  private async saveFolders(): Promise<void> {
    await this.writeDataFile('folders.json', this.foldersCache);
  }

  getMarkedFolders(): string[] {
    return [...this.foldersCache.markedFolders];
  }

  setMarkedFolders(folders: string[]): void {
    this.foldersCache.markedFolders = [...folders];
    this.queueSave('folders');
  }

  addMarkedFolder(path: string): void {
    if (!this.foldersCache.markedFolders.includes(path)) {
      this.foldersCache.markedFolders.push(path);
      this.queueSave('folders');
    }
  }

  removeMarkedFolder(path: string): void {
    const index = this.foldersCache.markedFolders.indexOf(path);
    if (index > -1) {
      this.foldersCache.markedFolders.splice(index, 1);
      // Also remove metadata
      delete this.foldersCache.metadata[path];
      this.queueSave('folders');
    }
  }

  isMarkedFolder(path: string): boolean {
    return this.foldersCache.markedFolders.includes(path);
  }

  getFolderMetadata(path: string): FolderMetadata | undefined {
    return this.foldersCache.metadata[path];
  }

  setFolderMetadata(path: string, metadata: FolderMetadata): void {
    this.foldersCache.metadata[path] = metadata;
    this.queueSave('folders');
  }

  // ========== Shortcuts ==========

  private async loadShortcuts(): Promise<void> {
    try {
      const data = await this.readDataFile('shortcuts.json');
      if (data) {
        this.shortcutsCache = {
          ...DEFAULT_SHORTCUTS_DATA,
          ...data,
        };
      }
    } catch (e) {
      console.warn('MillerNav: Could not load shortcuts data', e);
      this.shortcutsCache = { ...DEFAULT_SHORTCUTS_DATA };
    }
  }

  private async saveShortcuts(): Promise<void> {
    await this.writeDataFile('shortcuts.json', this.shortcutsCache);
  }

  getShortcuts(): Shortcut[] {
    return [...this.shortcutsCache.items];
  }

  addShortcut(shortcut: Shortcut): void {
    this.shortcutsCache.items.push(shortcut);
    this.queueSave('shortcuts');
  }

  removeShortcut(id: string): void {
    this.shortcutsCache.items = this.shortcutsCache.items.filter(
      (s) => s.id !== id
    );
    this.queueSave('shortcuts');
  }

  // ========== UI State ==========

  private async loadUIState(): Promise<void> {
    try {
      const data = await this.readDataFile('state.json');
      if (data) {
        this.uiStateCache = {
          ...DEFAULT_UI_STATE,
          ...data,
        };
      }
    } catch (e) {
      console.warn('MillerNav: Could not load UI state', e);
      this.uiStateCache = { ...DEFAULT_UI_STATE };
    }
  }

  private async saveUIState(): Promise<void> {
    await this.writeDataFile('state.json', this.uiStateCache);
  }

  getUIState(): UIState {
    return { ...this.uiStateCache };
  }

  updateUIState(updates: Partial<UIState>): void {
    this.uiStateCache = { ...this.uiStateCache, ...updates };
    this.queueSave('state');
  }

  // ========== File Operations ==========

  private getDataPath(filename: string): string {
    return `${this.app.vault.configDir}/plugins/${this.pluginId}/data/${filename}`;
  }

  private async ensureDataDir(): Promise<void> {
    const dirPath = `${this.app.vault.configDir}/plugins/${this.pluginId}/data`;
    if (!(await this.app.vault.adapter.exists(dirPath))) {
      await this.app.vault.adapter.mkdir(dirPath);
    }
  }

  private async readDataFile(filename: string): Promise<unknown | null> {
    const path = this.getDataPath(filename);
    try {
      if (await this.app.vault.adapter.exists(path)) {
        const content = await this.app.vault.adapter.read(path);
        return JSON.parse(content);
      }
    } catch (e) {
      console.warn(`MillerNav: Error reading ${filename}`, e);
    }
    return null;
  }

  private async writeDataFile(filename: string, data: unknown): Promise<void> {
    await this.ensureDataDir();
    const path = this.getDataPath(filename);
    await this.app.vault.adapter.write(path, JSON.stringify(data, null, 2));
  }

  // ========== Debounced Saving ==========

  private queueSave(type: 'folders' | 'shortcuts' | 'state'): void {
    // Clear existing timer
    const existingTimer = this.saveTimers.get(type);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      switch (type) {
        case 'folders':
          await this.saveFolders();
          break;
        case 'shortcuts':
          await this.saveShortcuts();
          break;
        case 'state':
          await this.saveUIState();
          break;
      }
      this.saveTimers.delete(type);
    }, this.SAVE_DEBOUNCE_MS);

    this.saveTimers.set(type, timer);
  }

  /**
   * Force flush all pending saves (call before unload)
   */
  async flushPendingSaves(): Promise<void> {
    // Clear all timers and save immediately
    for (const [type, timer] of this.saveTimers) {
      clearTimeout(timer);
      switch (type) {
        case 'folders':
          await this.saveFolders();
          break;
        case 'shortcuts':
          await this.saveShortcuts();
          break;
        case 'state':
          await this.saveUIState();
          break;
      }
    }
    this.saveTimers.clear();
  }

  /**
   * Update paths when folders are renamed
   */
  handleFolderRename(oldPath: string, newPath: string): void {
    // Update marked folders
    this.foldersCache.markedFolders = this.foldersCache.markedFolders.map(
      (path) => {
        if (path === oldPath) {
          return newPath;
        }
        if (path.startsWith(oldPath + '/')) {
          return newPath + path.slice(oldPath.length);
        }
        return path;
      }
    );

    // Update metadata keys
    const newMetadata: Record<string, FolderMetadata> = {};
    for (const [path, meta] of Object.entries(this.foldersCache.metadata)) {
      if (path === oldPath) {
        newMetadata[newPath] = meta;
      } else if (path.startsWith(oldPath + '/')) {
        newMetadata[newPath + path.slice(oldPath.length)] = meta;
      } else {
        newMetadata[path] = meta;
      }
    }
    this.foldersCache.metadata = newMetadata;

    // Update shortcuts
    this.shortcutsCache.items = this.shortcutsCache.items.map((s) => {
      if (s.path === oldPath) {
        return { ...s, path: newPath };
      }
      if (s.path.startsWith(oldPath + '/')) {
        return { ...s, path: newPath + s.path.slice(oldPath.length) };
      }
      return s;
    });

    this.queueSave('folders');
    this.queueSave('shortcuts');
  }

  /**
   * Clean up when folders are deleted
   */
  handleFolderDelete(deletedPath: string): void {
    // Remove from marked folders
    this.foldersCache.markedFolders = this.foldersCache.markedFolders.filter(
      (path) => path !== deletedPath && !path.startsWith(deletedPath + '/')
    );

    // Remove metadata
    for (const path of Object.keys(this.foldersCache.metadata)) {
      if (path === deletedPath || path.startsWith(deletedPath + '/')) {
        delete this.foldersCache.metadata[path];
      }
    }

    // Remove shortcuts
    this.shortcutsCache.items = this.shortcutsCache.items.filter(
      (s) => s.path !== deletedPath && !s.path.startsWith(deletedPath + '/')
    );

    this.queueSave('folders');
    this.queueSave('shortcuts');
  }
}
