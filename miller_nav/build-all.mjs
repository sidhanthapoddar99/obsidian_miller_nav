#!/usr/bin/env node
/**
 * Complete Build Script
 * Builds the plugin and copies all necessary files to the build/ directory
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.join(__dirname, 'build');

console.log('🔨 Building MillerNav plugin...\n');

// Step 1: Clean build directory
console.log('1️⃣  Cleaning build directory...');
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true });
}
fs.mkdirSync(buildDir, { recursive: true });
console.log('   ✓ Build directory cleaned\n');

// Step 2: Build CSS
console.log('2️⃣  Building CSS...');
try {
  execSync('node build-css.mjs', { stdio: 'inherit' });
  console.log('');
} catch (error) {
  console.error('   ❌ CSS build failed');
  process.exit(1);
}

// Step 3: Type check
console.log('3️⃣  Type checking...');
try {
  execSync('tsc -noEmit -skipLibCheck', { stdio: 'pipe' });
  console.log('   ✓ Type check passed\n');
} catch (error) {
  console.error('   ❌ Type check failed');
  process.exit(1);
}

// Step 4: Bundle JavaScript
console.log('4️⃣  Bundling JavaScript...');
try {
  execSync('node esbuild.config.mjs production', { stdio: 'inherit' });
  console.log('');
} catch (error) {
  console.error('   ❌ JavaScript build failed');
  process.exit(1);
}

// Step 5: Copy files to build directory
console.log('5️⃣  Copying files to build/...');
const filesToCopy = [
  { src: 'main.js', dest: 'main.js' },
  { src: 'manifest.json', dest: 'manifest.json' },
  { src: 'styles/styles.css', dest: 'styles.css' }
];

for (const file of filesToCopy) {
  const srcPath = path.join(__dirname, file.src);
  const destPath = path.join(buildDir, file.dest);

  if (!fs.existsSync(srcPath)) {
    console.error(`   ❌ Source file not found: ${file.src}`);
    process.exit(1);
  }

  fs.copyFileSync(srcPath, destPath);
  const size = fs.statSync(destPath).size;
  console.log(`   ✓ ${file.dest} (${Math.round(size / 1024)}KB)`);
}

console.log('\n✅ Build complete!');
console.log(`📦 Output: ${buildDir}`);
console.log('\n📋 Next steps:');
console.log('   - Run "npm run deploy" to copy to test vault');
console.log('   - Or manually copy files from build/ to your vault\n');
