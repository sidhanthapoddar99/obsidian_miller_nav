/**
 * File naming utilities
 * Handles unique name generation for files and folders
 */

import { App } from 'obsidian';
import { buildPath } from './index';

/**
 * Generate a unique file or folder name by appending numbers if conflicts exist
 * @param app Obsidian app instance
 * @param parentPath Parent folder path
 * @param baseName Base name without extension (e.g., "Untitled", "New Folder")
 * @param extension File extension (e.g., "md", "canvas") or empty string for folders
 * @returns Unique file/folder name (without path, just the name)
 *
 * @example
 * // For files
 * await getUniqueFileName(app, '/folder', 'Untitled', 'md')
 * // Returns: "Untitled.md" or "Untitled (1).md" or "Untitled (2).md" etc.
 *
 * @example
 * // For folders
 * await getUniqueFileName(app, '/folder', 'New Folder', '')
 * // Returns: "New Folder" or "New Folder (1)" or "New Folder (2)" etc.
 */
export async function getUniqueFileName(
  app: App,
  parentPath: string,
  baseName: string,
  extension: string
): Promise<string> {
  // Build initial name
  const initialName = extension ? `${baseName}.${extension}` : baseName;
  const initialPath = buildPath(parentPath, initialName);

  // Check if initial name is available
  const exists = await app.vault.adapter.exists(initialPath);
  if (!exists) {
    return initialName;
  }

  // Try numbered variations: "Name (1)", "Name (2)", etc.
  let counter = 1;
  while (counter < 1000) { // Safety limit to prevent infinite loops
    const numberedName = extension
      ? `${baseName} (${counter}).${extension}`
      : `${baseName} (${counter})`;

    const numberedPath = buildPath(parentPath, numberedName);
    const numberedExists = await app.vault.adapter.exists(numberedPath);

    if (!numberedExists) {
      return numberedName;
    }

    counter++;
  }

  // Fallback: append timestamp if we somehow hit the limit
  const timestamp = Date.now();
  return extension
    ? `${baseName} (${timestamp}).${extension}`
    : `${baseName} (${timestamp})`;
}
