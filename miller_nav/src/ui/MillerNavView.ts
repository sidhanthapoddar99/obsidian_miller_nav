/**
 * MillerNavView - Main ItemView for Miller columns navigation
 */

import { ItemView, WorkspaceLeaf, TFolder, TFile, Platform } from 'obsidian';
import { MILLER_NAV_VIEW, PaneItem } from '../types';
import type MillerNavPlugin from '../main';
import type { ViewCallbacks, ViewState } from './types';
import { renderColumnHeader, renderColumnFooter, renderCollapsedColumn, renderItem } from './components';
import { DragDropHandler } from './handlers';
import { showContextMenu } from './handlers/contextMenu';
import { DeleteConfirmModal, RenameModal } from './modals';
import { FileOperations } from './utils';
import { ColumnManager, SelectionManager } from './managers';
import { ItemDataProvider } from './providers';

export class MillerNavView extends ItemView {
  plugin: MillerNavPlugin;
  private containerEl_: HTMLElement;
  private columnsContainer: HTMLElement;

  // Extracted managers
  private columnManager: ColumnManager;
  private selectionManager: SelectionManager;
  private itemDataProvider: ItemDataProvider;

  // Handlers
  private dragHandler: DragDropHandler;
  private fileOps: FileOperations;

  // View state
  private autoRevealActive: boolean = false;
  private activeFilePath: string | null = null;
  private cachedCallbacks: ViewCallbacks | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: MillerNavPlugin) {
    super(leaf);
    this.plugin = plugin;

    // Initialize managers
    this.columnManager = new ColumnManager();
    this.selectionManager = new SelectionManager();
    this.itemDataProvider = new ItemDataProvider(
      this.app.vault,
      this.plugin.dataManager,
      this.plugin.settings
    );

    // Initialize handlers
    this.dragHandler = new DragDropHandler(this.app);
    this.fileOps = new FileOperations(this.app);

    // Initialize state
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
        const oldPath = this.activeFilePath;
        this.activeFilePath = file?.path ?? null;
        // Use targeted update instead of full re-render
        SelectionManager.updateActiveFileVisual(this.columnsContainer, oldPath, this.activeFilePath);
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
    if (!this.cachedCallbacks) {
      this.cachedCallbacks = {
        renderAllColumns: () => this.renderAllColumns(),
        toggleColumnCollapse: (i) => {
          this.columnManager.toggleCollapse(i);
          this.renderAllColumns();
        },
        collapseColumnTree: (i) => {
          this.columnManager.collapseTree(i);
          this.renderAllColumns();
        },
        collapseAll: () => this.collapseAll(),
        closeColumnsFrom: (i) => {
          this.columnManager.closeFrom(i);
          this.renderAllColumns();
        },
        createNote: (path) => this.createNote(path),
        createFolder: (path) => this.createFolder(path),
        createCanvas: (path) => this.createCanvas(path),
        createBase: (path) => this.createBase(path),
        openSubfolderColumn: (path, i) => {
          this.columnManager.openSubfolder(path, i);
          this.renderAllColumns();
        },
        toggleExpand: (path, i) => {
          this.columnManager.toggleExpand(path, i);
          this.renderAllColumns();
        },
        handleItemClick: (path, type, i) => this.handleItemClick(path, type, i),
        moveItems: (paths, target) => this.moveItems(paths, target),
        deleteItem: (path) => this.deleteItem(path),
        renameItem: (path) => this.renameItem(path),
        clearSelection: () => this.clearSelection(),
        toggleItemSelection: (path, add) => this.toggleItemSelection(path, add),
        selectRange: (from, to, col) => this.selectRange(from, to, col),
        getLastSelectedPath: () => this.selectionManager.lastSelectedPath,
        addMarkedFolder: (path) => this.plugin.dataManager.addMarkedFolder(path),
        removeMarkedFolder: (path) => this.plugin.dataManager.removeMarkedFolder(path),
        getActiveFilePath: () => this.activeFilePath,
      };
    }
    return this.cachedCallbacks!;
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
    const oldSelection = this.selectionManager.clear();
    SelectionManager.updateVisuals(this.columnsContainer, oldSelection, this.selectionManager.selectedItems);
  }

  private toggleItemSelection(path: string, addToSelection: boolean): void {
    const result = this.selectionManager.toggle(path, addToSelection);
    SelectionManager.updateVisuals(this.columnsContainer, result.old, result.new);
  }

  private selectRange(fromPath: string, toPath: string, columnIndex: number): void {
    // Get visible items for the column
    const column = this.columnManager.getColumn(columnIndex);
    if (!column) return;

    const visibleItems = this.itemDataProvider.getVisibleItemsInColumn(
      column.folderPath,
      column.expandedFolders,
      (path) => this.shouldOpenHorizontally(path, columnIndex)
    );

    const result = this.selectionManager.selectRange(fromPath, toPath, visibleItems);
    SelectionManager.updateVisuals(this.columnsContainer, result.old, result.new);
  }

  // ============ Item Actions ============

  private handleItemClick(path: string, type: string, columnIndex: number): void {
    // Clear multi-selection when clicking normally
    const oldSelection = this.selectionManager.clear();
    SelectionManager.updateVisuals(this.columnsContainer, oldSelection, this.selectionManager.selectedItems);

    // Close columns to the right when clicking in an earlier column
    this.columnManager.closeColumnsToRight(columnIndex, path);

    if (type === 'file') {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file instanceof TFile) {
        this.app.workspace.getLeaf().openFile(file);
      }
      this.renderAllColumns();
    } else if (type === 'folder') {
      if (this.shouldOpenHorizontally(path, columnIndex)) {
        this.columnManager.openSubfolder(path, columnIndex);
        this.renderAllColumns();
      } else {
        this.columnManager.toggleExpand(path, columnIndex);
        this.renderAllColumns();
      }
    }
  }

  private async createNote(folderPath: string): Promise<void> {
    await this.fileOps.createFile(folderPath, 'note', () => this.renderAllColumns());
  }

  private async createFolder(parentPath: string): Promise<void> {
    await this.fileOps.createFolder(parentPath, () => this.renderAllColumns());
  }

  private async createCanvas(folderPath: string): Promise<void> {
    await this.fileOps.createFile(folderPath, 'canvas', () => this.renderAllColumns());
  }

  private async createBase(folderPath: string): Promise<void> {
    await this.fileOps.createFile(folderPath, 'base', () => this.renderAllColumns());
  }

  private renameItem(path: string): void {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!file) return;

    const isFolder = file instanceof TFolder;
    const currentName = isFolder ? file.name : (file as TFile).basename;

    new RenameModal(this.app, currentName, isFolder, async (newName: string) => {
      await this.fileOps.rename(path, newName, () => this.renderAllColumns());
    }).open();
  }

  private async deleteItem(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!file) return;

    const itemName = path.split('/').pop() ?? path;

    const doDelete = () => this.fileOps.delete(path, () => this.renderAllColumns());

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
      this.selectionManager.selectedItems,
      () => this.renderAllColumns()
    );
  }

  // ============ Rendering ============

  private async renderAllColumns(): Promise<void> {
    // Update settings reference in case they changed
    this.itemDataProvider.updateSettings(this.plugin.settings);

    this.columnsContainer.empty();
    const columns = this.columnManager.getColumns();
    for (let i = 0; i < columns.length; i++) {
      await this.renderColumn(i);
    }
  }

  private async renderColumn(columnIndex: number): Promise<void> {
    const columnState = this.columnManager.getColumn(columnIndex)!;
    const columnEl = this.columnsContainer.createDiv({
      cls: `miller-nav-column ${columnState.isCollapsed ? 'is-collapsed' : ''}`
    });
    columnEl.setAttribute('data-column', String(columnIndex));

    // Setup drop target
    this.dragHandler.setupColumnDropTarget(
      columnEl,
      columnIndex,
      this.columnManager.getColumns(),
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
    const virtualItems = this.itemDataProvider.getVirtualItems();
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

    if (this.columnManager.isExpanded('/', columnIndex)) {
      await this.renderFolderChildren(listEl, '/', 1, columnIndex);
    }
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

    const items = this.itemDataProvider.getFolderItems(folder, indent);

    if (items.length === 0 && indent === 0) {
      listEl.createDiv({ cls: 'miller-nav-empty', text: 'Empty folder' });
      return;
    }

    for (const item of items) {
      this.renderItemElement(listEl, item, indent, columnIndex);

      if (item.type === 'folder' &&
          !this.shouldOpenHorizontally(item.path, columnIndex) &&
          this.columnManager.isExpanded(item.path, columnIndex)) {
        await this.renderFolderChildren(listEl, item.path, indent + 1, columnIndex);
      }
    }
  }

  private renderItemElement(listEl: HTMLElement, item: PaneItem, indent: number, columnIndex: number): void {
    const columnState = this.columnManager.getColumn(columnIndex)!;
    const opensHorizontally = item.type === 'folder' && this.shouldOpenHorizontally(item.path, columnIndex);
    const isActiveFile = item.type === 'file' && item.path === this.activeFilePath;

    renderItem({
      listEl,
      item,
      indent,
      columnIndex,
      columnState,
      selectedItems: this.selectionManager.selectedItems,
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
      if (!this.selectionManager.has(item.path)) {
        const oldSel = new Set(this.selectionManager.selectedItems);
        this.selectionManager.selectedItems.clear();
        this.selectionManager.add(item.path);
        // Just update visual state of this element
        SelectionManager.updateVisuals(this.columnsContainer, oldSel, this.selectionManager.selectedItems);
      }

      showContextMenu({
        app: this.app,
        event: e,
        item,
        columnIndex,
        selectedItems: this.selectionManager.selectedItems,
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
      columns: this.columnManager.serialize()
    };
  }

  async setState(state: Partial<ViewState>, result: { history: boolean }): Promise<void> {
    if (state.columns && state.columns.length > 0) {
      this.columnManager.deserialize(state.columns);
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
    this.columnManager.collapseAll();
    this.renderAllColumns();
  }

  async navigateTo(path: string): Promise<void> {
    // Reset to just root column
    this.columnManager.reset();
    this.columnManager.expandFolder('/', 0);

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
        this.columnManager.setSelectedItem(currentColumnIndex, currentPath);
        const columns = this.columnManager.getColumns();
        columns.push({
          folderPath: currentPath,
          expandedFolders: new Set(),
          isCollapsed: false
        });
        currentColumnIndex++;
      } else {
        // Expand inline in current column
        this.columnManager.expandFolder(currentPath, currentColumnIndex);
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
