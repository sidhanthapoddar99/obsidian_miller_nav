/**
 * Column header component with toolbar buttons
 *
 * Primary Nav: [Collapse Nav] NAVIGATOR [Auto Reveal][Collapse All][Sort][Search]
 * Secondary Nav: [Collapse Nav] [Name] [Sort][Search]
 */

import { setIcon } from 'obsidian';
import type { ColumnState, ViewCallbacks } from '../types';

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
  const shrinkBtn = headerEl.createSpan({
    cls: 'miller-nav-toolbar-btn miller-nav-shrink-btn',
    attr: { 'aria-label': 'Collapse column' }
  });
  setIcon(shrinkBtn, 'panel-left-close');
  shrinkBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    callbacks.toggleColumnCollapse(columnIndex);
  });

  // Title
  const titleEl = headerEl.createSpan({ cls: 'miller-nav-column-title' });
  if (isPrimary) {
    titleEl.textContent = 'Navigator';
  } else {
    const folderName = columnState.folderPath.split('/').pop() ?? columnState.folderPath;
    titleEl.textContent = folderName;
  }

  // Right side toolbar
  const toolbarEl = headerEl.createDiv({ cls: 'miller-nav-column-toolbar' });

  // Primary nav only: Auto Reveal
  if (isPrimary && onAutoRevealToggle) {
    const autoRevealBtn = toolbarEl.createSpan({
      cls: `miller-nav-toolbar-btn ${autoRevealActive ? 'is-active' : ''}`,
      attr: { 'aria-label': 'Auto reveal active file' }
    });
    setIcon(autoRevealBtn, 'crosshair');
    autoRevealBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onAutoRevealToggle();
    });
  }

  // Primary nav only: Collapse All
  if (isPrimary) {
    const collapseAllBtn = toolbarEl.createSpan({
      cls: 'miller-nav-toolbar-btn',
      attr: { 'aria-label': 'Collapse all' }
    });
    setIcon(collapseAllBtn, 'chevrons-down-up');
    collapseAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      callbacks.collapseColumnTree(columnIndex);
    });
  }

  // Sort button (all navs, but only secondary+ will use it for now)
  if (!isPrimary) {
    const sortBtn = toolbarEl.createSpan({
      cls: 'miller-nav-toolbar-btn',
      attr: { 'aria-label': 'Sort' }
    });
    setIcon(sortBtn, 'arrow-up-down');
    sortBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onSort) onSort();
      // TODO: Implement sort functionality
    });
  }

  // Search button (all navs)
  const searchBtn = toolbarEl.createSpan({
    cls: 'miller-nav-toolbar-btn',
    attr: { 'aria-label': 'Search' }
  });
  setIcon(searchBtn, 'search');
  searchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (onSearch) onSearch();
    // TODO: Implement search functionality
  });
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

  // New Note button
  const newNoteBtn = footerEl.createSpan({
    cls: 'miller-nav-footer-btn',
    attr: { 'aria-label': 'New note', 'title': 'New note' }
  });
  setIcon(newNoteBtn, 'file-plus');
  newNoteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    callbacks.createNote(folderPath);
  });

  // New Folder button
  const newFolderBtn = footerEl.createSpan({
    cls: 'miller-nav-footer-btn',
    attr: { 'aria-label': 'New folder', 'title': 'New folder' }
  });
  setIcon(newFolderBtn, 'folder-plus');
  newFolderBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    callbacks.createFolder(folderPath);
  });

  // New Canvas button
  const newCanvasBtn = footerEl.createSpan({
    cls: 'miller-nav-footer-btn',
    attr: { 'aria-label': 'New canvas', 'title': 'New canvas' }
  });
  setIcon(newCanvasBtn, 'layout-dashboard');
  newCanvasBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    callbacks.createCanvas(folderPath);
  });

  // New Base button
  const newBaseBtn = footerEl.createSpan({
    cls: 'miller-nav-footer-btn',
    attr: { 'aria-label': 'New base', 'title': 'New base' }
  });
  setIcon(newBaseBtn, 'database');
  newBaseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    callbacks.createBase(folderPath);
  });
}
