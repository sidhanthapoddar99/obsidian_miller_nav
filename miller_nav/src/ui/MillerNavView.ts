/**
 * MillerNavView - Main ItemView for the Miller columns navigation
 * Multi-column layout within a single view - subfolders open in adjacent columns
 */

import { ItemView, WorkspaceLeaf, TFolder, TFile, Menu, Platform, setIcon } from 'obsidian';
import { MILLER_NAV_VIEW, PaneItem } from '../types';
import type MillerNavPlugin from '../main';

// Represents a single column in the Miller columns layout
interface ColumnState {
  folderPath: string;
  selectedItem?: string; // Path of selected item in this column
}

export class MillerNavView extends ItemView {
  plugin: MillerNavPlugin;
  private containerEl_: HTMLElement;
  private columnsContainer: HTMLElement;
  private expandedFolders: Set<string> = new Set();

  // Miller columns state - each column shows contents of a subfolder
  private columns: ColumnState[] = [{ folderPath: '/' }];

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

    // Horizontal container for all columns
    this.columnsContainer = container.createDiv({ cls: 'miller-nav-columns' });

    // Render all columns
    await this.renderAllColumns();
  }

  async onClose(): Promise<void> {
    this.containerEl_.empty();
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
    const columnEl = this.columnsContainer.createDiv({ cls: 'miller-nav-column' });
    columnEl.setAttribute('data-column', String(columnIndex));

    // Column header for non-root columns
    if (columnIndex > 0) {
      const headerEl = columnEl.createDiv({ cls: 'miller-nav-column-header' });
      const folderName = columnState.folderPath.split('/').pop() ?? columnState.folderPath;
      headerEl.textContent = folderName;

      // Close button
      const closeBtn = headerEl.createSpan({ cls: 'miller-nav-column-close' });
      setIcon(closeBtn, 'x');
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeColumnsFrom(columnIndex);
      });
    }

    // List container for this column
    const listEl = columnEl.createDiv({ cls: 'miller-nav-list' });

    // Render content based on column type
    if (columnIndex === 0) {
      // First column: virtual folders + vault tree
      await this.renderRootColumn(listEl);
    } else {
      // Subsequent columns: subfolder contents
      await this.renderSubfolderColumn(listEl, columnState.folderPath, columnIndex);
    }
  }

  /**
   * Render the root column (column 0) with virtual folders and vault tree
   */
  private async renderRootColumn(listEl: HTMLElement): Promise<void> {
    // Virtual folders (Recent, Tags, Shortcuts)
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
      }, 0, 0);
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
      }, 0, 0);
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
      }, 0, 0);
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
    this.renderItem(listEl, rootItem, 0, 0);

    // If root is expanded, render its children
    if (this.expandedFolders.has('/')) {
      await this.renderFolderChildren(listEl, '/', 1, 0);
    }
  }

  /**
   * Render a subfolder column (columns 1+)
   */
  private async renderSubfolderColumn(listEl: HTMLElement, folderPath: string, columnIndex: number): Promise<void> {
    await this.renderFolderChildren(listEl, folderPath, 0, columnIndex);
  }

  /**
   * Render a single item
   */
  private renderItem(listEl: HTMLElement, item: PaneItem, indent: number, columnIndex: number): void {
    const el = listEl.createDiv({ cls: 'miller-nav-item' });
    el.setAttribute('data-path', item.path);
    el.setAttribute('data-type', item.type);

    // Check if this item is selected (opened a column to the right)
    const isSelected = this.columns[columnIndex]?.selectedItem === item.path;
    if (isSelected) {
      el.addClass('is-selected');
    }

    // Base padding + indentation (consistent for all items)
    const basePadding = 8;
    const indentSize = 20;
    el.style.paddingLeft = `${basePadding + indent * indentSize}px`;

    // Chevron for expandable folders, empty space for alignment on others
    if (item.type === 'folder') {
      if (!item.isMarked && item.hasChildren) {
        // Regular folder with children - show expand chevron
        const chevronEl = el.createSpan({ cls: 'miller-nav-chevron' });
        const isExpanded = this.expandedFolders.has(item.path);
        setIcon(chevronEl, isExpanded ? 'chevron-down' : 'chevron-right');
        chevronEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleExpand(item);
        });
      } else {
        // Subfolder or empty folder - empty space for alignment
        el.createSpan({ cls: 'miller-nav-chevron miller-nav-chevron-empty' });
      }
    } else {
      // File or virtual folder - empty space for alignment
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

    // Arrow for subfolders (indicates opens in new column)
    if (item.type === 'folder' && item.isMarked) {
      const arrowEl = el.createSpan({ cls: 'miller-nav-arrow' });
      setIcon(arrowEl, 'chevron-right');
      el.addClass('miller-nav-subfolder');
    }

    // Click handler
    el.addEventListener('click', () => this.handleItemClick(item, columnIndex));

    // Context menu
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e, item);
    });
  }

  /**
   * Render children of a folder
   */
  private async renderFolderChildren(listEl: HTMLElement, folderPath: string, indent: number, columnIndex: number): Promise<void> {
    const folder = folderPath === '/'
      ? this.app.vault.getRoot()
      : this.app.vault.getAbstractFileByPath(folderPath);

    if (!(folder instanceof TFolder)) return;

    const items: PaneItem[] = [];

    // Collect children
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

    // Sort: folders first, then alphabetically
    items.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });

    // Render each item
    for (const item of items) {
      this.renderItem(listEl, item, indent, columnIndex);

      // Recursively render expanded folders (only in column 0 for tree behavior)
      if (columnIndex === 0 && item.type === 'folder' && !item.isMarked && this.expandedFolders.has(item.path)) {
        await this.renderFolderChildren(listEl, item.path, indent + 1, columnIndex);
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
   * Toggle folder expansion (for unmarked folders in column 0)
   */
  private toggleExpand(item: PaneItem): void {
    if (this.expandedFolders.has(item.path)) {
      this.expandedFolders.delete(item.path);
    } else {
      this.expandedFolders.add(item.path);
    }
    this.renderAllColumns();
  }

  /**
   * Handle item click
   */
  private handleItemClick(item: PaneItem, columnIndex: number): void {
    if (item.type === 'file') {
      // Open file
      const file = this.app.vault.getAbstractFileByPath(item.path);
      if (file instanceof TFile) {
        this.app.workspace.getLeaf().openFile(file);
      }
    } else if (item.type === 'folder') {
      if (item.isMarked) {
        // Subfolder: open in next column
        this.openSubfolderColumn(item.path, columnIndex);
      } else {
        // Regular folder: toggle expand
        this.toggleExpand(item);
      }
    } else if (item.type === 'virtual') {
      // TODO: Handle virtual folders
    }
  }

  /**
   * Open a subfolder in the next column
   */
  private openSubfolderColumn(folderPath: string, fromColumnIndex: number): void {
    // Close any columns after the current one
    this.columns = this.columns.slice(0, fromColumnIndex + 1);

    // Mark the clicked item as selected in its column
    this.columns[fromColumnIndex].selectedItem = folderPath;

    // Add new column for this subfolder
    this.columns.push({ folderPath });

    // Re-render all columns
    this.renderAllColumns();
  }

  /**
   * Close columns starting from a specific index
   */
  private closeColumnsFrom(columnIndex: number): void {
    // Clear selection from the previous column
    if (columnIndex > 0 && this.columns[columnIndex - 1]) {
      this.columns[columnIndex - 1].selectedItem = undefined;
    }

    // Remove columns from this index onwards
    this.columns = this.columns.slice(0, columnIndex);

    // Re-render
    this.renderAllColumns();
  }

  /**
   * Get state for persistence
   */
  getState(): { columns: ColumnState[], expandedFolders: string[] } {
    return {
      columns: this.columns,
      expandedFolders: Array.from(this.expandedFolders)
    };
  }

  /**
   * Set state from persistence
   */
  async setState(state: { columns?: ColumnState[], expandedFolders?: string[] }, result: { history: boolean }): Promise<void> {
    if (state.columns) {
      this.columns = state.columns;
    }
    if (state.expandedFolders) {
      this.expandedFolders = new Set(state.expandedFolders);
    }
    // Only render if container exists (onOpen has been called)
    if (this.columnsContainer) {
      await this.renderAllColumns();
    }
  }

  /**
   * Show context menu
   */
  showContextMenu(event: MouseEvent, item: PaneItem): void {
    const menu = new Menu();

    if (item.type === 'folder') {
      const isMarked = this.plugin.dataManager.isMarkedFolder(item.path);
      menu.addItem((menuItem) => {
        menuItem
          .setTitle(isMarked ? 'Remove Subfolder' : 'Set as Subfolder')
          .setIcon(isMarked ? 'x' : 'columns')
          .onClick(async () => {
            // Save current expansion state
            const savedExpanded = new Set(this.expandedFolders);

            if (isMarked) {
              this.plugin.dataManager.removeMarkedFolder(item.path);
              // Close any columns showing this folder
              const colIndex = this.columns.findIndex(c => c.folderPath === item.path);
              if (colIndex > 0) {
                this.closeColumnsFrom(colIndex);
              }
            } else {
              this.plugin.dataManager.addMarkedFolder(item.path);
            }

            // Restore expansion state
            this.expandedFolders = savedExpanded;
            await this.renderAllColumns();
          });
      });

      menu.addSeparator();

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
    const savedExpanded = new Set(this.expandedFolders);

    const folder = folderPath === '/' ? '' : folderPath;
    const newPath = `${folder}/Untitled.md`.replace(/^\//, '');
    const file = await this.app.vault.create(newPath, '');
    await this.app.workspace.getLeaf().openFile(file);

    this.expandedFolders = savedExpanded;
    await this.renderAllColumns();
  }

  private async createFolder(parentPath: string): Promise<void> {
    const savedExpanded = new Set(this.expandedFolders);

    const parent = parentPath === '/' ? '' : parentPath;
    const newPath = `${parent}/New Folder`.replace(/^\//, '');
    await this.app.vault.createFolder(newPath);

    this.expandedFolders = savedExpanded;
    await this.renderAllColumns();
  }

  private async renameItem(path: string): Promise<void> {
    // TODO: Implement rename modal
  }

  private async deleteItem(path: string): Promise<void> {
    const savedExpanded = new Set(this.expandedFolders);

    const file = this.app.vault.getAbstractFileByPath(path);
    if (file) {
      await this.app.vault.trash(file, true);
    }

    this.expandedFolders = savedExpanded;
    await this.renderAllColumns();
  }

  /**
   * Refresh the view (preserves expansion state)
   */
  async refresh(): Promise<void> {
    await this.renderAllColumns();
  }

  /**
   * Collapse all folders
   */
  collapseAll(): void {
    this.expandedFolders.clear();
    this.columns = [{ folderPath: '/' }];
    this.renderAllColumns();
  }

  /**
   * Navigate to a path
   */
  async navigateTo(path: string): Promise<void> {
    // Expand all parent folders
    const parts = path.split('/');
    let currentPath = '';
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (currentPath) {
        this.expandedFolders.add(currentPath);
      }
    }
    this.expandedFolders.add('/');
    await this.renderAllColumns();
  }

  /**
   * Reveal a file in the navigator
   */
  async revealFile(file: TFile): Promise<void> {
    await this.navigateTo(file.parent?.path ?? '/');
  }
}
