/**
 * UI utility functions for MillerNav
 */

import { setIcon } from 'obsidian';

// ============ Path Helpers ============

/**
 * Normalize a path by removing trailing slashes (except for root)
 */
export function normalizePath(path: string): string {
  return path === '/' ? '/' : path.replace(/\/+$/, '');
}

/**
 * Get parent path from a file/folder path
 */
export function getParentPath(path: string): string {
  if (path === '/' || !path.includes('/')) return '/';
  return path.substring(0, path.lastIndexOf('/')) || '/';
}

/**
 * Get the name (last segment) from a path
 */
export function getPathName(path: string): string {
  if (path === '/' || !path) return path;
  return path.split('/').pop() ?? path;
}

// Re-export FileOperations
export { FileOperations } from './FileOperations';
export type { FileType } from './FileOperations';

// Re-export FileNaming utilities
export { getUniqueFileName } from './FileNaming';

/**
 * Build a path from parent and name
 */
export function buildPath(parentPath: string, name: string): string {
  const parent = parentPath === '/' ? '' : parentPath;
  return `${parent}/${name}`.replace(/^\//, '');
}

// ============ Button Creation ============

export interface ToolbarButtonOptions {
  parent: HTMLElement;
  icon: string;
  ariaLabel: string;
  title?: string;
  isActive?: boolean;
  onClick: (e: MouseEvent) => void;
  cls?: string;
}

/**
 * Create a toolbar button with icon
 */
export function createToolbarButton(options: ToolbarButtonOptions): HTMLElement {
  const { parent, icon, ariaLabel, title, isActive = false, onClick, cls = 'miller-nav-toolbar-btn' } = options;

  const btn = parent.createSpan({
    cls: `${cls}${isActive ? ' is-active' : ''}`,
    attr: {
      'aria-label': ariaLabel,
      ...(title && { 'title': title })
    }
  });
  setIcon(btn, icon);
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick(e);
  });
  return btn;
}

export interface FooterButtonOptions {
  parent: HTMLElement;
  icon: string;
  label: string;
  onClick: (e: MouseEvent) => void;
}

/**
 * Create a footer action button
 */
export function createFooterButton(options: FooterButtonOptions): HTMLElement {
  const { parent, icon, label, onClick } = options;

  const btn = parent.createSpan({
    cls: 'miller-nav-footer-btn',
    attr: { 'aria-label': label, 'title': label }
  });
  setIcon(btn, icon);
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick(e);
  });
  return btn;
}

// ============ DOM Helpers ============

/**
 * Update selection visual state for an item element
 */
export function updateItemSelectionClass(el: HTMLElement, isSelected: boolean): void {
  if (isSelected) {
    el.addClass('is-multi-selected');
  } else {
    el.removeClass('is-multi-selected');
  }
}

/**
 * Update active file visual state for an item element
 */
export function updateItemActiveClass(el: HTMLElement, isActive: boolean): void {
  if (isActive) {
    el.addClass('is-active-file');
  } else {
    el.removeClass('is-active-file');
  }
}

/**
 * Find all item elements in a container
 */
export function findItemElements(container: HTMLElement): NodeListOf<HTMLElement> {
  return container.querySelectorAll('.miller-nav-item');
}

/**
 * Find item element by path
 */
export function findItemByPath(container: HTMLElement, path: string): HTMLElement | null {
  return container.querySelector(`[data-path="${CSS.escape(path)}"]`);
}
