/**
 * MillerNav - Obsidian Plugin
 * Miller columns navigation for Obsidian with user-defined folder hierarchy
 */

import { Plugin, TAbstractFile, TFile, TFolder, WorkspaceLeaf } from 'obsidian';
import {
  MillerNavSettings,
  DEFAULT_SETTINGS,
  MILLER_NAV_VIEW,
} from './types';
import { DataManager } from './core/DataManager';
import { LevelComputer } from './core/LevelComputer';
import { getEventBus, resetEventBus } from './core/EventBus';
import { MillerNavView } from './ui/MillerNavView';
import { MillerNavSettingTab } from './settings/SettingsTab';

export default class MillerNavPlugin extends Plugin {
  settings: MillerNavSettings;
  dataManager: DataManager;
  levelComputer: LevelComputer;
  private isUnloading = false;

  async onload() {
    console.log('Loading MillerNav plugin');

    // Load settings
    await this.loadSettings();

    // Initialize data manager
    this.dataManager = new DataManager(this.app, this.manifest.id);
    await this.dataManager.loadAll();

    // Initialize level computer
    this.levelComputer = new LevelComputer(
      this.dataManager,
      this.settings.maxLevels
    );

    // Register the custom view
    this.registerView(MILLER_NAV_VIEW, (leaf) => new MillerNavView(leaf, this));

    // Add ribbon icon
    this.addRibbonIcon('columns', 'Open MillerNav', () => {
      this.activateView();
    });

    // Register commands
    this.addCommand({
      id: 'open-miller-nav',
      name: 'Open MillerNav',
      callback: () => this.activateView(),
    });

    this.addCommand({
      id: 'reveal-file-in-miller-nav',
      name: 'Reveal current file in MillerNav',
      callback: () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          this.revealFile(activeFile);
        }
      },
    });

    this.addCommand({
      id: 'collapse-miller-nav',
      name: 'Collapse all levels',
      callback: () => {
        const leaves = this.app.workspace.getLeavesOfType(MILLER_NAV_VIEW);
        for (const leaf of leaves) {
          if (leaf.view instanceof MillerNavView) {
            leaf.view.collapseAll();
          }
        }
      },
    });

    this.addCommand({
      id: 'refresh-miller-nav',
      name: 'Refresh MillerNav',
      callback: () => this.refreshViews(),
    });

    // Add settings tab
    this.addSettingTab(new MillerNavSettingTab(this.app, this));

    // Register vault events
    this.registerVaultEvents();

    // Open view on startup if configured
    this.app.workspace.onLayoutReady(() => {
      if (!this.isUnloading) {
        // Check if view is already open
        const leaves = this.app.workspace.getLeavesOfType(MILLER_NAV_VIEW);
        if (leaves.length === 0) {
          // Optionally auto-open on first install
          // this.activateView();
        }
      }
    });
  }

  async onunload() {
    this.isUnloading = true;
    console.log('Unloading MillerNav plugin');

    // Flush pending saves
    await this.dataManager.flushPendingSaves();

    // Reset event bus
    resetEventBus();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);

    // Update level computer with new settings
    if (this.levelComputer) {
      this.levelComputer.setMaxLevels(this.settings.maxLevels);
    }

    // Notify views of settings change
    this.refreshViews();
  }

  /**
   * Activate or create the MillerNav view
   */
  async activateView(): Promise<WorkspaceLeaf | null> {
    const { workspace } = this.app;

    let leaf = workspace.getLeavesOfType(MILLER_NAV_VIEW)[0];

    if (!leaf) {
      // Create new leaf in left sidebar
      const leftLeaf = workspace.getLeftLeaf(false);
      if (leftLeaf) {
        await leftLeaf.setViewState({
          type: MILLER_NAV_VIEW,
          active: true,
        });
        leaf = leftLeaf;
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }

    return leaf ?? null;
  }

  /**
   * Reveal a file in the navigator
   */
  async revealFile(file: TFile): Promise<void> {
    await this.activateView();

    const leaves = this.app.workspace.getLeavesOfType(MILLER_NAV_VIEW);
    for (const leaf of leaves) {
      if (leaf.view instanceof MillerNavView) {
        await leaf.view.revealFile(file);
      }
    }
  }

  /**
   * Refresh all MillerNav views
   */
  refreshViews(): void {
    const leaves = this.app.workspace.getLeavesOfType(MILLER_NAV_VIEW);
    for (const leaf of leaves) {
      if (leaf.view instanceof MillerNavView) {
        leaf.view.refresh();
      }
    }
  }

  /**
   * Register vault event handlers
   */
  private registerVaultEvents(): void {
    // Handle file/folder creation
    this.registerEvent(
      this.app.vault.on('create', (file) => {
        if (!this.isUnloading) {
          this.handleFileCreate(file);
        }
      })
    );

    // Handle file/folder deletion
    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        if (!this.isUnloading) {
          this.handleFileDelete(file);
        }
      })
    );

    // Handle file/folder rename
    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        if (!this.isUnloading) {
          this.handleFileRename(file, oldPath);
        }
      })
    );

    // Handle active file change
    this.registerEvent(
      this.app.workspace.on('file-open', (file) => {
        if (!this.isUnloading && file && this.settings.autoRevealActiveNote) {
          // Debounce to avoid rapid updates
          setTimeout(() => {
            if (!this.isUnloading) {
              this.revealFile(file);
            }
          }, 100);
        }
      })
    );
  }

  private handleFileCreate(file: TAbstractFile): void {
    // Refresh views to show new file/folder
    this.refreshViews();

    // Emit event
    if (file instanceof TFolder) {
      getEventBus().emit('folder:selected', { path: file.path, level: 0 });
    }
  }

  private handleFileDelete(file: TAbstractFile): void {
    // Clean up data manager if folder was deleted
    if (file instanceof TFolder) {
      this.dataManager.handleFolderDelete(file.path);
    }

    // Refresh views
    this.refreshViews();
  }

  private handleFileRename(file: TAbstractFile, oldPath: string): void {
    // Update data manager paths
    if (file instanceof TFolder) {
      this.dataManager.handleFolderRename(oldPath, file.path);
    }

    // Refresh views
    this.refreshViews();
  }
}
