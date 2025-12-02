/**
 * Column header component with toolbar buttons
 *
 * Primary Nav: [Collapse Nav] NAVIGATOR [Auto Reveal][Collapse All][Sort][Search]
 * Secondary Nav: [Collapse Nav] [Name] [Sort][Search]
 */

import type { ColumnState, ViewCallbacks } from '../types';
import { createToolbarButton, createFooterButton, getPathName } from '../utils';

export interface ColumnHeaderOptions {
  columnEl: HTMLElement;
  columnIndex: number;
  columnState: ColumnState;
  callbacks: ViewCallbacks;
  autoRevealActive?: boolean;
  onAutoRevealToggle?: () => void;
  onSearch?: () => void;
  onSort?: () => void;
}

export function renderColumnHeader(options: ColumnHeaderOptions): void {
  const {
    columnEl,
    columnIndex,
    columnState,
    callbacks,
    autoRevealActive = false,
    onAutoRevealToggle,
    onSearch,
    onSort
  } = options;

  const headerEl = columnEl.createDiv({ cls: 'miller-nav-column-header' });
  const isPrimary = columnIndex === 0;

  // Left side - Collapse Nav button
  createToolbarButton({
    parent: headerEl,
    icon: 'panel-left-close',
    ariaLabel: 'Collapse column',
    cls: 'miller-nav-toolbar-btn miller-nav-shrink-btn',
    onClick: () => callbacks.toggleColumnCollapse(columnIndex)
  });

  // Title
  const titleEl = headerEl.createSpan({ cls: 'miller-nav-column-title' });
  titleEl.textContent = isPrimary ? 'Navigator' : getPathName(columnState.folderPath);

  // Right side toolbar
  const toolbarEl = headerEl.createDiv({ cls: 'miller-nav-column-toolbar' });

  // Primary nav only: Auto Reveal
  if (isPrimary && onAutoRevealToggle) {
    createToolbarButton({
      parent: toolbarEl,
      icon: 'crosshair',
      ariaLabel: 'Auto reveal active file',
      isActive: autoRevealActive,
      onClick: onAutoRevealToggle
    });
  }

  // Primary nav only: Collapse All
  if (isPrimary) {
    createToolbarButton({
      parent: toolbarEl,
      icon: 'chevrons-down-up',
      ariaLabel: 'Collapse all',
      onClick: () => callbacks.collapseColumnTree(columnIndex)
    });
  }

  // Sort button (secondary columns only)
  if (!isPrimary && onSort) {
    createToolbarButton({
      parent: toolbarEl,
      icon: 'arrow-up-down',
      ariaLabel: 'Sort',
      onClick: onSort
    });
  }

  // Search button (all columns)
  if (onSearch) {
    createToolbarButton({
      parent: toolbarEl,
      icon: 'search',
      ariaLabel: 'Search',
      onClick: onSearch
    });
  }
}

/**
 * Render footer with New Note, New Folder, New Canvas, New Base buttons (icons only)
 */
export function renderColumnFooter(
  columnEl: HTMLElement,
  folderPath: string,
  callbacks: ViewCallbacks
): void {
  const footerEl = columnEl.createDiv({ cls: 'miller-nav-column-footer' });

  createFooterButton({
    parent: footerEl,
    icon: 'file-plus',
    label: 'New note',
    onClick: () => callbacks.createNote(folderPath)
  });

  createFooterButton({
    parent: footerEl,
    icon: 'folder-plus',
    label: 'New folder',
    onClick: () => callbacks.createFolder(folderPath)
  });

  createFooterButton({
    parent: footerEl,
    icon: 'layout-dashboard',
    label: 'New canvas',
    onClick: () => callbacks.createCanvas(folderPath)
  });

  createFooterButton({
    parent: footerEl,
    icon: 'database',
    label: 'New base',
    onClick: () => callbacks.createBase(folderPath)
  });
}
