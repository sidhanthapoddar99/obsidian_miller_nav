/**
 * MillerNavView - Main ItemView for Miller columns navigation
 */

import { ItemView, WorkspaceLeaf, TFolder, TFile, Platform } from 'obsidian';
import { MILLER_NAV_VIEW, PaneItem } from '../types';
import type MillerNavPlugin from '../main';
import type { ColumnState, ViewCallbacks, ViewState } from './types';
import { renderColumnHeader, renderColumnFooter, renderCollapsedColumn, renderItem } from './components';
import { DragDropHandler, showContextMenu } from './handlers';
import { DeleteConfirmModal, RenameModal } from './modals';

export class MillerNavView extends ItemView {
  plugin: MillerNavPlugin;
  private containerEl_: HTMLElement;
  private columnsContainer: HTMLElement;
  private columns: ColumnState[] = [{ folderPath: '/', expandedFolders: new Set(), isCollapsed: false }];
  private selectedItems: Set<string> = new Set();
  private dragHandler: DragDropHandler;
  private autoRevealActive: boolean = false;
  private activeFilePath: string | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: MillerNavPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.dragHandler = new DragDropHandler(this.app);
    this.autoRevealActive = plugin.settings.autoRevealActiveNote;
    this.activeFilePath = this.app.workspace.getActiveFile()?.path ?? null;
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

    // Listen for active file changes to highlight
    this.registerEvent(
      this.app.workspace.on('file-open', (file) => {
        this.activeFilePath = file?.path ?? null;
        this.renderAllColumns();
      })
    );

