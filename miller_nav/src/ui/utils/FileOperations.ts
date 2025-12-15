/**
 * File operations utility class
 * Consolidates create, rename, delete, and move operations
 */

import { App, TFile, TFolder, Notice } from 'obsidian';
import { buildPath, getUniqueFileName } from './index';

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

    // Get unique file name with automatic numbering
    const fileName = await getUniqueFileName(
      this.app,
      folderPath,
      config.defaultName,
      config.extension
    );
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
    // Get unique folder name with automatic numbering
    const folderName = await getUniqueFileName(
      this.app,
      parentPath,
      'New Folder',
      '' // Empty extension for folders
    );
    const folderPath = buildPath(parentPath, folderName);

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

        // Check for naming conflict and resolve with unique name
        let targetName = item.name;
        const basicTargetPath = `${targetFolderPath}/${item.name}`;
        const conflictExists = await this.app.vault.adapter.exists(basicTargetPath);

        if (conflictExists && basicTargetPath !== itemPath) {
          // Generate unique name for the target
          if (item instanceof TFile) {
            const baseName = item.basename;
            const extension = item.extension;
            targetName = await getUniqueFileName(
              this.app,
              targetFolderPath,
              baseName,
              extension
            );
          } else {
            // Folder
            targetName = await getUniqueFileName(
              this.app,
              targetFolderPath,
              item.name,
              ''
            );
          }
        }

        const newPath = `${targetFolderPath}/${targetName}`;
        await this.app.fileManager.renameFile(item, newPath);
      }

      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Failed to move items:', error);
      return false;
    }
  }

  /**
   * Delete multiple items (move to trash)
   */
  async deleteItems(
    paths: string[],
    onSuccess?: () => void
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const path of paths) {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (!file) {
        failed++;
        continue;
      }

      try {
        await this.app.vault.trash(file, true);
        success++;
      } catch (error) {
        console.error(`Failed to delete ${path}:`, error);
        failed++;
      }
    }

    // Show summary notification
    if (success > 0) {
      new Notice(`Deleted ${success} item${success === 1 ? '' : 's'}`);
    }
    if (failed > 0) {
      new Notice(`Failed to delete ${failed} item${failed === 1 ? '' : 's'}`, 5000);
    }

    if (success > 0) {
      onSuccess?.();
    }

    return { success, failed };
  }

  /**
   * Duplicate a folder recursively (deep copy)
   */
  async duplicateFolder(
    sourcePath: string,
    onSuccess?: () => void
  ): Promise<string | null> {
    const sourceFolder = this.app.vault.getAbstractFileByPath(sourcePath);
    if (!(sourceFolder instanceof TFolder)) {
      new Notice('Source is not a folder');
      return null;
    }

    const parentPath = sourceFolder.parent?.path ?? '/';
    const baseName = sourceFolder.name;

    // Get unique folder name
    const uniqueName = await getUniqueFileName(this.app, parentPath, baseName, '');
    const targetPath = buildPath(parentPath, uniqueName);

    try {
      // Create the new folder
      await this.app.vault.createFolder(targetPath);

      // Recursively copy contents
      await this.copyFolderContents(sourceFolder, targetPath);

      new Notice(`Duplicated folder: ${uniqueName}`);
      onSuccess?.();
      return targetPath;
    } catch (error) {
      console.error('Failed to duplicate folder:', error);
      new Notice('Failed to duplicate folder', 5000);
      return null;
    }
  }

  /**
   * Helper: Recursively copy folder contents
   */
  private async copyFolderContents(sourceFolder: TFolder, targetFolderPath: string): Promise<void> {
    for (const child of sourceFolder.children) {
      if (child instanceof TFile) {
        // Copy file
        try {
          const content = await this.app.vault.read(child);
          const newFilePath = buildPath(targetFolderPath, child.name);
          await this.app.vault.create(newFilePath, content);
        } catch (error) {
          console.error(`Failed to copy file ${child.path}:`, error);
          // Continue with other files
        }
      } else if (child instanceof TFolder) {
        // Recursively copy subfolder
        try {
          const newFolderPath = buildPath(targetFolderPath, child.name);
          await this.app.vault.createFolder(newFolderPath);
          await this.copyFolderContents(child, newFolderPath);
        } catch (error) {
          console.error(`Failed to copy folder ${child.path}:`, error);
          // Continue with other folders
        }
      }
    }
  }
}
