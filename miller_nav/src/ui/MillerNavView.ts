/**
 * MillerNavView - Main ItemView for the Miller columns navigation
 * Multi-column layout within a single view - subfolders open in adjacent columns
 *
 * Features:
 * - Drag and drop files/folders
 * - Multi-select with Ctrl/Cmd+click
 * - Column collapse/shrink
 * - Bulk actions on selected items
 */

import { ItemView, WorkspaceLeaf, TFolder, TFile, TAbstractFile, Menu, Platform, setIcon, Modal, App } from 'obsidian';
import { MILLER_NAV_VIEW, PaneItem } from '../types';
import type MillerNavPlugin from '../main';

// Represents a single column in the Miller columns layout
interface ColumnState {
  folderPath: string;
  selectedItem?: string; // Path of selected item that opened next column
  expandedFolders: Set<string>;
  isCollapsed: boolean; // Whether column is shrunk to a strip
}

/**
 * Confirmation modal for delete operations
 */
class DeleteConfirmModal extends Modal {
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
      for (const name of this.itemNames.slice(0, 5)) {
        listEl.createEl('li', { text: name });
      }
      if (count > 5) {
        listEl.createEl('li', { text: `...and ${count - 5} more`, cls: 'miller-nav-delete-more' });
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

export class MillerNavView extends ItemView {
  plugin: MillerNavPlugin;
  private containerEl_: HTMLElement;
  private columnsContainer: HTMLElement;

  // Miller columns state
  private columns: ColumnState[] = [{ folderPath: '/', expandedFolders: new Set(), isCollapsed: false }];

  // Multi-select state
  private selectedItems: Set<string> = new Set();

  // Drag state
  private draggedItem: PaneItem | null = null;
  private dragSourceColumn: number = -1;

  constructor(leaf: WorkspaceLeaf, plugin: MillerNavPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return MILLER_NAV_VIEW;
  }

  getDisplayText(): string {
    return 'MillerNav';
  }

  getIcon(): string {
    return 'columns';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass('miller-nav-container');
    this.containerEl_ = container;

    if (Platform.isMobile) {
      container.addClass('miller-nav-mobile');
    }

    // Click outside to clear selection
    container.addEventListener('click', (e) => {
      if (e.target === container || e.target === this.columnsContainer) {
        this.clearSelection();
      }
    });

    // Horizontal container for all columns
    this.columnsContainer = container.createDiv({ cls: 'miller-nav-columns' });

    // Render all columns
    await this.renderAllColumns();
  }

  async onClose(): Promise<void> {
    this.containerEl_.empty();
  }

  /**
   * Get the current level based on column index
   */
  private getColumnLevel(columnIndex: number): number {
    return columnIndex;
  }

  /**
   * Check if a folder should open horizontally
   */
  private shouldOpenHorizontally(folderPath: string, columnIndex: number): boolean {
    const isMarked = this.plugin.dataManager.isMarkedFolder(folderPath);
    const currentLevel = this.getColumnLevel(columnIndex);
    const maxLevels = this.plugin.settings.maxLevels;
    return isMarked && currentLevel < maxLevels;
  }

  /**
   * Clear multi-selection
   */
  private clearSelection(): void {
    this.selectedItems.clear();
    this.renderAllColumns();
  }

  /**
   * Toggle item selection (for multi-select)
   */
  private toggleItemSelection(path: string, addToSelection: boolean): void {
    if (addToSelection) {
      if (this.selectedItems.has(path)) {
        this.selectedItems.delete(path);
      } else {
        this.selectedItems.add(path);
      }
    } else {
      this.selectedItems.clear();
      this.selectedItems.add(path);
    }
    this.renderAllColumns();
  }

  /**
   * Render all columns
   */
  private async renderAllColumns(): Promise<void> {
    this.columnsContainer.empty();

    for (let i = 0; i < this.columns.length; i++) {
      await this.renderColumn(i);
    }
  }

  /**
   * Render a single column
   */
  private async renderColumn(columnIndex: number): Promise<void> {
    const columnState = this.columns[columnIndex];
    const columnEl = this.columnsContainer.createDiv({
      cls: `miller-nav-column ${columnState.isCollapsed ? 'is-collapsed' : ''}`
    });
    columnEl.setAttribute('data-column', String(columnIndex));

    // Make column a drop target
    this.setupDropTarget(columnEl, columnIndex);

    if (columnState.isCollapsed) {
      // Render collapsed column strip
      this.renderCollapsedColumn(columnEl, columnIndex);
      return;
    }

    // Column header/toolbar
    const headerEl = columnEl.createDiv({ cls: 'miller-nav-column-header' });

    // Shrink button (left side)
    const shrinkBtn = headerEl.createSpan({ cls: 'miller-nav-toolbar-btn miller-nav-shrink-btn', attr: { 'aria-label': 'Shrink column' } });
    setIcon(shrinkBtn, 'panel-left-close');
    shrinkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleColumnCollapse(columnIndex);
    });

    // Title
    const titleEl = headerEl.createSpan({ cls: 'miller-nav-column-title' });
    if (columnIndex === 0) {
      titleEl.textContent = 'Navigator';
    } else {
      const folderName = columnState.folderPath.split('/').pop() ?? columnState.folderPath;
      titleEl.textContent = folderName;
    }

    // Toolbar buttons
    const toolbarEl = headerEl.createDiv({ cls: 'miller-nav-column-toolbar' });

    // New Note button
    const newNoteBtn = toolbarEl.createSpan({ cls: 'miller-nav-toolbar-btn', attr: { 'aria-label': 'New note' } });
    setIcon(newNoteBtn, 'file-plus');
    newNoteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.createNote(columnState.folderPath);
    });

    // New Folder button
    const newFolderBtn = toolbarEl.createSpan({ cls: 'miller-nav-toolbar-btn', attr: { 'aria-label': 'New folder' } });
    setIcon(newFolderBtn, 'folder-plus');
    newFolderBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.createFolder(columnState.folderPath);
    });

    // Collapse tree button
    const collapseBtn = toolbarEl.createSpan({ cls: 'miller-nav-toolbar-btn', attr: { 'aria-label': 'Collapse all' } });
    setIcon(collapseBtn, 'chevrons-down-up');
    collapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.collapseColumnTree(columnIndex);
    });

    // Close button for non-root columns
    if (columnIndex > 0) {
      const closeBtn = toolbarEl.createSpan({ cls: 'miller-nav-toolbar-btn miller-nav-column-close', attr: { 'aria-label': 'Close' } });
      setIcon(closeBtn, 'x');
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeColumnsFrom(columnIndex);
      });
    }

    // List container for this column
    const listEl = columnEl.createDiv({ cls: 'miller-nav-list' });

    // Render content
    if (columnIndex === 0) {
      await this.renderRootColumn(listEl, columnIndex);
    } else {
      await this.renderSubfolderColumn(listEl, columnState.folderPath, columnIndex);
    }
  }

  /**
   * Render a collapsed column as a thin strip
   */
  private renderCollapsedColumn(columnEl: HTMLElement, columnIndex: number): void {
    const columnState = this.columns[columnIndex];

    const stripEl = columnEl.createDiv({ cls: 'miller-nav-collapsed-strip' });

    // Make entire strip clickable to expand
    stripEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleColumnCollapse(columnIndex);
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

  /**
   * Toggle column collapse state
   */
  private toggleColumnCollapse(columnIndex: number): void {
    this.columns[columnIndex].isCollapsed = !this.columns[columnIndex].isCollapsed;
    this.renderAllColumns();
  }

  /**
   * Setup drop target for a column
   */
  private setupDropTarget(columnEl: HTMLElement, columnIndex: number): void {
    columnEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (this.draggedItem) {
        columnEl.addClass('miller-nav-drop-target');
      }
    });

    columnEl.addEventListener('dragleave', (e) => {
      columnEl.removeClass('miller-nav-drop-target');
    });

    columnEl.addEventListener('drop', async (e) => {
      e.preventDefault();
      columnEl.removeClass('miller-nav-drop-target');

      if (this.draggedItem && this.draggedItem.path !== '/') {
        const targetFolder = this.columns[columnIndex].folderPath;
        await this.moveItems([this.draggedItem.path], targetFolder);
      }
      this.draggedItem = null;
      this.dragSourceColumn = -1;
    });
  }

  /**
   * Move items to a target folder
   */
  private async moveItems(itemPaths: string[], targetFolderPath: string): Promise<void> {
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

    this.selectedItems.clear();
    await this.renderAllColumns();
  }

  /**
   * Render the root column (column 0)
   */
  private async renderRootColumn(listEl: HTMLElement, columnIndex: number): Promise<void> {
    // Virtual folders
    if (this.plugin.settings.showRecentNotes) {
      this.renderItem(listEl, {
        id: 'virtual-recent',
        type: 'virtual',
        name: 'Recent',
        path: '__recent__',
        level: 0,
        virtualType: 'recent',
        icon: 'clock',
        hasChildren: false,
      }, 0, columnIndex);
    }

    if (this.plugin.settings.showTags) {
      this.renderItem(listEl, {
        id: 'virtual-tags',
        type: 'virtual',
        name: 'Tags',
        path: '__tags__',
        level: 0,
        virtualType: 'tags',
        icon: 'tag',
        hasChildren: false,
      }, 0, columnIndex);
    }

    if (this.plugin.settings.showShortcuts) {
      this.renderItem(listEl, {
        id: 'virtual-shortcuts',
        type: 'virtual',
        name: 'Shortcuts',
        path: '__shortcuts__',
        level: 0,
        virtualType: 'shortcuts',
        icon: 'star',
        hasChildren: false,
      }, 0, columnIndex);
    }

    // Vault root
    const vaultName = this.app.vault.getName();
    const rootItem: PaneItem = {
      id: 'folder-root',
      type: 'folder',
      name: vaultName,
      path: '/',
      level: 0,
      isMarked: false,
      hasChildren: true,
      icon: 'vault',
    };
    this.renderItem(listEl, rootItem, 0, columnIndex);

    const columnState = this.columns[columnIndex];
    if (columnState.expandedFolders.has('/')) {
      await this.renderFolderChildrenTree(listEl, '/', 1, columnIndex);
    }
  }

  /**
   * Render a subfolder column
   */
  private async renderSubfolderColumn(listEl: HTMLElement, folderPath: string, columnIndex: number): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);

    if (!(folder instanceof TFolder)) {
      const emptyEl = listEl.createDiv({ cls: 'miller-nav-empty' });
      emptyEl.textContent = 'Folder not found';
      return;
    }

    await this.renderFolderChildrenTree(listEl, folderPath, 0, columnIndex);
  }

  /**
   * Render a single item
   */
  private renderItem(listEl: HTMLElement, item: PaneItem, indent: number, columnIndex: number): void {
    const el = listEl.createDiv({ cls: 'miller-nav-item' });
    el.setAttribute('data-path', item.path);
    el.setAttribute('data-type', item.type);

    // Check if this item opened a column to the right
    const isColumnSelected = this.columns[columnIndex]?.selectedItem === item.path;
    if (isColumnSelected) {
      el.addClass('is-selected');
    }

    // Check if item is in multi-selection
    const isMultiSelected = this.selectedItems.has(item.path);
    if (isMultiSelected) {
      el.addClass('is-multi-selected');
    }

    // Make draggable (except root and virtual items)
    if (item.type !== 'virtual' && item.path !== '/') {
      el.setAttribute('draggable', 'true');
      el.addEventListener('dragstart', (e) => {
        this.draggedItem = item;
        this.dragSourceColumn = columnIndex;
        el.addClass('is-dragging');

        // If multi-selected, drag all selected items
        if (this.selectedItems.size > 1 && this.selectedItems.has(item.path)) {
          e.dataTransfer?.setData('text/plain', Array.from(this.selectedItems).join('\n'));
        } else {
          e.dataTransfer?.setData('text/plain', item.path);
        }
      });

      el.addEventListener('dragend', () => {
        el.removeClass('is-dragging');
        this.draggedItem = null;
        this.dragSourceColumn = -1;
      });
    }

    // Drop target for folders
    if (item.type === 'folder') {
      el.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.draggedItem && this.draggedItem.path !== item.path) {
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

        if (this.draggedItem && this.draggedItem.path !== item.path) {
          // Move selected items or just the dragged item
          const itemsToMove = this.selectedItems.size > 1 && this.selectedItems.has(this.draggedItem.path)
            ? Array.from(this.selectedItems)
            : [this.draggedItem.path];

          await this.moveItems(itemsToMove, item.path);
        }
        this.draggedItem = null;
        this.dragSourceColumn = -1;
      });
    }

    // Base padding + indentation
    const basePadding = 8;
    const indentSize = 20;
    el.style.paddingLeft = `${basePadding + indent * indentSize}px`;

    const columnState = this.columns[columnIndex];
    const opensHorizontally = item.type === 'folder' && this.shouldOpenHorizontally(item.path, columnIndex);

    // Chevron logic
    if (item.type === 'folder') {
      if (opensHorizontally) {
        el.createSpan({ cls: 'miller-nav-chevron miller-nav-chevron-empty' });
      } else if (item.hasChildren) {
        const chevronEl = el.createSpan({ cls: 'miller-nav-chevron' });
        const isExpanded = columnState.expandedFolders.has(item.path);
        setIcon(chevronEl, isExpanded ? 'chevron-down' : 'chevron-right');
        chevronEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleExpand(item, columnIndex);
        });
      } else {
        el.createSpan({ cls: 'miller-nav-chevron miller-nav-chevron-empty' });
      }
    } else {
      el.createSpan({ cls: 'miller-nav-chevron miller-nav-chevron-empty' });
    }

    // Icon
    if (item.icon) {
      const iconEl = el.createSpan({ cls: 'miller-nav-icon' });
      setIcon(iconEl, item.icon);
    }

    // Name
    const nameEl = el.createSpan({ cls: 'miller-nav-name' });
    nameEl.textContent = item.name;

    if (item.color) {
      nameEl.style.color = item.color;
    }

    // Note count
    if (item.noteCount !== undefined && item.noteCount > 0) {
      const countEl = el.createSpan({ cls: 'miller-nav-count' });
      countEl.textContent = String(item.noteCount);
    }

    // Arrow for horizontal-opening folders
    if (opensHorizontally) {
      const arrowEl = el.createSpan({ cls: 'miller-nav-arrow' });
      setIcon(arrowEl, 'chevron-right');
      el.addClass('miller-nav-subfolder');
    }

    // Click handler with multi-select support
    el.addEventListener('click', (e) => {
      const isModifierPressed = e.ctrlKey || e.metaKey;

      if (isModifierPressed && item.type !== 'virtual') {
        // Multi-select mode
        this.toggleItemSelection(item.path, true);
      } else {
        // Normal click - clear selection and handle item
        this.selectedItems.clear();
        this.handleItemClick(item, columnIndex);
      }
    });

    // Context menu
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      // If right-clicking on an unselected item, select only that item
      if (!this.selectedItems.has(item.path)) {
        this.selectedItems.clear();
        this.selectedItems.add(item.path);
        this.renderAllColumns();
      }
      this.showContextMenu(e, item, columnIndex);
    });
  }

  /**
   * Render children of a folder
   */
  private async renderFolderChildrenTree(listEl: HTMLElement, folderPath: string, indent: number, columnIndex: number): Promise<void> {
    const folder = folderPath === '/'
      ? this.app.vault.getRoot()
      : this.app.vault.getAbstractFileByPath(folderPath);

    if (!(folder instanceof TFolder)) return;

    const columnState = this.columns[columnIndex];
    const items: PaneItem[] = [];

    for (const child of folder.children) {
      if (child instanceof TFolder) {
        if (child.name.startsWith('.')) continue;

        const isMarked = this.plugin.dataManager.isMarkedFolder(child.path);
        const metadata = this.plugin.dataManager.getFolderMetadata(child.path);
        const hasChildren = child.children.some((c) =>
          (c instanceof TFolder && !c.name.startsWith('.')) ||
          (c instanceof TFile && c.extension === 'md')
        );

        items.push({
          id: `folder-${child.path}`,
          type: 'folder',
          name: child.name,
          path: child.path,
          level: indent,
          isMarked: isMarked,
          hasChildren: hasChildren,
          icon: metadata?.icon ?? 'folder',
          color: metadata?.color,
          noteCount: this.plugin.settings.showNoteCount ? this.countNotes(child) : undefined,
        });
      } else if (child instanceof TFile && child.extension === 'md') {
        items.push({
          id: `file-${child.path}`,
          type: 'file',
          name: child.basename,
          path: child.path,
          level: indent,
          icon: 'file-text',
          hasChildren: false,
        });
      }
    }

    items.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });

    if (items.length === 0 && indent === 0) {
      const emptyEl = listEl.createDiv({ cls: 'miller-nav-empty' });
      emptyEl.textContent = 'Empty folder';
      return;
    }

    for (const item of items) {
      this.renderItem(listEl, item, indent, columnIndex);

      if (item.type === 'folder' &&
          !this.shouldOpenHorizontally(item.path, columnIndex) &&
          columnState.expandedFolders.has(item.path)) {
        await this.renderFolderChildrenTree(listEl, item.path, indent + 1, columnIndex);
      }
    }
  }

  /**
   * Count notes in a folder
   */
  private countNotes(folder: TFolder): number {
    let count = 0;
    for (const child of folder.children) {
      if (child instanceof TFile && child.extension === 'md') {
        count++;
      }
    }
    return count;
  }

  /**
   * Toggle folder expansion
   */
  private toggleExpand(item: PaneItem, columnIndex: number): void {
    const columnState = this.columns[columnIndex];
    if (columnState.expandedFolders.has(item.path)) {
      columnState.expandedFolders.delete(item.path);
    } else {
      columnState.expandedFolders.add(item.path);
    }
    this.renderAllColumns();
  }

  /**
   * Collapse all folders in a column's tree
   */
  private collapseColumnTree(columnIndex: number): void {
    const columnState = this.columns[columnIndex];
    columnState.expandedFolders.clear();
    this.renderAllColumns();
  }

  /**
   * Handle item click
   */
  private handleItemClick(item: PaneItem, columnIndex: number): void {
    if (item.type === 'file') {
      const file = this.app.vault.getAbstractFileByPath(item.path);
      if (file instanceof TFile) {
        this.app.workspace.getLeaf().openFile(file);
      }
    } else if (item.type === 'folder') {
      if (this.shouldOpenHorizontally(item.path, columnIndex)) {
        this.openSubfolderColumn(item.path, columnIndex);
      } else {
        this.toggleExpand(item, columnIndex);
      }
    }
  }

  /**
   * Open a subfolder in the next column
   */
  private openSubfolderColumn(folderPath: string, fromColumnIndex: number): void {
    this.columns = this.columns.slice(0, fromColumnIndex + 1);
    this.columns[fromColumnIndex].selectedItem = folderPath;
    this.columns.push({ folderPath, expandedFolders: new Set(), isCollapsed: false });
    this.renderAllColumns();
  }

  /**
   * Close columns from index
   */
  private closeColumnsFrom(columnIndex: number): void {
    if (columnIndex > 0 && this.columns[columnIndex - 1]) {
      this.columns[columnIndex - 1].selectedItem = undefined;
    }
    this.columns = this.columns.slice(0, columnIndex);
    this.renderAllColumns();
  }

  /**
   * Get state for persistence
   */
  getState(): { columns: Array<{ folderPath: string; selectedItem?: string; expandedFolders: string[]; isCollapsed: boolean }> } {
    return {
      columns: this.columns.map(col => ({
        folderPath: col.folderPath,
        selectedItem: col.selectedItem,
        expandedFolders: Array.from(col.expandedFolders),
        isCollapsed: col.isCollapsed
      }))
    };
  }

  /**
   * Set state from persistence
   */
  async setState(state: { columns?: Array<{ folderPath: string; selectedItem?: string; expandedFolders?: string[]; isCollapsed?: boolean }> }, result: { history: boolean }): Promise<void> {
    if (state.columns && state.columns.length > 0) {
      this.columns = state.columns.map(col => ({
        folderPath: col.folderPath,
        selectedItem: col.selectedItem,
        expandedFolders: new Set(col.expandedFolders ?? []),
        isCollapsed: col.isCollapsed ?? false
      }));
    }
    if (this.columnsContainer) {
      await this.renderAllColumns();
    }
  }

  /**
   * Show context menu
   */
  showContextMenu(event: MouseEvent, item: PaneItem, columnIndex: number): void {
    const menu = new Menu();
    const selectedCount = this.selectedItems.size;

    // Bulk actions for multiple selected items
    if (selectedCount > 1) {
      // Check if all selected are folders
      const allFolders = Array.from(this.selectedItems).every(path => {
        const file = this.app.vault.getAbstractFileByPath(path);
        return file instanceof TFolder;
      });

      if (allFolders) {
        const currentLevel = this.getColumnLevel(columnIndex);
        const maxLevels = this.plugin.settings.maxLevels;

        if (currentLevel < maxLevels) {
          menu.addItem((menuItem) => {
            menuItem
              .setTitle(`Set ${selectedCount} folders as Subfolders`)
              .setIcon('columns')
              .onClick(async () => {
                for (const path of this.selectedItems) {
                  this.plugin.dataManager.addMarkedFolder(path);
                }
                this.selectedItems.clear();
                await this.renderAllColumns();
              });
          });

          menu.addItem((menuItem) => {
            menuItem
              .setTitle(`Remove Subfolder from ${selectedCount} folders`)
              .setIcon('x')
              .onClick(async () => {
                for (const path of this.selectedItems) {
                  this.plugin.dataManager.removeMarkedFolder(path);
                }
                this.selectedItems.clear();
                await this.renderAllColumns();
              });
          });

          menu.addSeparator();
        }
      }

      menu.addItem((menuItem) => {
        menuItem
          .setTitle(`Delete ${selectedCount} items`)
          .setIcon('trash')
          .onClick(async () => {
            const pathsToDelete = Array.from(this.selectedItems);
            const itemNames = pathsToDelete.map(p => p.split('/').pop() ?? p);

            const doDelete = async () => {
              for (const path of pathsToDelete) {
                const file = this.app.vault.getAbstractFileByPath(path);
                if (file) {
                  await this.app.vault.trash(file, true);
                }
              }
              this.selectedItems.clear();
              await this.renderAllColumns();
            };

            if (this.plugin.settings.confirmBeforeDelete) {
              new DeleteConfirmModal(this.app, itemNames, doDelete).open();
            } else {
              await doDelete();
            }
          });
      });

      menu.addSeparator();

      menu.addItem((menuItem) => {
        menuItem
          .setTitle('Clear selection')
          .setIcon('x-circle')
          .onClick(() => {
            this.clearSelection();
          });
      });

      menu.showAtMouseEvent(event);
      return;
    }

    // Single item context menu
    if (item.type === 'folder') {
      const isMarked = this.plugin.dataManager.isMarkedFolder(item.path);
      const currentLevel = this.getColumnLevel(columnIndex);
      const maxLevels = this.plugin.settings.maxLevels;

      if (currentLevel < maxLevels) {
        menu.addItem((menuItem) => {
          menuItem
            .setTitle(isMarked ? 'Remove Subfolder' : 'Set as Subfolder')
            .setIcon(isMarked ? 'x' : 'columns')
            .onClick(async () => {
              if (isMarked) {
                this.plugin.dataManager.removeMarkedFolder(item.path);
                const colIndex = this.columns.findIndex(c => c.folderPath === item.path);
                if (colIndex > 0) {
                  this.closeColumnsFrom(colIndex);
                  return;
                }
              } else {
                this.plugin.dataManager.addMarkedFolder(item.path);
              }
              await this.renderAllColumns();
            });
        });

        menu.addSeparator();
      }

      menu.addItem((menuItem) => {
        menuItem
          .setTitle('New note')
          .setIcon('plus')
          .onClick(() => this.createNote(item.path));
      });

      menu.addItem((menuItem) => {
        menuItem
          .setTitle('New folder')
          .setIcon('folder-plus')
          .onClick(() => this.createFolder(item.path));
      });

      menu.addSeparator();

      menu.addItem((menuItem) => {
        menuItem
          .setTitle('Rename')
          .setIcon('pencil')
          .onClick(() => this.renameItem(item.path));
      });

      menu.addItem((menuItem) => {
        menuItem
          .setTitle('Delete')
          .setIcon('trash')
          .onClick(() => this.deleteItem(item.path));
      });
    } else if (item.type === 'file') {
      menu.addItem((menuItem) => {
        menuItem
          .setTitle('Open in new tab')
          .setIcon('file-plus')
          .onClick(() => {
            const file = this.app.vault.getAbstractFileByPath(item.path);
            if (file instanceof TFile) {
              this.app.workspace.getLeaf('tab').openFile(file);
            }
          });
      });

      menu.addSeparator();

      menu.addItem((menuItem) => {
        menuItem
          .setTitle('Rename')
          .setIcon('pencil')
          .onClick(() => this.renameItem(item.path));
      });

      menu.addItem((menuItem) => {
        menuItem
          .setTitle('Delete')
          .setIcon('trash')
          .onClick(() => this.deleteItem(item.path));
      });
    }

    menu.showAtMouseEvent(event);
  }

  private async createNote(folderPath: string): Promise<void> {
    const folder = folderPath === '/' ? '' : folderPath;
    const newPath = `${folder}/Untitled.md`.replace(/^\//, '');
    const file = await this.app.vault.create(newPath, '');
    await this.app.workspace.getLeaf().openFile(file);
    await this.renderAllColumns();
  }

  private async createFolder(parentPath: string): Promise<void> {
    const parent = parentPath === '/' ? '' : parentPath;
    const newPath = `${parent}/New Folder`.replace(/^\//, '');
    await this.app.vault.createFolder(newPath);
    await this.renderAllColumns();
  }

  private async renameItem(path: string): Promise<void> {
    // TODO: Implement rename modal
  }

  private async deleteItem(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!file) return;

    const itemName = path.split('/').pop() ?? path;

    const doDelete = async () => {
      await this.app.vault.trash(file, true);
      await this.renderAllColumns();
    };

    if (this.plugin.settings.confirmBeforeDelete) {
      new DeleteConfirmModal(this.app, [itemName], doDelete).open();
    } else {
      await doDelete();
    }
  }

  async refresh(): Promise<void> {
    await this.renderAllColumns();
  }

  collapseAll(): void {
    for (const col of this.columns) {
      col.expandedFolders.clear();
    }
    this.columns = [this.columns[0]];
    this.columns[0].selectedItem = undefined;
    this.renderAllColumns();
  }

  async navigateTo(path: string): Promise<void> {
    const parts = path.split('/');
    let currentPath = '';
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (currentPath) {
        this.columns[0].expandedFolders.add(currentPath);
      }
    }
    this.columns[0].expandedFolders.add('/');
    await this.renderAllColumns();
  }

  async revealFile(file: TFile): Promise<void> {
    await this.navigateTo(file.parent?.path ?? '/');
  }
}
