#!/usr/bin/env node
/**
 * Deploy Script
 * Copies built files to the test vault
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read vault path from .env file
const envPath = path.join(__dirname, '..', '.env');
let vaultPath = null;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/OBSIDIAN_TEST_VAULT_PATH=(.+)/);
  if (match) {
    vaultPath = match[1].trim();
  }
}

if (!vaultPath) {
  console.error('❌ OBSIDIAN_TEST_VAULT_PATH not found in .env file');
  process.exit(1);
}

const pluginDir = path.join(vaultPath, '.obsidian', 'plugins', 'miller-nav');
const buildDir = path.join(__dirname, 'build');

// Check if build directory exists
if (!fs.existsSync(buildDir)) {
  console.error('❌ Build directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Create plugin directory if it doesn't exist
if (!fs.existsSync(pluginDir)) {
  fs.mkdirSync(pluginDir, { recursive: true });
}

console.log('📦 Deploying to test vault...\n');
console.log(`   Source: ${buildDir}`);
console.log(`   Target: ${pluginDir}\n`);

const filesToDeploy = ['main.js', 'manifest.json', 'styles.css'];

for (const file of filesToDeploy) {
  const srcPath = path.join(buildDir, file);
  const destPath = path.join(pluginDir, file);

  if (!fs.existsSync(srcPath)) {
    console.error(`   ❌ ${file} not found in build directory`);
    continue;
  }

  fs.copyFileSync(srcPath, destPath);
  const size = fs.statSync(destPath).size;
  console.log(`   ✓ ${file} (${Math.round(size / 1024)}KB)`);
}

console.log('\n✅ Deployment complete!');
console.log('🔄 Reload Obsidian to see changes\n');
