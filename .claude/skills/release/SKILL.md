---
name: release
description: Automate the complete release process for MillerNav Obsidian plugin including version updates, building, packaging, tagging, and GitHub release creation. Use when the user asks to create a release, publish a new version, or wants to release the plugin to GitHub.
---

# Release Automation Skill

Guides users through the complete release workflow for the MillerNav Obsidian plugin with interactive step-by-step commands.

## When to Use This Skill

Use this skill when:
- User asks to "create a release"
- User wants to "publish a new version"
- User says "release version X.Y.Z"
- User asks to "prepare for GitHub release"
- User wants to "package the plugin for distribution"

## What This Skill Does

Guides the user through each release step:
1. Version number collection and validation
2. Version file updates
3. Production build
4. Artifact packaging
5. Checksum generation
6. Git operations (commit, tag, push)
7. GitHub release creation
8. Obsidian Community Plugin submission guidance

## Interactive Release Workflow

### Step 1: Ask for Version Number

Ask the user what version number they want to release.

**Prompt:**
```
What version number would you like to release?
Format: MAJOR.MINOR.PATCH (e.g., 1.0.0, 0.5.3, 2.1.0)
```

**Validate the format:**
- Must match pattern: `X.Y.Z` where X, Y, Z are numbers
- Examples: 1.0.0 ✓, 0.1.5 ✓, 2.10.3 ✓
- Invalid: 1.0 ✗, v1.0.0 ✗, 1.0.0-beta ✗

### Step 2: Verify Prerequisites

Check that required tools are available:

```bash
# Check if jq is installed
jq --version

# Check if gh CLI is installed
gh --version

# Check if gh is authenticated
gh auth status

# Check git status is clean
git status --porcelain
```

**If any prerequisite fails, provide installation instructions:**

- **jq not found:**
  - macOS: `brew install jq`
  - Ubuntu/Debian: `sudo apt install jq`
  - Fedora: `sudo dnf install jq`

- **gh not found:**
  - Install from: https://cli.github.com/
  - macOS: `brew install gh`
  - Linux: See https://github.com/cli/cli/blob/trunk/docs/install_linux.md

- **gh not authenticated:**
  - Run: `gh auth login`
  - Follow the interactive prompts

- **Uncommitted changes:**
  - User needs to commit or stash changes first
  - Show: `git status` output

### Step 3: Update Version Files

Update version in `manifest.json` and `package.json`:

```bash
# Update manifest.json
jq --arg version "{VERSION}" '.version = $version' miller_nav/manifest.json > miller_nav/manifest.json.tmp
mv miller_nav/manifest.json.tmp miller_nav/manifest.json

# Update package.json
jq --arg version "{VERSION}" '.version = $version' miller_nav/package.json > miller_nav/package.json.tmp
mv miller_nav/package.json.tmp miller_nav/package.json

# Verify the updates
echo "Updated manifest.json to version: $(jq -r '.version' miller_nav/manifest.json)"
echo "Updated package.json to version: $(jq -r '.version' miller_nav/package.json)"
```

### Step 4: Build the Plugin

Run production build:

```bash
cd miller_nav && npm run build && cd ..
```

**Verify build output:**
- Check that `miller_nav/build/` contains:
  - `main.js`
  - `manifest.json`
  - `styles.css`

### Step 5: Create Release Directory and Package Artifacts

Create versioned release directory and copy files:

```bash
# Create release directory
mkdir -p releases/version{VERSION}

# Copy build artifacts
cp miller_nav/build/main.js releases/version{VERSION}/
cp miller_nav/build/manifest.json releases/version{VERSION}/
cp miller_nav/build/styles.css releases/version{VERSION}/

# Create ZIP archive
cd releases/version{VERSION}
zip miller-nav-{VERSION}.zip main.js manifest.json styles.css
cd ../..

# Confirm creation
ls -lh releases/version{VERSION}/
```

### Step 6: Generate Checksums

Create SHA256 checksums for verification:

```bash
cd releases/version{VERSION}
sha256sum *.zip *.js *.json *.css > SHA256SUMS
cd ../..

# Display checksums
echo "Generated checksums:"
cat releases/version{VERSION}/SHA256SUMS
```

### Step 7: Create Git Commit and Tag

Commit version changes and create annotated tag:

```bash
# Add version files
git add miller_nav/manifest.json miller_nav/package.json

# Create commit
git commit -m "Release v{VERSION}

- Updated version to {VERSION}
- Built and packaged release artifacts
- Generated checksums"

# Create annotated tag
git tag -a "v{VERSION}" -m "Release version {VERSION}

## Installation

Download \`miller-nav-{VERSION}.zip\` from the release assets.

## Verification

Verify checksums using:
\`\`\`bash
sha256sum -c SHA256SUMS
\`\`\`"

# Verify tag creation
git tag -l "v{VERSION}"
git log -1 --oneline
```

### Step 8: Push to GitHub

Ask user to confirm push before proceeding:

**Prompt:**
```
Ready to push to GitHub. This will:
- Push the release commit to the main branch
- Push the v{VERSION} tag

Proceed? (y/n)
```

**If yes:**
```bash
# Push commit
git push origin $(git branch --show-current)

# Push tag
git push origin v{VERSION}

# Verify
git ls-remote --tags origin v{VERSION}
```

### Step 9: Create GitHub Release

**Ask for release notes:**

