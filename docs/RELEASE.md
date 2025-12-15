# Release Guide for MillerNav

This guide explains how to create and publish releases for the MillerNav Obsidian plugin.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Release Process](#release-process)
- [Release Directory Structure](#release-directory-structure)
- [Manual Release Steps](#manual-release-steps)
- [Submitting to Obsidian Community Plugins](#submitting-to-obsidian-community-plugins)
- [Rollback](#rollback)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Using Claude Code (Recommended)

```bash
/release
```

Follow the prompts to create a complete release automatically.

### Using the Script Directly

```bash
./scripts/release.sh 1.0.0
```

Replace `1.0.0` with your desired version number.

---

## Prerequisites

Before creating a release, ensure you have:

1. **GitHub CLI installed and authenticated**
   ```bash
   # Install gh
   brew install gh  # macOS
   # or
   sudo apt install gh  # Ubuntu/Debian

   # Authenticate
   gh auth login
   ```

2. **jq installed** (for JSON manipulation)
   ```bash
   brew install jq  # macOS
   sudo apt install jq  # Ubuntu/Debian
   ```

3. **Clean git working directory**
   ```bash
   git status  # Should show no uncommitted changes
   ```

4. **All dependencies installed**
   ```bash
   cd miller_nav
   npm install
   ```

5. **Successful test build**
   ```bash
   cd miller_nav
   npm run build
   ```

---

## Release Process

The automated release script performs these steps:

### 1. Version Management
- Updates `manifest.json` with new version
- Updates `package.json` with new version
- Validates version format (MAJOR.MINOR.PATCH)

### 2. Build
- Runs `npm run build` in `miller_nav/`
- Compiles TypeScript to JavaScript
- Concatenates CSS files
- Outputs to `miller_nav/build/`

### 3. Artifact Creation
- Creates `releases/version{X}/` directory
- Copies files:
  - `main.js` (bundled JavaScript)
  - `manifest.json` (plugin metadata)
  - `styles.css` (compiled styles)
- Creates ZIP archive: `miller-nav-{X}.zip`

### 4. Checksum Generation
- Generates SHA256 checksums for all files
- Creates `SHA256SUMS` file for verification

### 5. Git Operations
- Commits version changes
- Creates annotated git tag `v{X}`
- Pushes to GitHub

### 6. GitHub Release
- Creates GitHub release
- Uploads artifacts:
  - `miller-nav-{X}.zip`
  - `SHA256SUMS`
- Adds release notes

---

## Release Directory Structure

```
releases/
├── version1.0.0/
│   ├── main.js                    # Bundled JavaScript
│   ├── manifest.json              # Plugin metadata
│   ├── styles.css                 # Compiled CSS
│   ├── miller-nav-1.0.0.zip      # Distribution archive
│   ├── SHA256SUMS                 # Checksums for verification
│   └── RELEASE_NOTES.md           # Release notes
├── version1.0.1/
│   └── ...
└── version1.1.0/
    └── ...
```

---

## Manual Release Steps

If you need to create a release manually:

### 1. Update Versions

**manifest.json:**
```json
{
  "version": "1.0.0"
}
```

**package.json:**
```json
{
  "version": "1.0.0"
}
```

### 2. Build

```bash
cd miller_nav
npm run build
cd ..
```

### 3. Create Release Directory

```bash
VERSION="1.0.0"
mkdir -p "releases/version${VERSION}"
```

### 4. Copy Artifacts

```bash
cp miller_nav/build/main.js "releases/version${VERSION}/"
cp miller_nav/build/manifest.json "releases/version${VERSION}/"
cp miller_nav/build/styles.css "releases/version${VERSION}/"
```

### 5. Create ZIP

```bash
cd "releases/version${VERSION}"
zip "miller-nav-${VERSION}.zip" main.js manifest.json styles.css
cd ../..
```

### 6. Generate Checksums

```bash
cd "releases/version${VERSION}"
sha256sum *.zip *.js *.json *.css > SHA256SUMS
cd ../..
```

### 7. Commit and Tag

```bash
git add .
git commit -m "Release v${VERSION}"
git tag -a "v${VERSION}" -m "Release version ${VERSION}"
git push origin main
git push origin "v${VERSION}"
```

### 8. Create GitHub Release

```bash
gh release create "v${VERSION}" \
  --title "Miller Nav v${VERSION}" \
  --notes "Release version ${VERSION}" \
  "releases/version${VERSION}/miller-nav-${VERSION}.zip" \
  "releases/version${VERSION}/SHA256SUMS"
```

---

## Submitting to Obsidian Community Plugins

After creating a GitHub release, submit your plugin to Obsidian's community plugins:

### 1. Fork the Repository

Fork: [https://github.com/obsidianmd/obsidian-releases](https://github.com/obsidianmd/obsidian-releases)

### 2. Add Entry to community-plugins.json

Add this entry at the **end** of `community-plugins.json`:

```json
{
  "id": "miller-nav",
  "name": "Miller Nav",
  "author": "Your Name",
  "description": "Multi-pane hierarchical navigation for Obsidian vaults using Miller columns",
  "repo": "yourusername/obsidian_miller_nav"
}
```

**Important fields:**
- `id`: Must match the `id` in your `manifest.json`
- `repo`: Your GitHub repository in `username/repo` format

### 3. Create Pull Request

1. Commit your changes
2. Push to your fork
3. Create pull request to `obsidianmd/obsidian-releases`
4. Wait for review from Obsidian team

### 4. Review Process

The Obsidian team will:
- Review your plugin code
- Check for security issues
- Test basic functionality
- May request changes

This can take several days to weeks.

### 5. After Approval

Once approved:
- Your plugin appears in Obsidian's Community Plugins browser
- Users can install with one click
- Updates are automatically detected from your GitHub releases

---

## Version Management

### Semantic Versioning

Use semantic versioning: `MAJOR.MINOR.PATCH`

```
1.0.0 → 1.0.1  (Patch: Bug fixes only)
1.0.1 → 1.1.0  (Minor: New features, backward compatible)
1.1.0 → 2.0.0  (Major: Breaking changes)
```

### Pre-release Versions

For beta or testing releases:

```
1.0.0-beta.1
1.0.0-rc.1
```

Mark as pre-release on GitHub:
```bash
gh release create "v1.0.0-beta.1" --prerelease
```

---

## Rollback

If something goes wrong, you can rollback a release:

### Using the Script

```bash
./scripts/release.sh rollback 1.0.0
```

This will:
1. Delete local git tag
2. Delete remote git tag
3. Delete GitHub release
4. Revert the release commit

### Manual Rollback

```bash
VERSION="1.0.0"

# Delete local tag
git tag -d "v${VERSION}"

# Delete remote tag
git push origin --delete "v${VERSION}"

# Delete GitHub release
gh release delete "v${VERSION}" --yes

# Revert commit
git reset --hard HEAD~1
git push origin main --force  # ⚠️ Use with caution!
```

---

## Troubleshooting

### Error: "jq: command not found"

Install jq:
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt install jq

# Fedora
sudo dnf install jq
```

### Error: "gh: command not found"

Install GitHub CLI:
```bash
# macOS
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Or visit: https://cli.github.com/
```

### Error: "GitHub CLI is not authenticated"

Authenticate with GitHub:
```bash
gh auth login
```

### Error: "You have uncommitted changes"

Commit or stash your changes:
```bash
# Commit
git add .
git commit -m "Your message"

# Or stash
git stash
```

### Error: "Invalid version format"

Use semantic versioning format:
```
✓ 1.0.0
✓ 0.1.0
✓ 10.5.2
✗ 1.0
✗ v1.0.0
✗ 1.0.0.0
```

### Error: "Tag already exists"

Delete the existing tag first:
```bash
git tag -d v1.0.0
git push origin --delete v1.0.0
```

### Error: "manifest.json not found"

Make sure you're running the script from the repository root:
```bash
cd /path/to/obsidian_miller_nav
./scripts/release.sh 1.0.0
```

### Build Fails

Check that dependencies are installed:
```bash
cd miller_nav
npm install
npm run build  # Test build
```

### ZIP is Corrupted

Test the ZIP file:
```bash
unzip -t releases/version1.0.0/miller-nav-1.0.0.zip
```

If corrupted, recreate:
```bash
cd releases/version1.0.0
rm miller-nav-1.0.0.zip
zip miller-nav-1.0.0.zip main.js manifest.json styles.css
```

---

## Advanced Topics

### Custom Release Notes

The script will prompt for release notes. You can also prepare them in advance:

```bash
# Create RELEASE_NOTES.md before running script
cat > RELEASE_NOTES.md << 'EOF'
# What's New in v1.0.0

## Features
- Multi-pane navigation
- Virtual folders
- Customizable appearance

## Bug Fixes
- Fixed crash on startup
- Improved performance
EOF

# The script will use this file
```

### Automating with CI/CD

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd miller_nav && npm install

      - name: Build
        run: cd miller_nav && npm run build

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            miller_nav/build/main.js
            miller_nav/build/manifest.json
            miller_nav/build/styles.css
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Signing Releases

For added security, sign your releases with GPG:

```bash
# Create GPG key
gpg --gen-key

# Sign tag
git tag -s v1.0.0 -m "Release v1.0.0"

# Users verify
git tag -v v1.0.0
```

---

## Next Steps After Release

1. **Announce the release**
   - Update project README
   - Post on forums
   - Notify users on Discord/social media

2. **Monitor feedback**
   - Watch GitHub issues
   - Respond to user questions
   - Track bug reports

3. **Plan next release**
   - Update [docs/TODO.md](TODO.md)
   - Prioritize features
   - Fix reported bugs

---

## Resources

- [Obsidian Plugin Developer Docs](https://docs.obsidian.md/)
- [Submit Your Plugin Guide](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin)
- [obsidian-releases Repository](https://github.com/obsidianmd/obsidian-releases)
- [Semantic Versioning](https://semver.org/)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
