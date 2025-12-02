/**
 * Rename modal for files and folders
 */

import { Modal, App } from 'obsidian';

export class RenameModal extends Modal {
  private currentName: string;
  private isFolder: boolean;
  private onConfirm: (newName: string) => void;
  private inputEl: HTMLInputElement;

  constructor(app: App, currentName: string, isFolder: boolean, onConfirm: (newName: string) => void) {
    super(app);
    this.currentName = currentName;
    this.isFolder = isFolder;
    this.onConfirm = onConfirm;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('miller-nav-rename-modal');

    const title = this.isFolder ? 'Rename folder' : 'Rename file';
    contentEl.createEl('h3', { text: title });

    // Input field
    this.inputEl = contentEl.createEl('input', {
      type: 'text',
      cls: 'miller-nav-rename-input',
      value: this.currentName
    });
    this.inputEl.focus();
    this.inputEl.select();

    // Handle enter key
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.doRename();
      } else if (e.key === 'Escape') {
        this.close();
      }
    });

    // Buttons
    const buttonContainer = contentEl.createDiv({ cls: 'miller-nav-rename-buttons' });

    const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
    cancelBtn.addEventListener('click', () => this.close());

    const renameBtn = buttonContainer.createEl('button', {
      text: 'Rename',
      cls: 'mod-cta'
    });
    renameBtn.addEventListener('click', () => this.doRename());
  }

  private doRename(): void {
    const newName = this.inputEl.value.trim();
    if (newName && newName !== this.currentName) {
      this.onConfirm(newName);
    }
    this.close();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