**Prompt:**
```
Would you like to provide custom release notes, or use the default template? (custom/default)
```

**If default, use this template:**
```markdown
Release version {VERSION}

See [TODO.md](../docs/TODO.md) for details.

## Installation

### From GitHub Release
1. Download \`miller-nav-{VERSION}.zip\`
2. Extract to your vault's \`.obsidian/plugins/miller-nav/\` folder
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

### From Obsidian Community Plugins
Once approved, you can install directly from Obsidian:
Settings → Community Plugins → Browse → Search for "Miller Nav"

## Verification

Verify the download integrity using SHA256:
\`\`\`bash
sha256sum -c SHA256SUMS
\`\`\`
```

**Create the release:**

```bash
# Create release with artifacts
gh release create "v{VERSION}" \
  releases/version{VERSION}/miller-nav-{VERSION}.zip \
  releases/version{VERSION}/main.js \
  releases/version{VERSION}/manifest.json \
  releases/version{VERSION}/styles.css \
  releases/version{VERSION}/SHA256SUMS \
  --title "v{VERSION}" \
  --notes "{RELEASE_NOTES}"

# Get release URL
gh release view "v{VERSION}" --web
```

### Step 10: Display Success and Next Steps

After successful release, display:

```
✅ Release v{VERSION} completed successfully!

📦 Release URL: https://github.com/{USERNAME}/obsidian_miller_nav/releases/tag/v{VERSION}

📁 Local artifacts: releases/version{VERSION}/

## Next Steps: Submit to Obsidian Community Plugins

To make your plugin available in Obsidian's Community Plugins directory:

### 1. Fork the obsidian-releases repository
Visit: https://github.com/obsidianmd/obsidian-releases
Click "Fork" to create your own copy

### 2. Add your plugin to community-plugins.json

Clone your fork and edit \`community-plugins.json\`:

\`\`\`json
{
  "id": "miller-nav",
  "name": "Miller Nav",
  "author": "{YOUR_NAME}",
  "description": "Multi-pane hierarchical navigation for Obsidian vaults using Miller columns",
  "repo": "{YOUR_GITHUB_USERNAME}/obsidian_miller_nav"
}
\`\`\`

Add this entry in alphabetical order by ID.

### 3. Create Pull Request

Commit your changes:
\`\`\`bash
git add community-plugins.json
git commit -m "Add Miller Nav plugin"
git push origin master
\`\`\`

Then create a PR to the main obsidian-releases repository.

### 4. Wait for Review

The Obsidian team will review your submission. This typically takes a few days to a few weeks.

They will check:
- Plugin functionality and quality
- Code security and performance
- Compliance with Obsidian guidelines
- Proper manifest.json configuration

### 5. After Approval

Once approved, your plugin will appear in:
Settings → Community Plugins → Browse

Users can then install it directly from Obsidian!

## Resources

- Obsidian Developer Docs: https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin
- Sample Plugins: https://github.com/obsidianmd/obsidian-sample-plugin
- Plugin Guidelines: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
```

## Error Handling

### Common Issues and Solutions

**Build fails:**
```bash
cd miller_nav
rm -rf node_modules package-lock.json
npm install
npm run build
cd ..
```

**Tag already exists:**
```bash
# Delete local tag
git tag -d v{VERSION}

# Delete remote tag
git push origin --delete v{VERSION}

# Delete GitHub release
gh release delete v{VERSION} --yes
```

**Version files not updated:**
- Check jq is installed: `jq --version`
- Manually edit the files if needed
- Verify JSON syntax is valid

**Push fails (authentication):**
```bash
# Check remote URL
git remote -v

# If using HTTPS, switch to SSH:
git remote set-url origin git@github.com:{USERNAME}/obsidian_miller_nav.git

# Or configure credentials
gh auth login
```

**GitHub release creation fails:**
```bash
# Check authentication
gh auth status

# Re-authenticate if needed
gh auth login

# Verify release artifacts exist
ls -la releases/version{VERSION}/
```

## Rollback Procedure

If something goes wrong during release:

```bash
# Delete local tag
git tag -d v{VERSION}

# Delete remote tag (if pushed)
git push origin --delete v{VERSION}

# Delete GitHub release (if created)
gh release delete v{VERSION} --yes

# Revert the commit (if pushed)
git revert HEAD
git push origin $(git branch --show-current)

# Or reset if not pushed
git reset --hard HEAD~1

# Clean up release directory
rm -rf releases/version{VERSION}
```

## Best Practices

1. **Always test the plugin** in a test vault before releasing
2. **Update CHANGELOG or TODO.md** with release notes before releasing
3. **Verify checksums** after generating
4. **Test the ZIP file** by extracting and checking contents
5. **Keep version numbers semantic**: MAJOR.MINOR.PATCH
6. **Tag messages** should be descriptive
7. **Test installation** from the ZIP file before finalizing

## Notes

- The `releases/` directory is in `.gitignore` and won't be committed
- Artifacts are only stored locally and on GitHub Releases
- Tags are semantic(x,y,z) without prefix (e.g., 1.0.0) by convention
- Always verify build output before creating release
- GitHub releases are public once created

## Related Documentation

- **Release Guide**: [docs/RELEASE.md](../../docs/RELEASE.md)
- **Quick Reference**: [docs/RELEASE_QUICK_REF.md](../../docs/RELEASE_QUICK_REF.md)
