/**
 * Collapsed column strip component
 */

import { setIcon } from 'obsidian';
import type { ColumnState, ViewCallbacks } from '../types';

export interface CollapsedColumnOptions {
  columnEl: HTMLElement;
  columnIndex: number;
  columnState: ColumnState;
  callbacks: ViewCallbacks;
}

export function renderCollapsedColumn(options: CollapsedColumnOptions): void {
  const { columnEl, columnIndex, columnState, callbacks } = options;

  const stripEl = columnEl.createDiv({ cls: 'miller-nav-collapsed-strip' });

  // Make entire strip clickable to expand
  stripEl.addEventListener('click', (e) => {
    e.stopPropagation();
    callbacks.toggleColumnCollapse(columnIndex);
  });

  // Top section with expand icon
  const topSection = stripEl.createDiv({ cls: 'miller-nav-collapsed-top' });

  // Expand icon
  const expandIcon = topSection.createSpan({ cls: 'miller-nav-collapsed-icon' });
  setIcon(expandIcon, 'chevrons-right');

  // Level badge
  const levelEl = topSection.createDiv({ cls: 'miller-nav-collapsed-level' });
  levelEl.textContent = String(columnIndex);

  // Folder icon
  const folderIcon = stripEl.createDiv({ cls: 'miller-nav-collapsed-folder-icon' });
  if (columnIndex === 0) {
    setIcon(folderIcon, 'layout-grid');
  } else {
    setIcon(folderIcon, 'folder');
  }

  // Folder name (vertical text)
  const nameEl = stripEl.createDiv({ cls: 'miller-nav-collapsed-name' });
  if (columnIndex === 0) {
    nameEl.textContent = 'Navigator';
  } else {
    const folderName = columnState.folderPath.split('/').pop() ?? '';
    nameEl.textContent = folderName;
  }

  // If there's a selected item, show indicator
  if (columnState.selectedItem) {
    const selectedEl = stripEl.createDiv({ cls: 'miller-nav-collapsed-selected' });
    const selectedName = columnState.selectedItem.split('/').pop() ?? '';
    // Truncate if too long
    selectedEl.textContent = selectedName.length > 12
      ? selectedName.substring(0, 10) + '…'
      : selectedName;
    selectedEl.setAttribute('aria-label', selectedName);
  }
}
