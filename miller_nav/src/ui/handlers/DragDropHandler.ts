/**
 * Drag and drop handler
 */

import { App, TFolder } from 'obsidian';
import { PaneItem } from '../../types';
import type { ColumnState } from '../types';

export class DragDropHandler {
  private app: App;
  private draggedItem: PaneItem | null = null;
  private dragSourceColumn: number = -1;

  constructor(app: App) {
    this.app = app;
  }

  getDraggedItem(): PaneItem | null {
    return this.draggedItem;
  }

  getDragSourceColumn(): number {
    return this.dragSourceColumn;
  }

  startDrag(item: PaneItem, columnIndex: number): void {
    this.draggedItem = item;
    this.dragSourceColumn = columnIndex;
  }

  endDrag(): void {
    this.draggedItem = null;
    this.dragSourceColumn = -1;
  }

  setupColumnDropTarget(
    columnEl: HTMLElement,
    columnIndex: number,
    columns: ColumnState[],
    onMove: (itemPaths: string[], targetPath: string) => Promise<void>
  ): void {
    columnEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (this.draggedItem) {
        columnEl.addClass('miller-nav-drop-target');
      }
    });

    columnEl.addEventListener('dragleave', () => {
      columnEl.removeClass('miller-nav-drop-target');
    });

    columnEl.addEventListener('drop', async (e) => {
      e.preventDefault();
      columnEl.removeClass('miller-nav-drop-target');

      if (this.draggedItem && this.draggedItem.path !== '/') {
        const targetFolder = columns[columnIndex].folderPath;
        await onMove([this.draggedItem.path], targetFolder);
      }
      this.endDrag();
    });
  }

  async moveItems(
    itemPaths: string[],
    targetFolderPath: string,
    selectedItems: Set<string>,
    onComplete: () => Promise<void>
  ): Promise<void> {
    const targetFolder = targetFolderPath === '/'
      ? this.app.vault.getRoot()
      : this.app.vault.getAbstractFileByPath(targetFolderPath);

    if (!(targetFolder instanceof TFolder)) return;

    for (const itemPath of itemPaths) {
      const item = this.app.vault.getAbstractFileByPath(itemPath);
      if (!item) continue;

      // Don't move to same location
      if (item.parent?.path === targetFolder.path) continue;

      // Don't move folder into itself
      if (item instanceof TFolder && targetFolderPath.startsWith(itemPath + '/')) continue;

      const newPath = targetFolder.path === '/'
        ? item.name
        : `${targetFolder.path}/${item.name}`;

      try {
        await this.app.fileManager.renameFile(item, newPath);
      } catch (error) {
        console.error('Failed to move item:', error);
      }
    }

    selectedItems.clear();
    await onComplete();
  }
}
