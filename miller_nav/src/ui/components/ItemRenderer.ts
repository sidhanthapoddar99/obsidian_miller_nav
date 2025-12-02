/**
 * Item renderer component for files and folders
 */

import { setIcon } from 'obsidian';
import { PaneItem } from '../../types';
import type { ColumnState, ViewCallbacks } from '../types';

export interface ItemRendererOptions {
  listEl: HTMLElement;
  item: PaneItem;
  indent: number;
  columnIndex: number;
  columnState: ColumnState;
  selectedItems: Set<string>;
  opensHorizontally: boolean;
  callbacks: ViewCallbacks;
  onDragStart: (item: PaneItem, columnIndex: number) => void;
  onDragEnd: () => void;
  getDraggedItem: () => PaneItem | null;
}

export function renderItem(options: ItemRendererOptions): void {
  const {
    listEl,
    item,
    indent,
    columnIndex,
    columnState,
    selectedItems,
    opensHorizontally,
    callbacks,
    onDragStart,
    onDragEnd,
    getDraggedItem
  } = options;

  const el = listEl.createDiv({ cls: 'miller-nav-item' });
  el.setAttribute('data-path', item.path);
  el.setAttribute('data-type', item.type);

  // Check if this item opened a column to the right
  if (columnState.selectedItem === item.path) {
    el.addClass('is-selected');
  }

  // Check if item is in multi-selection
  if (selectedItems.has(item.path)) {
    el.addClass('is-multi-selected');
  }

  // Setup draggable (except root and virtual items)
  if (item.type !== 'virtual' && item.path !== '/') {
    setupDraggable(el, item, columnIndex, selectedItems, onDragStart, onDragEnd);
  }

  // Setup drop target for folders
  if (item.type === 'folder') {
    setupDropTarget(el, item, selectedItems, callbacks, getDraggedItem);
  }

  // Apply indentation
  const basePadding = 8;
  const indentSize = 20;
  el.style.paddingLeft = `${basePadding + indent * indentSize}px`;

  // Render chevron
  renderChevron(el, item, columnState, opensHorizontally, columnIndex, callbacks);

  // Render icon
  if (item.icon) {
    const iconEl = el.createSpan({ cls: 'miller-nav-icon' });
    setIcon(iconEl, item.icon);
  }

  // Render name
  const nameEl = el.createSpan({ cls: 'miller-nav-name' });
  nameEl.textContent = item.name;
  if (item.color) {
    nameEl.style.color = item.color;
  }

  // Render note count
  if (item.noteCount !== undefined && item.noteCount > 0) {
    const countEl = el.createSpan({ cls: 'miller-nav-count' });
    countEl.textContent = String(item.noteCount);
  }

  // Render arrow for horizontal-opening folders
  if (opensHorizontally) {
    const arrowEl = el.createSpan({ cls: 'miller-nav-arrow' });
    setIcon(arrowEl, 'chevron-right');
    el.addClass('miller-nav-subfolder');
  }

  // Setup click handler
  setupClickHandler(el, item, columnIndex, callbacks);

  // Setup context menu
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (!selectedItems.has(item.path)) {
      callbacks.clearSelection();
      callbacks.toggleItemSelection(item.path, false);
    }
  });
}

function renderChevron(
  el: HTMLElement,
  item: PaneItem,
  columnState: ColumnState,
  opensHorizontally: boolean,
  columnIndex: number,
  callbacks: ViewCallbacks
): void {
  if (item.type === 'folder') {
    if (opensHorizontally) {
      el.createSpan({ cls: 'miller-nav-chevron miller-nav-chevron-empty' });
    } else if (item.hasChildren) {
      const chevronEl = el.createSpan({ cls: 'miller-nav-chevron' });
      const isExpanded = columnState.expandedFolders.has(item.path);
      setIcon(chevronEl, isExpanded ? 'chevron-down' : 'chevron-right');
      chevronEl.addEventListener('click', (e) => {
        e.stopPropagation();
        callbacks.toggleExpand(item.path, columnIndex);
      });
    } else {
      el.createSpan({ cls: 'miller-nav-chevron miller-nav-chevron-empty' });
    }
  } else {
    el.createSpan({ cls: 'miller-nav-chevron miller-nav-chevron-empty' });
  }
}

function setupDraggable(
  el: HTMLElement,
  item: PaneItem,
  columnIndex: number,
  selectedItems: Set<string>,
  onDragStart: (item: PaneItem, columnIndex: number) => void,
  onDragEnd: () => void
): void {
  el.setAttribute('draggable', 'true');

  el.addEventListener('dragstart', (e) => {
    onDragStart(item, columnIndex);
    el.addClass('is-dragging');

    // If multi-selected, drag all selected items
    if (selectedItems.size > 1 && selectedItems.has(item.path)) {
      e.dataTransfer?.setData('text/plain', Array.from(selectedItems).join('\n'));
    } else {
      e.dataTransfer?.setData('text/plain', item.path);
    }
  });

  el.addEventListener('dragend', () => {
    el.removeClass('is-dragging');
    onDragEnd();
  });
}

function setupDropTarget(
  el: HTMLElement,
  item: PaneItem,
  selectedItems: Set<string>,
  callbacks: ViewCallbacks,
  getDraggedItem: () => PaneItem | null
): void {
  el.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedItem = getDraggedItem();
    if (draggedItem && draggedItem.path !== item.path) {
      el.addClass('miller-nav-drop-hover');
    }
  });

  el.addEventListener('dragleave', () => {
    el.removeClass('miller-nav-drop-hover');
  });

  el.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    el.removeClass('miller-nav-drop-hover');

    const draggedItem = getDraggedItem();
    if (draggedItem && draggedItem.path !== item.path) {
      const itemsToMove = selectedItems.size > 1 && selectedItems.has(draggedItem.path)
        ? Array.from(selectedItems)
        : [draggedItem.path];

      await callbacks.moveItems(itemsToMove, item.path);
    }
  });
}

function setupClickHandler(
  el: HTMLElement,
  item: PaneItem,
  columnIndex: number,
  callbacks: ViewCallbacks
): void {
  el.addEventListener('click', (e) => {
    const isModifierPressed = e.ctrlKey || e.metaKey;

    if (isModifierPressed && item.type !== 'virtual') {
      callbacks.toggleItemSelection(item.path, true);
    } else {
      callbacks.clearSelection();
      callbacks.handleItemClick(item.path, item.type, columnIndex);
    }
  });
}
