/**
 * Column footer component with creation buttons
 * New Note, New Folder, New Canvas, New Base (icons only)
 */

import type { ViewCallbacks } from '../types';
import { createFooterButton } from '../utils';

/**
 * Render footer with creation buttons
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
