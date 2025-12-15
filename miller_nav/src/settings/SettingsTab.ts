/**
 * SettingsTab - Plugin settings interface with multiple tabs
 */

import { App, PluginSettingTab, Setting, TFolder } from 'obsidian';
import type MillerNavPlugin from '../main';
import { MaxLevels } from '../types';

export class MillerNavSettingTab extends PluginSettingTab {
  plugin: MillerNavPlugin;
  private activeTab: 'general' | 'subfolders' = 'general';

  constructor(app: App, plugin: MillerNavPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'MillerNav Settings' });

    // Tab navigation
    const tabContainer = containerEl.createDiv({ cls: 'miller-nav-settings-tabs' });

    const generalTab = tabContainer.createEl('button', {
      text: 'General',
      cls: `miller-nav-settings-tab ${this.activeTab === 'general' ? 'is-active' : ''}`,
    });
    generalTab.addEventListener('click', () => {
      this.activeTab = 'general';
      this.display();
    });

    const subfoldersTab = tabContainer.createEl('button', {
      text: 'Subfolders',
      cls: `miller-nav-settings-tab ${this.activeTab === 'subfolders' ? 'is-active' : ''}`,
    });
    subfoldersTab.addEventListener('click', () => {
      this.activeTab = 'subfolders';
      this.display();
    });

    // Tab content
    const contentContainer = containerEl.createDiv({ cls: 'miller-nav-settings-content' });

    if (this.activeTab === 'general') {
      this.displayGeneralSettings(contentContainer);
    } else {
      this.displaySubfoldersSettings(contentContainer);
    }
  }

  private displayGeneralSettings(containerEl: HTMLElement): void {
    // ========== Navigation Settings ==========
    containerEl.createEl('h3', { text: 'Navigation' });

    new Setting(containerEl)
      .setName('Maximum navigation levels')
      .setDesc('Maximum number of subfolder levels to display (1-4)')
      .addSlider((slider) =>
        slider
          .setLimits(1, 4, 1)
          .setValue(this.plugin.settings.maxLevels)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxLevels = value as MaxLevels;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Confirm before deleting')
      .setDesc('Show confirmation dialog before deleting files or folders')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.confirmBeforeDelete)
          .onChange(async (value) => {
            this.plugin.settings.confirmBeforeDelete = value;
            await this.plugin.saveSettings();
          })
      );

    // ========== Display Settings ==========
    containerEl.createEl('h3', { text: 'Display' });

    new Setting(containerEl)
      .setName('Show recent notes')
      .setDesc('Display recent notes section')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showRecentNotes)
          .onChange(async (value) => {
            this.plugin.settings.showRecentNotes = value;
            await this.plugin.saveSettings();
            this.plugin.refreshViews();
          })
      );

    new Setting(containerEl)
      .setName('Recent notes count')
      .setDesc('Number of recent notes to display (1-20)')
      .addSlider((slider) =>
        slider
          .setLimits(1, 20, 1)
          .setValue(this.plugin.settings.recentNotesCount)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.recentNotesCount = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Show tags')
      .setDesc('Display tags section')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showTags)
          .onChange(async (value) => {
            this.plugin.settings.showTags = value;
            await this.plugin.saveSettings();
            this.plugin.refreshViews();
          })
      );

    new Setting(containerEl)
      .setName('Show shortcuts')
      .setDesc('Display shortcuts section')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showShortcuts)
          .onChange(async (value) => {
            this.plugin.settings.showShortcuts = value;
            await this.plugin.saveSettings();
            this.plugin.refreshViews();
          })
      );

    new Setting(containerEl)
      .setName('Show note count')
      .setDesc('Display note count badge on folders')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showNoteCount)
          .onChange(async (value) => {
            this.plugin.settings.showNoteCount = value;
            await this.plugin.saveSettings();
            this.plugin.refreshViews();
          })
      );

    new Setting(containerEl)
      .setName('Show icons')
      .setDesc('Display icons next to files and folders')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showIcons)
          .onChange(async (value) => {
            this.plugin.settings.showIcons = value;
            await this.plugin.saveSettings();
            this.plugin.refreshViews();
          })
      );

    // ========== Advanced Settings ==========
    containerEl.createEl('h3', { text: 'Advanced' });

    new Setting(containerEl)
      .setName('Excluded folders')
      .setDesc('Comma-separated list of folder patterns to exclude')
      .addTextArea((text) =>
        text
          .setPlaceholder('.git, node_modules, .obsidian')
          .setValue(this.plugin.settings.excludedFolders.join(', '))
          .onChange(async (value) => {
            this.plugin.settings.excludedFolders = value
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Ignored file extensions')
      .setDesc('Comma-separated list of file extensions to hide (without dot, e.g.: exe, dll, json)')
      .addTextArea((text) =>
        text
          .setPlaceholder('exe, dll, json')
          .setValue(this.plugin.settings.ignoredExtensions.join(', '))
          .onChange(async (value) => {
            this.plugin.settings.ignoredExtensions = value
              .split(',')
              .map((s) => s.trim().toLowerCase().replace(/^\./, ''))
              .filter((s) => s.length > 0);
            await this.plugin.saveSettings();
            this.plugin.refreshViews();
          })
      );
  }

  private displaySubfoldersSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: 'Subfolders' });

    containerEl.createEl('p', {
      text: 'Subfolders open in new columns (Miller navigation). Right-click any folder and select "Set as Subfolder" to add it here.',
      cls: 'miller-nav-settings-description',
    });

    const subfolders = this.plugin.dataManager.getMarkedFolders();

    if (subfolders.length === 0) {
      containerEl.createEl('p', {
        text: 'No subfolders configured yet.',
        cls: 'miller-nav-settings-empty',
      });
    } else {
      const folderList = containerEl.createDiv({ cls: 'miller-nav-settings-folder-list' });

      for (const folderPath of subfolders) {
        const level = this.plugin.levelComputer.computeLevel(folderPath);
        const exists = this.app.vault.getAbstractFileByPath(folderPath) !== null;

        const folderItem = folderList.createDiv({ cls: 'miller-nav-settings-folder-item' });

        if (!exists) {
          folderItem.addClass('is-invalid');
        }

        const folderInfo = folderItem.createDiv({ cls: 'miller-nav-settings-folder-info' });
        folderInfo.createSpan({ text: folderPath, cls: 'miller-nav-settings-folder-path' });
        folderInfo.createSpan({
          text: `Level ${level}`,
          cls: 'miller-nav-settings-folder-level',
        });

        if (!exists) {
          folderInfo.createSpan({
            text: '(missing)',
            cls: 'miller-nav-settings-folder-missing',
          });
        }

        // Remove button
        const removeBtn = folderItem.createEl('button', {
          text: 'Remove',
          cls: 'miller-nav-settings-folder-remove',
        });
        removeBtn.addEventListener('click', async () => {
          this.plugin.dataManager.removeMarkedFolder(folderPath);
          this.plugin.refreshViews();
          this.display(); // Refresh settings view
        });
      }
    }

    // Cleanup button
    new Setting(containerEl)
      .setName('Remove invalid subfolders')
      .setDesc('Remove subfolders that no longer exist in the vault')
      .addButton((button) =>
        button.setButtonText('Clean up').onClick(async () => {
          const allFolderPaths = new Set(
            this.app.vault.getAllLoadedFiles()
              .filter((f): f is TFolder => f instanceof TFolder)
              .map((f) => f.path)
          );
          const invalid = this.plugin.levelComputer.validateMarkedFolders(allFolderPaths);
          for (const path of invalid) {
            this.plugin.dataManager.removeMarkedFolder(path);
          }
          this.plugin.refreshViews();
          this.display();
        })
      );
  }
}