    this.columnsContainer = container.createDiv({ cls: 'miller-nav-columns' });
    await this.renderAllColumns();
  }

  async onClose(): Promise<void> {
    this.containerEl_.empty();
  }

  // ============ Callbacks for child components ============

  private getCallbacks(): ViewCallbacks {
    return {
      renderAllColumns: () => this.renderAllColumns(),
      toggleColumnCollapse: (i) => this.toggleColumnCollapse(i),
      collapseColumnTree: (i) => this.collapseColumnTree(i),
      closeColumnsFrom: (i) => this.closeColumnsFrom(i),
      createNote: (path) => this.createNote(path),
      createFolder: (path) => this.createFolder(path),
      createCanvas: (path) => this.createCanvas(path),
      createBase: (path) => this.createBase(path),
      openSubfolderColumn: (path, i) => this.openSubfolderColumn(path, i),
      toggleExpand: (path, i) => this.toggleExpand(path, i),
      handleItemClick: (path, type, i) => this.handleItemClick(path, type, i),
      moveItems: (paths, target) => this.moveItems(paths, target),
      deleteItem: (path) => this.deleteItem(path),
      renameItem: (path) => this.renameItem(path),
      clearSelection: () => this.clearSelection(),
      toggleItemSelection: (path, add) => this.toggleItemSelection(path, add),
      addMarkedFolder: (path) => this.plugin.dataManager.addMarkedFolder(path),
      removeMarkedFolder: (path) => this.plugin.dataManager.removeMarkedFolder(path),
      getActiveFilePath: () => this.activeFilePath,
    };
  }

  // ============ Navigation Logic ============

  private shouldOpenHorizontally(folderPath: string, columnIndex: number): boolean {
    const isMarked = this.plugin.dataManager.isMarkedFolder(folderPath);
    return isMarked && columnIndex < this.plugin.settings.maxLevels;
  }

  // ============ Auto Reveal ============

  private toggleAutoReveal(): void {
    this.autoRevealActive = !this.autoRevealActive;
    this.plugin.settings.autoRevealActiveNote = this.autoRevealActive;
    this.plugin.saveSettings();
    this.renderAllColumns();

    // If enabled, reveal current file
    if (this.autoRevealActive) {
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile) {
        this.revealFile(activeFile);
      }
    }
  }

  // ============ Selection ============

  private clearSelection(): void {
    this.selectedItems.clear();
    this.renderAllColumns();
  }

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

  // ============ Column Management ============

  private toggleColumnCollapse(columnIndex: number): void {
    this.columns[columnIndex].isCollapsed = !this.columns[columnIndex].isCollapsed;
    this.renderAllColumns();
  }

  private collapseColumnTree(columnIndex: number): void {
    this.columns[columnIndex].expandedFolders.clear();
    this.renderAllColumns();
  }

  private closeColumnsFrom(columnIndex: number): void {
    if (columnIndex > 0 && this.columns[columnIndex - 1]) {
      this.columns[columnIndex - 1].selectedItem = undefined;
    }
    this.columns = this.columns.slice(0, columnIndex);
    this.renderAllColumns();
  }

  private openSubfolderColumn(folderPath: string, fromColumnIndex: number): void {
    // Normalize path (remove trailing slashes except for root)
    const normalizedPath = folderPath === '/' ? '/' : folderPath.replace(/\/+$/, '');

    // Check if column for this folder already exists at any position
    const existingIndex = this.columns.findIndex(col => col.folderPath === normalizedPath);
    if (existingIndex !== -1) {
      // Column already exists - if it's after our current position, just reveal it
      if (existingIndex > fromColumnIndex) {
        // Column exists to the right, no action needed
        return;
      }
      // Column exists but at or before current position, don't duplicate
      return;
    }

    // Check if column already exists at the position we'd create
    if (this.columns.length > fromColumnIndex + 1) {
      if (this.columns[fromColumnIndex + 1]?.folderPath === normalizedPath) {
        // Already have this column as the next one
        return;
      }
    }

    // Close any columns after the current one
    this.columns = this.columns.slice(0, fromColumnIndex + 1);
    this.columns[fromColumnIndex].selectedItem = normalizedPath;
    this.columns.push({ folderPath: normalizedPath, expandedFolders: new Set(), isCollapsed: false });
    this.renderAllColumns();
  }

  private toggleExpand(path: string, columnIndex: number): void {
    const columnState = this.columns[columnIndex];
    if (columnState.expandedFolders.has(path)) {
      columnState.expandedFolders.delete(path);
    } else {
      columnState.expandedFolders.add(path);
    }
    this.renderAllColumns();
  }

  // ============ Item Actions ============

  private handleItemClick(path: string, type: string, columnIndex: number): void {
    // Clear multi-selection when clicking normally
    this.selectedItems.clear();

    // Close columns to the right when clicking in an earlier column
    if (columnIndex < this.columns.length - 1) {
      // Clear the selected item of current column if clicking something different
      if (this.columns[columnIndex].selectedItem !== path) {
        this.columns = this.columns.slice(0, columnIndex + 1);
        this.columns[columnIndex].selectedItem = undefined;
      }
    }

    if (type === 'file') {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file instanceof TFile) {
        this.app.workspace.getLeaf().openFile(file);
      }
      this.renderAllColumns();
    } else if (type === 'folder') {
      if (this.shouldOpenHorizontally(path, columnIndex)) {
        this.openSubfolderColumn(path, columnIndex);
      } else {
        this.toggleExpand(path, columnIndex);
      }
    }
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

  private async createCanvas(folderPath: string): Promise<void> {
    const folder = folderPath === '/' ? '' : folderPath;
    const newPath = `${folder}/Untitled.canvas`.replace(/^\//, '');
    // Canvas files are JSON with empty canvas structure
    const canvasContent = JSON.stringify({ nodes: [], edges: [] });
    const file = await this.app.vault.create(newPath, canvasContent);
    await this.app.workspace.getLeaf().openFile(file);
    await this.renderAllColumns();
  }

  private async createBase(folderPath: string): Promise<void> {
    const folder = folderPath === '/' ? '' : folderPath;
    const newPath = `${folder}/Untitled.base`.replace(/^\//, '');
    // Base files are JSON with empty database structure
    const baseContent = JSON.stringify({ columns: [], rows: [] });
    const file = await this.app.vault.create(newPath, baseContent);
    await this.app.workspace.getLeaf().openFile(file);
    await this.renderAllColumns();
  }

  private async renameItem(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!file) return;

    const isFolder = file instanceof TFolder;
    const currentName = isFolder ? file.name : (file as TFile).basename;

    new RenameModal(this.app, currentName, isFolder, async (newName: string) => {
      try {
        const parentPath = file.parent?.path ?? '';
        let newPath: string;

        if (isFolder) {
          newPath = parentPath ? `${parentPath}/${newName}` : newName;
        } else {
          const extension = (file as TFile).extension;
          newPath = parentPath ? `${parentPath}/${newName}.${extension}` : `${newName}.${extension}`;
        }

        await this.app.fileManager.renameFile(file, newPath);
        await this.renderAllColumns();
      } catch (error) {
        console.error('Failed to rename:', error);
      }
    }).open();
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

  private async moveItems(itemPaths: string[], targetFolderPath: string): Promise<void> {
    await this.dragHandler.moveItems(
      itemPaths,
      targetFolderPath,
      this.selectedItems,
      () => this.renderAllColumns()
    );
  }

  // ============ Rendering ============

  private async renderAllColumns(): Promise<void> {
    this.columnsContainer.empty();
    for (let i = 0; i < this.columns.length; i++) {
      await this.renderColumn(i);
    }
  }

  private async renderColumn(columnIndex: number): Promise<void> {
    const columnState = this.columns[columnIndex];
    const columnEl = this.columnsContainer.createDiv({
      cls: `miller-nav-column ${columnState.isCollapsed ? 'is-collapsed' : ''}`
    });
    columnEl.setAttribute('data-column', String(columnIndex));

    // Setup drop target
    this.dragHandler.setupColumnDropTarget(
      columnEl,
      columnIndex,
      this.columns,
      (paths, target) => this.moveItems(paths, target)
    );

    if (columnState.isCollapsed) {
      renderCollapsedColumn({
        columnEl,
        columnIndex,
        columnState,
        callbacks: this.getCallbacks()
      });
      return;
    }

    // Render header
    renderColumnHeader({
      columnEl,
      columnIndex,
      columnState,
      callbacks: this.getCallbacks(),
      autoRevealActive: this.autoRevealActive,
      onAutoRevealToggle: () => this.toggleAutoReveal(),
      onSearch: () => {
        // TODO: Implement search
      },
      onSort: () => {
        // TODO: Implement sort
      }
    });

    // Render list content
    const listEl = columnEl.createDiv({ cls: 'miller-nav-list' });

    if (columnIndex === 0) {
      await this.renderRootColumn(listEl, columnIndex);
    } else {
      await this.renderSubfolderColumn(listEl, columnState.folderPath, columnIndex);
    }

    // Render footer with New Note / New Folder buttons
    renderColumnFooter(columnEl, columnState.folderPath, this.getCallbacks());
  }

  private async renderRootColumn(listEl: HTMLElement, columnIndex: number): Promise<void> {
    const virtualItems = this.getVirtualItems();
    for (const item of virtualItems) {
      this.renderItemElement(listEl, item, 0, columnIndex);
    }

    // Vault root
    const rootItem: PaneItem = {
      id: 'folder-root',
      type: 'folder',
      name: this.app.vault.getName(),
      path: '/',
      level: 0,
      isMarked: false,
      hasChildren: true,
      icon: 'vault',
    };
    this.renderItemElement(listEl, rootItem, 0, columnIndex);

    if (this.columns[columnIndex].expandedFolders.has('/')) {
      await this.renderFolderChildren(listEl, '/', 1, columnIndex);
    }
  }

  private getVirtualItems(): PaneItem[] {
    const items: PaneItem[] = [];

    if (this.plugin.settings.showRecentNotes) {
      items.push({
        id: 'virtual-recent',
        type: 'virtual',
        name: 'Recent',
        path: '__recent__',
        level: 0,
        virtualType: 'recent',
        icon: 'clock',
        hasChildren: false,
      });
    }

    if (this.plugin.settings.showTags) {
      items.push({
        id: 'virtual-tags',
        type: 'virtual',
        name: 'Tags',
        path: '__tags__',
        level: 0,
        virtualType: 'tags',
        icon: 'tag',
        hasChildren: false,
      });
    }

    if (this.plugin.settings.showShortcuts) {
      items.push({
        id: 'virtual-shortcuts',
        type: 'virtual',
        name: 'Shortcuts',
        path: '__shortcuts__',
        level: 0,
        virtualType: 'shortcuts',
        icon: 'star',
        hasChildren: false,
      });
    }

    return items;
  }

  private async renderSubfolderColumn(listEl: HTMLElement, folderPath: string, columnIndex: number): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);

    if (!(folder instanceof TFolder)) {
      listEl.createDiv({ cls: 'miller-nav-empty', text: 'Folder not found' });
      return;
    }

    await this.renderFolderChildren(listEl, folderPath, 0, columnIndex);
  }

  private async renderFolderChildren(listEl: HTMLElement, folderPath: string, indent: number, columnIndex: number): Promise<void> {
    const folder = folderPath === '/'
      ? this.app.vault.getRoot()
      : this.app.vault.getAbstractFileByPath(folderPath);

    if (!(folder instanceof TFolder)) return;

    const items = this.getFolderItems(folder, indent);

    if (items.length === 0 && indent === 0) {
      listEl.createDiv({ cls: 'miller-nav-empty', text: 'Empty folder' });
      return;
    }

    const columnState = this.columns[columnIndex];

    for (const item of items) {
      this.renderItemElement(listEl, item, indent, columnIndex);

      if (item.type === 'folder' &&
          !this.shouldOpenHorizontally(item.path, columnIndex) &&
          columnState.expandedFolders.has(item.path)) {
        await this.renderFolderChildren(listEl, item.path, indent + 1, columnIndex);
      }
    }
  }

  private getFolderItems(folder: TFolder, indent: number): PaneItem[] {
    const items: PaneItem[] = [];
    const ignoredExtensions = this.plugin.settings.ignoredExtensions.map(e => e.toLowerCase());
    // Known Obsidian file types that get special icons
    const knownExtensions: Record<string, string> = {
      'md': 'file-text',
      'canvas': 'layout-dashboard',
      'base': 'database',
      'pdf': 'file-type',
      'png': 'image',
      'jpg': 'image',
      'jpeg': 'image',
      'gif': 'image',
      'svg': 'image',
      'webp': 'image',
      'mp3': 'music',
      'wav': 'music',
      'mp4': 'video',
      'webm': 'video',
    };

    for (const child of folder.children) {
      if (child instanceof TFolder) {
        if (child.name.startsWith('.')) continue;

        const isMarked = this.plugin.dataManager.isMarkedFolder(child.path);
        const metadata = this.plugin.dataManager.getFolderMetadata(child.path);
        const hasChildren = child.children.some((c) =>
          (c instanceof TFolder && !c.name.startsWith('.')) ||
          (c instanceof TFile)
        );

        items.push({
          id: `folder-${child.path}`,
          type: 'folder',
          name: child.name,
          path: child.path,
          level: indent,
          isMarked,
          hasChildren,
          icon: metadata?.icon ?? 'folder',
          color: metadata?.color,
          noteCount: this.plugin.settings.showNoteCount ? this.countNotes(child) : undefined,
        });
      } else if (child instanceof TFile) {
        const ext = child.extension.toLowerCase();

        // Skip ignored extensions
        if (ignoredExtensions.includes(ext)) continue;

        const isKnownType = ext in knownExtensions;
        const icon = knownExtensions[ext] ?? 'file';

        items.push({
          id: `file-${child.path}`,
          type: 'file',
          name: child.basename,
          path: child.path,
          level: indent,
          icon,
          hasChildren: false,
          // Only show extension label for unknown types
          extension: isKnownType ? undefined : ext.toUpperCase(),
        });
      }
    }

    return items.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
  }

  private countNotes(folder: TFolder): number {
    return folder.children.filter(c => c instanceof TFile && c.extension === 'md').length;
  }

  private renderItemElement(listEl: HTMLElement, item: PaneItem, indent: number, columnIndex: number): void {
    const columnState = this.columns[columnIndex];
    const opensHorizontally = item.type === 'folder' && this.shouldOpenHorizontally(item.path, columnIndex);
    const isActiveFile = item.type === 'file' && item.path === this.activeFilePath;

    renderItem({
      listEl,
      item,
      indent,
      columnIndex,
      columnState,
      selectedItems: this.selectedItems,
      opensHorizontally,
      isActiveFile,
      callbacks: this.getCallbacks(),
      onDragStart: (item, col) => this.dragHandler.startDrag(item, col),
      onDragEnd: () => this.dragHandler.endDrag(),
      getDraggedItem: () => this.dragHandler.getDraggedItem()
    });

    // Context menu handler
    const el = listEl.lastElementChild as HTMLElement;
    el?.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Update selection state without full re-render
      if (!this.selectedItems.has(item.path)) {
        this.selectedItems.clear();
        this.selectedItems.add(item.path);
        // Just update visual state of this element
        el.addClass('is-multi-selected');
      }

      showContextMenu({
        app: this.app,
        event: e,
        item,
        columnIndex,
        selectedItems: this.selectedItems,
        maxLevels: this.plugin.settings.maxLevels,
        confirmBeforeDelete: this.plugin.settings.confirmBeforeDelete,
        isMarkedFolder: (path) => this.plugin.dataManager.isMarkedFolder(path),
        callbacks: this.getCallbacks()
      });
    });
  }

  // ============ State Persistence ============

  getState(): ViewState {
    return {
      columns: this.columns.map(col => ({
        folderPath: col.folderPath,
        selectedItem: col.selectedItem,
        expandedFolders: Array.from(col.expandedFolders),
        isCollapsed: col.isCollapsed
      }))
    };
  }

  async setState(state: Partial<ViewState>, result: { history: boolean }): Promise<void> {
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

  // ============ Public API ============

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
    // Reset to just root column
    this.columns = [{ folderPath: '/', expandedFolders: new Set(), isCollapsed: false }];
    this.columns[0].expandedFolders.add('/');

    if (!path || path === '/') {
      await this.renderAllColumns();
      return;
    }

    const parts = path.split('/').filter(p => p);
    let currentPath = '';
    let currentColumnIndex = 0;

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      // Check if this folder should open horizontally (is marked)
      const shouldOpenHorizontal = this.plugin.dataManager.isMarkedFolder(currentPath) &&
                                    currentColumnIndex < this.plugin.settings.maxLevels;

      if (shouldOpenHorizontal) {
        // Open as new column
        this.columns[currentColumnIndex].selectedItem = currentPath;
        this.columns.push({
          folderPath: currentPath,
          expandedFolders: new Set(),
          isCollapsed: false
        });
        currentColumnIndex++;
      } else {
        // Expand inline in current column
        this.columns[currentColumnIndex].expandedFolders.add(currentPath);
      }
    }

    await this.renderAllColumns();

    // Scroll the last column into view
    setTimeout(() => {
      const lastColumn = this.columnsContainer.lastElementChild as HTMLElement;
      if (lastColumn) {
        lastColumn.scrollIntoView({ behavior: 'smooth', inline: 'end' });
      }
    }, 50);
  }

  async revealFile(file: TFile): Promise<void> {
    const parentPath = file.parent?.path ?? '/';
    await this.navigateTo(parentPath);

    // Highlight the file in the view
    setTimeout(() => {
      const fileEl = this.columnsContainer.querySelector(`[data-path="${file.path}"]`) as HTMLElement;
      if (fileEl) {
        fileEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Briefly highlight the file
        fileEl.addClass('is-selected');
        setTimeout(() => fileEl.removeClass('is-selected'), 2000);
      }
    }, 100);
  }
}
