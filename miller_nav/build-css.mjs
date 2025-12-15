#!/usr/bin/env node
/**
 * CSS Build Script
 * Concatenates all CSS files from styles/ directory into a single styles.css
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stylesDir = path.join(__dirname, 'styles');

// Order matters! These files will be concatenated in this order
const cssFiles = [
  'base.css',
  'columns.css',
  'items.css',
  'collapsed.css',
  'drag-drop.css',
  'modals.css',
  'settings.css'
];

const header = `/**
 * MillerNav Styles
 * Clean, minimal navigation UI with Miller columns
 *
 * This file is auto-generated from modular CSS files:
 * - base.css      : Container, layout, mobile, scrollbars
 * - columns.css   : Column structure, headers, toolbar
 * - items.css     : File/folder items, selection states
 * - collapsed.css : Collapsed column strip
 * - drag-drop.css : Drag and drop visual feedback
 * - modals.css    : Delete confirmation and other modals
 * - settings.css  : Settings page tabs and forms
 */

`;

let combinedCSS = header;

for (const file of cssFiles) {
  const filePath = path.join(stylesDir, file);

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Warning: ${file} not found, skipping...`);
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = file.replace('.css', '').toUpperCase();

  combinedCSS += `/* ${'='.repeat(74)} */\n`;
  combinedCSS += `/* ${fileName.padEnd(70)} */\n`;
  combinedCSS += `/* ${'='.repeat(74)} */\n\n`;
  combinedCSS += content.trim() + '\n\n';
}

const outputPath = path.join(stylesDir, 'styles.css');
fs.writeFileSync(outputPath, combinedCSS, 'utf8');

console.log('✓ CSS compiled successfully!');
console.log(`  Output: ${outputPath}`);
console.log(`  Size: ${Math.round(combinedCSS.length / 1024)}KB`);
