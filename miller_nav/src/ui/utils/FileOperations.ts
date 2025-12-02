/**
 * File operations utility class
 * Consolidates create, rename, delete, and move operations
 */

import { App, TFile, TFolder } from 'obsidian';
import { buildPath } from './index';

export type FileType = 'note' | 'folder' | 'canvas' | 'base';

interface FileTypeConfig {
  extension: string;
  defaultName: string;
  defaultContent: string;
  openAfterCreate: boolean;
}

const FILE_TYPE_CONFIGS: Record<Exclude<FileType, 'folder'>, FileTypeConfig> = {
  note: {
    extension: 'md',
    defaultName: 'Untitled',
    defaultContent: '',
    openAfterCreate: true
  },
  canvas: {
    extension: 'canvas',
    defaultName: 'Untitled',
    defaultContent: JSON.stringify({ nodes: [], edges: [] }),
    openAfterCreate: true
  },
  base: {
    extension: 'base',
    defaultName: 'Untitled',
    defaultContent: JSON.stringify({ columns: [], rows: [] }),
    openAfterCreate: true
  }
};

export class FileOperations {
  constructor(private app: App) {}

  /**
   * Create a new file of the specified type
   */
  async createFile(
    folderPath: string,
    type: Exclude<FileType, 'folder'>,
    onSuccess?: () => void
  ): Promise<TFile | null> {
    const config = FILE_TYPE_CONFIGS[type];
    const fileName = `${config.defaultName}.${config.extension}`;
    const filePath = buildPath(folderPath, fileName);

    try {
      const file = await this.app.vault.create(filePath, config.defaultContent);

      if (config.openAfterCreate) {
        this.app.workspace.getLeaf().openFile(file);
      }

      onSuccess?.();
      return file;
    } catch (error) {
      console.error(`Failed to create ${type}:`, error);
      return null;
    }
  }

  /**
   * Create a new folder
   */
  async createFolder(parentPath: string, onSuccess?: () => void): Promise<TFolder | null> {
    const folderPath = buildPath(parentPath, 'New Folder');

    try {
      await this.app.vault.createFolder(folderPath);
      onSuccess?.();
      return this.app.vault.getAbstractFileByPath(folderPath) as TFolder;
    } catch (error) {
      console.error('Failed to create folder:', error);
      return null;
    }
  }

  /**
   * Rename a file or folder
   */
  async rename(
    path: string,
    newName: string,
    onSuccess?: () => void
  ): Promise<boolean> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!file) return false;

    const isFolder = file instanceof TFolder;
    const parentPath = file.parent?.path ?? '';

    let newPath: string;
    if (isFolder) {
      newPath = parentPath ? `${parentPath}/${newName}` : newName;
    } else {
      const extension = (file as TFile).extension;
      newPath = parentPath ? `${parentPath}/${newName}.${extension}` : `${newName}.${extension}`;
    }

    try {
      await this.app.fileManager.renameFile(file, newPath);
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Failed to rename:', error);
      return false;
    }
  }

  /**
   * Delete a file or folder (move to trash)
   */
  async delete(path: string, onSuccess?: () => void): Promise<boolean> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!file) return false;

    try {
      await this.app.vault.trash(file, true);
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Failed to delete:', error);
      return false;
    }
  }

  /**
   * Move items to a target folder
   */
  async moveItems(
    itemPaths: string[],
    targetFolderPath: string,
    onSuccess?: () => void
  ): Promise<boolean> {
    const targetFolder = this.app.vault.getAbstractFileByPath(targetFolderPath);
    if (!(targetFolder instanceof TFolder)) return false;

    try {
      for (const itemPath of itemPaths) {
        const item = this.app.vault.getAbstractFileByPath(itemPath);
        if (!item) continue;

        // Don't move item into itself
        if (itemPath === targetFolderPath) continue;
        // Don't move into a subfolder of itself
        if (targetFolderPath.startsWith(itemPath + '/')) continue;

        const newPath = `${targetFolderPath}/${item.name}`;
        await this.app.fileManager.renameFile(item, newPath);
      }

      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Failed to move items:', error);
      return false;
    }
  }
}
