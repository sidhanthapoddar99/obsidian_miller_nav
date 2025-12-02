/**
 * Delete confirmation modal
 */

import { Modal, App } from 'obsidian';

export class DeleteConfirmModal extends Modal {
  private itemNames: string[];
  private onConfirm: () => void;

  constructor(app: App, itemNames: string[], onConfirm: () => void) {
    super(app);
    this.itemNames = itemNames;
    this.onConfirm = onConfirm;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('miller-nav-delete-modal');

    const count = this.itemNames.length;
    const title = count === 1
      ? `Delete "${this.itemNames[0]}"?`
      : `Delete ${count} items?`;

    contentEl.createEl('h3', { text: title });

    if (count > 1) {
      const listEl = contentEl.createEl('ul', { cls: 'miller-nav-delete-list' });
      const displayItems = this.itemNames.slice(0, 5);

      for (const name of displayItems) {
        listEl.createEl('li', { text: name });
      }

      if (count > 5) {
        listEl.createEl('li', {
          text: `...and ${count - 5} more`,
          cls: 'miller-nav-delete-more'
        });
      }
    }

    contentEl.createEl('p', {
      text: 'This will move the item(s) to your system trash.',
      cls: 'miller-nav-delete-note'
    });

    const buttonContainer = contentEl.createDiv({ cls: 'miller-nav-delete-buttons' });

    const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
    cancelBtn.addEventListener('click', () => this.close());

    const deleteBtn = buttonContainer.createEl('button', {
      text: 'Delete',
      cls: 'mod-warning'
    });
    deleteBtn.addEventListener('click', () => {
      this.onConfirm();
      this.close();
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
