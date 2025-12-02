/**
 * LevelComputer - Computes navigation levels based on marked folders
 *
 * Levels are computed dynamically by counting marked ancestors:
 * - Level 0: Root/virtual folders (Recent, Tags, Shortcuts)
 * - Level 1-4: User-marked folders
 */

import { DataManager } from './DataManager';
import { MaxLevels } from '../types';

export class LevelComputer {
  private dataManager: DataManager;
  private maxLevels: MaxLevels;

  constructor(dataManager: DataManager, maxLevels: MaxLevels = 3) {
    this.dataManager = dataManager;
    this.maxLevels = maxLevels;
  }

  /**
   * Update max levels setting
   */
  setMaxLevels(maxLevels: MaxLevels): void {
    this.maxLevels = maxLevels;
  }

  /**
   * Compute the navigation level of a folder based on marked ancestors.
   * Returns -1 if folder is not in any marked hierarchy.
   * Returns 0 for root-level marked folders.
   */
  computeLevel(folderPath: string): number {
    const markedFolders = this.dataManager.getMarkedFolders();

    // If the folder itself is marked, count its marked ancestors
    if (markedFolders.includes(folderPath)) {
      return this.countMarkedAncestors(folderPath, markedFolders) + 1;
    }

    // Check if any ancestor is marked
    const parts = folderPath.split('/');
    let currentPath = '';

    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
      if (markedFolders.includes(currentPath)) {
        // This folder is a child of a marked folder
        return this.countMarkedAncestors(currentPath, markedFolders) + 2;
      }
    }

    return -1; // Not in marked hierarchy
  }

  /**
   * Count how many marked ancestors a folder has
   */
  private countMarkedAncestors(folderPath: string, markedFolders: string[]): number {
    let count = 0;
    const parts = folderPath.split('/');
    let currentPath = '';

    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
      if (markedFolders.includes(currentPath)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Check if a folder can be marked as a subfolder.
   * Rules:
   * - Root folders can always be marked (Level 1)
   * - Non-root folders require parent to be marked
   * - Current level must not exceed maxLevels
   */
  canMarkAsSubfolder(folderPath: string): boolean {
    const parentPath = this.getParentPath(folderPath);

    // Root level folder - can always be Level 1
    if (!parentPath) {
      return true;
    }

    const markedFolders = this.dataManager.getMarkedFolders();

    // Check if parent is marked
    if (!markedFolders.includes(parentPath)) {
      // Parent not marked - check if we can still mark (if parent's parent is marked)
      const grandparentPath = this.getParentPath(parentPath);
      if (grandparentPath && !markedFolders.includes(grandparentPath)) {
        return false; // Need continuous marked hierarchy
      }
    }

    // Check if we'd exceed max levels
    const parentLevel = this.computeLevel(parentPath);
    if (parentLevel >= 0 && parentLevel >= this.maxLevels) {
      return false;
    }

    return true;
  }

  /**
   * Get the parent path of a folder
   */
  private getParentPath(folderPath: string): string | null {
    const lastSlash = folderPath.lastIndexOf('/');
    if (lastSlash === -1) {
      return null; // Root folder
    }
    return folderPath.substring(0, lastSlash);
  }

  /**
   * Get all marked ancestors of a path (for breadcrumb display)
   */
  getMarkedAncestors(folderPath: string): string[] {
    const markedFolders = this.dataManager.getMarkedFolders();
    const ancestors: string[] = [];
    const parts = folderPath.split('/');
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
      if (markedFolders.includes(currentPath)) {
        ancestors.push(currentPath);
      }
    }

    return ancestors;
  }

  /**
   * Get folders at a specific level
   */
  getFoldersAtLevel(level: number): string[] {
    const markedFolders = this.dataManager.getMarkedFolders();
    return markedFolders.filter((path) => this.computeLevel(path) === level);
  }

  /**
   * Get root-level marked folders (Level 1)
   */
  getRootMarkedFolders(): string[] {
    const markedFolders = this.dataManager.getMarkedFolders();
    return markedFolders.filter((path) => {
      const parentPath = this.getParentPath(path);
      // Root folder or parent is not marked
      return !parentPath || !markedFolders.includes(parentPath);
    });
  }

  /**
   * Get child marked folders of a given marked folder
   */
  getChildMarkedFolders(parentPath: string): string[] {
    const markedFolders = this.dataManager.getMarkedFolders();
    return markedFolders.filter((path) => {
      if (path === parentPath) return false;
      const parent = this.getParentPath(path);
      return parent === parentPath;
    });
  }

  /**
   * Validate all marked folders - returns invalid paths
   */
  validateMarkedFolders(existingPaths: Set<string>): string[] {
    const markedFolders = this.dataManager.getMarkedFolders();
    return markedFolders.filter((path) => !existingPaths.has(path));
  }
}
