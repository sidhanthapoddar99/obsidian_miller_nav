/**
 * Column header component with toolbar buttons
 *
 * Primary Nav: [Collapse Nav] NAVIGATOR [Auto Reveal][Collapse All][Sort][Search]
 * Secondary Nav: [Collapse Nav] [Name] [Sort][Search]
 */

import type { ColumnState, ViewCallbacks } from '../types';
import { createToolbarButton, getPathName } from '../utils';

export interface ColumnHeaderOptions {
  columnEl: HTMLElement;
  columnIndex: number;
  columnState: ColumnState;
  callbacks: ViewCallbacks;
  onManualReveal?: () => void;
  onSearch?: () => void;
  onSort?: () => void;
}

export function renderColumnHeader(options: ColumnHeaderOptions): void {
  const {
    columnEl,
    columnIndex,
    columnState,
    callbacks,
    onManualReveal,
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

  // Primary nav only: Manual Reveal
  if (isPrimary && onManualReveal) {
    createToolbarButton({
      parent: toolbarEl,
      icon: 'crosshair',
      ariaLabel: 'Reveal active file',
      onClick: onManualReveal
    });
  }

  // Primary nav only: Collapse All
  if (isPrimary) {
    createToolbarButton({
      parent: toolbarEl,
      icon: 'chevrons-down-up',
      ariaLabel: 'Collapse all',
      onClick: () => callbacks.collapseAll()
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
